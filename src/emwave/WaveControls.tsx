import ToggleSwitch from "../components/ToggleSwitch";
import RangeSlider from "../components/RangeSlider";
import CustomSelect from "../components/CustomSelect";
import { useI18n, type TranslationKey } from "../i18n";

const presetKeys: { value: string; key: TranslationKey }[] = [
  { value: "linear", key: "emwave.preset.linear" },
  { value: "circularR", key: "emwave.preset.circularR" },
  { value: "circularL", key: "emwave.preset.circularL" },
  { value: "elliptic", key: "emwave.preset.elliptic" },
  { value: "standing", key: "emwave.preset.standing" },
  { value: "interference", key: "emwave.preset.interference" },
  { value: "spherical", key: "emwave.preset.spherical" },
  { value: "plane_spherical", key: "emwave.preset.planeSpherical" },
  { value: "reflection", key: "emwave.preset.reflection" },
];

export default function WaveControls({ params, setParams, toggles, setToggles }) {
  const { t } = useI18n();
  const presets = presetKeys.map(function (p) {
    return { value: p.value, label: t(p.key) };
  });

  return (
    <>
      <div className="section">
        <label
          style={{
            display: "block",
            marginBottom: 4,
            fontSize: 12,
            fontWeight: 500,
          }}
        >
          <span
            style={{
              display: "block",
              marginBottom: 4,
              color: "var(--text-sec)",
              whiteSpace: "nowrap",
            }}
          >
            {t("emwave.preset")}
          </span>
          <CustomSelect
            value={params.preset}
            options={presets}
            onChange={(v) => setParams((p) => ({ ...p, preset: v }))}
          />
        </label>
      </div>

      <div className="section">
        <RangeSlider
          label="k"
          min={0.5} max={5} step={0.1} value={params.k}
          onChange={(v) => setParams((p) => ({ ...p, k: v }))}
          format={(v) => v.toFixed(1)}
        />
        <RangeSlider
          label="ω"
          min={0.5} max={8} step={0.1} value={params.omega}
          onChange={(v) => setParams((p) => ({ ...p, omega: v }))}
          format={(v) => v.toFixed(1)}
        />
        <RangeSlider
          label={t("emwave.amp")}
          min={0.2} max={3} step={0.1} value={params.amp}
          onChange={(v) => setParams((p) => ({ ...p, amp: v }))}
          format={(v) => v.toFixed(1)}
        />
        {params.preset === "reflection" && (
          <RangeSlider
            label={t("emwave.angle")}
            min={5} max={85} step={1} value={params.angle}
            onChange={(v) => setParams((p) => ({ ...p, angle: v }))}
            format={(v) => v.toFixed(0) + "°"}
          />
        )}
      </div>

      <div className="section">
        <ToggleSwitch
          label={t("emwave.beam")}
          checked={params.beamMode}
          onChange={(v) => setParams((p) => ({ ...p, beamMode: v }))}
        />
        {params.beamMode && (
          <RangeSlider
            label={t("emwave.beamWidth")}
            min={0.6} max={5} step={0.1} value={params.beamWidth}
            onChange={(v) => setParams((p) => ({ ...p, beamWidth: v }))}
            format={(v) => v.toFixed(1)}
          />
        )}
        <ToggleSwitch
          label={t("emwave.field")}
          checked={toggles.showField}
          onChange={(v) => setToggles((t) => ({ ...t, showField: v }))}
        />
        <ToggleSwitch
          label={t("emwave.front")}
          checked={toggles.showFront}
          onChange={(v) => setToggles((t) => ({ ...t, showFront: v }))}
        />
        <ToggleSwitch
          label={t("emwave.lines")}
          checked={toggles.showLines}
          onChange={(v) => setToggles((t) => ({ ...t, showLines: v }))}
        />
        <ToggleSwitch
          label={t("emwave.arrows")}
          checked={toggles.showWaveArrows}
          onChange={(v) => setToggles((t) => ({ ...t, showWaveArrows: v }))}
        />
        <ToggleSwitch
          label={t("emwave.k")}
          checked={toggles.showK}
          onChange={(v) => setToggles((t) => ({ ...t, showK: v }))}
        />
        <ToggleSwitch
          label={t("emwave.envelope")}
          checked={toggles.showEnvelope}
          onChange={(v) => setToggles((t) => ({ ...t, showEnvelope: v }))}
        />
      </div>
    </>
  );
}
