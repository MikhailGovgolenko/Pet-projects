import { useRef, useEffect, useCallback } from "react";
import { safeEval, sampleLens, traceRays, toScreen } from "./lensMath";

export default function Lens2D({ params, lensCache, onScaleChange, scale }) {
  const canvasRef = useRef(null);
  const stateRef = useRef({
    scale: 7,
    cx: 0,
    cy: 0,
    isDragging: false,
    dragStartX: 0,
    dragStartY: 0,
  });
  const drawPending = useRef(false);
  const isWheelZoom = useRef(false);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const { scale, cx, cy } = stateRef.current;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const key = params.eq + "|" + params.eqR;
    if (lensCache.current.key !== key) {
      lensCache.current = { key, data: sampleLens(params.eq, params.eqR) };
    }
    const lens = lensCache.current.data;

    const rays = traceRays(params.eq, params.eqR, lens.aperture, params.angle, params.n, params.rayCount);

    var grad = ctx.createLinearGradient(cx, 0, cx + 100, 0);
    grad.addColorStop(0, "rgba(150,180,255,0.2)");
    grad.addColorStop(1, "rgba(100,130,255,0.15)");
    ctx.fillStyle = grad;
    ctx.beginPath();
    lens.L.forEach(function (p, i) {
      var s = toScreen(p, cx, cy, scale);
      if (i === 0) ctx.moveTo(s.sx, s.sy);
      else ctx.lineTo(s.sx, s.sy);
    });
    for (var i = lens.R.length - 1; i >= 0; i--) {
      var s = toScreen(lens.R[i], cx, cy, scale);
      ctx.lineTo(s.sx, s.sy);
    }
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = "rgba(0,180,255,0.6)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    lens.L.forEach(function (p, i) {
      var s = toScreen(p, cx, cy, scale);
      if (i === 0) ctx.moveTo(s.sx, s.sy);
      else ctx.lineTo(s.sx, s.sy);
    });
    ctx.stroke();
    ctx.beginPath();
    lens.R.forEach(function (p, i) {
      var s = toScreen(p, cx, cy, scale);
      if (i === 0) ctx.moveTo(s.sx, s.sy);
      else ctx.lineTo(s.sx, s.sy);
    });
    ctx.stroke();

    for (var i = 0; i < rays.length; i++) {
      var r = rays[i];
      if (r.disabled) continue;
      var sP = toScreen(r.P, cx, cy, scale);
      var sH1 = toScreen(r.h1, cx, cy, scale);
      var sH2 = toScreen(r.h2, cx, cy, scale);
      var sEnd = toScreen(r.end, cx, cy, scale);

      ctx.strokeStyle = "rgba(255,60,60,0.9)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(sP.sx, sP.sy);
      ctx.lineTo(sH1.sx, sH1.sy);
      ctx.stroke();

      ctx.strokeStyle = "rgba(255,180,50,0.9)";
      ctx.beginPath();
      ctx.moveTo(sH1.sx, sH1.sy);
      ctx.lineTo(sH2.sx, sH2.sy);
      ctx.stroke();

      ctx.strokeStyle = "rgba(50,255,100,0.9)";
      ctx.beginPath();
      ctx.moveTo(sH2.sx, sH2.sy);
      ctx.lineTo(sEnd.sx, sEnd.sy);
      ctx.stroke();
    }
  }, [params, lensCache]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const state = stateRef.current;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    state.cx = canvas.width / 4;
    state.cy = canvas.height / 2;
    state.scale = 7;
    draw();
  }, [draw]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    stateRef.current.scale = scale;
    if (!isWheelZoom.current) {
      stateRef.current.cx = canvas.width / 4;
      stateRef.current.cy = canvas.height / 2;
    }
    isWheelZoom.current = false;
    draw();
  }, [scale]);

  useEffect(() => {
    const onResize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width = canvas.clientWidth;
      canvas.height = canvas.clientHeight;
      stateRef.current.cx = canvas.width / 4;
      stateRef.current.cy = canvas.height / 2;
      draw();
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [draw]);

  useEffect(() => {
    if (drawPending.current) return;
    drawPending.current = true;
    requestAnimationFrame(() => {
      drawPending.current = false;
      draw();
    });
  }, [params, draw]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const state = stateRef.current;
    if (!canvas) return;

    const onMouseDown = (e) => {
      state.isDragging = true;
      state.dragStartX = e.clientX;
      state.dragStartY = e.clientY;
    };

    const onMouseMove = (e) => {
      if (!state.isDragging) return;
      state.cx += e.clientX - state.dragStartX;
      state.cy += e.clientY - state.dragStartY;
      state.dragStartX = e.clientX;
      state.dragStartY = e.clientY;
      draw();
    };

    const onMouseUp = () => { state.isDragging = false; };
    const onMouseLeave = () => { state.isDragging = false; };

    const onWheel = (e) => {
      e.preventDefault();
      var factor = e.deltaY < 0 ? 1.05 : 0.95;
      var rect = canvas.getBoundingClientRect();
      var mx = e.clientX - rect.left;
      var my = e.clientY - rect.top;
      var x0 = (mx - state.cx) / state.scale;
      var y0 = (my - state.cy) / state.scale;
      state.scale = Math.min(10000, Math.max(2, state.scale * factor));
      state.cx = mx - x0 * state.scale;
      state.cy = my - y0 * state.scale;
      isWheelZoom.current = true;
      if (onScaleChange) onScaleChange(state.scale);
      draw();
    };

    canvas.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    canvas.addEventListener("mouseleave", onMouseLeave);
    canvas.addEventListener("wheel", onWheel, { passive: false });
    canvas.addEventListener("contextmenu", (e) => e.preventDefault());

    return () => {
      canvas.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      canvas.removeEventListener("mouseleave", onMouseLeave);
      canvas.removeEventListener("wheel", onWheel);
    };
  }, [draw]);

  return (
    <canvas
      ref={canvasRef}
      style={{ display: "block", width: "100%", height: "100%", cursor: "move" }}
    />
  );
}
