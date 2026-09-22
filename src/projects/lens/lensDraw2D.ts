/** Shared 2D drawing helpers for canvas and SVG renderers. */

export const REFLEN = 120;
export const COLOR_SINGLE = [50, 255, 100];

export function clamp(v: number, a: number, b: number) {
  return Math.max(a, Math.min(b, v));
}

export function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

export function mixColor(c1: number[], c2: number[], t: number) {
  return [
    Math.round(lerp(c1[0], c2[0], t)),
    Math.round(lerp(c1[1], c2[1], t)),
    Math.round(lerp(c1[2], c2[2], t)),
  ];
}

export function rgbToCss(rgb: number[], a: number) {
  return `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${a})`;
}

export type ScreenPoint = { x: number; y: number };

export function lensPathD(
  lens: { L: { z: number; r: number }[]; R: { z: number; r: number }[] },
  worldToScreen: (p: { z: number; r: number }) => ScreenPoint
) {
  const parts: string[] = [];
  lens.L.forEach((p, i) => {
    const s = worldToScreen(p);
    parts.push(`${i === 0 ? "M" : "L"}${s.x.toFixed(2)},${s.y.toFixed(2)}`);
  });
  for (let i = lens.R.length - 1; i >= 0; i--) {
    const s = worldToScreen(lens.R[i]);
    parts.push(`L${s.x.toFixed(2)},${s.y.toFixed(2)}`);
  }
  parts.push("Z");
  return parts.join(" ");
}

export function lensSurfacePathD(
  points: { z: number; r: number }[],
  worldToScreen: (p: { z: number; r: number }) => ScreenPoint
) {
  const parts: string[] = [];
  points.forEach((p, i) => {
    const s = worldToScreen(p);
    parts.push(`${i === 0 ? "M" : "L"}${s.x.toFixed(2)},${s.y.toFixed(2)}`);
  });
  return parts.join(" ");
}

export type Segment = {
  a: ScreenPoint;
  b: ScreenPoint;
  color: number[];
  intensity: number;
  coreWidth: number;
};

export function collectRaySegments(rays: any[], worldToScreen: (p: { z: number; r: number }) => ScreenPoint): Segment[] {
  const out: Segment[] = [];
  const baseColor = COLOR_SINGLE;

  const push = (a: ScreenPoint, b: ScreenPoint, color: number[], intensity: number, coreWidth: number) => {
    out.push({ a, b, color, intensity: clamp(intensity, 0, 1), coreWidth });
  };

  for (let i = 0; i < rays.length; i++) {
    const r = rays[i];
    const sP = worldToScreen(r.P);
    const sEnd = worldToScreen(r.end);
    const overallIntensity = (r.t1 || 1) * (r.t2 || 1);

    if (!r.h1) {
      push(sP, sEnd, baseColor, 0.75 * overallIntensity, 1.2);
      continue;
    }

    const sH1 = worldToScreen(r.h1);
    push(sP, sH1, baseColor, 0.8 * overallIntensity, 1.2);

    if (r.r1 > 0.001 && r.rdir) {
      const sR = worldToScreen({
        z: r.h1.z + r.rdir.z * REFLEN,
        r: r.h1.r + r.rdir.r * REFLEN,
      });
      push(sH1, sR, mixColor(baseColor, [255, 92, 200], 0.25), r.r1, 1.0);
    }

    if (r.h2) {
      const sH2 = worldToScreen(r.h2);
      push(sH1, sH2, baseColor, 0.6 * (r.t1 || 1), 2.0);
      push(sH2, sEnd, baseColor, overallIntensity, 2.0);
      for (const seg of r.inner || []) {
        push(worldToScreen(seg.a), worldToScreen(seg.b), baseColor, seg.i || 0, 1.2);
      }
      for (const ex of r.esc || []) {
        push(
          worldToScreen(ex.p),
          worldToScreen({ z: ex.p.z + ex.dir.z * REFLEN, r: ex.p.r + ex.dir.r * REFLEN }),
          baseColor,
          ex.i || 0,
          1.0
        );
      }
    } else {
      push(sH1, sEnd, baseColor, r.t1 || 1, 2.0);
    }
  }

  return out;
}

export function drawSegmentCanvas(
  ctx: CanvasRenderingContext2D,
  a: ScreenPoint,
  b: ScreenPoint,
  color: number[],
  intensity: number,
  coreWidth: number
) {
  coreWidth = coreWidth || 1.5;
  ctx.lineWidth = coreWidth * 6;
  ctx.strokeStyle = rgbToCss(color, clamp(0.06 * intensity, 0.02, 0.14));
  ctx.beginPath();
  ctx.moveTo(a.x, a.y);
  ctx.lineTo(b.x, b.y);
  ctx.stroke();
  ctx.lineWidth = coreWidth * 1.6;
  ctx.strokeStyle = rgbToCss(color, clamp(0.6 * intensity, 0.2, 0.95));
  ctx.beginPath();
  ctx.moveTo(a.x, a.y);
  ctx.lineTo(b.x, b.y);
  ctx.stroke();
  ctx.lineWidth = Math.max(1, coreWidth * 0.6);
  ctx.strokeStyle = rgbToCss([255, 255, 255], clamp(0.35 + 0.65 * intensity, 0.2, 1));
  ctx.beginPath();
  ctx.moveTo(a.x, a.y);
  ctx.lineTo(b.x, b.y);
  ctx.stroke();
}

const SVG_NS = "http://www.w3.org/2000/svg";

function svgLine(a: ScreenPoint, b: ScreenPoint, stroke: string, width: number) {
  const el = document.createElementNS(SVG_NS, "line");
  el.setAttribute("x1", String(a.x));
  el.setAttribute("y1", String(a.y));
  el.setAttribute("x2", String(b.x));
  el.setAttribute("y2", String(b.y));
  el.setAttribute("stroke", stroke);
  el.setAttribute("stroke-width", String(width));
  el.setAttribute("stroke-linecap", "round");
  return el;
}

export function drawSegmentSvg(g: SVGGElement, seg: Segment) {
  const { a, b, color, intensity, coreWidth } = seg;
  const w = coreWidth || 1.5;
  g.appendChild(svgLine(a, b, rgbToCss(color, clamp(0.06 * intensity, 0.02, 0.14)), w * 6));
  g.appendChild(svgLine(a, b, rgbToCss(color, clamp(0.6 * intensity, 0.2, 0.95)), w * 1.6));
  g.appendChild(svgLine(a, b, rgbToCss([255, 255, 255], clamp(0.35 + 0.65 * intensity, 0.2, 1)), Math.max(1, w * 0.6)));
}

export function drawLensSvg(
  g: SVGGElement,
  lens: { L: { z: number; r: number }[]; R: { z: number; r: number }[] },
  worldToScreen: (p: { z: number; r: number }) => ScreenPoint,
  cameraX: number
) {
  const d = lensPathD(lens, worldToScreen);

  const grad = document.createElementNS(SVG_NS, "linearGradient");
  grad.setAttribute("id", "lens-grad");
  grad.setAttribute("gradientUnits", "userSpaceOnUse");
  grad.setAttribute("x1", String(cameraX));
  grad.setAttribute("y1", "0");
  grad.setAttribute("x2", String(cameraX + 100));
  grad.setAttribute("y2", "0");
  const stop0 = document.createElementNS(SVG_NS, "stop");
  stop0.setAttribute("offset", "0%");
  stop0.setAttribute("stop-color", "rgba(150,180,255,0.2)");
  const stop1 = document.createElementNS(SVG_NS, "stop");
  stop1.setAttribute("offset", "100%");
  stop1.setAttribute("stop-color", "rgba(100,130,255,0.15)");
  grad.append(stop0, stop1);

  const defs = document.createElementNS(SVG_NS, "defs");
  defs.appendChild(grad);
  g.appendChild(defs);

  const fill = document.createElementNS(SVG_NS, "path");
  fill.setAttribute("d", d);
  fill.setAttribute("fill", "url(#lens-grad)");
  g.appendChild(fill);

  const strokeL = document.createElementNS(SVG_NS, "path");
  strokeL.setAttribute("d", lensSurfacePathD(lens.L, worldToScreen));
  strokeL.setAttribute("fill", "none");
  strokeL.setAttribute("stroke", "rgba(0,180,255,0.6)");
  strokeL.setAttribute("stroke-width", "2");
  g.appendChild(strokeL);

  const strokeR = document.createElementNS(SVG_NS, "path");
  strokeR.setAttribute("d", lensSurfacePathD(lens.R, worldToScreen));
  strokeR.setAttribute("fill", "none");
  strokeR.setAttribute("stroke", "rgba(0,180,255,0.6)");
  strokeR.setAttribute("stroke-width", "2");
  g.appendChild(strokeR);
}
