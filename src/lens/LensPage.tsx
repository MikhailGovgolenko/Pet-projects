import { useState, useRef, useCallback, useMemo, useEffect } from "react";
import GlassPanel from "../components/GlassPanel";
import ToggleSwitch from "../components/ToggleSwitch";
import LensControls from "./LensControls";
import Lens2D from "./Lens2D";
import Lens3D from "./Lens3D";

function buildEq(params) {
  if (params.useField && params.customEq.trim()) {
    return params.customEq.trim();
  }
  return `${params.z0}+(${params.a2})*r*r+(${params.a4})*r**4+(${params.a6})*r**6`;
}

export default function LensPage() {
  const [mode3d, setMode3d] = useState(false);
  const [scale, setScale] = useState(7);
  const [resetKey, setResetKey] = useState(0);
  const lensCache = useRef({ key: "" });

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
  });

  const paramsWithEq = useMemo(() => {
    var eq = buildEq(params);
    return { ...params, eq, eqR: "(0-(" + eq + "))" };
  }, [params]);

  const resetView = useCallback(() => {
    setScale(7);
    setResetKey((k) => k + 1);
  }, []);

  return (
    <div
      style={{
        height: "100%",
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
        {!mode3d ? (
          <Lens2D
            params={paramsWithEq}
            lensCache={lensCache}
            onScaleChange={setScale}
            scale={scale}
          />
        ) : (
          <Lens3D key={resetKey} params={paramsWithEq} />
        )}
      </div>

      <GlassPanel title="Линза">
        <div className="section">
          <ToggleSwitch label="3D-вид" checked={mode3d} onChange={setMode3d} />
        </div>
        <LensControls
          params={params}
          setParams={setParams}
          resetView={resetView}
          scale={scale}
        />
      </GlassPanel>
    </div>
  );
}
