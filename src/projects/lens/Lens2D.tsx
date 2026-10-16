import { useRef, useEffect, useCallback, memo } from "react";
import * as M from "./lensMathReflect";
import * as M_OLD from "./lensMath";
import { createCamera } from "./Camera";
import { createViewTransform, clipSegment, clipPolygon, clipPolyline, refineCurve, insertSurfacePoints, collectSurfaceHits } from "./lensDraw2D";

function cacheKey(p, aperture) {
  return [p.eq, p.eqR, aperture, p.angle, p.n, p.rayCount, p.useReflections].join("|");
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

function drawLens(ctx, lens, hits, wts, view) {
  var grad = ctx.createLinearGradient(view.w / 2, 0, view.w / 2 + 100, 0);
  grad.addColorStop(0, "rgba(150,180,255,0.2)");
  grad.addColorStop(1, "rgba(100,130,255,0.15)");
  ctx.fillStyle = grad;

  var Lsrc = hits ? insertSurfacePoints(lens.L, lens.eq, hits.onEq) : lens.L;
  var Rsrc = hits ? insertSurfacePoints(lens.R, lens.eqR, hits.onEqR) : lens.R;
  var Ls = refineCurve(Lsrc, lens.eq, wts, 0.25, view);
  var Rs = refineCurve(Rsrc, lens.eqR, wts, 0.25, view);
  var poly = clipPolygon(Ls.concat(Rs.slice().reverse()), view);
  ctx.beginPath();
  poly.forEach(function (p, i) {
    if (i === 0) ctx.moveTo(p.x, p.y);
    else ctx.lineTo(p.x, p.y);
  });
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = "rgba(0,180,255,0.6)";
  ctx.lineWidth = 2;
  [Ls, Rs].forEach(function (pts) {
    clipPolyline(pts, view).forEach(function (path) {
      ctx.beginPath();
      path.forEach(function (p, i) {
        if (i === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      });
      ctx.stroke();
    });
  });
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

var COLOR_SINGLE = [50, 255, 100];
var RAY_RADIUS = 1.5;

function rgbToCss(rgb, a) {
  return 'rgba(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ',' + a + ')';
}

function strokeLine(ctx, seg, stroke, width) {
  ctx.lineWidth = width;
  ctx.strokeStyle = stroke;
  ctx.beginPath();
  ctx.moveTo(seg.x1, seg.y1);
  ctx.lineTo(seg.x2, seg.y2);
  ctx.stroke();
}

function strokeSegment(ctx, seg, color, i, w) {
  strokeLine(ctx, seg, rgbToCss(color, 0.14 * i), w * 3);
  strokeLine(ctx, seg, rgbToCss(color, 0.6 * i), w * 1.6);
  strokeLine(ctx, seg, rgbToCss(color, i), Math.max(1, w * 0.6));
}

function drawRay(ctx, wts, aw, bw, freeA, freeB, color, intensity, w, view) {
  var i = clamp(intensity, 0, 1);
  if (i <= 0.001) return;
  var a = wts(aw);
  var b = wts(bw);
  var ax = a.x;
  var ay = a.y;
  var bx = b.x;
  var by = b.y;
  var dx = bx - ax;
  var dy = by - ay;
  var len = Math.hypot(dx, dy) || 1;
  var ext = 4 * Math.hypot(view.w, view.h);
  if (freeA) {
    ax -= (dx / len) * ext;
    ay -= (dy / len) * ext;
  }
  if (freeB) {
    bx += (dx / len) * ext;
    by += (dy / len) * ext;
  }
  var seg = clipSegment(ax, ay, bx, by, view.w, view.h);
  if (!seg) return;
  strokeSegment(ctx, seg, color, i, w);
}

function drawRays(ctx, rays, wts, view) {
  if (!rays || rays.length === 0) return;
  var baseColor = COLOR_SINGLE;

  ctx.save();
  ctx.lineCap = "round";

  for (var i = 0; i < rays.length; i++) {
    var r = rays[i];
    var overallIntensity = r.tir ? (r.t1 || 1) : (r.t1 || 1) * (r.t2 || 1);

    if (!r.h1) {
      drawRay(ctx, wts, r.P, r.end, true, true, baseColor, 1, RAY_RADIUS, view);
      continue;
    }

    drawRay(ctx, wts, r.P, r.h1, true, false, baseColor, 1, RAY_RADIUS, view);

    if (r.r1 > 0.001 && r.rdir) {
      var reflEnd = { z: r.h1.z + r.rdir.z * REFLEN, r: r.h1.r + r.rdir.r * REFLEN };
      drawRay(ctx, wts, r.h1, reflEnd, false, true, baseColor, r.r1, RAY_RADIUS, view);
    }

    if (r.edgeHit) {
      drawRay(ctx, wts, r.h1, r.edgeHit, false, false, baseColor, r.t1 || 1, RAY_RADIUS, view);
      if (!r.edgeTir) {
        drawRay(ctx, wts, r.edgeHit, r.end, false, true, baseColor, r.edgeIntensity || 0, RAY_RADIUS, view);
      }
      for (var edgeInner of r.inner || []) {
        drawRay(ctx, wts, edgeInner.a, edgeInner.b, false, false, baseColor, edgeInner.i || 0, RAY_RADIUS, view);
      }
      for (var edgeEsc of r.esc || []) {
        var escEnd = { z: edgeEsc.p.z + edgeEsc.dir.z * REFLEN, r: edgeEsc.p.r + edgeEsc.dir.r * REFLEN };
        drawRay(ctx, wts, edgeEsc.p, escEnd, false, true, baseColor, edgeEsc.i || 0, RAY_RADIUS, view);
      }
      continue;
    }

    if (r.h2) {
      drawRay(ctx, wts, r.h1, r.h2, false, false, baseColor, r.t1 || 1, RAY_RADIUS, view);
      drawRay(ctx, wts, r.h2, r.end, false, true, baseColor, overallIntensity, RAY_RADIUS, view);

      for (var k = 0; k < (r.inner || []).length; k++) {
        var seg = r.inner[k];
        drawRay(ctx, wts, seg.a, seg.b, false, false, baseColor, seg.i || 0, RAY_RADIUS, view);
      }
      for (var k2 = 0; k2 < r.esc.length; k2++) {
        var ex = r.esc[k2];
        var exEnd = { z: ex.p.z + ex.dir.z * REFLEN, r: ex.p.r + ex.dir.r * REFLEN };
        drawRay(ctx, wts, ex.p, exEnd, false, true, baseColor, ex.i || 0, RAY_RADIUS, view);
      }
    } else {
      drawRay(ctx, wts, r.h1, r.end, false, true, baseColor, r.t1 || 1, RAY_RADIUS, view);
    }
  }

  ctx.restore();
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
  const rayCacheRef = useRef<{ key: string; rays?: ReturnType<typeof M.traceRays>; hits?: { onEq: number[]; onEqR: number[] } }>({ key: "" });
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
    ctxRef.current?.setTransform(dpr, 0, 0, dpr, 0, 0);
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
    var rect = canvas.getBoundingClientRect();
    var view = {
      w: rect.width > 0 ? rect.width : canvas.width,
      h: rect.height > 0 ? rect.height : canvas.height,
    };
    var wts = createViewTransform(camera, view);
    drawLens(ctx, lens, rayCacheRef.current.hits, wts, view);
    drawRays(ctx, rays, wts, view);
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
        const math = p.useReflections ? M : M_OLD;
        const lens = math.sampleLens(p.eq, p.eqR);
        lensCacheRef.current = { key: eqKey, lens, box: lensBox(lens) };
      }
      const lens = lensCacheRef.current.lens;
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
        const math = p.useReflections ? M : M_OLD;
        var rawRays = math.traceRays(p.eq, p.eqR, lens.aperture, p.angle * (p.useReflections ? M.DEG : M_OLD.DEG), p.n, p.rayCount, lensCacheRef.current.box);
        var rays = (rawRays || []).map(function(rr){
          return {
            P: rr.P,
            h1: rr.h1 || null,
            h2: rr.h2 || null,
            end: rr.end || (rr.P ? { z: rr.P.z + 3000, r: rr.P.r } : null),
            ok: !!rr.ok,
            tir: !!rr.tir,
            edgeExit: !!rr.edgeExit,
            edgeHit: rr.edgeHit || null,
            edgeTir: !!rr.edgeTir,
            edgeIntensity: rr.edgeIntensity || 0,
            t1: rr.t1 != null ? rr.t1 : 1,
            t2: rr.t2 != null ? rr.t2 : 1,
            r1: rr.r1 != null ? rr.r1 : 0,
            rdir: rr.rdir || (rr.h1 && rr.h2 ? { z: rr.h2.z-rr.h1.z, r: rr.h2.r-rr.h1.r } : { z:0, r:0 }),
            inner: rr.inner || [],
            esc: rr.esc || [],
          };
        });
        rayCacheRef.current = { key, rays, hits: collectSurfaceHits(rays, p.eq, p.eqR) };
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
  }, [scheduleRender]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        display: "block",
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        cursor: "move",
        touchAction: "none",
      }}
    />
  );
}

export default memo(Lens2D);
