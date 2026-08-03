import { memo } from "react";
import RangeSlider from "../components/RangeSlider";
import ToggleSwitch from "../components/ToggleSwitch";
import { useI18n } from "../i18n";

function LensControls({ params, setParams }) {
  const { t } = useI18n();
  const formatVal = (n, v) => {
    if (n === "a2") return parseFloat(v).toFixed(3);
    if (n === "a4" || n === "a6") return parseFloat(v).toExponential(1);
    return parseFloat(v).toFixed(1).replace(/\.0$/, "");
  };

  const set = (key) => (val) => {
    setParams((p) => ({ ...p, [key]: val }));
  };

  const toggleUseField = (v) => {
    setParams((p) => ({ ...p, useField: v }));
  };

  const setEq = (v) => {
    setParams((p) => ({ ...p, customEq: v }));
  };

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
          onChange={set("n")}
        />
        <RangeSlider
          name="angle"
          label={t("lens.beamAngle")}
          min={-90} max={90} step={0.1} value={params.angle}
          onChange={set("angle")}
        />
        <RangeSlider
          name="rayCount"
          label={t("lens.rayCount")}
          min={3} max={201} step={1} value={params.rayCount}
          onChange={set("rayCount")}
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
              onChange={set("z0")}
              format={(v) => formatVal("z0", v)}
            />
            <RangeSlider
              name="a2"
              label="a₂"
              min={-0.1} max={0.1} step={1e-5} value={params.a2}
              onChange={set("a2")}
              format={(v) => formatVal("a2", v)}
            />
            <RangeSlider
              name="a4"
              label="a₄"
              min={-0.001} max={0.001} step={1e-7} value={params.a4}
              onChange={set("a4")}
              format={(v) => formatVal("a4", v)}
            />
            <RangeSlider
              name="a6"
              label="a₆"
              min={-1e-5} max={1e-5} step={1e-10} value={params.a6}
              onChange={set("a6")}
              format={(v) => formatVal("a6", v)}
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
              placeholder="-5 + 0.006457*r**2-5e-7*r**4"
              style={{
                background: "var(--input-bg)",
                border: "1px solid var(--glass-border)",
                borderRadius: 10,
                padding: "4px 5px",
                color: "inherit",
                fontSize: 11.5,
                outline: "none",
                width: "100%",
                fontFamily: "inherit",
              }}
            />
          </label>
        </div>
      )}
    </>
  );
}

export default memo(LensControls);
