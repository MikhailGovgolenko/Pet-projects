import { useMemo, useRef, useState, type CSSProperties, type ChangeEvent } from "react";
import GlassPanel from "../components/GlassPanel";
import RangeSlider from "../components/RangeSlider";
import ToggleSwitch from "../components/ToggleSwitch";
import DitherEngine, {
  DITHER_PRESETS,
  DITHER_ALGORITHMS,
  DITHER_SHAPES,
  DITHER_ANIMATIONS,
  DITHER_CURSOR_EFFECTS,
  DITHER_PALETTES,
  DEFAULT_DITHER_CONFIG,
  type DitherConfig,
  type DitherAlgorithm,
  type DitherShape,
  type DitherAnimation,
  type DitherCursorEffect,
} from "./DitherEngine";
import { FRAMER_COMPONENT_URL, DITHER_TSX_SOURCE } from "./framer";
import { useI18n } from "../i18n";

const selectStyle: CSSProperties = {
  width: "100%",
  background: "var(--select-bg)",
  border: "1px solid var(--glass-border)",
  borderRadius: 10,
  padding: "5px 8px",
  color: "inherit",
  fontSize: 11.5,
  fontWeight: 500,
  outline: "none",
  cursor: "pointer",
};

const groupLabel: CSSProperties = {
  display: "block",
  fontSize: 11.5,
  fontWeight: 500,
  color: "var(--text-sec)",
  marginBottom: 5,
};

const presetChip: CSSProperties = {
  width: "auto",
  margin: "0 4px 4px 0",
  padding: "5px 9px",
  borderRadius: 100,
  border: "1px solid var(--glass-border)",
  background: "var(--input-bg)",
  color: "inherit",
  fontSize: 10.5,
  fontWeight: 700,
  letterSpacing: "0.1px",
  cursor: "pointer",
  transition: "color 0.2s, border-color 0.2s, background 0.2s",
};

export default function DitherPage() {
  const { t } = useI18n();
  const [cfg, setCfg] = useState<DitherConfig>({ ...DEFAULT_DITHER_CONFIG });
  const [sourceUrl, setSourceUrl] = useState<string | undefined>(undefined);
  const [sourceIsVideo, setSourceIsVideo] = useState(false);
  const [copyState, setCopyState] = useState<"idle" | "link" | "tsx" | "error">("idle");
  const fileRef = useRef<HTMLInputElement>(null);

  const set = <K extends keyof DitherConfig>(key: K, value: DitherConfig[K]) =>
    setCfg((c) => ({ ...c, [key]: value }));

  const applyPreset = (key: string) => {
    const p = DITHER_PRESETS[key];
    if (p) setCfg((c) => ({ ...c, ...p.config }));
  };

  const copyFramer = async () => {
    try {
      await navigator.clipboard.writeText(FRAMER_COMPONENT_URL);
      setCopyState("link");
    } catch {
      try {
        await navigator.clipboard.writeText(DITHER_TSX_SOURCE);
        setCopyState("tsx");
      } catch {
        setCopyState("error");
      }
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

  const algoOptions = useMemo(
    () => Object.entries(DITHER_ALGORITHMS) as [DitherAlgorithm, string][],
    []
  );
  const shapeOptions = useMemo(
    () => Object.entries(DITHER_SHAPES) as [DitherShape, string][],
    []
  );
  const animOptions = useMemo(
    () => Object.entries(DITHER_ANIMATIONS) as [DitherAnimation, string][],
    []
  );
  const cursorOptions = useMemo(
    () => Object.entries(DITHER_CURSOR_EFFECTS) as [DitherCursorEffect, string][],
    []
  );

  return (
    <div
      style={{
        minHeight: "100dvh",
        width: "100%",
        overflow: "hidden",
        position: "relative",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          zIndex: 0,
        }}
      >
        <DitherEngine config={cfg} sourceUrl={sourceUrl} sourceIsVideo={sourceIsVideo} interactive />
      </div>

      <GlassPanel title={t("dither.panel")}>
        <div className="section">
          <span style={groupLabel}>{t("dither.preset")}</span>
          <div style={{ display: "flex", flexWrap: "wrap", margin: "0 -4px" }}>
            {Object.entries(DITHER_PRESETS).map(([key, p]) => (
              <button
                key={key}
                style={{
                  ...presetChip,
                  borderColor:
                    cfg.algorithm === p.config.algorithm &&
                    cfg.shape === p.config.shape &&
                    cfg.fg === p.config.fg
                      ? "var(--accent)"
                      : "var(--glass-border)",
                  color:
                    cfg.algorithm === p.config.algorithm &&
                    cfg.shape === p.config.shape &&
                    cfg.fg === p.config.fg
                      ? "var(--accent)"
                      : "inherit",
                }}
                onClick={() => applyPreset(key)}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div className="section">
          <label style={{ display: "block", margin: "6px 0" }}>
            <span style={groupLabel}>{t("dither.algorithm")}</span>
            <select
              value={cfg.algorithm}
              onChange={(e) => set("algorithm", e.target.value as DitherAlgorithm)}
              style={selectStyle}
            >
              {algoOptions.map(([k, label]) => (
                <option key={k} value={k}>{label}</option>
              ))}
            </select>
          </label>

          <label style={{ display: "block", margin: "6px 0" }}>
            <span style={groupLabel}>{t("dither.shape")}</span>
            <select
              value={cfg.shape}
              onChange={(e) => set("shape", e.target.value as DitherShape)}
              style={selectStyle}
            >
              {shapeOptions.map(([k, label]) => (
                <option key={k} value={k}>{label}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="section">
          <span style={groupLabel}>{t("dither.colors")}</span>
          <div style={{ display: "flex", gap: 10, marginBottom: 6 }}>
            <label style={{ flex: 1, display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, fontWeight: 500 }}>
              <input
                type="color"
                value={cfg.fg}
                onChange={(e) => set("fg", e.target.value)}
                style={{ width: 34, height: 26, border: "none", background: "none", padding: 0, cursor: "pointer" }}
              />
              <span style={{ color: "var(--text-sec)" }}>{t("dither.fg")}</span>
            </label>
            <label style={{ flex: 1, display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, fontWeight: 500 }}>
              <input
                type="color"
                value={cfg.bg}
                onChange={(e) => set("bg", e.target.value)}
                style={{ width: 34, height: 26, border: "none", background: "none", padding: 0, cursor: "pointer" }}
              />
              <span style={{ color: "var(--text-sec)" }}>{t("dither.bg")}</span>
            </label>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {DITHER_PALETTES.map((p) => (
              <button
                key={p.name}
                title={p.name}
                aria-label={p.name}
                onClick={() => setCfg((c) => ({ ...c, fg: p.fg, bg: p.bg }))}
                style={{
                  width: 40,
                  height: 24,
                  margin: 0,
                  padding: 0,
                  borderRadius: 8,
                  border: "1px solid var(--glass-border)",
                  background: `linear-gradient(90deg, ${p.fg} 50%, ${p.bg} 50%)`,
                  cursor: "pointer",
                }}
              />
            ))}
          </div>
        </div>

        <div className="section">
          <RangeSlider
            name="pixel"
            label={t("dither.pixel")}
            min={1}
            max={14}
            step={0.5}
            value={cfg.pixel}
            onChange={(v) => set("pixel", v)}
            format={(v) => v.toFixed(1).replace(/\.0$/, "") + "px"}
          />
          <RangeSlider
            name="levels"
            label={t("dither.levels")}
            min={2}
            max={8}
            step={1}
            value={cfg.levels}
            onChange={(v) => set("levels", Math.round(v))}
            format={(v) => String(Math.round(v))}
          />
          <RangeSlider
            name="contrast"
            label={t("dither.contrast")}
            min={-100}
            max={100}
            step={1}
            value={cfg.contrast}
            onChange={(v) => set("contrast", v)}
            format={(v) => (v > 0 ? "+" : "") + v}
          />
          {cfg.shape === "dot" && (
            <RangeSlider
              name="spacing"
              label={t("dither.spacing")}
              min={0.3}
              max={1.2}
              step={0.02}
              value={cfg.spacing}
              onChange={(v) => set("spacing", v)}
              format={(v) => v.toFixed(2)}
            />
          )}
          <ToggleSwitch
            name="invert"
            label={t("dither.invert")}
            checked={cfg.invert}
            onChange={(v) => set("invert", v)}
          />
        </div>

        <div className="section">
          <label style={{ display: "block", margin: "6px 0" }}>
            <span style={groupLabel}>{t("dither.animation")}</span>
            <select
              value={cfg.animation}
              onChange={(e) => set("animation", e.target.value as DitherAnimation)}
              style={selectStyle}
            >
              {animOptions.map(([k, label]) => (
                <option key={k} value={k}>{label}</option>
              ))}
            </select>
          </label>

          <label style={{ display: "block", margin: "6px 0" }}>
            <span style={groupLabel}>{t("dither.cursor")}</span>
            <select
              value={cfg.cursorEffect}
              onChange={(e) => set("cursorEffect", e.target.value as DitherCursorEffect)}
              style={selectStyle}
            >
              {cursorOptions.map(([k, label]) => (
                <option key={k} value={k}>{label}</option>
              ))}
            </select>
          </label>

          <ToggleSwitch
            name="animate"
            label={t("dither.animate")}
            checked={cfg.animate}
            onChange={(v) => set("animate", v)}
          />
        </div>

        <div className="section">
          <input
            ref={fileRef}
            type="file"
            accept="image/*,video/mp4,video/webm,video/quicktime"
            style={{ display: "none" }}
            onChange={onFile}
          />
          <button
            onClick={() => fileRef.current?.click()}
            style={{ width: "auto", marginRight: 8, padding: "7px 14px" }}
          >
            {t("dither.upload")}
          </button>
          <button onClick={copyFramer} style={{ width: "auto", padding: "7px 14px" }}>
            {copyState === "link"
              ? "✓ " + t("dither.copiedLink")
              : copyState === "tsx"
              ? "✓ " + t("dither.copiedTsx")
              : copyState === "error"
              ? "✗ " + t("dither.copyError")
              : t("dither.copyFramer")}
          </button>
          <div style={{ fontSize: 10.5, color: "var(--text-sec)", marginTop: 6, lineHeight: 1.45 }}>
            {t("dither.copyHint")}
          </div>
        </div>
      </GlassPanel>
    </div>
  );
}