import { memo, useMemo } from "react";
import RangeSlider from "../components/RangeSlider";
import ToggleSwitch from "../components/ToggleSwitch";
import { compile, substituteCoeffs, type ExprError } from "./expr";
import { useI18n } from "../i18n";

function formatVal(n, v) {
  if (n === "a2") return parseFloat(v).toFixed(3);
  if (n === "a4" || n === "a6") return parseFloat(v).toExponential(1);
  return parseFloat(v).toFixed(1).replace(/\.0$/, "");
}

const fmt = (n) => (v) => formatVal(n, v);
const formatZ0 = fmt("z0");
const formatA2 = fmt("a2");
const formatA4 = fmt("a4");
const formatA6 = fmt("a6");

function LensControls({ params, setParams, drawnCount }) {
  const { t } = useI18n();

  const handlers = useMemo(
    () => ({
      n: (v) => setParams((p) => ({ ...p, n: v })),
      angle: (v) => setParams((p) => ({ ...p, angle: v })),
      rayCount: (v) => setParams((p) => ({ ...p, rayCount: v })),
      z0: (v) => setParams((p) => ({ ...p, z0: v })),
      a2: (v) => setParams((p) => ({ ...p, a2: v })),
      a4: (v) => setParams((p) => ({ ...p, a4: v })),
      a6: (v) => setParams((p) => ({ ...p, a6: v })),
      keepFailed: (v) => setParams((p) => ({ ...p, keepFailed: v })),
    }),
    [setParams]
  );

  const toggleUseField = (v) => {
    setParams((p) => ({ ...p, useField: v }));
  };

  const setEq = (v) => {
    setParams((p) => ({ ...p, customEq: v }));
  };

  const eqError = useMemo<ExprError | null>(() => {
    if (!params.useField || !params.customEq.trim()) return null;
    try {
      compile(substituteCoeffs(params.customEq.trim(), params));
      return null;
    } catch (e) {
      return e as ExprError;
    }
  }, [params.useField, params.customEq, params.z0, params.a2, params.a4, params.a6]);

  return (
    <>
      <div className="section">
        <ToggleSwitch
          name="useField"
          label={t("lens.useField")}
          checked={params.useField}
          onChange={toggleUseField}
        />
      </div>

      <div className="section">
        <RangeSlider
          name="n"
          label={t("lens.refraction")}
          min={1} max={10} step={0.01} value={params.n}
          onChange={handlers.n}
        />
        <RangeSlider
          name="angle"
          label={t("lens.beamAngle")}
          min={-90} max={90} step={0.1} value={params.angle}
          onChange={handlers.angle}
        />
        <RangeSlider
          name="rayCount"
          label={t("lens.rayCount")}
          min={3} max={201} step={1} value={params.rayCount}
          onChange={handlers.rayCount}
        />
        <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between", margin: "4px 0", fontSize: 12, fontWeight: 500 }}>
          <span style={{ color: "var(--text-sec)" }}>{t("lens.drawn")}</span>
          <span style={{ color: "var(--accent)", fontFamily: '"SF Mono", monospace', fontSize: 10.5, fontWeight: 700 }}>
            {drawnCount}
          </span>
        </label>
      </div>

      <div className="section">
        <ToggleSwitch
          name="keepFailed"
          label={t("lens.keepFailed")}
          checked={params.keepFailed}
          onChange={handlers.keepFailed}
        />
      </div>

      {!params.useField && (
        <div className="section">
          <div className="glass-group">
            <span className="group-title">{t("lens.polynomial")}</span>
            <RangeSlider
              name="z0"
              label="z₀"
              min={-20} max={20} step={0.001} value={params.z0}
              onChange={handlers.z0}
              format={formatZ0}
            />
            <RangeSlider
              name="a2"
              label="a₂"
              min={-0.1} max={0.1} step={1e-5} value={params.a2}
              onChange={handlers.a2}
              format={formatA2}
            />
            <RangeSlider
              name="a4"
              label="a₄"
              min={-0.001} max={0.001} step={1e-7} value={params.a4}
              onChange={handlers.a4}
              format={formatA4}
            />
            <RangeSlider
              name="a6"
              label="a₆"
              min={-1e-5} max={1e-5} step={1e-10} value={params.a6}
              onChange={handlers.a6}
              format={formatA6}
            />
          </div>
        </div>
      )}

      {params.useField && (
        <div className="section">
          <label style={{ flexDirection: "column", alignItems: "flex-start", gap: 2, display: "flex" }}>
            <span style={{ fontSize: 12, fontWeight: 500, color: "var(--text-sec)" }}>
              z(r)
            </span>
            <input
              id="customEq"
              name="customEq"
              type="text"
              value={params.customEq}
              onChange={(e) => setEq(e.target.value)}
              placeholder="z0+a2*r^2+a4*r^4, e.g. -5+0.006457*r^2-5e-7*r^4"
              aria-invalid={!!eqError}
              style={{
                background: "var(--input-bg)",
                border: `1px solid ${eqError ? "var(--danger)" : "var(--glass-border)"}`,
                borderRadius: 10,
                padding: "4px 5px",
                color: "inherit",
                fontSize: 11.5,
                outline: "none",
                width: "100%",
                fontFamily: "inherit",
              }}
            />
            {eqError && (
              <span style={{ fontSize: 10.5, color: "var(--danger)", lineHeight: 1.3 }}>
                {t("lens.eqError")}: {eqError.message}
              </span>
            )}
          </label>
        </div>
      )}
    </>
  );
}

export default memo(LensControls);
