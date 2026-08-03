import { useState, useRef, useCallback, useMemo, Component, type ReactNode } from "react";
import GlassPanel from "../components/GlassPanel";
import ToggleSwitch from "../components/ToggleSwitch";
import LensControls from "./LensControls";
import Lens2D from "./Lens2D";
import Lens3D from "./Lens3D";
import { compile, substituteCoeffs } from "./expr";
import { useI18n, type TranslationKey } from "../i18n";

function defaultEq(params) {
  return `${params.z0}+(${params.a2})*r*r+(${params.a4})*r**4+(${params.a6})*r**6`;
}

function buildEq(params) {
  if (params.useField && params.customEq.trim()) {
    const eq = substituteCoeffs(params.customEq.trim(), params);
    try {
      compile(eq);
      return eq;
    } catch {
      return defaultEq(params);
    }
  }
  return defaultEq(params);
}

class ViewBoundary extends Component<
  { t: (key: TranslationKey) => string; children?: ReactNode },
  { error: unknown }
> {
  state = { error: null as unknown };

  static getDerivedStateFromError(error: unknown) {
    return { error };
  }

  render() {
    if (this.state.error) {
      const msg = this.state.error instanceof Error ? this.state.error.message : String(this.state.error);
      return (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            gap: 12,
            alignItems: "center",
            justifyContent: "center",
            color: "var(--text-sec)",
            fontSize: 13,
            textAlign: "center",
            padding: 16,
          }}
        >
          <div>
            {this.props.t("lens.viewError")}: {msg}
          </div>
          <button onClick={() => this.setState({ error: null })}>{this.props.t("lens.retry")}</button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function LensPage() {
  const { t } = useI18n();
  const [mode3d, setMode3d] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const scaleRef = useRef(null);

  const [params, setParams] = useState({
    n: 1.5,
    angle: 0,
    rayCount: 41,
    z0: -5,
    a2: 0.006457,
    a4: -5e-7,
    a6: 0,
    useField: false,
    customEq: "",
    keepFailed: false,
    useReflections: false, // when true use new math that accounts for reflections
  });

  const paramsWithEq = useMemo(() => {
    var eq = buildEq(params);
    return { ...params, eq, eqR: "(0-(" + eq + "))" };
  }, [params]);

  const resetView = useCallback(() => {
    setResetKey((k) => k + 1);
  }, []);

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
        id="canvas-container"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          zIndex: 0,
        }}
      >
        <ViewBoundary key={mode3d ? "3d" : "2d"} t={t}>
          {!mode3d ? (
            <Lens2D
              params={paramsWithEq}
              resetKey={resetKey}
              scaleRef={scaleRef}
            />
          ) : (
            <Lens3D key={resetKey} params={paramsWithEq} scaleRef={scaleRef} />
          )}
        </ViewBoundary>
      </div>

      <GlassPanel title={t("lens.panel")}>
        <div className="section">
          <ToggleSwitch name="mode3d" label={t("lens.mode3d")} checked={mode3d} onChange={setMode3d} />
        </div>
        <LensControls
          params={params}
          setParams={setParams}
        />
        <div className="section">
          <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between", margin: "4px 0", fontSize: 12, fontWeight: 500 }}>
            <span style={{ color: "var(--text-sec)" }}>{t("lens.scale")}</span>
            <span ref={scaleRef} style={{ color: "var(--accent)", fontFamily: '"SF Mono", monospace', fontSize: 10.5, fontWeight: 700 }}>
              7.00
            </span>
          </label>
          <button onClick={resetView}>{t("lens.resetView")}</button>
        </div>
      </GlassPanel>
    </div>
  );
}
