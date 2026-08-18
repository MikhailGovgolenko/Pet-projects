import { useEffect, useRef, type CSSProperties } from "react";

export type DitherAlgorithm =
  | "bayer2"
  | "bayer4"
  | "bayer8"
  | "floyd"
  | "atkinson"
  | "noise";

export type DitherShape = "square" | "dot" | "glow";

export type DitherAnimation =
  | "none"
  | "scan"
  | "flow"
  | "wave"
  | "jitter"
  | "glitch"
  | "melt"
  | "rain"
  | "dissolve";

export type DitherCursorEffect =
  | "none"
  | "reveal"
  | "trail"
  | "ripple"
  | "warp"
  | "pinch"
  | "twist"
  | "scatter";

export interface DitherConfig {
  algorithm: DitherAlgorithm;
  shape: DitherShape;
  fg: string;
  bg: string;
  pixel: number;
  levels: number;
  contrast: number;
  spacing: number;
  invert: boolean;
  animation: DitherAnimation;
  cursorEffect: DitherCursorEffect;
  animate: boolean;
  zoom: number;
  offsetX: number;
  offsetY: number;
}

export const DEFAULT_DITHER_CONFIG: DitherConfig = {
  algorithm: "bayer8",
  shape: "square",
  fg: "#f2e9d8",
  bg: "#0c0a08",
  pixel: 3,
  levels: 2,
  contrast: 18,
  spacing: 0.8,
  invert: false,
  animation: "none",
  cursorEffect: "none",
  animate: true,
  zoom: 1,
  offsetX: 0,
  offsetY: 0,
};

export const DITHER_PRESETS: Record<
  string,
  { label: string; config: Partial<DitherConfig> }
> = {
  statue: {
    label: "Statue",
    config: {
      algorithm: "bayer8",
      shape: "square",
      fg: "#f2e9d8",
      bg: "#0c0a08",
      pixel: 3,
      levels: 2,
      contrast: 18,
      spacing: 0.8,
      invert: false,
      animation: "none",
      cursorEffect: "none",
    },
  },
  mono: {
    label: "Mono Print",
    config: {
      algorithm: "floyd",
      shape: "square",
      fg: "#f5f5f2",
      bg: "#101010",
      pixel: 2,
      levels: 2,
      contrast: 8,
      spacing: 0.8,
      invert: false,
      animation: "none",
      cursorEffect: "none",
    },
  },
  amber: {
    label: "Amber LED",
    config: {
      algorithm: "bayer4",
      shape: "glow",
      fg: "#ffb000",
      bg: "#0a0500",
      pixel: 6,
      levels: 2,
      contrast: 22,
      spacing: 0.8,
      invert: false,
      animation: "none",
      cursorEffect: "none",
    },
  },
  crt: {
    label: "CRT",
    config: {
      algorithm: "bayer2",
      shape: "glow",
      fg: "#d7fbff",
      bg: "#02060a",
      pixel: 5,
      levels: 2,
      contrast: 30,
      spacing: 0.8,
      invert: false,
      animation: "scan",
      cursorEffect: "none",
    },
  },
  newsprint: {
    label: "Newsprint",
    config: {
      algorithm: "atkinson",
      shape: "dot",
      fg: "#1a1a1a",
      bg: "#f7f5ef",
      pixel: 3,
      levels: 2,
      contrast: 12,
      spacing: 0.72,
      invert: false,
      animation: "none",
      cursorEffect: "none",
    },
  },
  blueprint: {
    label: "Blueprint",
    config: {
      algorithm: "bayer8",
      shape: "dot",
      fg: "#8fd3ff",
      bg: "#071a33",
      pixel: 4,
      levels: 2,
      contrast: 16,
      spacing: 0.75,
      invert: false,
      animation: "none",
      cursorEffect: "none",
    },
  },
};

export const DITHER_ALGORITHMS: Record<DitherAlgorithm, string> = {
  bayer2: "Bayer 2×2",
  bayer4: "Bayer 4×4",
  bayer8: "Bayer 8×8",
  floyd: "Floyd–Steinberg",
  atkinson: "Atkinson",
  noise: "Noise",
};

export const DITHER_SHAPES: Record<DitherShape, string> = {
  square: "Square",
  dot: "Dot",
  glow: "Glow (LED)",
};

export const DITHER_ANIMATIONS: Record<DitherAnimation, string> = {
  dissolve: "Dissolve",
  scan: "Scan",
  jitter: "Jitter",
  flow: "Flow",
  wave: "Wave",
  glitch: "Glitch",
  melt: "Melt",
  rain: "Rain",
  none: "Static",
};

export const DITHER_CURSOR_EFFECTS: Record<DitherCursorEffect, string> = {
  reveal: "Reveal",
  trail: "Trail",
  ripple: "Ripple",
  warp: "Warp",
  pinch: "Pinch",
  twist: "Twist",
  scatter: "Scatter",
  none: "Off",
};

export const DITHER_PALETTES: { name: string; fg: string; bg: string }[] = [
  { name: "Monochrome", fg: "#ffffff", bg: "#000000" },
  { name: "Paper", fg: "#1a1a1a", bg: "#f7f5ef" },
  { name: "Amber", fg: "#ffb000", bg: "#0a0500" },
  { name: "CRT Green", fg: "#9dffb0", bg: "#021005" },
  { name: "Phosphor Blue", fg: "#d7fbff", bg: "#02060a" },
  { name: "Blueprint", fg: "#8fd3ff", bg: "#071a33" },
  { name: "Ink", fg: "#e8e4da", bg: "#16120e" },
  { name: "Sepia", fg: "#e8d5b0", bg: "#20150c" },
];

/* ---------------------------------------------------------------- */
/*  Dithering math                                                   */
/* ---------------------------------------------------------------- */

const BAYER2 = [
  [0, 2],
  [3, 1],
];

const BAYER4 = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
];

const BAYER8 = [
  [0, 32, 8, 40, 2, 34, 10, 42],
  [48, 16, 56, 24, 50, 18, 58, 26],
  [12, 44, 4, 36, 14, 46, 6, 38],
  [60, 28, 52, 20, 62, 30, 54, 22],
  [3, 35, 11, 43, 1, 33, 9, 41],
  [51, 19, 59, 27, 49, 17, 57, 25],
  [15, 47, 7, 39, 13, 45, 5, 37],
  [63, 31, 55, 23, 61, 29, 53, 21],
];

function clamp(v: number, a: number, b: number) {
  return v < a ? a : v > b ? b : v;
}

function hash2(x: number, y: number) {
  let n = (x * 374761393 + y * 668265263) | 0;
  n = (n ^ (n >> 13)) * 1274126177;
  n = n ^ (n >> 16);
  return ((n >>> 0) % 1000) / 1000;
}

function parseColor(hex: string) {
  const h = hex.replace("#", "");
  const v = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
  return { r: (v >> 16) & 255, g: (v >> 8) & 255, b: v & 255, a: 1 };
}

function lerpColor(c1: { r: number; g: number; b: number }, c2: { r: number; g: number; b: number }, t: number) {
  return {
    r: Math.round(c1.r + (c2.r - c1.r) * t),
    g: Math.round(c1.g + (c2.g - c1.g) * t),
    b: Math.round(c1.b + (c2.b - c1.b) * t),
  };
}

let squareBuffer: { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } | null = null;

function getSquareBuffer(cellsX: number, cellsY: number) {
  if (
    squareBuffer &&
    squareBuffer.canvas.width === cellsX &&
    squareBuffer.canvas.height === cellsY
  ) {
    return squareBuffer;
  }
  const canvas = document.createElement("canvas");
  canvas.width = cellsX;
  canvas.height = cellsY;
  squareBuffer = {
    canvas,
    ctx: canvas.getContext("2d", { willReadFrequently: true })!,
  };
  return squareBuffer;
}

/* Draw a procedural source scene (an abstract statue portrait). */
export function drawSourceScene(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const bg = ctx.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0, "#0a0a12");
  bg.addColorStop(0.55, "#14141f");
  bg.addColorStop(1, "#07070c");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  const glow = ctx.createRadialGradient(w * 0.5, h * 0.38, 10, w * 0.5, h * 0.38, h * 0.55);
  glow.addColorStop(0, "rgba(255,240,214,0.28)");
  glow.addColorStop(1, "rgba(255,240,214,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, w, h);

  const cx = w * 0.5;
  const headY = h * 0.36;
  const headR = w * 0.165;

  ctx.save();
  ctx.translate(cx, headY);

  const skin = ctx.createLinearGradient(0, -headR, 0, headR);
  skin.addColorStop(0, "#efe4cf");
  skin.addColorStop(0.55, "#d8c7a8");
  skin.addColorStop(1, "#8a7659");
  ctx.fillStyle = skin;

  ctx.beginPath();
  ctx.ellipse(0, 0, headR, headR * 1.28, 0, 0, Math.PI * 2);
  ctx.fill();

  const side = ctx.createLinearGradient(headR * 0.2, 0, headR, 0);
  side.addColorStop(0, "rgba(0,0,0,0)");
  side.addColorStop(1, "rgba(20,14,8,0.55)");
  ctx.fillStyle = side;
  ctx.beginPath();
  ctx.ellipse(0, 0, headR, headR * 1.28, 0, 0, Math.PI * 2);
  ctx.fill();

  const face = ctx.createLinearGradient(-headR * 0.4, 0, headR * 0.7, 0);
  face.addColorStop(0, "rgba(255,250,240,0.5)");
  face.addColorStop(0.5, "rgba(255,250,240,0)");
  face.addColorStop(1, "rgba(30,20,10,0.5)");
  ctx.fillStyle = face;
  ctx.beginPath();
  ctx.ellipse(0, 0, headR, headR * 1.28, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#120d08";
  ctx.beginPath();
  ctx.ellipse(-headR * 0.34, -headR * 0.16, headR * 0.11, headR * 0.05, -0.2, 0, Math.PI * 2);
  ctx.ellipse(headR * 0.34, -headR * 0.16, headR * 0.11, headR * 0.05, 0.2, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#2c2012";
  ctx.beginPath();
  ctx.ellipse(-headR * 0.34, -headR * 0.17, headR * 0.075, headR * 0.035, -0.2, 0, Math.PI * 2);
  ctx.ellipse(headR * 0.34, -headR * 0.17, headR * 0.075, headR * 0.035, 0.2, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "rgba(20,12,6,0.75)";
  ctx.lineWidth = Math.max(1, headR * 0.022);
  ctx.beginPath();
  ctx.moveTo(-headR * 0.55, -headR * 0.52);
  ctx.lineTo(-headR * 0.12, -headR * 0.42);
  ctx.moveTo(headR * 0.55, -headR * 0.52);
  ctx.lineTo(headR * 0.12, -headR * 0.42);
  ctx.stroke();

  ctx.fillStyle = "#241708";
  ctx.beginPath();
  ctx.ellipse(0, headR * 0.24, headR * 0.1, headR * 0.065, 0, 0, Math.PI);
  ctx.fill();

  ctx.strokeStyle = "rgba(30,18,8,0.7)";
  ctx.lineWidth = Math.max(1, headR * 0.02);
  ctx.beginPath();
  ctx.moveTo(0, headR * 0.34);
  ctx.quadraticCurveTo(headR * 0.16, headR * 0.48, headR * 0.05, headR * 0.62);
  ctx.stroke();

  ctx.fillStyle = "#15100a";
  ctx.beginPath();
  ctx.moveTo(-headR * 0.95, -headR * 0.35);
  ctx.quadraticCurveTo(-headR * 0.5, -headR * 1.18, 0, -headR * 1.1);
  ctx.quadraticCurveTo(headR * 0.5, -headR * 1.18, headR * 0.95, -headR * 0.35);
  ctx.quadraticCurveTo(0, -headR * 0.62, -headR * 0.95, -headR * 0.35);
  ctx.fill();

  ctx.fillStyle = "#0d0906";
  ctx.beginPath();
  ctx.moveTo(-headR * 0.85, -headR * 0.3);
  ctx.quadraticCurveTo(-headR * 0.55, -headR * 0.95, 0, -headR * 0.88);
  ctx.quadraticCurveTo(headR * 0.55, -headR * 0.95, headR * 0.85, -headR * 0.3);
  ctx.quadraticCurveTo(0, -headR * 0.42, -headR * 0.85, -headR * 0.3);
  ctx.fill();

  ctx.restore();

  const sh = ctx.createLinearGradient(0, headY + headR * 0.4, 0, h);
  sh.addColorStop(0, "rgba(16,12,8,0)");
  sh.addColorStop(1, "rgba(16,12,8,0.85)");
  ctx.fillStyle = sh;

  ctx.beginPath();
  ctx.moveTo(cx - headR * 1.7, headY + headR * 0.75);
  ctx.quadraticCurveTo(cx, headY + headR * 0.15, cx + headR * 1.7, headY + headR * 0.75);
  ctx.lineTo(cx + w * 0.42, h);
  ctx.lineTo(cx - w * 0.42, h);
  ctx.closePath();
  ctx.fill();

  const chest = ctx.createLinearGradient(0, headY + headR * 0.6, 0, h);
  chest.addColorStop(0, "rgba(210,190,160,0.28)");
  chest.addColorStop(1, "rgba(210,190,160,0)");
  ctx.fillStyle = chest;
  ctx.beginPath();
  ctx.moveTo(cx - headR * 1.6, headY + headR * 0.8);
  ctx.quadraticCurveTo(cx, headY + headR * 0.2, cx + headR * 1.6, headY + headR * 0.8);
  ctx.lineTo(cx + headR * 0.7, h);
  ctx.lineTo(cx - headR * 0.7, h);
  ctx.closePath();
  ctx.fill();
}

/* ---------------------------------------------------------------- */
/*  Renderer                                                         */
/* ---------------------------------------------------------------- */

export interface DitherSource {
  canvas: HTMLCanvasElement;
  isVideo: boolean;
  video?: HTMLVideoElement;
}

export function createDitherSource(
  url?: string,
  isVideo = false
): DitherSource {
  const canvas = document.createElement("canvas");
  canvas.width = 640;
  canvas.height = 800;
  const ctx = canvas.getContext("2d")!;
  drawSourceScene(ctx, 640, 800);
  if (!url) return { canvas, isVideo: false };
  if (isVideo) {
    const video = document.createElement("video");
    video.src = url;
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.crossOrigin = "anonymous";
    video.play().catch(() => {});
    return { canvas, isVideo: true, video };
  }
  const img = new Image();
  img.onload = () => {
    drawSourceCover(ctx, img, canvas.width, canvas.height);
  };
  img.src = url;
  return { canvas, isVideo: false };
}

function drawSourceCover(
  ctx: CanvasRenderingContext2D,
  img: CanvasImageSource,
  w: number,
  h: number
) {
  const iw = (img as HTMLImageElement).naturalWidth || w;
  const ih = (img as HTMLImageElement).naturalHeight || h;
  const s = Math.max(w / iw, h / ih);
  const dw = iw * s;
  const dh = ih * s;
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
}

function renderDither(
  ctx: CanvasRenderingContext2D,
  src: HTMLCanvasElement,
  cfg: DitherConfig,
  time: number,
  cursor: { x: number; y: number; on: boolean } | null
) {
  const w = ctx.canvas.width;
  const h = ctx.canvas.height;
  const srcData = src.getContext("2d")!.getImageData(0, 0, src.width, src.height);
  const SW = src.width;
  const SH = src.height;

  const maxCells = 240000;
  let cell = cfg.pixel;
  const shrink = Math.sqrt(maxCells / (w * h));
  if (shrink < 1) cell = Math.max(1.5, cell / shrink);

  const cellsX = Math.ceil(w / cell);
  const cellsY = Math.ceil(h / cell);
  const levels = Math.max(2, Math.round(cfg.levels));
  const cont = cfg.contrast / 100;

  const fg = parseColor(cfg.fg);
  const bg = parseColor(cfg.bg);

  const sample = (i: number, j: number) => {
    const u = (i * cell + cell * 0.5) / w;
    const v = (j * cell + cell * 0.5) / h;
    const uu = (u - 0.5) / cfg.zoom + 0.5 + cfg.offsetX * 0.5;
    const vv = (v - 0.5) / cfg.zoom + 0.5 + cfg.offsetY * 0.5;
    if (uu < 0 || uu > 1 || vv < 0 || vv > 1) return 0;
    const sx = clamp(Math.floor(uu * SW), 0, SW - 1);
    const sy = clamp(Math.floor(vv * SH), 0, SH - 1);
    const o = (sy * SW + sx) * 4;
    let l =
      (0.299 * srcData.data[o] + 0.587 * srcData.data[o + 1] + 0.114 * srcData.data[o + 2]) / 255;
    l = (l - 0.5) * (1 + cont) + 0.5;
    if (cfg.invert) l = 1 - l;
    return clamp(l, 0, 1);
  };

  const isDiffusion = cfg.algorithm === "floyd" || cfg.algorithm === "atkinson";
  const grid = isDiffusion ? new Float32Array(cellsX * cellsY) : null;
  if (grid) {
    for (let j = 0; j < cellsY; j++) {
      for (let i = 0; i < cellsX; i++) {
        grid[j * cellsX + i] = sample(i, j);
      }
    }
    const g = grid;
    for (let j = 0; j < cellsY; j++) {
      for (let i = 0; i < cellsX; i++) {
        const idx = j * cellsX + i;
        const old = g[idx];
        const q = clamp(Math.round(old * (levels - 1)), 0, levels - 1);
        const nv = q / (levels - 1);
        g[idx] = nv;
        const err = old - nv;
        if (cfg.algorithm === "floyd") {
          if (i + 1 < cellsX) g[idx + 1] += (err * 7) / 16;
          if (j + 1 < cellsY) {
            if (i > 0) g[idx + cellsX - 1] += (err * 3) / 16;
            g[idx + cellsX] += (err * 5) / 16;
            if (i + 1 < cellsX) g[idx + cellsX + 1] += err / 16;
          }
        } else {
          const d = err / 8;
          if (i + 1 < cellsX) g[idx + 1] += d;
          if (i + 2 < cellsX) g[idx + 2] += d;
          if (j + 1 < cellsY) {
            if (i > 0) g[idx + cellsX - 1] += d;
            g[idx + cellsX] += d;
            if (i + 1 < cellsX) g[idx + cellsX + 1] += d;
          }
          if (j + 2 < cellsY) g[idx + 2 * cellsX] += d;
        }
      }
    }
  }

  const bayer =
    cfg.algorithm === "bayer2" ? BAYER2
    : cfg.algorithm === "bayer4" ? BAYER4
    : cfg.algorithm === "bayer8" ? BAYER8
    : null;
  const bayerSize = bayer ? bayer.length : 0;

  ctx.fillStyle = cfg.bg;
  ctx.fillRect(0, 0, w, h);

  const R = Math.max(130, cell * 46);
  const t = time;

  const isSquare = cfg.shape === "square";
  let bufImg: ImageData | null = null;
  let bufData: Uint8ClampedArray | null = null;
  let small: HTMLCanvasElement | null = null;
  if (isSquare) {
    small = getSquareBuffer(cellsX, cellsY).canvas;
    bufImg = getSquareBuffer(cellsX, cellsY).ctx.createImageData(cellsX, cellsY);
    bufData = bufImg.data;
  }

  for (let j = 0; j < cellsY; j++) {
    const y = j * cell;
    for (let i = 0; i < cellsX; i++) {
      const x = i * cell;

      let v: number;
      if (grid) {
        v = grid[j * cellsX + i];
      } else if (bayer) {
        const th = (bayer[j % bayerSize][i % bayerSize] + 0.5) / (bayerSize * bayerSize);
        v = clamp(Math.floor(sample(i, j) * levels + th), 0, levels - 1) / (levels - 1);
      } else {
        const th = (hash2(i, j) - 0.5) * 0.55;
        v = clamp(Math.floor(sample(i, j) * levels + th), 0, levels - 1) / (levels - 1);
      }

      let f = v;
      let ox = 0;
      let oy = 0;

      switch (cfg.animation) {
        case "scan": {
          const band = ((t * 0.45) % (h + cell * 2)) - cell;
          const d = Math.abs(y - band);
          f = clamp(f + (1 - f) * Math.max(0, 1 - d / (h * 0.22)), 0, 1);
          break;
        }
        case "flow":
          f = clamp(f * (0.55 + 0.45 * Math.sin(x * 0.015 - t * 2.4)), 0, 1);
          break;
        case "wave":
          f = clamp(f + Math.sin(y * 0.022 - t * 3.1) * 0.14, 0, 1);
          break;
        case "jitter":
          f = clamp(f + (hash2(i + Math.floor(t * 30), j) - 0.5) * 0.32, 0, 1);
          break;
        case "glitch":
          ox += Math.round(Math.sin(y * 0.035 + t * 5) * 2.2);
          if (hash2(Math.floor(y), Math.floor(t * 8)) > 0.985) ox += 6;
          break;
        case "melt": {
          const drop = ((t * 26) % h) + cell;
          if (y < drop) oy += (Math.min(drop - y, cell * 6) / cell) * (0.35 + 0.65 * hash2(i, Math.floor(y)));
          break;
        }
        case "rain": {
          const band = ((t * 55) % (h + cell * 40)) - cell * 20;
          const d = Math.abs(y - band);
          f = clamp(f + (1 - f) * Math.max(0, 1 - d / (cell * 20)), 0, 1);
          break;
        }
        case "dissolve":
          if (hash2(i, j + Math.floor(t * 14)) > 0.985) f = 0;
          break;
      }

      if (cursor && cursor.on && cfg.cursorEffect !== "none") {
        const dxc = x - cursor.x;
        const dyc = y - cursor.y;
        const dist = Math.hypot(dxc, dyc);
        const fall = clamp(1 - dist / R, 0, 1);
        const ce = cfg.cursorEffect;
        if (ce === "reveal") {
          f = clamp(f * (0.08 + 0.92 * fall), 0, 1);
        } else if (ce === "trail") {
          f = clamp(f * (0.25 + 0.75 * fall), 0, 1);
        } else if (ce === "ripple") {
          f = clamp(f * (0.72 + 0.28 * Math.sin(dist * 0.14 - t * 7)), 0, 1);
        } else if (ce === "warp") {
          const k = fall * cell * 3.2;
          const ang = Math.atan2(dyc, dxc);
          ox += (Math.cos(ang) * k) / cell;
          oy += (Math.sin(ang) * k) / cell;
        } else if (ce === "pinch") {
          ox += (-dxc / cell) * fall * 0.55;
          oy += (-dyc / cell) * fall * 0.55;
        } else if (ce === "twist") {
          const ang = fall * 0.9 * Math.sin(t * 2);
          ox += (-dyc / cell) * ang * 0.06;
          oy += (dxc / cell) * ang * 0.06;
        } else if (ce === "scatter") {
          ox += (hash2(i + Math.floor(t * 30), j) - 0.5) * fall * 7;
          oy += (hash2(i, j + Math.floor(t * 30)) - 0.5) * fall * 7;
        }
      }

      if (f <= 0.015) continue;

      const pi = clamp(Math.round(i + ox), 0, cellsX - 1);
      const pj = clamp(Math.round(j + oy), 0, cellsY - 1);

      if (isSquare) {
        const c = lerpColor(bg, fg, f);
        const o = (pj * cellsX + pi) * 4;
        bufData![o] = c.r;
        bufData![o + 1] = c.g;
        bufData![o + 2] = c.b;
        bufData![o + 3] = 255;
      } else if (cfg.shape === "dot") {
        const r = (cell / 2) * 0.92 * Math.sqrt(f) * cfg.spacing;
        if (r > 0.25) {
          ctx.fillStyle = cfg.fg;
          ctx.beginPath();
          ctx.arc(pi * cell + cell / 2, pj * cell + cell / 2, r, 0, Math.PI * 2);
          ctx.fill();
        }
      } else {
        const r = cell * 1.7;
        const a = clamp(f, 0, 1);
        const g = ctx.createRadialGradient(
          pi * cell + cell / 2, pj * cell + cell / 2, 0,
          pi * cell + cell / 2, pj * cell + cell / 2, r
        );
        g.addColorStop(0, `rgba(${fg.r},${fg.g},${fg.b},${a})`);
        g.addColorStop(0.45, `rgba(${fg.r},${fg.g},${fg.b},${a * 0.45})`);
        g.addColorStop(1, `rgba(${fg.r},${fg.g},${fg.b},0)`);
        ctx.fillStyle = g;
        ctx.fillRect(pi * cell - r, pj * cell - r, r * 2, r * 2);
      }
    }
  }

  if (isSquare && bufImg) {
    getSquareBuffer(cellsX, cellsY).ctx.putImageData(bufImg, 0, 0);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(small!, 0, 0, w, h);
  }
}

/* ---------------------------------------------------------------- */
/*  Component                                                        */
/* ---------------------------------------------------------------- */

interface DitherEngineProps {
  config: Partial<DitherConfig>;
  sourceUrl?: string;
  sourceIsVideo?: boolean;
  interactive?: boolean;
  autoCursor?: boolean;
  style?: CSSProperties;
  className?: string;
  onLoad?: (ready: boolean) => void;
}

export default function DitherEngine({
  config,
  sourceUrl,
  sourceIsVideo = false,
  interactive = false,
  autoCursor = false,
  style,
  className,
  onLoad,
}: DitherEngineProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const srcRef = useRef<DitherSource | null>(null);
  const cfgRef = useRef<DitherConfig>({ ...DEFAULT_DITHER_CONFIG, ...config });
  const cursorRef = useRef<{ x: number; y: number; on: boolean } | null>(null);
  const rafRef = useRef(0);

  cfgRef.current = { ...DEFAULT_DITHER_CONFIG, ...config };

  useEffect(() => {
    srcRef.current = createDitherSource(sourceUrl, sourceIsVideo);
    onLoad?.(true);

    const canvas = canvasRef.current;
    if (!canvas) return;

    const onMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      cursorRef.current = {
        x: ((e.clientX - rect.left) / rect.width) * canvas.width,
        y: ((e.clientY - rect.top) / rect.height) * canvas.height,
        on: true,
      };
    };
    const onLeave = () => {
      if (cursorRef.current) cursorRef.current.on = false;
    };
    if (interactive) {
      canvas.addEventListener("pointermove", onMove);
      canvas.addEventListener("pointerleave", onLeave);
    }

    const fitCanvas = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const cw = Math.max(1, Math.round(canvas.clientWidth * dpr));
      const ch = Math.max(1, Math.round(canvas.clientHeight * dpr));
      if (canvas.width !== cw || canvas.height !== ch) {
        canvas.width = cw;
        canvas.height = ch;
      }
    };
    fitCanvas();

    let last = 0;
    const loop = (now: number) => {
      rafRef.current = requestAnimationFrame(loop);
      if (now - last < 33) return;
      last = now;
      fitCanvas();
      const src = srcRef.current;
      const ctx = canvas.getContext("2d");
      if (!src || !ctx) return;

      if (src.isVideo && src.video) {
        if (src.video.readyState >= 2) {
          drawSourceCover(
            src.canvas.getContext("2d")!,
            src.video,
            src.canvas.width,
            src.canvas.height
          );
        }
      }

      let cursor = cursorRef.current;
      if ((autoCursor || !interactive) && cfgRef.current.cursorEffect !== "none") {
        const t = now / 1000;
        cursor = {
          x: canvas.width * (0.5 + 0.34 * Math.sin(t * 0.5)) +
            (cursorRef.current ? cursorRef.current.x * 0.1 : 0),
          y: canvas.height * (0.5 + 0.3 * Math.sin(t * 0.7 + 1.7)) +
            (cursorRef.current ? cursorRef.current.y * 0.1 : 0),
          on: true,
        };
      }

      renderDither(ctx, src.canvas, cfgRef.current, now / 1000, cursor);
    };
    rafRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafRef.current);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerleave", onLeave);
      const src = srcRef.current;
      if (src?.isVideo && src.video) {
        src.video.pause();
        URL.revokeObjectURL(src.video.src);
      }
    };
  }, [sourceUrl, sourceIsVideo, interactive]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{
        display: "block",
        width: "100%",
        height: "100%",
        objectFit: "cover",
        ...style,
      }}
    />
  );
}