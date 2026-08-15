import { useRef, useEffect, useCallback, memo } from "react";
import * as M from "./lensMathReflect";
import * as M_OLD from "./lensMath";
import { createCamera } from "./Camera";

function cacheKey(p, aperture) {
  return [p.eq, p.eqR, aperture, p.angle, p.n, p.rayCount, p.keepFailed, p.useReflections].join("|");
}

function lensBox(lens) {
  var zMin = Infinity;
  var zMax = -Infinity;
  for (var i = 0; i < lens.L.length; i++) {
    var z = lens.L[i].z;
    if (z < zMin) zMin = z;
    if (z > zMax) zMax = z;
    z = lens.R[i].z;
    if (z < zMin) zMin = z;
    if (z > zMax) zMax = z;
  }
  return { z0: zMin, z1: zMax, r1: lens.aperture };
}

function drawLens(ctx, lens, camera) {
  var grad = ctx.createLinearGradient(camera.x, 0, camera.x + 100, 0);
  grad.addColorStop(0, "rgba(150,180,255,0.2)");
  grad.addColorStop(1, "rgba(100,130,255,0.15)");
  ctx.fillStyle = grad;
  ctx.beginPath();
  lens.L.forEach(function (p, i) {
    var s = camera.worldToScreen(p);
    if (i === 0) ctx.moveTo(s.x, s.y);
    else ctx.lineTo(s.x, s.y);
  });
  for (var i = lens.R.length - 1; i >= 0; i--) {
    var s = camera.worldToScreen(lens.R[i]);
    ctx.lineTo(s.x, s.y);
  }
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = "rgba(0,180,255,0.6)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  lens.L.forEach(function (p, i) {
    var s = camera.worldToScreen(p);
    if (i === 0) ctx.moveTo(s.x, s.y);
    else ctx.lineTo(s.x, s.y);
  });
  ctx.stroke();
  ctx.beginPath();
  lens.R.forEach(function (p, i) {
    var s = camera.worldToScreen(p);
    if (i === 0) ctx.moveTo(s.x, s.y);
    else ctx.lineTo(s.x, s.y);
  });
  ctx.stroke();
}

var REFLEN = 120;

function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
function lerp(a, b, t) { return a + (b - a) * t; }
function mixColor(c1, c2, t) {
  return [
    Math.round(lerp(c1[0], c2[0], t)),
    Math.round(lerp(c1[1], c2[1], t)),
    Math.round(lerp(c1[2], c2[2], t)),
  ];
}

// single ray hue; brightness controlled by intensity
var COLOR_SINGLE = [50, 255, 100]; // green (#32FF64)

function rgbToCss(rgb, a) {
  return 'rgba(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ',' + a + ')';
}

function drawSegment(ctx, a, b, color, intensity, coreWidth) {
  coreWidth = coreWidth || 1.5;
  // glow
  ctx.lineWidth = coreWidth * 6;
  ctx.strokeStyle = rgbToCss(color, clamp(0.06 * intensity, 0.02, 0.14));
  ctx.beginPath();
  ctx.moveTo(a.x, a.y);
  ctx.lineTo(b.x, b.y);
  ctx.stroke();
  // colored core
  ctx.lineWidth = coreWidth * 1.6;
  ctx.strokeStyle = rgbToCss(color, clamp(0.6 * intensity, 0.2, 0.95));
  ctx.beginPath();
  ctx.moveTo(a.x, a.y);
  ctx.lineTo(b.x, b.y);
  ctx.stroke();
  // thin bright center
  ctx.lineWidth = Math.max(1, coreWidth * 0.6);
  ctx.strokeStyle = rgbToCss([255,255,255], clamp(0.35 + 0.65 * intensity, 0.2, 1));
  ctx.beginPath();
  ctx.moveTo(a.x, a.y);
  ctx.lineTo(b.x, b.y);
  ctx.stroke();
}

function drawRays(ctx, rays, camera) {
  if (!rays || rays.length === 0) return;
  // single hue for all rays; brightness varies with intensity
  var baseColor = COLOR_SINGLE;

  for (var i = 0; i < rays.length; i++) {
    var r = rays[i];
    var sP = camera.worldToScreen(r.P);
    var sEnd = camera.worldToScreen(r.end);

    // overall transmitted intensity (used for brightness)
    var overallIntensity = (r.t1 || 1) * (r.t2 || 1);

    // if no first hit, draw incoming ray with low width and intensity
    if (!r.h1) {
      drawSegment(ctx, sP, sEnd, baseColor, 0.75 * overallIntensity, 1.2);
      continue;
    }

    var sH1 = camera.worldToScreen(r.h1);
    // incoming segment (before first surface) - show slightly dimmer
    drawSegment(ctx, sP, sH1, baseColor, 0.8 * overallIntensity, 1.2);

    // reflected ray from first surface
    var sR = camera.worldToScreen({
      z: r.h1.z + r.rdir.z * REFLEN,
      r: r.h1.r + r.rdir.r * REFLEN,
    });
    // reflection intensity uses r.r1
    var reflIntensity = r.r1 || 0;
    if (reflIntensity > 0.001) {
      // draw reflection with same hue but a bit shifted toward magenta
      var reflColor = mixColor(baseColor, [255,92,200], 0.25);
      drawSegment(ctx, sH1, sR, reflColor, reflIntensity, 1.0);
    }

    if (r.h2) {
      var sH2 = camera.worldToScreen(r.h2);
      // inside lens segment
      drawSegment(ctx, sH1, sH2, baseColor, 0.6 * (r.t1 || 1), 2.0);
      // exiting segment
      drawSegment(ctx, sH2, sEnd, baseColor, overallIntensity, 2.0);

      // internal bounces
      for (var k = 0; k < r.inner.length; k++) {
        var seg = r.inner[k];
        var sA = camera.worldToScreen(seg.a);
        var sB = camera.worldToScreen(seg.b);
        var ci = seg.i || 0;
        drawSegment(ctx, sA, sB, baseColor, ci, 1.2);
      }
      // escaped/transmitted rays inside
      for (var k = 0; k < r.esc.length; k++) {
        var ex = r.esc[k];
        var sE = camera.worldToScreen(ex.p);
        var sF = camera.worldToScreen({
          z: ex.p.z + ex.dir.z * REFLEN,
          r: ex.p.r + ex.dir.r * REFLEN,
        });
        drawSegment(ctx, sE, sF, baseColor, ex.i || 0, 1.0);
      }
    } else {
      // single-surface transmission (no second hit)
      drawSegment(ctx, sH1, sEnd, baseColor, r.t1 || 1, 2.0);
    }
  }
}

function Lens2D({ params, resetKey, scaleRef }) {
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const cameraRef = useRef(createCamera());
  const dragRef = useRef({ isDragging: false, x: 0, y: 0 });
  const renderScheduled = useRef(false);
  const zoomReportScheduled = useRef(false);
  const pinchRef = useRef(null);
  const lensCacheRef = useRef<{
    key: string;
      lens?: ReturnType<typeof M.sampleLens>;
    box?: { z0: number; z1: number; r1: number };
  }>({ key: "" });
    const rayCacheRef = useRef<{ key: string; rays?: ReturnType<typeof M.traceRays> }>({ key: "" });
  const simPending = useRef(false);
  const fittedRef = useRef(false);
  const paramsRef = useRef(params);
  paramsRef.current = params;

  const syncCanvasSize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    let rect = canvas.getBoundingClientRect();
    let w = rect.width;
    let h = rect.height;
    if (w <= 0 || h <= 0) {
      w = window.innerWidth;
      h = window.innerHeight;
    }
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.max(1, Math.round(w * dpr));
    canvas.height = Math.max(1, Math.round(h * dpr));
    ctxRef.current.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { width: w, height: h };
  }, []);

  const render = useCallback(() => {
    const ctx = ctxRef.current;
    const canvas = canvasRef.current;
    const camera = cameraRef.current;
    const lens = lensCacheRef.current.lens;
    const rays = rayCacheRef.current.rays;
    if (!ctx || !canvas || !lens || !rays) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawLens(ctx, lens, camera);
    drawRays(ctx, rays, camera);
  }, []);

  const scheduleRender = useCallback(() => {
    if (renderScheduled.current) return;
    renderScheduled.current = true;
    requestAnimationFrame(function () {
      renderScheduled.current = false;
      render();
    });
  }, [render]);

  useEffect(() => {
    if (simPending.current) return;
    simPending.current = true;
    requestAnimationFrame(() => {
      simPending.current = false;
      const p = paramsRef.current;
      const eqKey = p.eq + "|" + p.eqR;
      if (lensCacheRef.current.key !== eqKey) {
        const math = p.useOldMath ? M_OLD : M;
        const lens = math.sampleLens(p.eq, p.eqR);
        lensCacheRef.current = { key: eqKey, lens, box: lensBox(lens) };
      }
      const lens = lensCacheRef.current.lens;
      // После первого расчёта линзы подгоняем начальный вид под неё.
      if (!fittedRef.current && lensCacheRef.current.box) {
        fittedRef.current = true;
        const rect = canvasRef.current ? canvasRef.current.getBoundingClientRect() : null;
        const w = rect && rect.width > 0 ? rect.width : window.innerWidth;
        const h = rect && rect.height > 0 ? rect.height : window.innerHeight;
        cameraRef.current.fit(lensCacheRef.current.box, w, h);
        if (scaleRef.current) scaleRef.current.textContent = cameraRef.current.scale.toFixed(2);
      }
      const key = cacheKey(p, lens.aperture);
      if (rayCacheRef.current.key !== key) {
        const math = p.useReflections ? M : M_OLD; // default: old math (no reflections); when useReflections true -> use new math with reflections
        var rawRays = math.traceRays(p.eq, p.eqR, lens.aperture, p.angle * (p.useReflections ? M.DEG : M_OLD.DEG), p.n, p.rayCount, lensCacheRef.current.box, p.keepFailed);
        // normalize ray objects to include newer fields (rdir, r1, t1, t2, inner, esc, tir)
        var rays = (rawRays || []).map(function(rr){
          return {
            P: rr.P,
            h1: rr.h1 || null,
            h2: rr.h2 || null,
            end: rr.end || (rr.P ? { z: rr.P.z + 3000, r: rr.P.r } : null),
            ok: !!rr.ok,
            tir: !!rr.tir,
            t1: rr.t1 != null ? rr.t1 : 1,
            t2: rr.t2 != null ? rr.t2 : 1,
            r1: rr.r1 != null ? rr.r1 : 0,
            rdir: rr.rdir || (rr.h1 && rr.h2 ? { z: rr.h2.z-rr.h1.z, r: rr.h2.r-rr.h1.r } : { z:0, r:0 }),
            inner: rr.inner || [],
            esc: rr.esc || [],
          };
        });
        rayCacheRef.current = { key, rays };
      }
      scheduleRender();
    });
  }, [params, scheduleRender]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    ctxRef.current = canvas.getContext("2d");
    const size = syncCanvasSize();
    if (size) cameraRef.current.reset(size.width, size.height);
    render();
  }, [syncCanvasSize, render]);

  useEffect(() => {
    const camera = cameraRef.current;
    const rect = canvasRef.current ? canvasRef.current.getBoundingClientRect() : null;
    const w = rect && rect.width > 0 ? rect.width : window.innerWidth;
    const h = rect && rect.height > 0 ? rect.height : window.innerHeight;
    const box = lensCacheRef.current.box;
    if (box) {
      camera.fit(box, w, h);
    } else {
      camera.reset(w, h);
    }
    if (scaleRef.current) scaleRef.current.textContent = camera.scale.toFixed(2);
    renderScheduled.current = false;
    render();
  }, [resetKey, render]);

  useEffect(() => {
    const onResize = () => {
      syncCanvasSize();
      scheduleRender();
    };
    window.addEventListener("resize", onResize);
    window.visualViewport?.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      window.visualViewport?.removeEventListener("resize", onResize);
    };
  }, [syncCanvasSize, scheduleRender]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const camera = cameraRef.current;

    const reportScale = () => {
      if (zoomReportScheduled.current) return;
      zoomReportScheduled.current = true;
      requestAnimationFrame(function () {
        zoomReportScheduled.current = false;
        if (scaleRef.current) scaleRef.current.textContent = camera.scale.toFixed(2);
      });
    };

    const onMouseDown = (e) => {
      dragRef.current.isDragging = true;
      dragRef.current.x = e.clientX;
      dragRef.current.y = e.clientY;
    };

    const onMouseMove = (e) => {
      if (!dragRef.current.isDragging) return;
      camera.pan(e.clientX - dragRef.current.x, e.clientY - dragRef.current.y);
      dragRef.current.x = e.clientX;
      dragRef.current.y = e.clientY;
      scheduleRender();
    };

    const onMouseUp = () => { dragRef.current.isDragging = false; };
    const onMouseLeave = () => { dragRef.current.isDragging = false; };

    const onWheel = (e) => {
      e.preventDefault();
      var factor = e.deltaY < 0 ? 1.05 : 0.95;
      var rect = canvas.getBoundingClientRect();
      camera.zoomAt(e.clientX - rect.left, e.clientY - rect.top, factor);
      reportScale();
      scheduleRender();
    };

    const onTouchStart = (e) => {
      if (e.touches.length === 1) {
        dragRef.current.isDragging = true;
        dragRef.current.x = e.touches[0].clientX;
        dragRef.current.y = e.touches[0].clientY;
        pinchRef.current = null;
      } else if (e.touches.length === 2) {
        dragRef.current.isDragging = false;
        pinchRef.current = {
          dist: Math.hypot(
            e.touches[1].clientX - e.touches[0].clientX,
            e.touches[1].clientY - e.touches[0].clientY
          ),
        };
      }
    };

    const onTouchMove = (e) => {
      e.preventDefault();
      if (e.touches.length === 2 && pinchRef.current) {
        const t1 = e.touches[0];
        const t2 = e.touches[1];
        const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
        if (dist > 0) {
          var rect = canvas.getBoundingClientRect();
          camera.zoomAt(
            (t1.clientX + t2.clientX) / 2 - rect.left,
            (t1.clientY + t2.clientY) / 2 - rect.top,
            dist / pinchRef.current.dist
          );
          pinchRef.current.dist = dist;
          reportScale();
          scheduleRender();
        }
      } else if (e.touches.length === 1 && dragRef.current.isDragging) {
        const t = e.touches[0];
        camera.pan(t.clientX - dragRef.current.x, t.clientY - dragRef.current.y);
        dragRef.current.x = t.clientX;
        dragRef.current.y = t.clientY;
        scheduleRender();
      }
    };

    const onTouchEnd = (e) => {
      if (e.touches.length === 0) {
        dragRef.current.isDragging = false;
        pinchRef.current = null;
      } else if (e.touches.length === 1) {
        pinchRef.current = null;
        dragRef.current.isDragging = true;
        dragRef.current.x = e.touches[0].clientX;
        dragRef.current.y = e.touches[0].clientY;
      }
    };

    const onContextMenu = (e) => e.preventDefault();

    canvas.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    canvas.addEventListener("mouseleave", onMouseLeave);
    canvas.addEventListener("wheel", onWheel, { passive: false });
    canvas.addEventListener("touchstart", onTouchStart, { passive: true });
    canvas.addEventListener("touchmove", onTouchMove, { passive: false });
    canvas.addEventListener("touchend", onTouchEnd);
    canvas.addEventListener("touchcancel", onTouchEnd);
    canvas.addEventListener("contextmenu", onContextMenu);

    return () => {
      canvas.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      canvas.removeEventListener("mouseleave", onMouseLeave);
      canvas.removeEventListener("wheel", onWheel);
      canvas.removeEventListener("touchstart", onTouchStart);
      canvas.removeEventListener("touchmove", onTouchMove);
      canvas.removeEventListener("touchend", onTouchEnd);
      canvas.removeEventListener("touchcancel", onTouchEnd);
      canvas.removeEventListener("contextmenu", onContextMenu);
    };
  }, [scheduleRender, syncCanvasSize]);

  return (
    <canvas
      ref={canvasRef}
      style={{ display: "block", width: "100%", height: "100%", cursor: "move", touchAction: "none" }}
    />
  );
}

export default memo(Lens2D);
