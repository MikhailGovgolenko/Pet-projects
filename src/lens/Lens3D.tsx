import { useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import ThemeUpdater from "../components/ThemeUpdater";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { safeEval, sampleLens, deriv, normVec, refract3d, findIntersection } from "./lensMath";

function LensMesh({ eq, eqR, aperture }) {
  const geo = useMemo(() => {
    var nR = 40;
    var pts = [];
    for (var i = 0; i <= nR; i++) {
      var r = (i / nR) * aperture;
      var z = safeEval(eq, r);
      if (!isFinite(z)) continue;
      pts.push(new THREE.Vector2(r, z));
    }
    for (var i = nR; i >= 0; i--) {
      var r = (i / nR) * aperture;
      var z = safeEval(eqR, r);
      if (!isFinite(z)) continue;
      pts.push(new THREE.Vector2(r, z));
    }
    if (pts.length < 4) return null;
    return new THREE.LatheGeometry(pts, 48);
  }, [eq, eqR, aperture]);

  if (!geo) return null;

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} geometry={geo}>
      <meshPhongMaterial
        color={0x4488cc}
        emissive={0x112244}
        emissiveIntensity={0.15}
        transparent
        opacity={0.85}
        side={THREE.DoubleSide}
        shininess={60}
        specular={0x446688}
      />
    </mesh>
  );
}

function Rays({ eq, eqR, aperture, angle, n, rayCount }) {
  var angleRad = angle;

  var group = useMemo(function () {
    var colors = [0xff4444, 0xffb434, 0x44ff66];
    var allSegs = [[], [], []];
    var dir = { z: Math.cos(angleRad), r: Math.sin(angleRad) };
    var perp = { z: -dir.r, r: dir.z };
    var nSide = Math.max(1, Math.round(Math.sqrt(rayCount)));
    var halfSize = aperture * 0.7071;
    var startDist = 35;
    var endDist = 3000;

    function traceAtOffset(rOff) {
      var P = {
        z: -startDist * dir.z + rOff * perp.z,
        r: -startDist * dir.r + rOff * perp.r,
      };
      var D = normVec(dir);
      var h1 = findIntersection(P, D, eq);
      if (!h1) return null;
      var N = normVec({ z: -1, r: deriv(eq, h1.r) });
      if (N.z * D.z + N.r * D.r > 0) N = { z: -N.z, r: -N.r };
      var T1 = refract3d(D, N, 1 / n);
      if (!T1) return null;
      var h2 = findIntersection(
        { z: h1.z + 1e-6 * T1.z, r: h1.r + 1e-6 * T1.r },
        T1, eqR
      );
      if (!h2) return null;
      var N2 = normVec({ z: -1, r: deriv(eqR, h2.r) });
      if (N2.z * T1.z + N2.r * T1.r > 0) N2 = { z: -N2.z, r: -N2.r };
      var T2 = refract3d(T1, N2, n);
      if (!T2) return null;
      var end = { z: h2.z + endDist * T2.z, r: h2.r + endDist * T2.r };
      return { P, h1, h2, end };
    }

    var traceCache = {};
    for (var i = 0; i < nSide; i++) {
      for (var j = 0; j < nSide; j++) {
        var x = (i / Math.max(1, nSide - 1) - 0.5) * 2 * halfSize;
        var y = (j / Math.max(1, nSide - 1) - 0.5) * 2 * halfSize;
        var r = Math.sqrt(x * x + y * y);
        if (r > aperture) continue;
        var ck = r.toFixed(4);
        var ray;
        if (traceCache[ck]) {
          ray = traceCache[ck];
        } else {
          ray = traceAtOffset(r);
          traceCache[ck] = ray;
        }
        if (!ray) continue;
        var theta = Math.atan2(y || 1e-10, x || 1e-10);
        var ct = Math.cos(theta);
        var st = Math.sin(theta);
        var pts = [ray.P, ray.h1, ray.h2, ray.end];
        for (var si = 0; si < 3; si++) {
          var p0 = pts[si];
          var p1 = pts[si + 1];
          allSegs[si].push(
            p0.r * ct, p0.r * st, p0.z,
            p1.r * ct, p1.r * st, p1.z
          );
        }
      }
    }

    var g = new THREE.Group();
    for (var si = 0; si < 3; si++) {
      if (allSegs[si].length === 0) continue;
      var geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.Float32BufferAttribute(allSegs[si], 3));
      var mat = new THREE.LineBasicMaterial({
        color: colors[si],
        transparent: true,
        opacity: 0.4,
      });
      g.add(new THREE.LineSegments(geo, mat));
    }
    return g;
  }, [eq, eqR, aperture, angleRad, n, rayCount]);

  return <primitive object={group} />;
}

function Scene({ eq, eqR, aperture, angle, n, rayCount }) {
  return (
    <>
      <ambientLight intensity={1.0} color={0x404060} />
      <directionalLight position={[15, 30, 15]} intensity={1.5} color={0xffffff} />
      <directionalLight position={[-15, -10, -15]} intensity={0.5} color={0x4488ff} />
      <LensMesh eq={eq} eqR={eqR} aperture={aperture} />
      <Rays
        eq={eq}
        eqR={eqR}
        aperture={aperture}
        angle={angle}
        n={n}
        rayCount={rayCount}
      />
      <ThemeUpdater />
      <OrbitControls
        enableDamping
        dampingFactor={0.08}
        minDistance={5}
        maxDistance={150}
      />
    </>
  );
}

export default function Lens3D({ params }) {
  const lensSample = useMemo(() => {
    return sampleLens(params.eq, params.eqR);
  }, [params.eq, params.eqR]);

  return (
    <Canvas
      camera={{ position: [55, 32, 55], fov: 50, near: 0.1, far: 500 }}
      gl={{ antialias: true }}
      style={{
        width: "100%",
        height: "100%",
        position: "absolute",
        inset: 0,
        cursor: "grab",
      }}
    >
      <Scene
        eq={params.eq}
        eqR={params.eqR}
        aperture={lensSample.aperture}
        angle={params.angle * (Math.PI / 180)}
        n={params.n}
        rayCount={params.rayCount}
      />
    </Canvas>
  );
}
