import { useRef, useEffect, useCallback, memo } from "react";
import { sampleLens, traceRays } from "./lensMath";
import { createCamera } from "./Camera";

function cacheKey(p, aperture) {
  return [p.eq, p.eqR, aperture, p.angle, p.n, p.rayCount].join("|");
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
    if (r.disabled) continue;
    var sP = camera.worldToScreen(r.P);
    var sH1 = camera.worldToScreen(r.h1);
    var sH2 = camera.worldToScreen(r.h2);
    var sEnd = camera.worldToScreen(r.end);

    ctx.strokeStyle = "rgba(255,60,60,0.9)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(sP.x, sP.y);
    ctx.lineTo(sH1.x, sH1.y);
    ctx.stroke();

    ctx.strokeStyle = "rgba(255,180,50,0.9)";
    ctx.beginPath();
    ctx.moveTo(sH1.x, sH1.y);
    ctx.lineTo(sH2.x, sH2.y);
    ctx.stroke();

    ctx.strokeStyle = "rgba(50,255,100,0.9)";
    ctx.beginPath();
    ctx.moveTo(sH2.x, sH2.y);
    ctx.lineTo(sEnd.x, sEnd.y);
    ctx.stroke();
  }
}

function Lens2D({ params, simCache, resetKey, scaleRef }) {
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const cameraRef = useRef(createCamera());
  const dragRef = useRef({ isDragging: false, x: 0, y: 0 });
  const renderScheduled = useRef(false);
  const zoomReportScheduled = useRef(false);
  const lastZoomRef = useRef(7);
  const simCacheRef = useRef(simCache);
  simCacheRef.current = simCache;
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
    const cache = simCacheRef.current;
    if (!ctx || !canvas || !cache.lens) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawLens(ctx, cache.lens, camera);
    drawRays(ctx, cache.rays, camera);
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
    const p = paramsRef.current;
    const lens = sampleLens(p.eq, p.eqR);
    const key = cacheKey(p, lens.aperture);
    if (simCacheRef.current.key !== key) {
      const rays = traceRays(p.eq, p.eqR, lens.aperture, p.angle, p.n, p.rayCount);
      simCacheRef.current = { key, lens, rays };
    }
    scheduleRender();
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
    scheduleRender();
  }, [resetKey, scheduleRender, scaleRef]);

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
      lastZoomRef.current = camera.scale;
      if (!zoomReportScheduled.current) {
        zoomReportScheduled.current = true;
        requestAnimationFrame(function () {
          zoomReportScheduled.current = false;
          if (scaleRef.current) scaleRef.current.textContent = lastZoomRef.current.toFixed(2);
        });
      }
      scheduleRender();
    };

    const onContextMenu = (e) => e.preventDefault();

    canvas.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    canvas.addEventListener("mouseleave", onMouseLeave);
    canvas.addEventListener("wheel", onWheel, { passive: false });
    canvas.addEventListener("contextmenu", onContextMenu);

    return () => {
      canvas.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      canvas.removeEventListener("mouseleave", onMouseLeave);
      canvas.removeEventListener("wheel", onWheel);
      canvas.removeEventListener("contextmenu", onContextMenu);
    };
  }, [scheduleRender, syncCanvasSize]);

  return (
    <canvas
      ref={canvasRef}
      style={{ display: "block", width: "100%", height: "100%", cursor: "move" }}
    />
  );
}

export default memo(Lens2D);
