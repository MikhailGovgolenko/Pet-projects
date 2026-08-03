import { useRef, useEffect, useCallback, memo } from "react";
import { sampleLens, traceRays, DEG } from "./lensMath";
import { createCamera } from "./Camera";

function cacheKey(p, aperture) {
  return [p.eq, p.eqR, aperture, p.angle, p.n, p.rayCount].join("|");
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

function drawRays(ctx, rays, camera) {
  for (var i = 0; i < rays.length; i++) {
    var r = rays[i];
    var sP = camera.worldToScreen(r.P);
    var sEnd = camera.worldToScreen(r.end);
    if (!r.h1) {
      ctx.strokeStyle = "rgba(255,60,60,0.9)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(sP.x, sP.y);
      ctx.lineTo(sEnd.x, sEnd.y);
      ctx.stroke();
      continue;
    }
    var sH1 = camera.worldToScreen(r.h1);
    ctx.strokeStyle = "rgba(255,60,60,0.9)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(sP.x, sP.y);
    ctx.lineTo(sH1.x, sH1.y);
    ctx.stroke();

    ctx.strokeStyle = "rgba(255,180,50,0.9)";
    if (r.h2) {
      var sH2 = camera.worldToScreen(r.h2);
      ctx.beginPath();
      ctx.moveTo(sH1.x, sH1.y);
      ctx.lineTo(sH2.x, sH2.y);
      ctx.stroke();
      ctx.strokeStyle = "rgba(50,255,100,0.9)";
      ctx.beginPath();
      ctx.moveTo(sH2.x, sH2.y);
      ctx.lineTo(sEnd.x, sEnd.y);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.moveTo(sH1.x, sH1.y);
      ctx.lineTo(sEnd.x, sEnd.y);
      ctx.stroke();
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
    lens?: ReturnType<typeof sampleLens>;
    box?: { z0: number; z1: number; r1: number };
  }>({ key: "" });
  const rayCacheRef = useRef<{ key: string; rays?: ReturnType<typeof traceRays> }>({ key: "" });
  const simPending = useRef(false);
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
        const lens = sampleLens(p.eq, p.eqR);
        lensCacheRef.current = { key: eqKey, lens, box: lensBox(lens) };
      }
      const lens = lensCacheRef.current.lens;
      const key = cacheKey(p, lens.aperture);
      if (rayCacheRef.current.key !== key) {
        rayCacheRef.current = {
          key,
          rays: traceRays(p.eq, p.eqR, lens.aperture, p.angle * DEG, p.n, p.rayCount, lensCacheRef.current.box),
        };
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
    camera.reset(rect ? rect.width : window.innerWidth, rect ? rect.height : window.innerHeight);
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
