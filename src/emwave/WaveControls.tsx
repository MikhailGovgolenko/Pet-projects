import ToggleSwitch from "../components/ToggleSwitch";
import RangeSlider from "../components/RangeSlider";
import CustomSelect from "../components/CustomSelect";

const presets = [
  { value: "linear", label: "Линейная поляризация" },
  { value: "circularR", label: "Круговая поляризация (R)" },
  { value: "circularL", label: "Круговая поляризация (L)" },
  { value: "elliptic", label: "Эллиптическая поляризация" },
  { value: "standing", label: "Стоячая волна" },
  { value: "interference", label: "2D Интерференция" },
  { value: "spherical", label: "Сферическая волна" },
  { value: "plane_spherical", label: "Плоская+Сферическая" },
  { value: "reflection", label: "Отражение от плоскости" },
];

export default function WaveControls({ params, setParams, toggles, setToggles }) {
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
            Пресет
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
          label="Амплитуда"
          min={0.2} max={3} step={0.1} value={params.amp}
          onChange={(v) => setParams((p) => ({ ...p, amp: v }))}
          format={(v) => v.toFixed(1)}
        />
        {params.preset === "reflection" && (
          <RangeSlider
            label="Угол падения"
            min={5} max={85} step={1} value={params.angle}
            onChange={(v) => setParams((p) => ({ ...p, angle: v }))}
            format={(v) => v.toFixed(0) + "°"}
          />
        )}
      </div>

      <div className="section">
        <ToggleSwitch
          label="Гауссов пучок"
          checked={params.beamMode}
          onChange={(v) => setParams((p) => ({ ...p, beamMode: v }))}
        />
        {params.beamMode && (
          <RangeSlider
            label="Ширина пучка"
            min={0.6} max={5} step={0.1} value={params.beamWidth}
            onChange={(v) => setParams((p) => ({ ...p, beamWidth: v }))}
            format={(v) => v.toFixed(1)}
          />
        )}
        <ToggleSwitch
          label="Векторное поле"
          checked={toggles.showField}
          onChange={(v) => setToggles((t) => ({ ...t, showField: v }))}
        />
        <ToggleSwitch
          label="Волновой фронт"
          checked={toggles.showFront}
          onChange={(v) => setToggles((t) => ({ ...t, showFront: v }))}
        />
        <ToggleSwitch
          label="Линии E/B"
          checked={toggles.showLines}
          onChange={(v) => setToggles((t) => ({ ...t, showLines: v }))}
        />
        <ToggleSwitch
          label="Стрелки волны"
          checked={toggles.showWaveArrows}
          onChange={(v) => setToggles((t) => ({ ...t, showWaveArrows: v }))}
        />
        <ToggleSwitch
          label="k-вектор"
          checked={toggles.showK}
          onChange={(v) => setToggles((t) => ({ ...t, showK: v }))}
        />
        <ToggleSwitch
          label="Огибающая пучка"
          checked={toggles.showEnvelope}
          onChange={(v) => setToggles((t) => ({ ...t, showEnvelope: v }))}
        />
      </div>
    </>
  );
}
