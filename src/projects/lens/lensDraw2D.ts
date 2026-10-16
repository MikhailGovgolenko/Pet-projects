/** Shared 2D drawing helpers for canvas and SVG renderers. */

export const REFLEN = 120;
export const COLOR_SINGLE = [50, 255, 100];
export const RAY_RADIUS = 1.5;

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
export type CamView = { w: number; h: number };
type CamLike = { x: number; y: number; scale: number };

export function createViewTransform(camera: CamLike, view: CamView) {
  const s = camera.scale;
  const cz = (view.w / 2 - camera.x) / s;
  const cr = (camera.y - view.h / 2) / s;
  return (p: { z: number; r: number }) => ({
    x: view.w / 2 + (p.z - cz) * s,
    y: view.h / 2 + (cr - p.r) * s,
  });
}

export function clipSegment(ax, ay, bx, by, w, h) {
  let t0 = 0;
  let t1 = 1;
  const dx = bx - ax;
  const dy = by - ay;
  const clip = (p, q) => {
    if (p === 0) return q >= 0;
    const r = q / p;
    if (p < 0) {
      if (r > t1) return false;
      if (r > t0) t0 = r;
    } else {
      if (r < t0) return false;
      if (r < t1) t1 = r;
    }
    return true;
  };
  if (!clip(-dx, ax)) return null;
  if (!clip(dx, w - ax)) return null;
  if (!clip(-dy, ay)) return null;
  if (!clip(dy, h - ay)) return null;
  return { x1: ax + t0 * dx, y1: ay + t0 * dy, x2: ax + t1 * dx, y2: ay + t1 * dy };
}

export function clipPolygon(pts: ScreenPoint[], view: CamView): ScreenPoint[] {
  let poly = pts.slice();
  const edge = (x, y, nx, ny) => {
    const out: ScreenPoint[] = [];
    const n = poly.length;
    for (let i = 0; i < n; i++) {
      const a = poly[i];
      const b = poly[(i + 1) % n];
      const da = nx * (a.x - x) + ny * (a.y - y);
      const db = nx * (b.x - x) + ny * (b.y - y);
      if (da >= 0) out.push(a);
      if (da >= 0 !== db >= 0) {
        const t = da / (da - db);
        out.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
      }
    }
    poly = out;
  };
  edge(0, 0, 1, 0);
  edge(view.w, 0, -1, 0);
  edge(0, 0, 0, 1);
  edge(0, view.h, 0, -1);
  return poly;
}

export function clipPolyline(pts: ScreenPoint[], view: CamView): ScreenPoint[][] {
  const paths: ScreenPoint[][] = [];
  let sub: ScreenPoint[] = [];
  const flush = () => {
    if (sub.length) paths.push(sub);
    sub = [];
  };
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i];
    const b = pts[i + 1];
    const s = clipSegment(a.x, a.y, b.x, b.y, view.w, view.h);
    if (!s) {
      flush();
      continue;
    }
    if (!sub.length) {
      sub.push({ x: s.x1, y: s.y1 });
    } else {
      const last = sub[sub.length - 1];
      if (Math.hypot(last.x - s.x1, last.y - s.y1) > 1e-6) {
        flush();
        sub.push({ x: s.x1, y: s.y1 });
      }
    }
    sub.push({ x: s.x2, y: s.y2 });
  }
  flush();
  return paths;
}

function screenPathD(paths: ScreenPoint[][], close: boolean) {
  const parts: string[] = [];
  for (const path of paths) {
    if (path.length < 2) continue;
    path.forEach((p, i) => parts.push(`${i === 0 ? "M" : "L"}${p.x.toFixed(2)},${p.y.toFixed(2)}`));
    if (close) parts.push("Z");
  }
  return parts.join(" ");
}

export type Segment = {
  a: ScreenPoint;
  b: ScreenPoint;
  color: number[];
  intensity: number;
  coreWidth: number;
};

export function collectRaySegments(
  rays: any[],
  camera: CamLike,
  view: CamView
): Segment[] {
  const out: Segment[] = [];
  const baseColor = COLOR_SINGLE;
  const wts = createViewTransform(camera, view);
  const ext = 4 * Math.hypot(view.w, view.h);

  const push = (
    aw: { z: number; r: number },
    bw: { z: number; r: number },
    freeA: boolean,
    freeB: boolean,
    color: number[],
    intensity: number,
    width: number
  ) => {
    const i = clamp(intensity, 0, 1);
    if (i <= 0.001) return;
    const a = wts(aw);
    const b = wts(bw);
    let ax = a.x;
    let ay = a.y;
    let bx = b.x;
    let by = b.y;
    const dx = bx - ax;
    const dy = by - ay;
    const len = Math.hypot(dx, dy) || 1;
    if (freeA) {
      ax -= (dx / len) * ext;
      ay -= (dy / len) * ext;
    }
    if (freeB) {
      bx += (dx / len) * ext;
      by += (dy / len) * ext;
    }
    const seg = clipSegment(ax, ay, bx, by, view.w, view.h);
    if (!seg) return;
    out.push({ a: { x: seg.x1, y: seg.y1 }, b: { x: seg.x2, y: seg.y2 }, color, intensity: i, coreWidth: width });
  };

  for (let i = 0; i < rays.length; i++) {
    const r = rays[i];
    const overallIntensity = r.tir ? (r.t1 || 1) : (r.t1 || 1) * (r.t2 || 1);

    if (!r.h1) {
      push(r.P, r.end, true, true, baseColor, 1, RAY_RADIUS);
      continue;
    }

    push(r.P, r.h1, true, false, baseColor, 1, RAY_RADIUS);

    if (r.r1 > 0.001 && r.rdir) {
      const reflEnd = { z: r.h1.z + r.rdir.z * REFLEN, r: r.h1.r + r.rdir.r * REFLEN };
      push(r.h1, reflEnd, false, true, baseColor, r.r1, RAY_RADIUS);
    }

    if (r.edgeHit) {
      push(r.h1, r.edgeHit, false, false, baseColor, r.t1 || 1, RAY_RADIUS);
      if (!r.edgeTir) {
        push(r.edgeHit, r.end, false, true, baseColor, r.edgeIntensity || 0, RAY_RADIUS);
      }
      for (const seg of r.inner || []) push(seg.a, seg.b, false, false, baseColor, seg.i || 0, RAY_RADIUS);
      for (const ex of r.esc || []) {
        push(ex.p, { z: ex.p.z + ex.dir.z * REFLEN, r: ex.p.r + ex.dir.r * REFLEN }, false, true, baseColor, ex.i || 0, RAY_RADIUS);
      }
      continue;
    }

    if (r.h2) {
      push(r.h1, r.h2, false, false, baseColor, r.t1 || 1, RAY_RADIUS);
      push(r.h2, r.end, false, true, baseColor, overallIntensity, RAY_RADIUS);
      for (const seg of r.inner || []) push(seg.a, seg.b, false, false, baseColor, seg.i || 0, RAY_RADIUS);
      for (const ex of r.esc || []) {
        push(ex.p, { z: ex.p.z + ex.dir.z * REFLEN, r: ex.p.r + ex.dir.r * REFLEN }, false, true, baseColor, ex.i || 0, RAY_RADIUS);
      }
    } else {
      push(r.h1, r.end, false, true, baseColor, r.t1 || 1, RAY_RADIUS);
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
  coreWidth = 1.5
) {
  const i = clamp(intensity, 0, 1);
  if (i <= 0.001) return;
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineWidth = coreWidth * 3;
  ctx.strokeStyle = rgbToCss(color, 0.14 * i);
  ctx.beginPath();
  ctx.moveTo(a.x, a.y);
  ctx.lineTo(b.x, b.y);
  ctx.stroke();
  ctx.lineWidth = coreWidth * 1.6;
  ctx.strokeStyle = rgbToCss(color, 0.6 * i);
  ctx.beginPath();
  ctx.moveTo(a.x, a.y);
  ctx.lineTo(b.x, b.y);
  ctx.stroke();
  ctx.lineWidth = Math.max(1, coreWidth * 0.6);
  ctx.strokeStyle = rgbToCss(color, i);
  ctx.beginPath();
  ctx.moveTo(a.x, a.y);
  ctx.lineTo(b.x, b.y);
  ctx.stroke();
  ctx.restore();
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
  const i = clamp(intensity, 0, 1);
  if (i <= 0.001) return;
  const w = coreWidth || 1.5;
  g.appendChild(svgLine(a, b, rgbToCss(color, 0.14 * i), w * 3));
  g.appendChild(svgLine(a, b, rgbToCss(color, 0.6 * i), w * 1.6));
  g.appendChild(svgLine(a, b, rgbToCss(color, i), Math.max(1, w * 0.6)));
}

export function drawLensSvg(
  g: SVGGElement,
  lens: { L: { z: number; r: number }[]; R: { z: number; r: number }[] },
  camera: CamLike,
  view: CamView
) {
  const wts = createViewTransform(camera, view);
  const Ls = lens.L.map(wts);
  const Rs = lens.R.map(wts);
  const d = screenPathD([clipPolygon([...Ls, ...Rs.slice().reverse()], view)], true);

  const grad = document.createElementNS(SVG_NS, "linearGradient");
  grad.setAttribute("id", "lens-grad");
  grad.setAttribute("gradientUnits", "userSpaceOnUse");
  grad.setAttribute("x1", String(view.w / 2));
  grad.setAttribute("y1", "0");
  grad.setAttribute("x2", String(view.w / 2 + 100));
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
  strokeL.setAttribute("d", screenPathD(clipPolyline(Ls, view), false));
  strokeL.setAttribute("fill", "none");
  strokeL.setAttribute("stroke", "rgba(0,180,255,0.6)");
  strokeL.setAttribute("stroke-width", "2");
  g.appendChild(strokeL);

  const strokeR = document.createElementNS(SVG_NS, "path");
  strokeR.setAttribute("d", screenPathD(clipPolyline(Rs, view), false));
  strokeR.setAttribute("fill", "none");
  strokeR.setAttribute("stroke", "rgba(0,180,255,0.6)");
  strokeR.setAttribute("stroke-width", "2");
  g.appendChild(strokeR);
}
