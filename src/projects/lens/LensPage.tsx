import { useState, useRef, useCallback, useMemo, Component, type ReactNode } from "react";
import GlassPanel from "./GlassPanel";
import ToggleSwitch from "./ToggleSwitch";
import LensControls from "./LensControls";
import Lens2D from "./Lens2D";
import Lens2DSvg from "./Lens2DSvg";
import Lens3D from "./Lens3D";
import { useLensSafariScroll } from "./useLensSafariScroll";
import { compile, substituteCoeffs } from "./expr";
import { useI18n, type TranslationKey } from "../../core/i18n";

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
  const scroll = useLensSafariScroll();
  const [mode3d, setMode3d] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const scaleRef = useRef(null);

  const [params, setParams] = useState({
    n: 1.5,
    angle: 0,
    rayCount: 41,
    z0: -0.25,
    a2: 5.084377517e-2,
    a4: -2.995721263e-4,
    a6: 2.117804002e-6,
    useField: true,
    useReflections: false,
    customEq: "-0.25+5.084377517e-02*r^2-2.995721263e-04*r^4+2.117804002e-06*r^6+1.510418374e-08*r^8-1.230188343e-09*r^10+3.006394090e-11*r^12-1.485492474e-13*r^14-2.027671851e-14*r^16+8.961515411e-16*r^18-1.118122378e-17*r^20-6.858274636e-19*r^22+4.138766553e-20*r^24-5.573760978e-22*r^26-4.462213858e-23*r^28+2.549223328e-24*r^30-8.936749756e-27*r^32-4.518738263e-27*r^34+1.585886700e-28*r^36+4.929142510e-30*r^38-4.836420490e-31*r^40-1.190930725e-34*r^42+1.217501736e-33*r^44-2.191268853e-35*r^46-3.154311782e-36*r^48+1.079202632e-37*r^50",
  });

  const paramsWithEq = useMemo(() => {
    var eq = buildEq(params);
    return { ...params, eq, eqR: "(0-(" + eq + "))" };
  }, [params]);

  const resetView = useCallback(() => {
    setResetKey((k) => k + 1);
  }, []);

  const frameHeight = scroll.enabled ? scroll.frameHeight : undefined;

  const frame = (
    <div
      className="lens-frame"
      style={{
        position: "relative",
        width: "100%",
        height: frameHeight ?? "100dvh",
        minHeight: frameHeight ? undefined : "100dvh",
        overflow: scroll.enabled ? "visible" : "hidden",
        overscrollBehavior: "none",
        touchAction: "none",
      }}
    >
      <div
        id="canvas-container"
        style={
          scroll.enabled
            ? { position: "absolute", left: 0, right: 0, top: -scroll.pad, bottom: -scroll.pad }
            : undefined
        }
      >
        <ViewBoundary key={mode3d ? "3d" : "2d"} t={t}>
          {!mode3d ? (
            scroll.enabled ? (
              <Lens2DSvg params={paramsWithEq} resetKey={resetKey} scaleRef={scaleRef} />
            ) : (
              <Lens2D params={paramsWithEq} resetKey={resetKey} scaleRef={scaleRef} />
            )
          ) : (
            <Lens3D key={resetKey} params={paramsWithEq} scaleRef={scaleRef} />
          )}
        </ViewBoundary>
      </div>

      <GlassPanel title={t("lens.panel")}>
        <div className="section">
          <ToggleSwitch name="mode3d" label={t("lens.mode3d")} checked={mode3d} onChange={setMode3d} />
        </div>
        <LensControls params={params} setParams={setParams} />
        <div className="section">
          <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between", margin: "4px 0", fontSize: 12, fontWeight: 500 }}>
            <span style={{ color: "var(--text-sec)" }}>{t("lens.scale")}</span>
            <span ref={scaleRef} style={{ color: "var(--accent)", fontFamily: '"SF Mono", monospace', fontSize: 10.5, fontWeight: 700 }}>
              7.00
            </span>
          </label>
          <a
            href="/lens/notes"
            style={{ display: "block", margin: "0 0 8px", color: "var(--accent)", fontSize: 12, textDecoration: "none" }}
          >
            {t("lens.computeLens")}
          </a>
          <button onClick={resetView}>{t("lens.resetView")}</button>
        </div>
      </GlassPanel>
    </div>
  );

  return (
    <>
      <style>{`
        #canvas-container {
          position: absolute;
          inset: 0;
        }
      `}</style>

      {scroll.enabled ? (
        <div
          className="lens-scroll-band"
          style={{ height: scroll.bandHeight }}
        >
          <div aria-hidden="true" style={{ height: scroll.pad }} />
          {frame}
          <div aria-hidden="true" style={{ height: scroll.pad }} />
        </div>
      ) : (
        <div style={{ position: "relative", minHeight: "100dvh", background: "var(--bg)" }}>{frame}</div>
      )}
    </>
  );
}
