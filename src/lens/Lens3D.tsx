import { useMemo, useLayoutEffect, useRef, useState, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import ThemeUpdater from "../components/ThemeUpdater";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { safeEval, sampleLens, deriv, normVec, refract3d, findIntersection } from "./lensMath";

const RAY_COLORS = [0xff4444, 0xffb434, 0x44ff66];

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

function lensBox(lens) {
  var zMin = Infinity;
  var zMax = -Infinity;
  for (var i = 0; i < lens.L.length; i++) {
    var z = lens.L[i].z;
    if (z < zMin) zMin = z;
    if (z > zMax) zMax = z;
    z = lens.R[i].z;
    if (z < zMin) zMin = z;
    if (z > zMax) zMax = z;
  }
  return { z0: zMin, z1: zMax, r1: lens.aperture };
}

function Rays({ eq, eqR, aperture, angle, n, rayCount, box }) {
  const traceCache = useRef(new Map());

  const structure = useMemo(() => {
    const group = new THREE.Group();
    const segs = RAY_COLORS.map((color) => {
      const geo = new THREE.BufferGeometry();
      const mat = new THREE.LineBasicMaterial({
        color,
        transparent: true,
        opacity: 0.4,
      });
      const seg = new THREE.LineSegments(geo, mat);
      seg.visible = false;
      group.add(seg);
      return seg;
    });
    return { group, segs };
  }, []);

  useLayoutEffect(() => {
    var dir = { z: Math.cos(angle), r: Math.sin(angle) };
    var perp = { z: -dir.r, r: dir.z };
    var nSide = Math.max(1, Math.round(Math.sqrt(rayCount)));
    var halfSize = aperture * 0.7071;
    var startDist = 35;
    var endDist = 3000;
    var cache = traceCache.current;

    function traceAtOffset(rOff) {
      var P = {
        z: -startDist * dir.z + rOff * perp.z,
        r: -startDist * dir.r + rOff * perp.r,
      };
      var D = normVec(dir);
      var h1 = findIntersection(P, D, eq, box);
      if (!h1) return null;
      var N = normVec({ z: -1, r: deriv(eq, h1.r) });
      if (N.z * D.z + N.r * D.r > 0) N = { z: -N.z, r: -N.r };
      var T1 = refract3d(D, N, 1 / n);
      if (!T1) return null;
      var h2 = findIntersection(
        { z: h1.z + 1e-6 * T1.z, r: h1.r + 1e-6 * T1.r },
        T1, eqR, box
      );
      if (!h2) return null;
      var N2 = normVec({ z: -1, r: deriv(eqR, h2.r) });
      if (N2.z * T1.z + N2.r * T1.r > 0) N2 = { z: -N2.z, r: -N2.r };
      var T2 = refract3d(T1, N2, n);
      if (!T2) return null;
      var end = { z: h2.z + endDist * T2.z, r: h2.r + endDist * T2.r };
      return { P, h1, h2, end };
    }

    var allSegs = [[], [], []];
    for (var i = 0; i < nSide; i++) {
      for (var j = 0; j < nSide; j++) {
        var x = (i / Math.max(1, nSide - 1) - 0.5) * 2 * halfSize;
        var y = (j / Math.max(1, nSide - 1) - 0.5) * 2 * halfSize;
        var r = Math.sqrt(x * x + y * y);
        if (r > aperture) continue;
        var ck = eq + "|" + eqR + "|" + angle.toFixed(4) + "|" + n + "|" + r.toFixed(4);
        var ray = cache.get(ck);
        if (ray === undefined) {
          if (cache.size > 20000) cache.clear();
          ray = traceAtOffset(r);
          cache.set(ck, ray);
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

    for (var si = 0; si < 3; si++) {
      var seg = structure.segs[si];
      if (allSegs[si].length > 0) {
        seg.geometry.setAttribute("position", new THREE.Float32BufferAttribute(allSegs[si], 3));
        seg.visible = true;
      } else {
        seg.visible = false;
      }
    }
  }, [eq, eqR, aperture, angle, n, rayCount, box, structure]);

  return <primitive object={structure.group} />;
}

function Scene({ eq, eqR, aperture, angle, n, rayCount, box }) {
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
        box={box}
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
  const [applied, setApplied] = useState(params);
  const pendingRef = useRef(false);
  const latestRef = useRef(params);
  latestRef.current = params;

  useEffect(() => {
    if (pendingRef.current) return;
    pendingRef.current = true;
    requestAnimationFrame(() => {
      pendingRef.current = false;
      setApplied(latestRef.current);
    });
  }, [params]);

  const lensSample = useMemo(() => {
    return sampleLens(applied.eq, applied.eqR);
  }, [applied.eq, applied.eqR]);

  const box = useMemo(() => lensBox(lensSample), [lensSample]);

  return (
    <Canvas
      dpr={[1, 2]}
      camera={{ position: [55, 32, 55], fov: 50, near: 0.1, far: 500 }}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      style={{
        width: "100%",
        height: "100%",
        position: "absolute",
        inset: 0,
        cursor: "grab",
      }}
    >
      <Scene
        eq={applied.eq}
        eqR={applied.eqR}
        aperture={lensSample.aperture}
        angle={applied.angle * (Math.PI / 180)}
        n={applied.n}
        rayCount={applied.rayCount}
        box={box}
      />
    </Canvas>
  );
}
