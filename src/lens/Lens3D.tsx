import { useMemo, useLayoutEffect, useRef, useState, useEffect } from "react";
import { Canvas, useThree, useFrame } from "@react-three/fiber";
import ThemeUpdater from "../components/ThemeUpdater";
import * as THREE from "three";
import { LineSegments2, LineSegmentsGeometry, LineMaterial, OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { safeEval, sampleLens, traceRay3D } from "./lensMath";
import { useI18n } from "../i18n";

const RAY_BASE = [0xff3c3c, 0xffb432, 0x32ff64, 0xff5cc8, 0xff5cc8].map((c) => new THREE.Color(c));
const REFLEN = 120;

const FOV = 50;
const SCALE = 7;

function computeInit(params) {
  const w = typeof window !== "undefined" ? window.innerWidth : 1280;
  const h = typeof window !== "undefined" ? window.innerHeight : 720;
  const d = h / (2 * SCALE * Math.tan((FOV * Math.PI) / 360));
  let zc = 0;
  try {
    const b = lensBox(sampleLens(params.eq, params.eqR));
    zc = 0.5 * (b.z0 + b.z1);
  } catch {}
  return {
    pos: new THREE.Vector3(-d, 0, zc),
    target: new THREE.Vector3(0, 0, zc),
    d,
    k: SCALE * d,
  };
}

function Fallback() {
  const { t } = useI18n();
  return (
    <div style={{ color: "var(--text-sec)", fontSize: 13, textAlign: "center", padding: 16 }}>
      {t("lens.noWebgl")}
    </div>
  );
}

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
        color={0x9cc8f0}
        emissive={0x223355}
        emissiveIntensity={0.25}
        transparent
        opacity={0.45}
        depthWrite={false}
        side={THREE.DoubleSide}
        shininess={80}
        specular={0xaaccff}
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

function Rays({ eq, eqR, aperture, angle, n, rayCount, box, keepFailed }) {
  const traceCache = useRef(new Map());
  const { size } = useThree();

  const structure = useMemo(() => {
    const group = new THREE.Group();
    const segs = RAY_BASE.map((base, si) => {
      const geo = new LineSegmentsGeometry();
      const mat = new LineMaterial({
        color: 0xffffff,
        vertexColors: true,
        transparent: true,
        opacity: 0.9,
        linewidth: 1.5,
        resolution: new THREE.Vector2(1, 1),
      });
      mat.toneMapped = false;
      const seg = new LineSegments2(geo, mat);
      seg.visible = false;
      group.add(seg);
      return seg;
    });
    return { group, segs };
  }, []);

  useLayoutEffect(() => {
    for (const seg of structure.segs) {
      (seg.material as any).resolution.set(size.width, size.height);
    }
  }, [structure, size]);

  useLayoutEffect(() => {
    function updateSeg(si, positions, colors, visible) {
      const seg = structure.segs[si];
      seg.geometry.setPositions(positions);
      seg.geometry.setColors(colors);
      delete (seg.geometry as any)._maxInstanceCount;
      seg.visible = visible;
    }
    function push(allSegs, allCols, si, a, b, intensity) {
      allSegs[si].push(a.x, a.y, a.z, b.x, b.y, b.z);
      var base = RAY_BASE[si];
      var r = base.r * intensity;
      var g = base.g * intensity;
      var bl = base.b * intensity;
      allCols[si].push(r, g, bl, r, g, bl);
    }
    var dx = Math.sin(angle);
    var dz = Math.cos(angle);
    var perpx = -Math.cos(angle);
    var perpz = Math.sin(angle);
    var count = Math.max(1, Math.round(rayCount));
    var startDist = 120;
    var endDist = 3000;
    var cache = traceCache.current;
    var zMid = box ? 0.5 * (box.z0 + box.z1) : 0;
    var uC = zMid * Math.sin(angle);
    var GOLDEN = 2.3999632297286533;

    function fibDisk(n, cx, cy, rx, ry) {
      var res = [];
      for (var i = 0; i < n; i++) {
        var t = (i + 0.5) / n;
        var phi = i * GOLDEN;
        var rho = Math.sqrt(t);
        res.push({ a: cx + rho * Math.cos(phi) * rx, b: cy + rho * Math.sin(phi) * ry });
      }
      return res;
    }

    function toOffset(ab) {
      return { u: uC - ab.a * Math.cos(angle), w: ab.b };
    }

    function traceAt(off) {
      var ck = eq + "|" + eqR + "|" + angle.toFixed(4) + "|" + n + "|" + off.u.toFixed(4) + "|" + off.w.toFixed(4);
      var ray = cache.get(ck);
      if (ray === undefined) {
        if (cache.size > 20000) cache.clear();
        var P = {
          x: -startDist * dx + off.u * perpx,
          y: off.w,
          z: -startDist * dz + off.u * perpz,
        };
        ray = traceRay3D(eq, eqR, P, { x: dx, y: 0, z: dz }, n, box, endDist);
        cache.set(ck, ray);
      }
      return ray;
    }

    var picks;
    if (!keepFailed) {
      var okPts = [];
      var seen = new Set();
      var probeN = Math.max(count, 40);
      for (const off of fibDisk(probeN, 0, 0, aperture, aperture).map(toOffset)) {
        var k = off.u.toFixed(4) + "|" + off.w.toFixed(4);
        seen.add(k);
        var probeRay = traceAt(off);
        if (probeRay.ok || probeRay.tir) okPts.push(off);
      }
      if (okPts.length === 0) {
        for (var si = 0; si < 4; si++) {
          updateSeg(si, [0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0], false);
        }
        return;
      }
      var rounds = 0;
      while (okPts.length < count && rounds < 4) {
        rounds++;
        var cx = 0, cy = 0;
        for (const p of okPts) { cx += p.u; cy += p.w; }
        cx /= okPts.length;
        cy /= okPts.length;
        var rmax = 0.001;
        for (const p of okPts) rmax = Math.max(rmax, Math.hypot(p.u - cx, p.w - cy));
        rmax *= 1.4;
        for (const off of fibDisk(Math.max(count * 8, 160), cx, cy, rmax, rmax).map(toOffset)) {
          if (okPts.length >= count) break;
          var k2 = off.u.toFixed(4) + "|" + off.w.toFixed(4);
          if (seen.has(k2)) continue;
          seen.add(k2);
          var probeRay2 = traceAt(off);
          if (probeRay2.ok || probeRay2.tir) okPts.push(off);
        }
      }
      var stride = okPts.length / count;
      picks = [];
      for (var j = 0; j < count; j++) {
        picks.push(okPts[Math.min(okPts.length - 1, Math.floor(j * stride))]);
      }
    } else {
      picks = fibDisk(count, 0, 0, aperture, aperture).map(toOffset);
    }

    var allSegs = [[], [], [], []];
    var allCols = [[], [], [], []];
    for (var i = 0; i < picks.length; i++) {
      var ray = traceAt(picks[i]);
      if (ray.h1 && ray.rdir) {
        push(allSegs, allCols, 3, ray.h1, {
          x: ray.h1.x + REFLEN * ray.rdir.x,
          y: ray.h1.y + REFLEN * ray.rdir.y,
          z: ray.h1.z + REFLEN * ray.rdir.z,
        }, ray.r1);
      }
      if (ray.h2) {
        for (var ki = 0; ki < ray.inner.length; ki++) {
          var seg = ray.inner[ki];
          push(allSegs, allCols, 1, seg.a, seg.b, seg.i);
        }
        for (var ke = 0; ke < ray.esc.length; ke++) {
          var ex = ray.esc[ke];
          push(allSegs, allCols, 2, ex.p, {
            x: ex.p.x + REFLEN * ex.dir.x,
            y: ex.p.y + REFLEN * ex.dir.y,
            z: ex.p.z + REFLEN * ex.dir.z,
          }, ex.i);
        }
      }
      if (!ray.ok && !ray.tir) {
        if (keepFailed) {
          if (!ray.h1) {
            push(allSegs, allCols, 0, ray.P, ray.end, 1);
            continue;
          }
          push(allSegs, allCols, 0, ray.P, ray.h1, 1);
          if (ray.h2) {
            push(allSegs, allCols, 1, ray.h1, ray.h2, ray.t1);
            push(allSegs, allCols, 2, ray.h2, ray.end, ray.t1 * ray.t2);
          } else {
            push(allSegs, allCols, 1, ray.h1, ray.end, ray.t1);
          }
        }
        continue;
      }
      push(allSegs, allCols, 0, ray.P, ray.h1, 1);
      push(allSegs, allCols, 1, ray.h1, ray.h2, ray.t1);
      push(allSegs, allCols, 2, ray.h2, ray.end, ray.t1 * ray.t2);
    }

    for (var si = 0; si < 4; si++) {
      var has = allSegs[si].length > 0;
      updateSeg(si, has ? allSegs[si] : [0, 0, 0, 0, 0, 0], has ? allCols[si] : [0, 0, 0, 0, 0, 0], has);
    }
  }, [eq, eqR, aperture, angle, n, rayCount, box, structure, keepFailed]);

  return <primitive object={structure.group} />;
}

function Orbit({ scaleRef, init }) {
  const { camera, gl } = useThree();
  const controls = useMemo(() => {
    const c = new OrbitControlsImpl(camera, gl.domElement);
    c.enableDamping = true;
    c.dampingFactor = 0.08;
    c.zoomToCursor = true;
    c.target.copy(init.target);
    c.update();
    return c;
  }, [camera, gl, init]);

  useFrame(() => {
    const d = controls.getDistance();
    if (d > 1e-9) {
      const near = Math.max(d * 0.005, 1e-9);
      const far = Math.max(d * 2000000, 2000);
      if (camera.near !== near || camera.far !== far) {
        camera.near = near;
        camera.far = far;
        camera.updateProjectionMatrix();
      }
      if (scaleRef && scaleRef.current) {
        scaleRef.current.textContent = (init.k / d).toFixed(2);
      }
    }
    controls.update();
  });

  useEffect(() => () => controls.dispose(), [controls]);

  return <primitive object={controls} />;
}

function Scene({ eq, eqR, aperture, angle, n, rayCount, box, keepFailed, scaleRef, init }) {
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
        keepFailed={keepFailed}
      />
      <ThemeUpdater />
      <Orbit scaleRef={scaleRef} init={init} />
    </>
  );
}

export default function Lens3D({ params, scaleRef }) {
  const [applied, setApplied] = useState(params);
  const [init] = useState(() => computeInit(params));
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
      camera={{ position: [init.pos.x, init.pos.y, init.pos.z], fov: FOV, near: 0.01, far: 1000000 }}
      gl={{ antialias: true }}
      fallback={<Fallback />}
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
        keepFailed={applied.keepFailed}
        scaleRef={scaleRef}
        init={init}
      />
    </Canvas>
  );
}
