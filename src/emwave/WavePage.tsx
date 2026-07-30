import { useState } from "react";
import GlassPanel from "../components/GlassPanel";
import WaveScene from "./WaveScene";
import WaveControls from "./WaveControls";
import { badgeNames, presetInfo } from "./wavePresets";

export default function WavePage() {
  const [params, setParams] = useState({
    preset: "linear",
    k: 2.0,
    omega: 3.0,
    amp: 1.0,
    angle: 45,
    beamMode: false,
    beamWidth: 1.5,
  });

  const [toggles, setToggles] = useState({
    showField: true,
    showFront: true,
    showLines: true,
    showWaveArrows: true,
    showK: true,
    showEnvelope: false,
  });

  var info = presetInfo[params.preset];
  var badgeText = badgeNames[params.preset] || "Волна";

  return (
    <div style={{ height: "100%", position: "relative" }}>
      <div id="canvas-container" style={{ position: "fixed", inset: 0, zIndex: 0 }}>
        <WaveScene params={params} toggles={toggles} />
      </div>

      {/* Wave badge — center top */}
      <div
        className="glass"
        style={{
          position: "absolute",
          top: 68,
          left: "50%",
          transform: "translateX(-50%)",
          padding: "10px 26px",
          borderRadius: 100,
          fontSize: 13.5,
          fontWeight: 700,
          letterSpacing: "0.2px",
          zIndex: 10,
          pointerEvents: "none",
          whiteSpace: "nowrap",
        }}
      >
        {badgeText}
      </div>

      {/* Legend — right top */}
      <div
        className="glass"
        style={{
          position: "absolute",
          right: 20,
          top: 20,
          padding: "14px 18px",
          zIndex: 10,
          fontSize: 12.5,
          fontWeight: 500,
        }}
        >
          <h4
            style={{
              margin: "0 0 10px 0",
              fontSize: 14,
              fontWeight: 700,
              opacity: 0.9,
            }}
          >
            Обозначения
          </h4>
          <div
            className="legend-item"
            style={{ display: "flex", alignItems: "center", gap: 10, margin: "7px 0" }}
          >
            <span style={{ width: 11, height: 11, borderRadius: "50%", background: "#00d4ff", boxShadow: "0 0 6px #00d4ff", flexShrink: 0 }} />
            E
        </div>
        <div
          className="legend-item"
          style={{ display: "flex", alignItems: "center", gap: 10, margin: "7px 0" }}
        >
          <span style={{ width: 11, height: 11, borderRadius: "50%", background: "#ff3366", boxShadow: "0 0 6px #ff3366", flexShrink: 0 }} />
          B
        </div>
        <div
          className="legend-item"
          style={{ display: "flex", alignItems: "center", gap: 10, margin: "7px 0" }}
        >
          <span style={{ width: 11, height: 11, borderRadius: "50%", background: "#ffd700", boxShadow: "0 0 6px #ffd700", flexShrink: 0 }} />
          k
        </div>
        <div
          className="legend-item"
          style={{ display: "flex", alignItems: "center", gap: 10, margin: "7px 0" }}
        >
          <span style={{ width: 11, height: 11, borderRadius: "50%", background: "#00ff88", boxShadow: "0 0 6px #00ff88", flexShrink: 0 }} />
          Envelope
        </div>
      </div>

      {/* Info panel — right bottom */}
      <div
        className="glass"
        style={{
          position: "absolute",
          right: 20,
          bottom: 20,
          width: 300,
          padding: 16,
          zIndex: 10,
          fontSize: 12.5,
          lineHeight: 1.5,
        }}
      >
        <h4
          style={{
            margin: "0 0 8px 0",
            fontSize: 11,
            color: "var(--accent)",
            textTransform: "uppercase",
            letterSpacing: "0.8px",
            fontWeight: 700,
          }}
        >
          Физика
        </h4>
        {info && info.formulas.map(function (f, i) {
          return (
            <div
              key={i}
              className="formula"
              style={{
                fontFamily: '"Times New Roman", Times, serif',
                fontStyle: "italic",
                fontSize: 14,
                margin: "6px 0",
                opacity: 0.95,
              }}
            >
              {f}
            </div>
          );
        })}
        {info && (
          <div
            className="desc"
            style={{
              color: "var(--text-sec)",
              marginTop: 6,
              fontSize: 12,
              lineHeight: 1.4,
            }}
          >
            {typeof info.desc === "function" ? info.desc(params.angle) : info.desc}
          </div>
        )}
      </div>

      <GlassPanel title="EM Wave">
        <WaveControls
          params={params}
          setParams={setParams}
          toggles={toggles}
          setToggles={setToggles}
        />
      </GlassPanel>
    </div>
  );
}
