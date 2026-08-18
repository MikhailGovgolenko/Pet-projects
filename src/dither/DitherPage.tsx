import { useRef, useState, type CSSProperties, type ChangeEvent } from "react";
import RangeSlider from "../components/RangeSlider";
import ToggleSwitch from "../components/ToggleSwitch";
import CustomSelect from "../components/CustomSelect";
import DitherEngine, {
  DITHER_PRESETS,
  DITHER_ALGORITHMS,
  DITHER_SHAPES,
  DITHER_ANIMATIONS,
  DITHER_CURSOR_EFFECTS,
  DITHER_COLOR_PRESETS,
  type DitherPreset,
  type DitherAlgorithm,
  type DitherShape,
  type DitherColorMode,
  type DitherAnimation,
  type DitherCursorEffect,
  type DitherMediaPosition,
} from "./DitherEngine";
import { DITHER_TSX_SOURCE } from "./code";
import { useI18n } from "../i18n";

const microLabel: CSSProperties = {
  display: "block",
  fontSize: 9.5,
  fontWeight: 700,
  letterSpacing: 1.4,
  textTransform: "uppercase",
  color: "var(--text-sec)",
  marginBottom: 6,
  opacity: 0.8,
};

const chipRow: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 5,
  marginBottom: 2,
};

const chip: CSSProperties = {
  width: "auto",
  margin: 0,
  padding: "5px 10px",
  borderRadius: 100,
  border: "1px solid var(--glass-border)",
  background: "var(--input-bg)",
  color: "var(--text-sec)",
  fontSize: 10.5,
  fontWeight: 700,
  letterSpacing: "0.1px",
  cursor: "pointer",
  transition: "color 0.15s, border-color 0.15s, background 0.15s",
};

const activeChip: CSSProperties = {
  ...chip,
  color: "var(--accent)",
  borderColor: "var(--accent)",
  background: "var(--accent-soft)",
};

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button type="button" style={active ? activeChip : chip} onClick={onClick}>
      {children}
    </button>
  );
}

function Seg({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      style={{
        flex: 1,
        width: "auto",
        margin: 0,
        padding: "5px 8px",
        borderRadius: 9,
        border: "1px solid " + (active ? "var(--accent)" : "var(--glass-border)"),
        background: active ? "var(--accent-soft)" : "var(--input-bg)",
        color: active ? "var(--accent)" : "var(--text-sec)",
        fontSize: 10.5,
        fontWeight: 700,
        cursor: "pointer",
        transition: "color 0.15s, border-color 0.15s, background 0.15s",
      }}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

const PRESET_ORDER: Exclude<DitherPreset, "custom">[] = [
  "statue",
  "monoPrint",
  "amberLed",
  "crt",
  "newsprint",
  "blueprint",
];

const MEDIA_POSITIONS: { value: DitherMediaPosition; label: string }[] = [
  { value: "center", label: "Center" },
  { value: "top", label: "Top" },
  { value: "bottom", label: "Bottom" },
  { value: "left", label: "Left" },
  { value: "right", label: "Right" },
  { value: "top-left", label: "Top Left" },
  { value: "top-right", label: "Top Right" },
  { value: "bottom-left", label: "Bottom Left" },
  { value: "bottom-right", label: "Bottom Right" },
];

const COLOR_MODE_OPTIONS = [
  { value: "solid", label: "Solid" },
  { value: "linear", label: "Linear" },
  { value: "source", label: "Source" },
];

const ANIM_OPTIONS = Object.entries(DITHER_ANIMATIONS).map(([value, label]) => ({ value, label }));
const CURSOR_OPTIONS = Object.entries(DITHER_CURSOR_EFFECTS).map(([value, label]) => ({ value, label }));
const ALGO_OPTIONS = Object.entries(DITHER_ALGORITHMS).map(([value, label]) => ({ value, label }));
const SHAPE_OPTIONS = Object.entries(DITHER_SHAPES).map(([value, label]) => ({ value, label }));

export default function DitherPage() {
  const { t } = useI18n();
  const [preset, setPreset] = useState<DitherPreset>("statue");
  const [algorithm, setAlgorithm] = useState<DitherAlgorithm>("bayer4");
  const [shape, setShape] = useState<DitherShape>("dot");
  const [levels, setLevels] = useState(2);
  const [spacing, setSpacing] = useState(0.25);
  const [brightness, setBrightness] = useState(5);
  const [contrast, setContrast] = useState(20);
  const [fg, setFg] = useState<string | undefined>(undefined);
  const [bg, setBg] = useState<string | undefined>(undefined);
  const [pixel, setPixel] = useState<number | undefined>(undefined);
  const [invert, setInvert] = useState<boolean | undefined>(undefined);
  const [colorMode, setColorMode] = useState<DitherColorMode>("solid");
  const [gradientStart, setGradientStart] = useState("#4DA6FF");
  const [gradientEnd, setGradientEnd] = useState("#FF4DD2");
  const [gradientAngle, setGradientAngle] = useState(90);
  const [animMode, setAnimMode] = useState<DitherAnimation>("none");
  const [animSpeed, setAnimSpeed] = useState(1);
  const [motionArea, setMotionArea] = useState<"full" | "image">("full");
  const [mouseMode, setMouseMode] = useState<DitherCursorEffect>("trail");
  const [mouseRadius, setMouseRadius] = useState(180);
  const [mouseStrength, setMouseStrength] = useState(0.6);
  const [radius, setRadius] = useState(0);
  const [sourceType, setSourceType] = useState<"image" | "video">("image");
  const [fit, setFit] = useState<"cover" | "contain">("cover");
  const [mediaPosition, setMediaPosition] = useState<DitherMediaPosition>("center");
  const [sourceUrl, setSourceUrl] = useState<string | undefined>(undefined);
  const [sourceIsVideo, setSourceIsVideo] = useState(false);
  const [copyState, setCopyState] = useState<"idle" | "ok" | "error">("idle");
  const [collapsed, setCollapsed] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const presetCfg =
    preset !== "custom"
      ? DITHER_PRESETS[preset].config
      : {
          algorithm,
          shape,
          pixelSize: pixel ?? 5,
          levels,
          spacing,
          brightness,
          contrast,
          invert: invert ?? false,
          foreground: fg ?? "#F4F4F0",
          background: bg ?? "#050505",
        };

  const effCfg =
    fg || bg || pixel !== undefined || invert !== undefined
      ? {
          ...presetCfg,
          foreground: fg ?? presetCfg.foreground,
          background: bg ?? presetCfg.background,
          pixelSize: pixel ?? presetCfg.pixelSize,
          invert: invert ?? presetCfg.invert,
        }
      : presetCfg;

  const applyPreset = (key: Exclude<DitherPreset, "custom">) => {
    const p = DITHER_PRESETS[key].config;
    setPreset(key);
    setAlgorithm(p.algorithm);
    setShape(p.shape);
    setLevels(p.levels);
    setSpacing(p.spacing);
    setBrightness(p.brightness);
    setContrast(p.contrast);
  };

  const tweak = <K extends "algorithm" | "shape" | "levels" | "spacing" | "brightness" | "contrast">(
    key: K,
    value: number | string
  ) => {
    const setters = {
      algorithm: setAlgorithm,
      shape: setShape,
      levels: setLevels,
      spacing: setSpacing,
      brightness: setBrightness,
      contrast: setContrast,
    } as Record<K, (v: never) => void>;
    (setters[key] as (v: typeof value) => void)(value as never);
    setPreset("custom");
  };

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(DITHER_TSX_SOURCE);
      setCopyState("ok");
    } catch {
      setCopyState("error");
    }
    setTimeout(() => setCopyState("idle"), 2500);
  };

  const onFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setSourceIsVideo(file.type.startsWith("video/"));
    setSourceUrl((old) => {
      if (old) URL.revokeObjectURL(old);
      return url;
    });
  };

  const clearMedia = () => {
    setSourceUrl((old) => {
      if (old) URL.revokeObjectURL(old);
      return undefined;
    });
    setSourceIsVideo(false);
  };

  return (
    <div
      style={{
        minHeight: "100dvh",
        width: "100%",
        overflow: "hidden",
        position: "relative",
      }}
    >
      <style>{`
        .de-panel {
          position: absolute;
          left: calc(16px + env(safe-area-inset-left));
          top: calc(16px + env(safe-area-inset-top));
          width: min(336px, calc(100vw - 32px));
          padding: 14px;
          background: var(--glass-bg);
          backdrop-filter: blur(60px) saturate(240%);
          -webkit-backdrop-filter: blur(60px) saturate(240%);
          border: 1px solid var(--glass-border);
          border-radius: 18px;
          box-shadow: var(--glass-shadow);
          z-index: 10;
          color: inherit;
          transition: transform 0.45s cubic-bezier(0.32,0.72,0,1), opacity 0.35s ease;
          max-height: calc(100dvh - 32px - env(safe-area-inset-top));
          overflow-y: auto;
          overscroll-behavior: contain;
        }
        .de-panel.collapsed {
          transform: translateX(calc(-100% - 40px));
          opacity: 0;
          pointer-events: none;
        }
        .de-panel::-webkit-scrollbar { width: 3px; }
        .de-panel::-webkit-scrollbar-thumb { background: var(--glass-border); border-radius: 3px; }
        .de-section {
          padding: 11px 0;
          border-bottom: 1px solid var(--glass-border);
        }
        .de-section:last-child { border-bottom: none; padding-bottom: 2px; }
        .de-expand {
          position: fixed;
          left: calc(20px + env(safe-area-inset-left));
          top: calc(20px + env(safe-area-inset-top));
          width: 44px;
          height: 44px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          z-index: 20;
          background: var(--glass-bg);
          backdrop-filter: blur(80px) saturate(260%);
          -webkit-backdrop-filter: blur(80px) saturate(260%);
          border: 1px solid var(--glass-border);
          box-shadow: var(--glass-shadow);
        }
        .de-expand span {
          display: block;
          width: 7px;
          height: 7px;
          border-right: 2px solid currentColor;
          border-top: 2px solid currentColor;
          transform: rotate(45deg);
          margin-right: 2px;
          opacity: 0.8;
        }
        .de-seg-row {
          display: flex;
          gap: 5;
        }
        @media (max-width: 640px) {
          .de-panel {
            left: 12px;
            right: 12px;
            width: auto;
            top: auto;
            bottom: calc(16px + env(safe-area-inset-bottom));
            max-height: 46dvh;
            padding-bottom: calc(16px + env(safe-area-inset-bottom));
          }
          .de-panel.collapsed {
            transform: translateY(calc(100% + 48px));
          }
        }
      `}</style>

      <div
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          zIndex: 0,
        }}
      >
        <DitherEngine
          preset={preset}
          algorithm={algorithm}
          shape={shape}
          levels={levels}
          spacing={spacing}
          brightness={brightness}
          contrast={contrast}
          foreground={fg}
          background={bg}
          pixelSize={pixel}
          invert={invert}
          colorMode={colorMode}
          gradientStart={gradientStart}
          gradientEnd={gradientEnd}
          gradientAngle={gradientAngle}
          sourceType={sourceType}
          image={sourceUrl && !sourceIsVideo ? { src: sourceUrl } : undefined}
          video={sourceUrl && sourceIsVideo ? sourceUrl : undefined}
          fit={fit}
          mediaPosition={mediaPosition}
          animMode={animMode}
          animSpeed={animSpeed}
          motionArea={motionArea}
          mouseMode={mouseMode}
          mouseRadius={mouseRadius}
          mouseStrength={mouseStrength}
          radius={radius}
        />
      </div>

      <div className={"de-panel" + (collapsed ? " collapsed" : "")}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 4,
            paddingBottom: 10,
            borderBottom: "1px solid var(--glass-border)",
          }}
        >
          <span style={{ fontWeight: 700, fontSize: 14, letterSpacing: "-0.2px" }}>
            {t("dither.panel")}
          </span>
          <div
            onClick={() => setCollapsed(true)}
            style={{
              width: 26,
              height: 26,
              borderRadius: "50%",
              background: "var(--input-bg)",
              border: "1px solid var(--glass-border)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              transition: "background 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(128,128,128,0.15)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "var(--input-bg)")}
          >
            <span
              style={{
                display: "block",
                width: 5,
                height: 5,
                borderLeft: "2px solid currentColor",
                borderBottom: "2px solid currentColor",
                transform: "rotate(45deg)",
                marginLeft: 2,
                opacity: 0.8,
              }}
            />
          </div>
        </div>

        <div className="de-section">
          <span style={microLabel}>{t("dither.preset")}</span>
          <div style={chipRow}>
            {PRESET_ORDER.map((key) => (
              <Chip key={key} active={preset === key} onClick={() => applyPreset(key)}>
                {DITHER_PRESETS[key].label}
              </Chip>
            ))}
            <Chip active={preset === "custom"} onClick={() => setPreset("custom")}>
              {t("dither.custom")}
            </Chip>
          </div>
        </div>

        <div className="de-section">
          <span style={microLabel}>{t("dither.media")}</span>
          <input
            ref={fileRef}
            type="file"
            accept="image/*,video/mp4,video/webm,video/quicktime"
            style={{ display: "none" }}
            onChange={onFile}
          />
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => fileRef.current?.click()}
              style={{ flex: 1, width: "auto", margin: 0, padding: "8px 10px" }}
            >
              {t("dither.upload")}
            </button>
            {sourceUrl && (
              <button onClick={clearMedia} style={{ width: "auto", margin: 0, padding: "8px 10px" }}>
                ✕
              </button>
            )}
          </div>
          <div style={{ ...chipRow, marginTop: 8 }}>
            <Seg active={sourceType === "image"} onClick={() => setSourceType("image")}>
              {t("dither.image")}
            </Seg>
            <Seg active={sourceType === "video"} onClick={() => setSourceType("video")}>
              {t("dither.video")}
            </Seg>
            <Seg active={fit === "cover"} onClick={() => setFit("cover")}>
              {t("dither.fill")}
            </Seg>
            <Seg active={fit === "contain"} onClick={() => setFit("contain")}>
              {t("dither.fitOption")}
            </Seg>
          </div>
          <div style={{ marginTop: 8 }}>
            <CustomSelect
              value={mediaPosition}
              options={MEDIA_POSITIONS}
              onChange={(v) => setMediaPosition(v as DitherMediaPosition)}
            />
          </div>
        </div>

        <div className="de-section">
          <span style={microLabel}>{t("dither.colors")}</span>
          <CustomSelect
            value={colorMode}
            options={COLOR_MODE_OPTIONS}
            onChange={(v) => setColorMode(v as DitherColorMode)}
          />
          {colorMode === "solid" && (
            <>
              <div style={{ display: "flex", gap: 10, marginTop: 9 }}>
                <label
                  style={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: 11.5,
                    fontWeight: 600,
                  }}
                >
                  <input
                    type="color"
                    value={effCfg.foreground}
                    onChange={(e) => setFg(e.target.value)}
                    style={{
                      width: 32,
                      height: 24,
                      border: "none",
                      background: "none",
                      padding: 0,
                      cursor: "pointer",
                    }}
                  />
                  <span style={{ color: "var(--text-sec)" }}>{t("dither.fg")}</span>
                </label>
                <label
                  style={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: 11.5,
                    fontWeight: 600,
                  }}
                >
                  <input
                    type="color"
                    value={effCfg.background}
                    onChange={(e) => setBg(e.target.value)}
                    style={{
                      width: 32,
                      height: 24,
                      border: "none",
                      background: "none",
                      padding: 0,
                      cursor: "pointer",
                    }}
                  />
                  <span style={{ color: "var(--text-sec)" }}>{t("dither.bg")}</span>
                </label>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
                {Object.entries(DITHER_COLOR_PRESETS).map(([key, p]) => (
                  <button
                    key={key}
                    title={p.label}
                    aria-label={p.label}
                    onClick={() => {
                      setFg(p.fg);
                      setBg(p.bg);
                    }}
                    style={{
                      width: 38,
                      height: 22,
                      margin: 0,
                      padding: 0,
                      borderRadius: 7,
                      border:
                        fg === p.fg && bg === p.bg
                          ? "1px solid var(--accent)"
                          : "1px solid var(--glass-border)",
                      background: `linear-gradient(90deg, ${p.fg} 50%, ${p.bg} 50%)`,
                      cursor: "pointer",
                    }}
                  />
                ))}
              </div>
            </>
          )}
          {colorMode === "linear" && (
            <>
              <div style={{ display: "flex", gap: 10, marginTop: 9 }}>
                <label
                  style={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: 11.5,
                    fontWeight: 600,
                  }}
                >
                  <input
                    type="color"
                    value={gradientStart}
                    onChange={(e) => setGradientStart(e.target.value)}
                    style={{
                      width: 32,
                      height: 24,
                      border: "none",
                      background: "none",
                      padding: 0,
                      cursor: "pointer",
                    }}
                  />
                  <span style={{ color: "var(--text-sec)" }}>{t("dither.gradientA")}</span>
                </label>
                <label
                  style={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: 11.5,
                    fontWeight: 600,
                  }}
                >
                  <input
                    type="color"
                    value={gradientEnd}
                    onChange={(e) => setGradientEnd(e.target.value)}
                    style={{
                      width: 32,
                      height: 24,
                      border: "none",
                      background: "none",
                      padding: 0,
                      cursor: "pointer",
                    }}
                  />
                  <span style={{ color: "var(--text-sec)" }}>{t("dither.gradientB")}</span>
                </label>
              </div>
              <RangeSlider
                name="angle"
                label={t("dither.angle")}
                min={0}
                max={360}
                step={5}
                value={gradientAngle}
                onChange={setGradientAngle}
                format={(v) => v.toFixed(0) + "°"}
              />
            </>
          )}
        </div>

        <div className="de-section">
          <span style={microLabel}>{t("dither.settings")}</span>
          <CustomSelect
            value={preset === "custom" ? algorithm : effCfg.algorithm}
            options={ALGO_OPTIONS}
            onChange={(v) => tweak("algorithm", v as DitherAlgorithm)}
          />
          <div style={{ marginTop: 8 }}>
            <CustomSelect
              value={preset === "custom" ? shape : effCfg.shape}
              options={SHAPE_OPTIONS}
              onChange={(v) => tweak("shape", v as DitherShape)}
            />
          </div>
          <RangeSlider
            name="pixel"
            label={t("dither.pixel")}
            min={2}
            max={24}
            step={1}
            value={effCfg.pixelSize}
            onChange={(v) => setPixel(Math.round(v))}
            format={(v) => v.toFixed(0) + "px"}
          />
          <RangeSlider
            name="levels"
            label={t("dither.levels")}
            min={2}
            max={6}
            step={1}
            value={preset === "custom" ? levels : effCfg.levels}
            onChange={(v) => tweak("levels", Math.round(v))}
            format={(v) => String(Math.round(v))}
          />
          <RangeSlider
            name="spacing"
            label={t("dither.spacing")}
            min={0}
            max={0.7}
            step={0.05}
            value={preset === "custom" ? spacing : effCfg.spacing}
            onChange={(v) => tweak("spacing", Math.round(v * 100) / 100)}
            format={(v) => v.toFixed(2)}
          />
          <RangeSlider
            name="brightness"
            label={t("dither.brightness")}
            min={-100}
            max={100}
            step={1}
            value={preset === "custom" ? brightness : effCfg.brightness}
            onChange={(v) => tweak("brightness", Math.round(v))}
            format={(v) => (v > 0 ? "+" : "") + v}
          />
          <RangeSlider
            name="contrast"
            label={t("dither.contrast")}
            min={-100}
            max={100}
            step={1}
            value={preset === "custom" ? contrast : effCfg.contrast}
            onChange={(v) => tweak("contrast", Math.round(v))}
            format={(v) => (v > 0 ? "+" : "") + v}
          />
        </div>

        <div className="de-section">
          <span style={microLabel}>{t("dither.animation")}</span>
          <CustomSelect
            value={animMode}
            options={ANIM_OPTIONS}
            onChange={(v) => setAnimMode(v as DitherAnimation)}
          />
          {animMode !== "none" && (
            <>
              <RangeSlider
                name="speed"
                label={t("dither.speed")}
                min={0.1}
                max={3}
                step={0.1}
                value={animSpeed}
                onChange={(v) => setAnimSpeed(Math.round(v * 10) / 10)}
                format={(v) => v.toFixed(1) + "×"}
              />
              <div style={chipRow}>
                <Seg active={motionArea === "full"} onClick={() => setMotionArea("full")}>
                  {t("dither.motionFull")}
                </Seg>
                <Seg active={motionArea === "image"} onClick={() => setMotionArea("image")}>
                  {t("dither.motionImage")}
                </Seg>
              </div>
            </>
          )}
        </div>

        <div className="de-section">
          <span style={microLabel}>{t("dither.cursor")}</span>
          <CustomSelect
            value={mouseMode}
            options={CURSOR_OPTIONS}
            onChange={(v) => setMouseMode(v as DitherCursorEffect)}
          />
          {mouseMode !== "none" && (
            <>
              <RangeSlider
                name="cursorRange"
                label={t("dither.cursorRange")}
                min={40}
                max={500}
                step={10}
                value={mouseRadius}
                onChange={(v) => setMouseRadius(Math.round(v / 10) * 10)}
                format={(v) => v.toFixed(0) + "px"}
              />
              <RangeSlider
                name="strength"
                label={t("dither.strength")}
                min={0.1}
                max={1}
                step={0.05}
                value={mouseStrength}
                onChange={(v) => setMouseStrength(Math.round(v * 100) / 100)}
                format={(v) => v.toFixed(2)}
              />
            </>
          )}
          <ToggleSwitch
            name="invert"
            label={t("dither.invert")}
            checked={effCfg.invert}
            onChange={(v) => setInvert(v)}
          />
          <RangeSlider
            name="radius"
            label={t("dither.radius")}
            min={0}
            max={64}
            step={1}
            value={radius}
            onChange={(v) => setRadius(Math.round(v))}
            format={(v) => v.toFixed(0) + "px"}
          />
        </div>

        <div className="de-section" style={{ paddingTop: 12 }}>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={copyCode}
              style={{ flex: 1, width: "auto", margin: 0, padding: "8px 10px" }}
            >
              {copyState === "ok" ? "✓ " + t("dither.copiedCode") : copyState === "error" ? "✗ " + t("dither.copyError") : "⎘ " + t("dither.copyCode")}
            </button>
          </div>
          <div style={{ fontSize: 10.5, color: "var(--text-sec)", marginTop: 7, lineHeight: 1.45, opacity: 0.85 }}>
            {t("dither.copyHint")}
          </div>
        </div>
      </div>

      {collapsed && (
        <div className="de-expand" onClick={() => setCollapsed(false)}>
          <span />
        </div>
      )}
    </div>
  );
}