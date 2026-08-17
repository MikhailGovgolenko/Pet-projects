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
    <div
      style={{
        minHeight: "100dvh",
        width: "100%",
        overflow: "hidden",
        position: "relative",
      }}
    >
      <style>{`
        .wave-badge {
          position: absolute;
          left: 50%;
          transform: translateX(-50%);
          top: calc(68px + env(safe-area-inset-top));
          padding: 10px 26px;
          border-radius: 100px;
          font-size: 13.5px;
          font-weight: 700;
          letter-spacing: 0.2px;
          z-index: 10;
          pointer-events: none;
          white-space: nowrap;
          max-width: calc(100vw - 24px);
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .wave-legend {
          position: absolute;
          right: 20px;
          top: 20px;
          padding: 14px 18px;
          z-index: 10;
          font-size: 12.5px;
          font-weight: 500;
        }
        .wave-info {
          right: 20px;
          bottom: 20px;
          width: min(300px, calc(100vw - 40px));
          max-height: 40vh;
          overflow-y: auto;
          overscroll-behavior: contain;
        }
        @media (max-width: 640px) {
          .wave-badge {
            top: calc(64px + env(safe-area-inset-top));
            padding: 8px 18px;
            font-size: 12.5px;
          }
          .wave-legend {
            left: 50%;
            right: auto;
            top: calc(118px + env(safe-area-inset-top));
            transform: translateX(-50%);
            display: flex;
            flex-direction: row;
            align-items: center;
            gap: 12px;
            padding: 8px 14px;
            border-radius: 100px;
          }
          .wave-legend h4 { display: none; }
          .wave-legend .legend-item { margin: 0 !important; }
          .wave-info {
            display: none;
          }
        }
        @media (max-width: 380px) {
          .wave-legend { gap: 10px; padding: 7px 12px; font-size: 11.5px; }
        }
      `}</style>

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
        <WaveScene params={params} toggles={toggles} />
      </div>

      {/* Wave badge — center top */}
      <div className="glass wave-badge">
        {badgeText}
      </div>

      {/* Legend — right top */}
      <div className="glass wave-legend">
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
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            margin: "7px 0",
          }}
        >
          <span
            style={{
              width: 11,
              height: 11,
              borderRadius: "50%",
              background: "#00d4ff",
              boxShadow: "0 0 6px #00d4ff",
              flexShrink: 0,
            }}
          />
          E
        </div>
        <div
          className="legend-item"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            margin: "7px 0",
          }}
        >
          <span
            style={{
              width: 11,
              height: 11,
              borderRadius: "50%",
              background: "#ff3366",
              boxShadow: "0 0 6px #ff3366",
              flexShrink: 0,
            }}
          />
          B
        </div>
        <div
          className="legend-item"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            margin: "7px 0",
          }}
        >
          <span
            style={{
              width: 11,
              height: 11,
              borderRadius: "50%",
              background: "#ffd700",
              boxShadow: "0 0 6px #ffd700",
              flexShrink: 0,
            }}
          />
          k
        </div>
        <div
          className="legend-item"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            margin: "7px 0",
          }}
        >
          <span
            style={{
              width: 11,
              height: 11,
              borderRadius: "50%",
              background: "#00ff88",
              boxShadow: "0 0 6px #00ff88",
              flexShrink: 0,
            }}
          />
          Огибающая
        </div>
      </div>

      {/* Info panel — right bottom */}
      <div
        className="glass wave-info"
        style={{
          position: "absolute",
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
        {info &&
          info.formulas.map(function (f, i) {
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
            {typeof info.desc === "function"
              ? info.desc(params.angle)
              : info.desc}
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
