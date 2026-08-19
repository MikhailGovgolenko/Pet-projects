import * as React from "react";
import { addPropertyControls, ControlType } from "framer";

/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 *
 * Dither Engine — a dithering effect component with presets, animation and
 * mouse interaction. Render any image or video as ordered-dither art.
 *
 * Algorithms: Bayer 2×2 / 4×4 / 8×8, Floyd–Steinberg, Atkinson, Noise.
 * Pixel shapes: Square, Dot, Glow. 8 animations, 7 cursor effects,
 * 6 color presets + custom solid / linear gradient / source tinting.
 */

// ── Types ─────────────────────────────────────────────────────────────

export type DitherAlgorithm = "bayer2" | "bayer4" | "bayer8" | "floyd" | "atkinson" | "noise";
export type DitherShape = "square" | "dot" | "glow";
export type DitherPreset = "statue" | "monoPrint" | "amberLed" | "crt" | "newsprint" | "blueprint" | "custom";
export type DitherColorMode = "solid" | "linear" | "source";
export type DitherAnimation = "none" | "dissolve" | "scan" | "jitter" | "flow" | "wave" | "glitch" | "melt" | "rain";
export type DitherCursorEffect = "none" | "reveal" | "trail" | "ripple" | "warp" | "pinch" | "twist" | "scatter";
export type DitherBoxPosition = "top-left" | "top-right" | "bottom-left" | "bottom-center" | "bottom-right";
export type DitherMediaPosition = "center" | "top" | "bottom" | "left" | "right" | "top-left" | "top-right" | "bottom-left" | "bottom-right";

export interface DitherConfig {
  algorithm: DitherAlgorithm;
  shape: DitherShape;
  pixelSize: number;
  levels: number;
  spacing: number;
  brightness: number;
  contrast: number;
  invert: boolean;
  foreground: string;
  background: string;
}

// ── Presets & constants (mirror the reference component's looks) ──────

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
  glow: "Glow",
};

export const DITHER_ANIMATIONS: Record<DitherAnimation, string> = {
  none: "None",
  dissolve: "Dissolve",
  scan: "Scan",
  jitter: "Jitter",
  flow: "Flow",
  wave: "Wave",
  glitch: "Glitch",
  melt: "Melt",
  rain: "Rain",
};

export const DITHER_CURSOR_EFFECTS: Record<DitherCursorEffect, string> = {
  none: "None",
  reveal: "Reveal",
  trail: "Trail",
  ripple: "Ripple",
  warp: "Warp",
  pinch: "Pinch",
  twist: "Twist",
  scatter: "Scatter",
};

export const DITHER_PRESETS: Record<Exclude<DitherPreset, "custom">, { label: string; config: DitherConfig }> = {
  monoPrint: {
    label: "Mono Print",
    config: {
      algorithm: "bayer8",
      shape: "square",
      pixelSize: 5,
      levels: 2,
      spacing: 0.35,
      brightness: 0,
      contrast: 35,
      invert: false,
      foreground: "#FFFFFF",
      background: "#0A0A0A",
    },
  },
  statue: {
    label: "Statue",
    config: {
      algorithm: "bayer4",
      shape: "dot",
      pixelSize: 5,
      levels: 2,
      spacing: 0.25,
      brightness: 5,
      contrast: 20,
      invert: false,
      foreground: "#F4F4F0",
      background: "#050505",
    },
  },
  amberLed: {
    label: "Amber LED",
    config: {
      algorithm: "bayer4",
      shape: "glow",
      pixelSize: 8,
      levels: 3,
      spacing: 0.4,
      brightness: 5,
      contrast: 30,
      invert: false,
      foreground: "#FFB020",
      background: "#120700",
    },
  },
  crt: {
    label: "CRT",
    config: {
      algorithm: "floyd",
      shape: "square",
      pixelSize: 4,
      levels: 3,
      spacing: 0.3,
      brightness: -5,
      contrast: 25,
      invert: false,
      foreground: "#3CFF74",
      background: "#03140A",
    },
  },
  newsprint: {
    label: "Newsprint",
    config: {
      algorithm: "floyd",
      shape: "dot",
      pixelSize: 6,
      levels: 2,
      spacing: 0.12,
      brightness: 10,
      contrast: 10,
      invert: false,
      foreground: "#181512",
      background: "#F1EBDF",
    },
  },
  blueprint: {
    label: "Blueprint",
    config: {
      algorithm: "bayer2",
      shape: "square",
      pixelSize: 6,
      levels: 2,
      spacing: 0.3,
      brightness: 0,
      contrast: 20,
      invert: false,
      foreground: "#D9E8FF",
      background: "#0B2E6B",
    },
  },
};

export const DITHER_COLOR_PRESETS: Record<string, { label: string; fg: string; bg: string }> = {
  mono: { label: "Mono", fg: "#FFFFFF", bg: "#0A0A0A" },
  paper: { label: "Paper", fg: "#181512", bg: "#F1EBDF" },
  amber: { label: "Amber", fg: "#FFB020", bg: "#120700" },
  blueLed: { label: "Blue LED", fg: "#4DA6FF", bg: "#02091A" },
  crtGreen: { label: "CRT Green", fg: "#3CFF74", bg: "#03140A" },
  blueprint: { label: "Blueprint", fg: "#D9E8FF", bg: "#0B2E6B" },
  cyan: { label: "Cyan", fg: "#35F0E0", bg: "#001414" },
  neonPink: { label: "Neon Pink", fg: "#FF4DD2", bg: "#170018" },
};

export const DEFAULT_DITHER_CONFIG: DitherConfig = {
  algorithm: "bayer4",
  shape: "dot",
  pixelSize: 5,
  levels: 2,
  spacing: 0.25,
  brightness: 5,
  contrast: 20,
  invert: false,
  foreground: "#F4F4F0",
  background: "#050505",
};

const DEFAULT_IMAGE = "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg";
const DEFAULT_VIDEO = "https://framerusercontent.com/assets/MLWPbW1dUQawJLhhun3dBwpgJak.mp4";

// ── Math helpers ──────────────────────────────────────────────────────

function hash(x: number, y: number, seed: number): number {
  let h = (Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(seed, 1013904223)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

function parseColor(css: string): [number, number, number] {
  if (typeof document === "undefined") return [255, 255, 255];
  const probe = document.createElement("span");
  probe.style.color = css;
  probe.style.display = "none";
  document.body.appendChild(probe);
  const rgb = getComputedStyle(probe).color;
  document.body.removeChild(probe);
  const m = rgb.match(/[\d.]+/g);
  return m ? [Number(m[0]), Number(m[1]), Number(m[2])] : [255, 255, 255];
}

function normalizeHex(css: string): string {
  if (/^#[0-9a-fA-F]{6}$/.test(css)) return css.toUpperCase();
  const [r, g, b] = parseColor(css);
  const hex = (v: number) => v.toString(16).padStart(2, "0");
  return `#${hex(r)}${hex(g)}${hex(b)}`.toUpperCase();
}

const BAYER2 = [0, 0.5, 0.75, 0.25];
const BAYER4 = [0, 0.5, 0.125, 0.625, 0.75, 0.25, 0.875, 0.375, 0.1875, 0.6875, 0.0625, 0.5625, 0.9375, 0.4375, 0.8125, 0.3125];
const BAYER8 = (() => {
  const m = new Array<number>(64);
  for (let r = 0; r < 8; r++)
    for (let c = 0; c < 8; c++) {
      const v = BAYER4[(r % 4) * 4 + (c % 4)] * 16;
      m[r * 8 + c] = (v * 4 + (Math.floor(r / 4) * 2 + Math.floor(c / 4))) / 64;
    }
  return m;
})();

// ── Overlay UI pieces ─────────────────────────────────────────────────

const mono: React.CSSProperties = {
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
};

const microLabelStyle: React.CSSProperties = {
  fontSize: 9,
  letterSpacing: 1.2,
  textTransform: "uppercase",
  color: "rgba(255,255,255,0.45)",
};

function OverlaySelect({
  label,
  value,
  options,
  accent,
  openUp,
  onSelect,
}: {
  label: string;
  value: string;
  options: [string, string][];
  accent: string;
  openUp: boolean;
  onSelect: (value: string) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onDown, true);
    return () => document.removeEventListener("pointerdown", onDown, true);
  }, [open]);

  const current = options.find(([v]) => v === value)?.[1] ?? value;

  return (
    <div ref={ref} style={{ position: "relative", pointerEvents: "auto", width: "100%" }}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={label}
        onClick={() => setOpen(!open)}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
          width: "100%",
          padding: "8px 10px",
          borderRadius: 10,
          border: "1px solid rgba(255,255,255,0.14)",
          background: "rgba(8,8,8,0.62)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          color: "rgba(255,255,255,0.92)",
          fontFamily: "inherit",
          fontSize: 11,
          cursor: "pointer",
          userSelect: "none",
          textAlign: "left",
        }}
      >
        <span style={microLabelStyle}>{label}</span>
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {current}
          <span
            aria-hidden="true"
            style={{ fontSize: 8, opacity: 0.55, transform: open ? "rotate(180deg)" : "none" }}
          >
            ▾
          </span>
        </span>
      </button>
      {open && (
        <div
          role="listbox"
          aria-label={`${label} options`}
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            ...(openUp ? { bottom: "calc(100% + 6px)" } : { top: "calc(100% + 6px)" }),
            padding: 4,
            borderRadius: 10,
            border: "1px solid rgba(255,255,255,0.14)",
            background: "rgba(8,8,8,0.85)",
            backdropFilter: "blur(14px)",
            WebkitBackdropFilter: "blur(14px)",
            maxHeight: 200,
            overflowY: "auto",
            zIndex: 3,
          }}
        >
          {options.map(([v, title]) => {
            const sel = v === value;
            return (
              <button
                key={v}
                type="button"
                role="option"
                aria-selected={sel}
                onClick={() => {
                  onSelect(v);
                  setOpen(false);
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  width: "100%",
                  padding: "6px 8px",
                  borderRadius: 6,
                  border: "none",
                  background: "transparent",
                  color: sel ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.65)",
                  fontFamily: "inherit",
                  fontSize: 11,
                  cursor: "pointer",
                  textAlign: "left",
                  userSelect: "none",
                }}
              >
                <span
                  aria-hidden="true"
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: 999,
                    flexShrink: 0,
                    background: sel ? accent : "transparent",
                    border: sel ? "none" : "1px solid rgba(255,255,255,0.25)",
                    boxShadow: sel ? `0 0 6px ${accent}` : "none",
                  }}
                />
                {title}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function OverlaySlider({
  label,
  value,
  min,
  max,
  step,
  accent,
  format,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  accent: string;
  format?: (v: number) => string;
  onChange: (v: number) => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, pointerEvents: "auto" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: 9,
          letterSpacing: 1.2,
          textTransform: "uppercase",
          color: "rgba(255,255,255,0.5)",
        }}
      >
        <span>{label}</span>
        <span style={{ color: "rgba(255,255,255,0.9)", fontVariantNumeric: "tabular-nums" }}>
          {format ? format(value) : value}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-label={label}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        style={{ width: "100%", height: 4, accentColor: accent, cursor: "pointer" }}
      />
    </div>
  );
}

function OverlaySwitch({
  label,
  value,
  accent,
  onChange,
}: {
  label: string;
  value: boolean;
  accent: string;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={value}
      aria-label={label}
      onClick={() => onChange(!value)}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        width: "100%",
        padding: "2px 0",
        border: "none",
        background: "transparent",
        color: "rgba(255,255,255,0.7)",
        fontFamily: "inherit",
        fontSize: 9,
        letterSpacing: 1.2,
        textTransform: "uppercase",
        cursor: "pointer",
        pointerEvents: "auto",
      }}
    >
      <span>{label}</span>
      <span
        aria-hidden="true"
        style={{
          position: "relative",
          width: 32,
          height: 18,
          flexShrink: 0,
          borderRadius: 999,
          background: value ? accent : "rgba(255,255,255,0.16)",
          transition: "background 0.15s",
        }}
      >
        <span
          style={{
            position: "absolute",
            top: 2,
            left: value ? 16 : 2,
            width: 14,
            height: 14,
            borderRadius: 999,
            background: value ? "#0A0A0A" : "#FFFFFF",
            transition: "left 0.15s",
          }}
        />
      </span>
    </button>
  );
}

function OverlayColor({
  label,
  value,
  overridden,
  onChange,
  onReset,
}: {
  label: string;
  value: string;
  overridden: boolean;
  onChange: (v: string) => void;
  onReset: () => void;
}) {
  const hex = normalizeHex(value);
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", pointerEvents: "auto" }}>
      <span style={microLabelStyle}>{label}</span>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 10, fontVariantNumeric: "tabular-nums", color: "rgba(255,255,255,0.8)" }}>
          {hex}
        </span>
        <label
          style={{
            position: "relative",
            width: 22,
            height: 22,
            borderRadius: 6,
            background: value,
            border: "1px solid rgba(255,255,255,0.25)",
            cursor: "pointer",
            overflow: "hidden",
          }}
        >
          <input
            type="color"
            value={hex}
            aria-label={`${label} color`}
            onChange={(e) => onChange(e.target.value)}
            style={{
              position: "absolute",
              inset: 0,
              opacity: 0,
              width: "100%",
              height: "100%",
              padding: 0,
              border: "none",
              cursor: "pointer",
            }}
          />
        </label>
        {overridden && (
          <button
            type="button"
            aria-label={`Reset ${label}`}
            onClick={onReset}
            style={{
              width: 16,
              height: 16,
              padding: 0,
              borderRadius: 4,
              border: "none",
              background: "rgba(255,255,255,0.1)",
              color: "rgba(255,255,255,0.6)",
              fontSize: 11,
              lineHeight: "16px",
              cursor: "pointer",
            }}
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────

export interface DitherProps {
  preset?: DitherPreset;
  colorPreset?: string;
  sourceType?: "image" | "video";
  image?: string | { src?: string; alt?: string };
  video?: string;
  fit?: "cover" | "contain";
  mediaPosition?: DitherMediaPosition;
  colorMode?: DitherColorMode;
  gradientStart?: string;
  gradientEnd?: string;
  gradientAngle?: number;
  algorithm?: DitherAlgorithm;
  shape?: DitherShape;
  pixelSize?: number;
  levels?: number;
  spacing?: number;
  brightness?: number;
  contrast?: number;
  invert?: boolean;
  foreground?: string;
  background?: string;
  animMode?: DitherAnimation;
  animSpeed?: number;
  motionArea?: "full" | "image";
  mouseMode?: DitherCursorEffect;
  mouseRadius?: number;
  mouseStrength?: number;
  radius?: number;
  showOverlay?: boolean;
  boxPosition?: DitherBoxPosition;
  presetMenu?: boolean;
  colorMenu?: boolean;
  motionMenu?: boolean;
  cursorMenu?: boolean;
  style?: React.CSSProperties;
  autoCursor?: boolean;
}

export default function DitherEngine(props: DitherProps) {
  const {
    preset = "statue",
    colorPreset = "default",
    sourceType = "image",
    fit = "cover",
    mediaPosition = "center",
    image,
    video,
    colorMode = "solid",
    gradientStart = "#4DA6FF",
    gradientEnd = "#FF4DD2",
    gradientAngle = 90,
    algorithm = "bayer4",
    shape = "dot",
    pixelSize,
    levels = 2,
    spacing = 0.25,
    brightness = 0,
    contrast = 20,
    invert,
    foreground,
    background,
    animMode = "none",
    animSpeed = 1,
    motionArea = "full",
    mouseMode = "reveal",
    mouseRadius = 180,
    mouseStrength = 0.6,
    radius = 0,
    showOverlay = false,
    boxPosition = "top-left",
    presetMenu = true,
    colorMenu = true,
    motionMenu = true,
    cursorMenu = true,
    style,
    autoCursor = false,
  } = props;

  const rootRef = React.useRef<HTMLDivElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const fileRef = React.useRef<HTMLInputElement>(null);
  const uploadedUrlRef = React.useRef<string | null>(null);

  const [open, setOpen] = React.useState(false);
  const [presetState, setPresetState] = React.useState<DitherPreset | null>(null);
  const [colorPresetState, setColorPresetState] = React.useState<string | null>(null);
  const [animState, setAnimState] = React.useState<DitherAnimation | null>(null);
  const [cursorState, setCursorState] = React.useState<DitherCursorEffect | null>(null);
  const [pixelState, setPixelState] = React.useState<number | null>(null);
  const [invertState, setInvertState] = React.useState<boolean | null>(null);
  const [fgState, setFgState] = React.useState<string | null>(null);
  const [bgState, setBgState] = React.useState<string | null>(null);
  const [speedState, setSpeedState] = React.useState<number | null>(null);
  const [rangeState, setRangeState] = React.useState<number | null>(null);
  const [strengthState, setStrengthState] = React.useState<number | null>(null);
  const [uploadedUrl, setUploadedUrl] = React.useState<string | null>(null);
  const [uploadedType, setUploadedType] = React.useState<"image" | "video" | null>(null);
  const [uploadedName, setUploadedName] = React.useState<string | null>(null);
  const [reducedMotion, setReducedMotion] = React.useState(false);

  React.useEffect(() => {
    const mq = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    if (!mq) return;
    const update = () => setReducedMotion(mq.matches);
    update();
    mq.addEventListener?.("change", update);
    return () => mq.removeEventListener?.("change", update);
  }, []);

  React.useEffect(
    () => () => {
      if (uploadedUrlRef.current) URL.revokeObjectURL(uploadedUrlRef.current);
    },
    []
  );

  const effectivePreset = presetState ?? preset;
  const effectiveColorPreset = colorPresetState ?? colorPreset;
  const effectiveAnim = animState ?? animMode;
  const effectiveCursor = cursorState ?? mouseMode;
  const speed = speedState ?? animSpeed;
  const mouseRange = rangeState ?? mouseRadius;
  const mousePower = strengthState ?? mouseStrength;

  const customCfg: DitherConfig = {
    algorithm,
    shape,
    pixelSize: pixelSize ?? 5,
    levels,
    spacing,
    brightness,
    contrast,
    invert: invert ?? false,
    foreground: foreground ?? "#F4F4F0",
    background: background ?? "#050505",
  };

  const presetCfg =
    effectivePreset !== "custom" && DITHER_PRESETS[effectivePreset as Exclude<DitherPreset, "custom">]
      ? DITHER_PRESETS[effectivePreset as Exclude<DitherPreset, "custom">].config
      : customCfg;

  const colorPresetCfg =
    effectiveColorPreset && effectiveColorPreset !== "default" ? DITHER_COLOR_PRESETS[effectiveColorPreset] : undefined;
  const colorPresetPropCfg = colorPreset !== "default" ? DITHER_COLOR_PRESETS[colorPreset] : undefined;

  const fg = fgState ?? colorPresetCfg?.fg ?? foreground ?? colorPresetPropCfg?.fg;
  const bg = bgState ?? colorPresetCfg?.bg ?? background ?? colorPresetPropCfg?.bg;
  const px = pixelState ?? pixelSize;
  const inv = invertState ?? invert;
  const config: DitherConfig =
    fg || bg || px !== undefined || inv !== undefined
      ? {
          ...presetCfg,
          foreground: fg ?? presetCfg.foreground,
          background: bg ?? presetCfg.background,
          pixelSize: px ?? presetCfg.pixelSize,
          invert: inv ?? presetCfg.invert,
        }
      : presetCfg;

  const srcImage =
    (uploadedUrl && uploadedType === "image" ? uploadedUrl : typeof image === "string" ? image : image?.src) ||
    DEFAULT_IMAGE;
  const srcVideo = (uploadedUrl && uploadedType === "video" ? uploadedUrl : video) || DEFAULT_VIDEO;
  const isVideo = uploadedUrl ? uploadedType === "video" : sourceType === "video";

  // ── Render engine ────────────────────────────────────────────────────

  React.useEffect(() => {
    const root = rootRef.current;
    const canvas = canvasRef.current;
    if (!root || !canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rm = typeof window.matchMedia === "function" ? window.matchMedia("(prefers-reduced-motion: reduce)").matches : false;
    const anim = rm ? "none" : effectiveAnim;
    const cursor = rm ? "none" : effectiveCursor;
    const continuous = anim !== "none" || cursor !== "none" || (isVideo && !rm) || (autoCursor && cursor !== "none");

    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const pixel = Math.max(2, config.pixelSize);

    let cssW = 0;
    let cssH = 0;
    let cols = 0;
    let rows = 0;
    let cells = new Float32Array(0);
    let sourceCells = new Uint32Array(0);
    let gradientCells = new Uint32Array(0);
    let levelsArr = new Uint8Array(0);
    let trailCells = new Float32Array(0);
    let diffCells = new Float32Array(0);
    let rampCss: string[] = [];
    let rampABGR = new Uint32Array(0);
    let glowSprite: HTMLCanvasElement | null = null;
    let offCanvas: HTMLCanvasElement | null = null;
    let offCtx: CanvasRenderingContext2D | null = null;
    let imgBuf: HTMLCanvasElement | null = null;
    let imgBufCtx: CanvasRenderingContext2D | null = null;
    let imgEl: HTMLImageElement | null = null;
    let vidEl: HTMLVideoElement | null = null;
    let playVideo: (() => void) | null = null;

    let ready = false;
    let visible = true;
    let destroyed = false;
    let rafId = 0;
    let lastFrame = -1e9;
    let cursorX = -1e4;
    let cursorY = -1e4;
    let cursorSX = -1e4;
    let cursorSY = -1e4;
    let cursorActive = 0;
    let cursorInput = 0;
    let lastPointer = 0;
    let blackSm = -1;
    let whiteSm = -1;
    let cellsVersion = 0;
    let renderedVersion = -1;
    let trailHasContent = false;

    const [fgRgb, bgRgb] = [parseColor(config.foreground), parseColor(config.background)];
    const [g0Rgb, g1Rgb] = [parseColor(gradientStart), parseColor(gradientEnd)];

    rampCss = [];
    rampABGR = new Uint32Array(config.levels);
    for (let i = 0; i < config.levels; i++) {
      const k = i / Math.max(1, config.levels - 1);
      const rr = Math.round(bgRgb[0] + (fgRgb[0] - bgRgb[0]) * k);
      const gg = Math.round(bgRgb[1] + (fgRgb[1] - bgRgb[1]) * k);
      const bb = Math.round(bgRgb[2] + (fgRgb[2] - bgRgb[2]) * k);
      rampCss.push(`rgb(${rr},${gg},${bb})`);
      rampABGR[i] = (255 << 24) | (bb << 16) | (gg << 8) | rr;
    }

    if (config.shape === "glow") {
      glowSprite = document.createElement("canvas");
      glowSprite.width = 64;
      glowSprite.height = 64;
      const g = glowSprite.getContext("2d");
      if (g) {
        const col = colorMode === "solid" ? fgRgb : [255, 255, 255];
        const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
        grad.addColorStop(0, `rgba(${col[0]},${col[1]},${col[2]},1)`);
        grad.addColorStop(0.25, `rgba(${col[0]},${col[1]},${col[2]},0.55)`);
        grad.addColorStop(1, `rgba(${col[0]},${col[1]},${col[2]},0)`);
        g.fillStyle = grad;
        g.fillRect(0, 0, 64, 64);
      }
    }

    function resize() {
      cssW = Math.max(1, root.offsetWidth);
      cssH = Math.max(1, root.offsetHeight);
      canvas.width = Math.round(cssW * dpr);
      canvas.height = Math.round(cssH * dpr);
      canvas.style.width = cssW + "px";
      canvas.style.height = cssH + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cols = Math.max(1, Math.ceil(cssW / pixel));
      rows = Math.max(1, Math.ceil(cssH / pixel));
      cells = new Float32Array(cols * rows);
      levelsArr = new Uint8Array(cols * rows);
      trailCells = new Float32Array(cols * rows);
      if (colorMode === "source") sourceCells = new Uint32Array(cols * rows);
      if (colorMode === "linear") {
        gradientCells = new Uint32Array(cols * rows);
        const ang = ((gradientAngle - 90) * Math.PI) / 180;
        const ca = Math.cos(ang);
        const sa = Math.sin(ang);
        const span = (Math.abs(ca) + Math.abs(sa)) / 2;
        for (let r = 0; r < rows; r++)
          for (let c = 0; c < cols; c++) {
            let t = ((c + 0.5) / cols - 0.5) * ca + ((r + 0.5) / rows - 0.5) * sa;
            t = t / (2 * span) + 0.5;
            t = t < 0 ? 0 : t > 1 ? 1 : t;
            const rr = Math.round(g0Rgb[0] + (g1Rgb[0] - g0Rgb[0]) * t);
            const gg = Math.round(g0Rgb[1] + (g1Rgb[1] - g0Rgb[1]) * t);
            const bb = Math.round(g0Rgb[2] + (g1Rgb[2] - g0Rgb[2]) * t);
            gradientCells[r * cols + c] = (255 << 24) | (bb << 16) | (gg << 8) | rr;
          }
      }
      cellsVersion++;
    }

    function computeCells() {
      if (!ready) return;
      if (!imgBuf || imgBuf.width !== cols || imgBuf.height !== rows) {
        imgBuf = document.createElement("canvas");
        imgBuf.width = cols;
        imgBuf.height = rows;
        imgBufCtx = imgBuf.getContext("2d", { willReadFrequently: true });
      }
      if (!imgBufCtx) return;
      const el = isVideo ? vidEl : imgEl;
      const mw = isVideo ? vidEl?.videoWidth ?? 0 : imgEl?.naturalWidth ?? 0;
      const mh = isVideo ? vidEl?.videoHeight ?? 0 : imgEl?.naturalHeight ?? 0;
      if (!el || !mw || !mh) return;

      const contain = fit === "contain";
      const scale = contain ? Math.min(cols / mw, rows / mh) : Math.max(cols / mw, rows / mh);
      const dw = mw * scale;
      const dh = mh * scale;
      const xPos = mediaPosition.includes("left") ? 0 : mediaPosition.includes("right") ? 1 : 0.5;
      const yPos = mediaPosition.includes("top") ? 0 : mediaPosition.includes("bottom") ? 1 : 0.5;
      const dx = (cols - dw) * xPos;
      const dy = (rows - dh) * yPos;
      if (contain) {
        imgBufCtx.fillStyle = "#000000";
        imgBufCtx.fillRect(0, 0, cols, rows);
      }
      imgBufCtx.drawImage(el, dx, dy, dw, dh);

      let data: Uint8ClampedArray;
      try {
        data = imgBufCtx.getImageData(0, 0, cols, rows).data;
      } catch {
        cells.fill(0.5);
        cellsVersion++;
        return;
      }

      const x0 = Math.max(0, Math.floor(dx));
      const y0 = Math.max(0, Math.floor(dy));
      const x1 = Math.min(cols, Math.ceil(dx + dw));
      const y1 = Math.min(rows, Math.ceil(dy + dh));
      const lum = new Float32Array(cols * rows);
      const hist = new Uint32Array(256);
      let count = 0;
      const withSource = colorMode === "source" && sourceCells.length === cols * rows;
      for (let r = y0; r < y1; r++)
        for (let c = x0; c < x1; c++) {
          const idx = r * cols + c;
          const o = idx * 4;
          const L = (data[o] * 0.2126 + data[o + 1] * 0.7152 + data[o + 2] * 0.0722) / 255;
          lum[idx] = L;
          hist[Math.min(255, Math.round(L * 255))]++;
          count++;
          if (withSource) sourceCells[idx] = (255 << 24) | (data[o + 2] << 16) | (data[o + 1] << 8) | data[o];
        }
      if (!count) return;

      let lo = 0;
      let hi = 255;
      let acc = 0;
      const loTarget = count * 0.02;
      const hiTarget = count * 0.98;
      for (let i = 0; i < 256; i++) {
        acc += hist[i];
        if (acc <= loTarget) lo = i;
        if (acc <= hiTarget) hi = i;
      }
      const black = lo / 255;
      const range = Math.max(8, hi - lo) / 255;
      if (blackSm < 0) {
        blackSm = black;
        whiteSm = range;
      } else {
        const k = isVideo ? 0.15 : 1;
        blackSm += (black - blackSm) * k;
        whiteSm += (range - whiteSm) * k;
      }

      const kBright = 1 + config.brightness / 100;
      const kContrast = config.contrast / 100;
      const invCfg = config.invert;
      for (let r = 0; r < rows; r++)
        for (let c = 0; c < cols; c++) {
          const idx = r * cols + c;
          if (c < x0 || c >= x1 || r < y0 || r >= y1) {
            cells[idx] = 0;
            continue;
          }
          let v = (lum[idx] - blackSm) / whiteSm;
          v = (v - 0.5) * kBright + 0.5 + kContrast;
          if (invCfg) v = 1 - v;
          cells[idx] = v < 0 ? 0 : v > 1 ? 1 : v;
        }
      cellsVersion++;
    }

    function frame(ts: number) {
      const t = (ts / 1000) * speed;

      if (isVideo && vidEl && vidEl.readyState >= 2) computeCells();

      if (autoCursor) {
        const now = performance.now();
        if (now - lastPointer > 1200 && cursor !== "none") {
          const ac = now / 1000;
          cursorX = cssW * (0.5 + 0.42 * Math.sin(ac * 0.45));
          cursorY = cssH * (0.5 + 0.4 * Math.sin(ac * 0.31 + 1.7));
          cursorInput = 1;
        }
      }

      cursorActive += (cursorInput - cursorActive) * 0.08;
      cursorSX += (cursorX - cursorSX) * 0.18;
      cursorSY += (cursorY - cursorSY) * 0.18;

      const cellCX = cursorSX / pixel;
      const cellCY = cursorSY / pixel;
      const cursorRange = mouseRange / pixel;
      const cursorOn = cursor !== "none" && cursorActive > 0.01;

      if (cursor === "trail") {
        if (trailHasContent) {
          let alive = false;
          for (let i = 0; i < trailCells.length; i++) {
            const d = trailCells[i] * 0.9;
            trailCells[i] = d;
            if (d > 0.01) alive = true;
          }
          if (!alive) trailHasContent = false;
        }
        if (cursorOn) {
          trailHasContent = true;
          const brush = mousePower * cursorActive;
          const radius = Math.max(1, cursorRange * 0.5);
          const r2 = Math.ceil(radius);
          const ccx = Math.round(cellCX);
          const ccy = Math.round(cellCY);
          for (let dy = -r2; dy <= r2; dy++) {
            const rr = ccy + dy;
            if (rr < 0 || rr >= rows) continue;
            for (let dx = -r2; dx <= r2; dx++) {
              const cc = ccx + dx;
              if (cc < 0 || cc >= cols) continue;
              const dist = Math.sqrt(dx * dx + dy * dy);
              if (dist > radius) continue;
              const f = 1 - dist / radius;
              const v = f * f * brush * 0.85;
              const idx = rr * cols + cc;
              if (v > trailCells[idx]) trailCells[idx] = v;
            }
          }
        }
      }

      const scanOffset = anim === "scan" ? (t * 0.22) % 1.3 - 0.15 : 0;
      const dissolvePulse = anim === "dissolve" ? Math.sin(t * 1.5) * 0.3 : 0;
      const glitchFrame = anim === "glitch" ? Math.floor(t * 2.5) : 0;
      const midC = cols / 2;
      const midR = rows / 2;

      if (anim !== "none" || cursorOn) {
        let changed = false;
        for (let r = 0; r < rows; r++) {
          let rowShift = 0;
          let rowDrop = false;
          if (anim === "glitch") {
            const h = hash(Math.floor(r / 6), 11, glitchFrame);
            if (h > 0.8) rowShift = (h - 0.9) * 34;
            if (h > 0.94) rowDrop = true;
          }
          for (let c = 0; c < cols; c++) {
            let sx = c + rowShift;
            let sy = r;
            let boost = 0;
            let light = 0;

            if (anim === "flow") sx += Math.sin(r * 0.13 + t * 1.6) * 1.8;
            if (anim === "melt") {
              const n = 0.4 + hash(c, 7, 0) * 0.9;
              sy = r - t * 7 * n;
              sy = ((sy % rows) + rows) % rows;
            } else if (anim === "wave") {
              const d = Math.sqrt((c - midC) * (c - midC) + (r - midR) * (r - midR));
              light += Math.sin(d * 0.35 - t * 3) * 0.22;
            } else if (anim === "rain") {
              const n = 8 + hash(c, 3, 0) * 14;
              const span = rows * 1.4;
              const i = ((t * n + hash(c, 5, 0) * span) % span) - r;
              if (i > 0 && i < 9) light += (1 - i / 9) * 0.55;
            }

            if (cursorOn) {
              const dcx = c + 0.5 - cellCX;
              const dcy = r + 0.5 - cellCY;
              const dist = Math.sqrt(dcx * dcx + dcy * dcy);
              const strength = mousePower * cursorActive;
              if (cursor === "trail") {
                boost += trailCells[r * cols + c];
              } else if (dist < cursorRange) {
                const f = 1 - dist / cursorRange;
                if (cursor === "reveal") boost += f * f * strength * 0.7;
                else if (cursor === "ripple") boost += Math.sin(dist * 0.9 - t * 5) * f * strength * 0.45;
                else if (cursor === "warp" && dist > 0.001) {
                  const push = f * f * strength * cursorRange * 0.35;
                  sx += (dcx / dist) * push;
                  sy += (dcy / dist) * push;
                } else if (cursor === "pinch" && dist > 0.001) {
                  const push = f * f * strength * cursorRange * 0.35;
                  sx -= (dcx / dist) * push;
                  sy -= (dcy / dist) * push;
                } else if (cursor === "twist") {
                  const ang = f * f * strength * 3;
                  const cosA = Math.cos(ang);
                  const sinA = Math.sin(ang);
                  sx = cellCX + dcx * cosA - dcy * sinA;
                  sy = cellCY + dcx * sinA + dcy * cosA;
                } else if (cursor === "scatter") {
                  const n = f * f * strength * 10;
                  const seed = Math.floor(t * 20);
                  sx += (hash(c, r, seed) - 0.5) * n;
                  sy += (hash(c, r, seed + 7) - 0.5) * n;
                }
              }
            }

            const ix = Math.round(sx);
            const iy = Math.round(sy);
            const cxi = ix < 0 ? 0 : ix > cols - 1 ? cols - 1 : ix;
            const cyi = iy < 0 ? 0 : iy > rows - 1 ? rows - 1 : iy;
            let v = cells[cyi * cols + cxi];

            if (rowDrop) v = 1 - v;

            if (anim === "scan") {
              const d = Math.abs(r / rows - scanOffset);
              if (d < 0.09) light += (1 - d / 0.09) * 0.45;
            }

            const weight = motionArea === "image" ? (v < 0.03 ? 0 : v > 0.155 ? 1 : (v - 0.03) * 8) : 1;
            const nv = v + (dissolvePulse + light) * weight + boost;
            const oi = r * cols + c;
            const clamped = nv < 0 ? 0 : nv > 1 ? 1 : nv;
            if (clamped !== cells[oi]) changed = true;
            cells[oi] = clamped;
          }
        }
        if (changed) cellsVersion++;
      }

      const needDither = cellsVersion !== renderedVersion || anim === "jitter";
      if (!needDither) return;

      const maxLevel = config.levels - 1;
      const jitter = anim === "jitter";
      const jx = jitter ? Math.floor(t * 9) : 0;
      const jy = jitter ? Math.floor(t * 5.3) : 0;
      const jseed = jitter ? Math.floor(t * 12) : 0;

      if (config.algorithm === "floyd" || config.algorithm === "atkinson") {
        if (diffCells.length !== cells.length) diffCells = new Float32Array(cells.length);
        diffCells.set(cells);
        for (let r = 0; r < rows; r++)
          for (let c = 0; c < cols; c++) {
            const idx = r * cols + c;
            const val = diffCells[idx];
            let q = Math.round(val * maxLevel);
            q = q < 0 ? 0 : q > maxLevel ? maxLevel : q;
            levelsArr[idx] = q;
            const error = val - q / maxLevel;
            if (config.algorithm === "floyd") {
              if (c + 1 < cols) diffCells[idx + 1] += error * 0.4375;
              if (r + 1 < rows) {
                if (c > 0) diffCells[idx + cols - 1] += error * 0.1875;
                diffCells[idx + cols] += error * 0.3125;
                if (c + 1 < cols) diffCells[idx + cols + 1] += error * 0.0625;
              }
            } else {
              const e = error * 0.125;
              if (c + 1 < cols) diffCells[idx + 1] += e;
              if (c + 2 < cols) diffCells[idx + 2] += e;
              if (r + 1 < rows) {
                if (c > 0) diffCells[idx + cols - 1] += e;
                diffCells[idx + cols] += e;
                if (c + 1 < cols) diffCells[idx + cols + 1] += e;
              }
              if (r + 2 < rows) diffCells[idx + 2 * cols] += e;
            }
          }
      } else {
        let matrix: number[] = BAYER4;
        let size = 4;
        if (config.algorithm === "bayer2") {
          matrix = BAYER2;
          size = 2;
        } else if (config.algorithm === "bayer8") {
          matrix = BAYER8;
          size = 8;
        }
        const noise = config.algorithm === "noise";
        for (let r = 0; r < rows; r++)
          for (let c = 0; c < cols; c++) {
            const idx = r * cols + c;
            const th = noise ? hash(c, r, jseed) : matrix[((r + jy) % size) * size + ((c + jx) % size)];
            let q = Math.floor(cells[idx] * maxLevel + th);
            q = q < 0 ? 0 : q > maxLevel ? maxLevel : q;
            levelsArr[idx] = q;
          }
      }

      const cell = pixel * (1 - config.spacing);
      const inset = (pixel - cell) / 2;
      const levels = config.levels;
      const maxLvl = maxLevel;

      if (pixel <= 3) {
        if (!offCanvas || offCanvas.width !== cols || offCanvas.height !== rows) {
          offCanvas = document.createElement("canvas");
          offCanvas.width = cols;
          offCanvas.height = rows;
          offCtx = offCanvas.getContext("2d");
        }
        if (offCtx) {
          const img = offCtx.createImageData(cols, rows);
          const buf = new Uint32Array(img.data.buffer);
          const n = cols * rows;
          if (colorMode === "solid") {
            for (let i = 0; i < n; i++) buf[i] = rampABGR[levelsArr[i]];
          } else {
            const src = colorMode === "source" ? sourceCells : gradientCells;
            const br = bgRgb[0];
            const bgG = bgRgb[1];
            const bb = bgRgb[2];
            for (let i = 0; i < n; i++) {
              const lvl = levelsArr[i];
              if (lvl === 0 || i >= src.length) {
                buf[i] = rampABGR[0];
                continue;
              }
              const s = src[i];
              const k = lvl / maxLvl;
              const rr = Math.round(br + ((s & 255) - br) * k);
              const gg = Math.round(bgG + (((s >> 8) & 255) - bgG) * k);
              const b2 = Math.round(bb + (((s >> 16) & 255) - bb) * k);
              buf[i] = (255 << 24) | (b2 << 16) | (gg << 8) | rr;
            }
          }
          offCtx.putImageData(img, 0, 0);
          ctx.globalCompositeOperation = "source-over";
          ctx.globalAlpha = 1;
          ctx.imageSmoothingEnabled = false;
          ctx.drawImage(offCanvas, 0, 0, cols, rows, 0, 0, cssW, cssH);
          ctx.imageSmoothingEnabled = true;
        }
        renderedVersion = cellsVersion;
        return;
      }

      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = 1;
      if (colorMode === "solid") {
        ctx.fillStyle = rampCss[0];
        ctx.fillRect(0, 0, cssW, cssH);
      } else {
        ctx.clearRect(0, 0, cssW, cssH);
      }

      if (config.shape === "glow" && glowSprite) {
        ctx.globalCompositeOperation = "lighter";
        const spriteSize = pixel * 2.4;
        for (let lvl = 1; lvl <= levels; lvl++) {
          ctx.globalAlpha = 0.9 * (lvl / levels);
          for (let r = 0; r < rows; r++)
            for (let c = 0; c < cols; c++)
              if (levelsArr[r * cols + c] === lvl)
                ctx.drawImage(
                  glowSprite,
                  c * pixel + pixel / 2 - spriteSize / 2,
                  r * pixel + pixel / 2 - spriteSize / 2,
                  spriteSize,
                  spriteSize
                );
        }
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = "source-over";
      } else if (config.shape === "dot") {
        for (let lvl = 1; lvl <= levels; lvl++) {
          const k = lvl / levels;
          const radius = (cell / 2) * (0.45 + 0.55 * k);
          ctx.fillStyle = colorMode === "solid" ? rampCss[levels - 1] : "#FFFFFF";
          ctx.beginPath();
          for (let r = 0; r < rows; r++)
            for (let c = 0; c < cols; c++) {
              if (levelsArr[r * cols + c] !== lvl) continue;
              const cx = c * pixel + pixel / 2;
              const cy = r * pixel + pixel / 2;
              ctx.moveTo(cx + radius, cy);
              ctx.arc(cx, cy, radius, 0, 6.2832);
            }
          ctx.fill();
        }
      } else {
        for (let lvl = 1; lvl <= levels; lvl++) {
          if (colorMode === "solid") ctx.fillStyle = rampCss[lvl];
          else {
            ctx.fillStyle = "#FFFFFF";
            ctx.globalAlpha = lvl / levels;
          }
          for (let r = 0; r < rows; r++)
            for (let c = 0; c < cols; c++)
              if (levelsArr[r * cols + c] === lvl)
                ctx.fillRect(c * pixel + inset, r * pixel + inset, cell, cell);
        }
        ctx.globalAlpha = 1;
      }

      if (colorMode !== "solid") {
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = "source-in";
        if (colorMode === "source" && imgBuf) {
          ctx.imageSmoothingEnabled = false;
          ctx.drawImage(imgBuf, 0, 0, cols, rows, 0, 0, cssW, cssH);
          ctx.imageSmoothingEnabled = true;
        } else {
          const ang = ((gradientAngle - 90) * Math.PI) / 180;
          const ca = Math.cos(ang);
          const sa = Math.sin(ang);
          const span = (Math.abs(ca) * cssW + Math.abs(sa) * cssH) / 2;
          const grad = ctx.createLinearGradient(
            cssW / 2 - ca * span,
            cssH / 2 - sa * span,
            cssW / 2 + ca * span,
            cssH / 2 + sa * span
          );
          grad.addColorStop(0, `rgb(${g0Rgb[0]},${g0Rgb[1]},${g0Rgb[2]})`);
          grad.addColorStop(1, `rgb(${g1Rgb[0]},${g1Rgb[1]},${g1Rgb[2]})`);
          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, cssW, cssH);
        }
        ctx.globalCompositeOperation = "destination-over";
        ctx.fillStyle = rampCss[0];
        ctx.fillRect(0, 0, cssW, cssH);
        ctx.globalCompositeOperation = "source-over";
      }
      renderedVersion = cellsVersion;
    }

    const kick = () => {
      if (!continuous) frame(performance.now());
    };

    const loop = (ts: number) => {
      const cellsCount = cols * rows;
      const interval = cellsCount > 210000 ? 44 : cellsCount > 120000 ? 30 : 0;
      const idle =
        anim === "none" && !isVideo && cursorInput === 0 && cursorActive < 0.004 && cursor !== "trail";
      if (ready && visible && !idle && ts - lastFrame >= interval) {
        frame(ts);
        lastFrame = ts;
      }
      rafId = window.requestAnimationFrame(loop);
    };

    resize();

    if (isVideo) {
      vidEl = document.createElement("video");
      vidEl.crossOrigin = "anonymous";
      vidEl.muted = true;
      vidEl.loop = true;
      vidEl.playsInline = true;
      vidEl.setAttribute("playsinline", "");
      vidEl.setAttribute("muted", "");
      vidEl.preload = "auto";
      const showFrame = () => {
        if (destroyed) return;
        ready = true;
        computeCells();
        kick();
      };
      if (rm) {
        vidEl.addEventListener("loadedmetadata", () => {
          try {
            const dur = vidEl?.duration;
            if (vidEl && Number.isFinite(dur) && dur > 0) vidEl.currentTime = Math.min(2, dur * 0.25);
            else if (vidEl) vidEl.currentTime = 0.1;
          } catch {
            /* ignore */
          }
        });
        vidEl.addEventListener("seeked", () => {
          showFrame();
          setTimeout(() => {
            if (!destroyed) showFrame();
          }, 300);
        });
      } else {
        const play = () => {
          if (vidEl && vidEl.paused) vidEl.play().catch(() => {});
        };
        playVideo = play;
        vidEl.addEventListener("loadeddata", () => {
          showFrame();
          play();
        });
        vidEl.addEventListener("canplay", play);
      }
      vidEl.onerror = () => {
        if (destroyed) return;
        ready = true;
        cells.fill(0.5);
        kick();
      };
      vidEl.src = srcVideo;
    } else {
      imgEl = new Image();
      imgEl.crossOrigin = "anonymous";
      imgEl.onload = () => {
        if (destroyed) return;
        ready = true;
        computeCells();
        kick();
      };
      imgEl.onerror = () => {
        if (destroyed) return;
        ready = true;
        cells.fill(0.5);
        kick();
      };
      imgEl.src = srcImage;
    }

    const onMove = (e: PointerEvent) => {
      const rect = root.getBoundingClientRect();
      const sx = rect.width > 0 ? root.offsetWidth / rect.width : 1;
      const sy = rect.height > 0 ? root.offsetHeight / rect.height : 1;
      cursorX = (e.clientX - rect.left) * sx;
      cursorY = (e.clientY - rect.top) * sy;
      lastPointer = performance.now();
      if (cursorActive < 0.01) {
        cursorSX = cursorX;
        cursorSY = cursorY;
      }
      cursorInput = 1;
      if (playVideo) playVideo();
    };
    const onLeave = () => {
      cursorInput = 0;
    };
    if (cursor !== "none") {
      root.addEventListener("pointermove", onMove);
      root.addEventListener("pointerleave", onLeave);
    }

    const ro = new ResizeObserver(() => {
      resize();
      kick();
    });
    ro.observe(root);

    let io: IntersectionObserver | null = null;
    if (continuous) {
      io = new IntersectionObserver((entries) => {
        visible = entries[0]?.isIntersecting ?? true;
      });
      io.observe(root);
      rafId = window.requestAnimationFrame(loop);
    }

    return () => {
      destroyed = true;
      cancelAnimationFrame(rafId);
      ro.disconnect();
      io?.disconnect();
      root.removeEventListener("pointermove", onMove);
      root.removeEventListener("pointerleave", onLeave);
      if (vidEl) {
        vidEl.pause();
        vidEl.removeAttribute("src");
        vidEl.load();
      }
    };
  }, [
    srcImage,
    srcVideo,
    isVideo,
    fit,
    mediaPosition,
    colorMode,
    gradientStart,
    gradientEnd,
    gradientAngle,
    config.algorithm,
    config.shape,
    config.pixelSize,
    config.levels,
    config.spacing,
    config.brightness,
    config.contrast,
    config.invert,
    config.foreground,
    config.background,
    effectiveAnim,
    effectiveCursor,
    motionArea,
    speed,
    mouseRange,
    mousePower,
    autoCursor,
  ]);

  // ── Overlay ──────────────────────────────────────────────────────────

  const openUp = boxPosition.startsWith("bottom");
  const overlayPos: React.CSSProperties =
    boxPosition === "top-right"
      ? { top: 14, right: 14 }
      : boxPosition === "bottom-left"
        ? { bottom: 14, left: 14 }
        : boxPosition === "bottom-center"
          ? { bottom: 14, left: "50%", transform: "translateX(-50%)" }
          : boxPosition === "bottom-right"
            ? { bottom: 14, right: 14 }
            : { top: 14, left: 14 };

  const presetOptions: [string, string][] = [
    ["statue", "Statue"],
    ["monoPrint", "Mono Print"],
    ["amberLed", "Amber LED"],
    ["crt", "CRT"],
    ["newsprint", "Newsprint"],
    ["blueprint", "Blueprint"],
    ...(effectivePreset === "custom" ? ([["custom", "Custom"]] as [string, string][]) : []),
  ];

  const colorOptions: [string, string][] = [
    ["default", "Preset Default"],
    ["mono", "Mono"],
    ["paper", "Paper"],
    ["amber", "Amber"],
    ["blueLed", "Blue LED"],
    ["crtGreen", "CRT Green"],
    ["blueprint", "Blueprint"],
    ["cyan", "Cyan"],
    ["neonPink", "Neon Pink"],
  ];

  const animOptions: [string, string][] = [
    ["none", "Off"],
    ["dissolve", "Dissolve"],
    ["scan", "Scan"],
    ["jitter", "Jitter"],
    ["flow", "Flow"],
    ["wave", "Wave"],
    ["glitch", "Glitch"],
    ["melt", "Melt"],
    ["rain", "Rain"],
  ];

  const cursorOptions: [string, string][] = [
    ["none", "Off"],
    ["reveal", "Reveal"],
    ["trail", "Trail"],
    ["ripple", "Ripple"],
    ["warp", "Warp"],
    ["pinch", "Pinch"],
    ["twist", "Twist"],
    ["scatter", "Scatter"],
  ];

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const url = URL.createObjectURL(file);
    if (uploadedUrlRef.current) URL.revokeObjectURL(uploadedUrlRef.current);
    uploadedUrlRef.current = url;
    setUploadedUrl(url);
    setUploadedType(file.type.startsWith("video/") ? "video" : "image");
    setUploadedName(file.name);
  };

  const clearUpload = () => {
    if (uploadedUrlRef.current) URL.revokeObjectURL(uploadedUrlRef.current);
    uploadedUrlRef.current = null;
    setUploadedUrl(null);
    setUploadedType(null);
    setUploadedName(null);
  };

  return (
    <div
      ref={rootRef}
      role="img"
      aria-label={(typeof image === "object" && image?.alt) || "Dithered image"}
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        overflow: "hidden",
        borderRadius: radius,
        background: config.background,
        ...style,
      }}
    >
      <canvas ref={canvasRef} style={{ position: "absolute", inset: 0, display: "block" }} />

      {showOverlay && !reducedMotion && (
        <div
          style={{
            position: "absolute",
            ...overlayPos,
            width: 216,
            maxWidth: "calc(100% - 28px)",
            display: "flex",
            flexDirection: "column",
            zIndex: 2,
            borderRadius: 16,
            border: "1px solid rgba(255,255,255,0.12)",
            background: "rgba(10,10,12,0.66)",
            backdropFilter: "blur(18px)",
            WebkitBackdropFilter: "blur(18px)",
            overflow: "hidden",
            pointerEvents: "auto",
            ...mono,
          }}
        >
          <button
            type="button"
            aria-expanded={open}
            aria-label="Toggle controls"
            onClick={() => setOpen(!open)}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              width: "100%",
              padding: "11px 14px",
              border: "none",
              borderBottom: open ? "1px solid rgba(255,255,255,0.08)" : "none",
              background: "transparent",
              cursor: "pointer",
              color: "rgba(255,255,255,0.92)",
              fontFamily: "inherit",
            }}
          >
            <span
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: 11,
                letterSpacing: 2,
                textTransform: "uppercase",
                fontWeight: 600,
              }}
            >
              <span
                aria-hidden="true"
                style={{ width: 8, height: 8, borderRadius: 2, background: "#FFFFFF", boxShadow: "0 0 8px #FFFFFF" }}
              />
              Dither Engine
            </span>
            <span
              aria-hidden="true"
              style={{
                fontSize: 9,
                opacity: 0.6,
                transform: open ? "none" : "rotate(-90deg)",
                transition: "transform 0.15s",
              }}
            >
              ▾
            </span>
          </button>

          {open && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: 14 }}>
              <input
                ref={fileRef}
                type="file"
                accept="image/*,video/*"
                onChange={handleUpload}
                style={{ display: "none" }}
              />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 7,
                  width: "100%",
                  padding: "9px 10px",
                  borderRadius: 10,
                  border: "1px solid #FFFFFF",
                  background: "transparent",
                  color: "#FFFFFF",
                  fontFamily: "inherit",
                  fontSize: 11,
                  letterSpacing: 0.5,
                  cursor: "pointer",
                  pointerEvents: "auto",
                }}
              >
                <span aria-hidden="true" style={{ fontSize: 13 }}>
                  ↑
                </span>
                Upload Image / Video
              </button>

              {uploadedName && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 8,
                    marginTop: -4,
                  }}
                >
                  <span
                    style={{
                      fontSize: 10,
                      color: "rgba(255,255,255,0.6)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {uploadedName}
                  </span>
                  <button
                    type="button"
                    aria-label="Remove uploaded media"
                    onClick={clearUpload}
                    style={{
                      flexShrink: 0,
                      padding: "2px 7px",
                      borderRadius: 5,
                      border: "none",
                      background: "rgba(255,255,255,0.1)",
                      color: "rgba(255,255,255,0.65)",
                      fontSize: 10,
                      cursor: "pointer",
                      pointerEvents: "auto",
                    }}
                  >
                    Clear
                  </button>
                </div>
              )}

              {presetMenu && (
                <OverlaySelect
                  label="Preset"
                  value={effectivePreset}
                  options={presetOptions}
                  accent="#FFFFFF"
                  openUp={openUp}
                  onSelect={(v) => setPresetState(v as DitherPreset)}
                />
              )}

              {colorMenu && (
                <>
                  <OverlaySelect
                    label="Colors"
                    value={fgState || bgState ? "default" : effectiveColorPreset}
                    options={colorOptions}
                    accent="#FFFFFF"
                    openUp={openUp}
                    onSelect={(v) => {
                      setColorPresetState(v);
                      setFgState(null);
                      setBgState(null);
                    }}
                  />
                  <OverlayColor
                    label="Foreground"
                    value={config.foreground}
                    overridden={fgState != null}
                    onChange={setFgState}
                    onReset={() => setFgState(null)}
                  />
                  <OverlayColor
                    label="Background"
                    value={config.background}
                    overridden={bgState != null}
                    onChange={setBgState}
                    onReset={() => setBgState(null)}
                  />
                </>
              )}

              <OverlaySlider
                label="Pixel Size"
                value={config.pixelSize}
                min={2}
                max={24}
                step={1}
                accent="#FFFFFF"
                format={(v) => `${v}px`}
                onChange={(v) => setPixelState(v)}
              />

              {motionMenu && (
                <OverlaySelect
                  label="Motion"
                  value={effectiveAnim}
                  options={animOptions}
                  accent="#FFFFFF"
                  openUp={openUp}
                  onSelect={(v) => setAnimState(v as DitherAnimation)}
                />
              )}

              {motionMenu && effectiveAnim !== "none" && (
                <OverlaySlider
                  label="Speed"
                  value={speed}
                  min={0.1}
                  max={3}
                  step={0.1}
                  accent="#FFFFFF"
                  format={(v) => `${v.toFixed(1)}×`}
                  onChange={(v) => setSpeedState(v)}
                />
              )}

              {cursorMenu && (
                <OverlaySelect
                  label="Cursor"
                  value={effectiveCursor}
                  options={cursorOptions}
                  accent="#FFFFFF"
                  openUp={openUp}
                  onSelect={(v) => setCursorState(v as DitherCursorEffect)}
                />
              )}

              {cursorMenu && effectiveCursor !== "none" && (
                <>
                  <OverlaySlider
                    label="Cursor Range"
                    value={mouseRange}
                    min={40}
                    max={500}
                    step={10}
                    accent="#FFFFFF"
                    format={(v) => `${v}px`}
                    onChange={(v) => setRangeState(v)}
                  />
                  <OverlaySlider
                    label="Strength"
                    value={mousePower}
                    min={0.1}
                    max={1}
                    step={0.05}
                    accent="#FFFFFF"
                    format={(v) => v.toFixed(2)}
                    onChange={(v) => setStrengthState(v)}
                  />
                </>
              )}

              <OverlaySwitch
                label="Invert"
                value={config.invert}
                accent="#FFFFFF"
                onChange={(v) => setInvertState(v)}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Property controls ─────────────────────────────────────────────────

addPropertyControls(DitherEngine, {
  preset: {
    type: ControlType.Enum,
    title: "Preset",
    options: ["statue", "monoPrint", "amberLed", "crt", "newsprint", "blueprint", "custom"],
    optionTitles: ["Statue", "Mono Print", "Amber LED", "CRT", "Newsprint", "Blueprint", "Custom"],
    defaultValue: "statue",
  },
  colorMode: {
    type: ControlType.Enum,
    title: "Color Mode",
    options: ["solid", "linear", "source"],
    optionTitles: ["Solid", "Linear", "Source"],
    defaultValue: "solid",
  },
  foreground: {
    type: ControlType.Color,
    title: "Foreground",
    optional: true,
    hidden: (e) => e.colorMode === "linear" || e.colorMode === "source",
  },
  background: {
    type: ControlType.Color,
    title: "Background",
    optional: true,
  },
  gradientStart: {
    type: ControlType.Color,
    title: "Color A",
    defaultValue: "#4DA6FF",
    hidden: (e) => e.colorMode !== "linear",
  },
  gradientEnd: {
    type: ControlType.Color,
    title: "Color B",
    defaultValue: "#FF4DD2",
    hidden: (e) => e.colorMode !== "linear",
  },
  gradientAngle: {
    type: ControlType.Number,
    title: "Angle",
    min: 0,
    max: 360,
    step: 5,
    unit: "°",
    defaultValue: 90,
    hidden: (e) => e.colorMode !== "linear",
  },
  sourceType: {
    type: ControlType.Enum,
    title: "Source",
    options: ["image", "video"],
    optionTitles: ["Image", "Video"],
    displaySegmentedControl: true,
    defaultValue: "image",
  },
  image: {
    type: ControlType.ResponsiveImage,
    title: "Image",
    hidden: (e) => e.sourceType === "video",
  },
  video: {
    type: ControlType.File,
    title: "Video",
    allowedFileTypes: ["mp4", "webm", "mov"],
    hidden: (e) => e.sourceType !== "video",
  },
  fit: {
    type: ControlType.Enum,
    title: "Fit",
    options: ["cover", "contain"],
    optionTitles: ["Fill", "Fit"],
    displaySegmentedControl: true,
    defaultValue: "cover",
  },
  mediaPosition: {
    type: ControlType.Enum,
    title: "Position",
    options: ["center", "top", "bottom", "left", "right", "top-left", "top-right", "bottom-left", "bottom-right"],
    optionTitles: ["Center", "Top", "Bottom", "Left", "Right", "Top Left", "Top Right", "Bottom Left", "Bottom Right"],
    defaultValue: "center",
  },
  algorithm: {
    type: ControlType.Enum,
    title: "Algorithm",
    options: ["bayer2", "bayer4", "bayer8", "floyd", "atkinson", "noise"],
    optionTitles: ["Bayer 2×2", "Bayer 4×4", "Bayer 8×8", "Floyd–Steinberg", "Atkinson", "Noise"],
    defaultValue: "bayer4",
    hidden: (e) => e.preset !== "custom",
  },
  shape: {
    type: ControlType.Enum,
    title: "Pixel Shape",
    options: ["square", "dot", "glow"],
    optionTitles: ["Square", "Dot", "Glow"],
    displaySegmentedControl: true,
    defaultValue: "dot",
    hidden: (e) => e.preset !== "custom",
  },
  pixelSize: {
    type: ControlType.Number,
    title: "Pixel Size",
    min: 2,
    max: 24,
    step: 1,
    unit: "px",
    defaultValue: 5,
    optional: true,
  },
  levels: {
    type: ControlType.Number,
    title: "Tone Levels",
    min: 2,
    max: 6,
    step: 1,
    displayStepper: true,
    defaultValue: 2,
    hidden: (e) => e.preset !== "custom",
  },
  spacing: {
    type: ControlType.Number,
    title: "Spacing",
    min: 0,
    max: 0.7,
    step: 0.05,
    defaultValue: 0.25,
    hidden: (e) => e.preset !== "custom",
  },
  brightness: {
    type: ControlType.Number,
    title: "Brightness",
    min: -100,
    max: 100,
    step: 1,
    defaultValue: 0,
    hidden: (e) => e.preset !== "custom",
  },
  contrast: {
    type: ControlType.Number,
    title: "Contrast",
    min: -100,
    max: 100,
    step: 1,
    defaultValue: 20,
    hidden: (e) => e.preset !== "custom",
  },
  invert: {
    type: ControlType.Boolean,
    title: "Invert",
    defaultValue: false,
  },
  animMode: {
    type: ControlType.Enum,
    title: "Animation",
    options: ["none", "dissolve", "scan", "jitter", "flow", "wave", "glitch", "melt", "rain"],
    optionTitles: ["None", "Dissolve", "Scan", "Jitter", "Flow", "Wave", "Glitch", "Melt", "Rain"],
    defaultValue: "none",
  },
  animSpeed: {
    type: ControlType.Number,
    title: "Speed",
    min: 0.1,
    max: 3,
    step: 0.1,
    defaultValue: 1,
    hidden: (e) => e.animMode === "none",
  },
  motionArea: {
    type: ControlType.Enum,
    title: "Motion Area",
    options: ["full", "image"],
    optionTitles: ["Full Frame", "Image Only"],
    displaySegmentedControl: true,
    defaultValue: "full",
    hidden: (e) => e.animMode === "none",
  },
  mouseMode: {
    type: ControlType.Enum,
    title: "Mouse",
    options: ["none", "reveal", "trail", "ripple", "warp", "pinch", "twist", "scatter"],
    optionTitles: ["None", "Reveal", "Trail", "Ripple", "Warp", "Pinch", "Twist", "Scatter"],
    defaultValue: "reveal",
  },
  mouseRadius: {
    type: ControlType.Number,
    title: "Cursor Range",
    min: 40,
    max: 500,
    step: 10,
    unit: "px",
    defaultValue: 180,
    hidden: (e) => e.mouseMode === "none",
  },
  mouseStrength: {
    type: ControlType.Number,
    title: "Strength",
    min: 0.1,
    max: 1,
    step: 0.05,
    defaultValue: 0.6,
    hidden: (e) => e.mouseMode === "none",
  },
  radius: {
    type: ControlType.Number,
    title: "Corner Radius",
    min: 0,
    max: 64,
    step: 1,
    unit: "px",
    defaultValue: 0,
  },
  showOverlay: {
    type: ControlType.Boolean,
    title: "Overlay",
    defaultValue: false,
    enabledTitle: "Show",
    disabledTitle: "Hide",
  },
  boxPosition: {
    type: ControlType.Enum,
    title: "Box Position",
    options: ["top-left", "top-right", "bottom-left", "bottom-center", "bottom-right"],
    optionTitles: ["Top Left", "Top Right", "Bottom Left", "Bottom Center", "Bottom Right"],
    defaultValue: "top-left",
    hidden: (e) => !e.showOverlay,
  },
  presetMenu: {
    type: ControlType.Boolean,
    title: "Preset Menu",
    defaultValue: true,
    hidden: (e) => !e.showOverlay,
  },
  colorMenu: {
    type: ControlType.Boolean,
    title: "Color Menu",
    defaultValue: true,
    hidden: (e) => !e.showOverlay,
  },
  motionMenu: {
    type: ControlType.Boolean,
    title: "Motion Menu",
    defaultValue: true,
    hidden: (e) => !e.showOverlay,
  },
  cursorMenu: {
    type: ControlType.Boolean,
    title: "Cursor Menu",
    defaultValue: true,
    hidden: (e) => !e.showOverlay,
  },
});