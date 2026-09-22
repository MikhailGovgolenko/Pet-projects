import { useRef, useEffect, useCallback, memo } from "react";
import * as M from "./lensMathReflect";
import * as M_OLD from "./lensMath";
import { createCamera } from "./Camera";
import { collectRaySegments, drawLensSvg, drawSegmentSvg } from "./lensDraw2D";

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

function Lens2DSvg({ params, resetKey, scaleRef }) {
  const surfaceRef = useRef<HTMLDivElement>(null);
  const gRef = useRef<SVGGElement>(null);
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

  const getSize = useCallback(() => {
    const rect = surfaceRef.current?.getBoundingClientRect();
    const w = rect && rect.width > 0 ? rect.width : window.innerWidth;
    const h = rect && rect.height > 0 ? rect.height : window.innerHeight;
    return { width: w, height: h };
  }, []);

  const render = useCallback(() => {
    const g = gRef.current;
    const camera = cameraRef.current;
    const lens = lensCacheRef.current.lens;
    const rays = rayCacheRef.current.rays;
    if (!g || !lens || !rays) return;

    while (g.firstChild) g.removeChild(g.firstChild);

    const wts = (p: { z: number; r: number }) => camera.worldToScreen(p);
    drawLensSvg(g, lens, wts, camera.x);
    for (const seg of collectRaySegments(rays, wts)) {
      drawSegmentSvg(g, seg);
    }
  }, []);

  const scheduleRender = useCallback(() => {
    if (renderScheduled.current) return;
    renderScheduled.current = true;
    requestAnimationFrame(() => {
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
      if (!fittedRef.current && lensCacheRef.current.box) {
        fittedRef.current = true;
        const { width, height } = getSize();
        cameraRef.current.fit(lensCacheRef.current.box, width, height);
        if (scaleRef.current) scaleRef.current.textContent = cameraRef.current.scale.toFixed(2);
      }
      const key = cacheKey(p, lens.aperture);
      if (rayCacheRef.current.key !== key) {
        const math = p.useReflections ? M : M_OLD;
        var rawRays = math.traceRays(
          p.eq, p.eqR, lens.aperture,
          p.angle * (p.useReflections ? M.DEG : M_OLD.DEG),
          p.n, p.rayCount, lensCacheRef.current.box, p.keepFailed
        );
        rayCacheRef.current = {
          key,
          rays: (rawRays || []).map((rr) => ({
            P: rr.P,
            h1: rr.h1 || null,
            h2: rr.h2 || null,
            end: rr.end || (rr.P ? { z: rr.P.z + 3000, r: rr.P.r } : null),
            ok: !!rr.ok,
            tir: !!rr.tir,
            t1: rr.t1 != null ? rr.t1 : 1,
            t2: rr.t2 != null ? rr.t2 : 1,
            r1: rr.r1 != null ? rr.r1 : 0,
            rdir: rr.rdir || (rr.h1 && rr.h2 ? { z: rr.h2.z - rr.h1.z, r: rr.h2.r - rr.h1.r } : { z: 0, r: 0 }),
            inner: rr.inner || [],
            esc: rr.esc || [],
          })),
        };
      }
      scheduleRender();
    });
  }, [params, scheduleRender, getSize]);

  useEffect(() => {
    const { width, height } = getSize();
    cameraRef.current.reset(width, height);
    render();
  }, [getSize, render]);

  useEffect(() => {
    const camera = cameraRef.current;
    const { width, height } = getSize();
    const box = lensCacheRef.current.box;
    if (box) camera.fit(box, width, height);
    else camera.reset(width, height);
    if (scaleRef.current) scaleRef.current.textContent = camera.scale.toFixed(2);
    renderScheduled.current = false;
    render();
  }, [resetKey, render, getSize]);

  useEffect(() => {
    const onResize = () => scheduleRender();
    window.addEventListener("resize", onResize);
    window.visualViewport?.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      window.visualViewport?.removeEventListener("resize", onResize);
    };
  }, [scheduleRender]);

  useEffect(() => {
    const surface = surfaceRef.current;
    if (!surface) return;
    const camera = cameraRef.current;

    const reportScale = () => {
      if (zoomReportScheduled.current) return;
      zoomReportScheduled.current = true;
      requestAnimationFrame(() => {
        zoomReportScheduled.current = false;
        if (scaleRef.current) scaleRef.current.textContent = camera.scale.toFixed(2);
      });
    };

    const onMouseDown = (e: MouseEvent) => {
      dragRef.current.isDragging = true;
      dragRef.current.x = e.clientX;
      dragRef.current.y = e.clientY;
    };
    const onMouseMove = (e: MouseEvent) => {
      if (!dragRef.current.isDragging) return;
      camera.pan(e.clientX - dragRef.current.x, e.clientY - dragRef.current.y);
      dragRef.current.x = e.clientX;
      dragRef.current.y = e.clientY;
      scheduleRender();
    };
    const onMouseUp = () => { dragRef.current.isDragging = false; };
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const factor = e.deltaY < 0 ? 1.05 : 0.95;
      const rect = surface.getBoundingClientRect();
      camera.zoomAt(e.clientX - rect.left, e.clientY - rect.top, factor);
      reportScale();
      scheduleRender();
    };
    const onTouchStart = (e: TouchEvent) => {
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
    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      if (e.touches.length === 2 && pinchRef.current) {
        const t1 = e.touches[0];
        const t2 = e.touches[1];
        const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
        if (dist > 0) {
          const rect = surface.getBoundingClientRect();
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
    const onTouchEnd = (e: TouchEvent) => {
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
    const onContextMenu = (e: Event) => e.preventDefault();

    surface.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    surface.addEventListener("wheel", onWheel, { passive: false });
    surface.addEventListener("touchstart", onTouchStart, { passive: true });
    surface.addEventListener("touchmove", onTouchMove, { passive: false });
    surface.addEventListener("touchend", onTouchEnd);
    surface.addEventListener("touchcancel", onTouchEnd);
    surface.addEventListener("contextmenu", onContextMenu);

    return () => {
      surface.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      surface.removeEventListener("wheel", onWheel);
      surface.removeEventListener("touchstart", onTouchStart);
      surface.removeEventListener("touchmove", onTouchMove);
      surface.removeEventListener("touchend", onTouchEnd);
      surface.removeEventListener("touchcancel", onTouchEnd);
      surface.removeEventListener("contextmenu", onContextMenu);
    };
  }, [scheduleRender]);

  return (
    <div
      ref={surfaceRef}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        cursor: "move",
        touchAction: "none",
      }}
    >
      <svg
        width="100%"
        height="100%"
        style={{ display: "block", pointerEvents: "none" }}
        aria-hidden="true"
      >
        <g ref={gRef} />
      </svg>
    </div>
  );
}

export default memo(Lens2DSvg);
