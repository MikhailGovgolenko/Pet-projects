import { useMemo, useRef, useState, type CSSProperties, type ChangeEvent } from "react";
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
import { DITHER_TSX_SOURCE } from "./code";
import { useI18n } from "../i18n";

const selectStyle: CSSProperties = {
  width: "100%",
  background: "var(--select-bg)",
  border: "1px solid var(--glass-border)",
  borderRadius: 9,
  padding: "6px 9px",
  color: "inherit",
  fontSize: 11.5,
  fontWeight: 600,
  outline: "none",
  cursor: "pointer",
  appearance: "none",
};

const selectWrapStyle: CSSProperties = {
  position: "relative",
  display: "block",
};

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

export default function DitherPage() {
  const { t } = useI18n();
  const [cfg, setCfg] = useState<DitherConfig>({ ...DEFAULT_DITHER_CONFIG });
  const [sourceUrl, setSourceUrl] = useState<string | undefined>(undefined);
  const [sourceIsVideo, setSourceIsVideo] = useState(false);
  const [copyState, setCopyState] = useState<"idle" | "ok" | "error">("idle");
  const [collapsed, setCollapsed] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const set = <K extends keyof DitherConfig>(key: K, value: DitherConfig[K]) =>
    setCfg((c) => ({ ...c, [key]: value }));

  const applyPreset = (key: string) => {
    const p = DITHER_PRESETS[key];
    if (p) setCfg((c) => ({ ...c, ...p.config }));
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

  const sameAsPreset = (key: string) => {
    const p = DITHER_PRESETS[key]?.config;
    if (!p) return false;
    return (
      cfg.algorithm === p.algorithm &&
      cfg.shape === p.shape &&
      cfg.fg === p.fg &&
      cfg.bg === p.bg &&
      cfg.pixel === p.pixel &&
      cfg.levels === p.levels &&
      cfg.contrast === p.contrast &&
      cfg.invert === p.invert
    );
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
        .de-select-arrow {
          position: absolute;
          right: 10px;
          top: 50%;
          width: 6px;
          height: 6px;
          border-right: 1.5px solid var(--text-sec);
          border-bottom: 1.5px solid var(--text-sec);
          transform: translateY(-70%) rotate(45deg);
          pointer-events: none;
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
        <DitherEngine config={cfg} sourceUrl={sourceUrl} sourceIsVideo={sourceIsVideo} interactive />
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
            {Object.entries(DITHER_PRESETS).map(([key, p]) => (
              <Chip key={key} active={sameAsPreset(key)} onClick={() => applyPreset(key)}>
                {p.label}
              </Chip>
            ))}
          </div>
        </div>

        <div className="de-section">
          <span style={microLabel}>{t("dither.algorithm")}</span>
          <label style={selectWrapStyle}>
            <select
              value={cfg.algorithm}
              onChange={(e) => set("algorithm", e.target.value as DitherAlgorithm)}
              style={selectStyle}
            >
              {algoOptions.map(([k, label]) => (
                <option key={k} value={k}>{label}</option>
              ))}
            </select>
            <span className="de-select-arrow" />
          </label>

          <span style={{ ...microLabel, marginTop: 10 }}>{t("dither.shape")}</span>
          <label style={selectWrapStyle}>
            <select
              value={cfg.shape}
              onChange={(e) => set("shape", e.target.value as DitherShape)}
              style={selectStyle}
            >
              {shapeOptions.map(([k, label]) => (
                <option key={k} value={k}>{label}</option>
              ))}
            </select>
            <span className="de-select-arrow" />
          </label>
        </div>

        <div className="de-section">
          <span style={microLabel}>{t("dither.colors")}</span>
          <div style={{ display: "flex", gap: 10, marginBottom: 8 }}>
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
                value={cfg.fg}
                onChange={(e) => set("fg", e.target.value)}
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
                value={cfg.bg}
                onChange={(e) => set("bg", e.target.value)}
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
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {DITHER_PALETTES.map((p) => (
              <button
                key={p.name}
                title={p.name}
                aria-label={p.name}
                onClick={() => setCfg((c) => ({ ...c, fg: p.fg, bg: p.bg }))}
                style={{
                  width: 38,
                  height: 22,
                  margin: 0,
                  padding: 0,
                  borderRadius: 7,
                  border:
                    cfg.fg === p.fg && cfg.bg === p.bg
                      ? "1px solid var(--accent)"
                      : "1px solid var(--glass-border)",
                  background: `linear-gradient(90deg, ${p.fg} 50%, ${p.bg} 50%)`,
                  cursor: "pointer",
                }}
              />
            ))}
          </div>
        </div>

        <div className="de-section">
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

        <div className="de-section">
          <span style={microLabel}>{t("dither.animation")}</span>
          <label style={selectWrapStyle}>
            <select
              value={cfg.animation}
              onChange={(e) => set("animation", e.target.value as DitherAnimation)}
              style={selectStyle}
            >
              {animOptions.map(([k, label]) => (
                <option key={k} value={k}>{label}</option>
              ))}
            </select>
            <span className="de-select-arrow" />
          </label>

          <span style={{ ...microLabel, marginTop: 10 }}>{t("dither.cursor")}</span>
          <label style={selectWrapStyle}>
            <select
              value={cfg.cursorEffect}
              onChange={(e) => set("cursorEffect", e.target.value as DitherCursorEffect)}
              style={selectStyle}
            >
              {cursorOptions.map(([k, label]) => (
                <option key={k} value={k}>{label}</option>
              ))}
            </select>
            <span className="de-select-arrow" />
          </label>

          <ToggleSwitch
            name="animate"
            label={t("dither.animate")}
            checked={cfg.animate}
            onChange={(v) => set("animate", v)}
          />
        </div>

        <div className="de-section">
          <span style={microLabel}>{t("dither.fit")}</span>
          <RangeSlider
            name="zoom"
            label={t("dither.zoom")}
            min={0.5}
            max={3}
            step={0.01}
            value={cfg.zoom}
            onChange={(v) => set("zoom", v)}
            format={(v) => v.toFixed(2) + "×"}
          />
          <RangeSlider
            name="offsetX"
            label={t("dither.offsetX")}
            min={-1}
            max={1}
            step={0.01}
            value={cfg.offsetX}
            onChange={(v) => set("offsetX", v)}
            format={(v) => v.toFixed(2)}
          />
          <RangeSlider
            name="offsetY"
            label={t("dither.offsetY")}
            min={-1}
            max={1}
            step={0.01}
            value={cfg.offsetY}
            onChange={(v) => set("offsetY", v)}
            format={(v) => v.toFixed(2)}
          />
        </div>

        <div className="de-section" style={{ paddingTop: 12 }}>
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