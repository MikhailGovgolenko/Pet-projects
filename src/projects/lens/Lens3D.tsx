// @ts-nocheck
import { useMemo, useLayoutEffect, useRef, useState, useEffect } from "react";
import { Canvas, useThree, useFrame } from "@react-three/fiber";
import ThemeUpdater from "./ThemeUpdater";
import * as THREE from "three";
import { LineSegments2, LineSegmentsGeometry, LineMaterial, OrbitControls as OrbitControlsImpl } from "three-stdlib";
import * as M from "./lensMathReflect";
import * as M_OLD from "./lensMath";
import { useI18n } from "../../core/i18n";

const RAY_BASE = [0xff3c3c, 0xffb432, 0x32ff64, 0xff5cc8, 0xff5cc8].map((c) => new THREE.Color(c));
const REFLEN = 100000;

const FOV = 50;
const FILL = 0.4;

function computeInit(params) {
  const w = typeof window !== "undefined" ? window.innerWidth : 1280;
  const h = typeof window !== "undefined" ? window.innerHeight : 720;
  const fovHalf = Math.tan((FOV * Math.PI) / 360);
  let zc = 0;
  let r1 = 1;
  try {
    const math = params.useReflections ? M : M_OLD;
    const b = lensBox(math.sampleLens(params.eq, params.eqR));
    zc = 0.5 * (b.z0 + b.z1);
    r1 = Math.max(b.r1, 1e-6);
  } catch {}
  // Match the 2D fit scale, which is based on the smaller viewport dimension.
  const scale = (Math.min(w, h) * FILL) / (2 * r1);
  const d = h / (2 * scale * fovHalf);
  return {
    pos: new THREE.Vector3(-d, 0, zc),
    target: new THREE.Vector3(0, 0, zc),
    d,
    k: scale * d,
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
      var z = M.safeEval(eq, r);
      if (!isFinite(z)) continue;
      pts.push(new THREE.Vector2(r, z));
    }
    for (var i = nR; i >= 0; i--) {
      var r = (i / nR) * aperture;
      var z = M.safeEval(eqR, r);
      if (!isFinite(z)) continue;
      pts.push(new THREE.Vector2(r, z));
    }
    if (pts.length < 4) return null;
    return new THREE.LatheGeometry(pts, 48);
  }, [eq, eqR, aperture]);

  if (!geo) return null;

  return (
    <group rotation={[-Math.PI / 2, 0, 0]}>
      <mesh geometry={geo} renderOrder={1}>
        <meshPhongMaterial
          color={0x9cc8f0}
          emissive={0x223355}
          emissiveIntensity={0.25}
          transparent
          opacity={0.45}
          depthWrite={false}
          side={THREE.BackSide}
          shininess={80}
          specular={0xaaccff}
        />
      </mesh>
      <mesh geometry={geo} renderOrder={3}>
        <meshPhongMaterial
          color={0x9cc8f0}
          emissive={0x223355}
          emissiveIntensity={0.25}
          transparent
          opacity={0.45}
          depthWrite={false}
          side={THREE.FrontSide}
          shininess={80}
          specular={0xaaccff}
        />
      </mesh>
    </group>
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

function Rays({ eq, eqR, aperture, angle, n, rayCount, box, useReflections }) {
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
        opacity: 1,
        linewidth: 1.5,
        worldUnits: false,
        blending: THREE.NormalBlending,
        depthWrite: si !== 3,
        depthTest: si !== 3,
        resolution: new THREE.Vector2(1, 1),
      });
      mat.toneMapped = false;
      const seg = new LineSegments2(geo, mat);
      seg.renderOrder = si === 3 ? 5 : 2;
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


  useEffect(() => {
    traceCache.current.clear();
  }, [useReflections]);

  useLayoutEffect(() => {
    function updateSeg(si, positions, colors, visible) {
      const seg = structure.segs[si];
      seg.geometry.setPositions(positions);
      seg.geometry.setColors(colors, 4);
      delete (seg.geometry as any)._maxInstanceCount;
      seg.visible = visible;
    }
    // single hue for all rays; brightness controlled by intensity
    function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
    // single color RGB (green)
    var baseColor = new THREE.Color(0x32ff64);

    // diagnostics and counters
    var currentRayCK = null;
    var traceWarned = new Set();
    var skippedSegments = 0;
    var skippedExamples = [];

    function push(allSegs, allCols, si, a, b, intensity) {
      var i = typeof intensity === 'number' && isFinite(intensity) ? intensity : 0;
      i = Math.max(0, Math.min(1, i));
      // skip zero-length segments
      var dx = (b.x - a.x), dy = (b.y - a.y), dz = (b.z - a.z);
      var dist2 = dx*dx + dy*dy + dz*dz;
      if (dist2 < 1e-12) {
        skippedSegments++;
        if (skippedExamples.length < 8) skippedExamples.push({ ck: currentRayCK || 'unknown', segment: si, intensity: i, a, b, len: Math.sqrt(dist2) });
        return;
      }
      allSegs[si].push(a.x, a.y, a.z, b.x, b.y, b.z);
      var r = baseColor.r;
      var g = baseColor.g;
      var bl = baseColor.b;
      var a4 = si === 3 ? i * 0.5 : i;
      allCols[si].push(r, g, bl, a4, r, g, bl, a4);
    }
    var EXT = 100000;
    function extendFrom(p, base, dist) {
      var dx = p.x - base.x, dy = p.y - base.y, dz = p.z - base.z;
      var len = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1;
      var k = dist / len;
      return { x: p.x + dx * k, y: p.y + dy * k, z: p.z + dz * k };
    }
    var dx = Math.sin(angle);
    var dz = Math.cos(angle);
    var perpx = -Math.cos(angle);
    var perpz = Math.sin(angle);
    var count = Math.max(1, Math.round(rayCount));
    var startDist = 120;
    var endDist = 100000;
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

    function traceAt(off): any {
      var ck = eq + "|" + eqR + "|" + angle.toFixed(4) + "|" + n + "|" + off.u.toFixed(4) + "|" + off.w.toFixed(4) + "|" + (useReflections ? "withRef" : "noRef");
      var ray = cache.get(ck);
      if (ray === undefined) {
        if (cache.size > 20000) cache.clear();
        var P = {
          x: -startDist * dx + off.u * perpx,
          y: off.w,
          z: -startDist * dz + off.u * perpz,
        };
        const math = useReflections ? M : M_OLD;
        var raw = math.traceRay3D(eq, eqR, P, { x: dx, y: 0, z: dz }, n, box, endDist);
        // normalize to expected fields
        ray = Object.assign({}, raw);
        ray.rdir = raw.rdir != null ? raw.rdir : (raw.h1 && raw.h2 ? { x: raw.h2.x - raw.h1.x, y: raw.h2.y - raw.h1.y, z: raw.h2.z - raw.h1.z } : { x: 0, y: 0, z: 0 });
        ray.r1 = raw.r1 != null ? raw.r1 : 0;
      ray.t1 = isFinite(raw.t1) ? raw.t1 : 1;
      ray.t2 = isFinite(raw.t2) ? raw.t2 : 1;
      // normalize arrays and inner intensities
      ray.inner = Array.isArray(raw.inner) ? raw.inner.map((seg) => {
        return {
          a: seg && seg.a ? seg.a : { x: 0, y: 0, z: 0 },
          b: seg && seg.b ? seg.b : { x: 0, y: 0, z: 0 },
          // default missing inner intensity to 1 (inherit full brightness) to avoid black segments
          i: isFinite(Number(seg && seg.i)) ? Number(seg.i) : 1,
        };
      }) : [];
      ray.esc = Array.isArray(raw.esc) ? raw.esc.map((ex) => {
        return {
          p: ex && ex.p ? ex.p : { x: 0, y: 0, z: 0 },
          dir: ex && ex.dir ? ex.dir : { x: 0, y: 0, z: 1 },
          // default missing escape intensity to 1
          i: isFinite(Number(ex && ex.i)) ? Number(ex.i) : 1,
        };
      }) : [];
      ray.status = raw.status || (raw.ok ? "ok" : raw.tir ? "tir" : "miss");
      ray.ok = ray.status === "ok";
      ray.tir = ray.status === "tir";
      ray.miss = ray.status === "miss";
      // diagnostics: log suspicious raw intensities (t1/t2 === 0 or non-finite)
      var bad = (!isFinite(raw.t1) || !isFinite(raw.t2) || raw.t1 === 0 || raw.t2 === 0);
      if (bad && !traceWarned.has(ck) && traceWarned.size < 200) {
        try {
          var info = {
            ck,
            raw_t1: raw.t1,
            raw_t2: raw.t2,
            inner_i: Array.isArray(raw.inner) ? raw.inner.map((s) => (s && s.i != null ? s.i : null)) : null,
            esc_i: Array.isArray(raw.esc) ? raw.esc.map((e) => (e && e.i != null ? e.i : null)) : null,
          };
          console.warn('Lens3D: suspect raw intensities ' + JSON.stringify(info, null, 2));
        } catch (e) {
          console.warn('Lens3D: suspect raw intensities', ck, raw.t1, raw.t2);
        }
        traceWarned.add(ck);
      }
      try { ray._ck = ck; } catch (e) {}
      cache.set(ck, ray);
      }
      return ray;
    }

    // Match notebook usable aperture (0.995), no probe shrink
    var apDraw = aperture * 0.995;
    var picks = fibDisk(count, 0, 0, apDraw, apDraw).map(toOffset);

    var allSegs = [[], [], [], []];
    var allCols = [[], [], [], []];
    for (var i = 0; i < picks.length; i++) {
      var ray = traceAt(picks[i]);
      var rr: any = ray;
      // attach current ray cache key for push() diagnostics
      currentRayCK = rr && rr._ck ? rr._ck : null;

      // Non-reflect: only ok. Reflect: ok + tir (bounce viz). Miss: skip entirely.
      if (rr.miss || rr.status === "miss") continue;
      if (!useReflections && !rr.ok) continue;
      if (useReflections && !rr.ok && !rr.tir) continue;
      if (!rr.h1) continue;

      if (rr.rdir && isFinite(rr.r1) && rr.r1 > 0.001) {
        push(allSegs, allCols, 3, rr.h1, {
          x: rr.h1.x + REFLEN * rr.rdir.x,
          y: rr.h1.y + REFLEN * rr.rdir.y,
          z: rr.h1.z + REFLEN * rr.rdir.z,
        }, rr.r1);
      }
      if (useReflections && rr.h2) {
        for (var ki = 0; ki < (rr.inner || []).length; ki++) {
          var seg = rr.inner[ki];
          push(allSegs, allCols, 1, seg.a, seg.b, seg.i);
        }
        for (var ke = 0; ke < (rr.esc || []).length; ke++) {
          var ex = rr.esc[ke];
          push(allSegs, allCols, 2, ex.p, {
            x: ex.p.x + REFLEN * ex.dir.x,
            y: ex.p.y + REFLEN * ex.dir.y,
            z: ex.p.z + REFLEN * ex.dir.z,
          }, ex.i);
        }
      }

      var Pstart = extendFrom(rr.P, rr.h1, EXT);
      push(allSegs, allCols, 0, Pstart, rr.h1, 1);
      if (rr.h2 && isFinite(rr.t1) && rr.t1 > 1e-6) {
        push(allSegs, allCols, 1, rr.h1, rr.h2, rr.t1);
      }
      // Transmitted exit only for ok (never for tir / miss / passthrough)
      if (rr.ok && rr.h2 && isFinite(rr.t2) && rr.t2 > 1e-6) {
        push(allSegs, allCols, 2, rr.h2, rr.end, rr.t1 * rr.t2);
      }
      // clear current ray marker to avoid stale references
      currentRayCK = null;
      if (skippedSegments > 0) {
        try {
          console.info('Lens3D: skipped zero/invalid segments', skippedSegments, skippedExamples.slice(0,5));
        } catch (e) {}
      }
    }

    for (var si = 0; si < 4; si++) {
      var has = allSegs[si].length > 0;
      updateSeg(si, has ? allSegs[si] : [0, 0, 0, 0, 0, 0], has ? allCols[si] : [0, 0, 0, 0, 0, 0], has);
    }
  }, [eq, eqR, aperture, angle, n, rayCount, box, structure, useReflections]);

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

function Scene({ eq, eqR, aperture, angle, n, rayCount, box, scaleRef, init, useReflections }) {
  return (
    <>
      <ambientLight intensity={1.0} color={0x404060} />
      <directionalLight position={[15, 30, 15]} intensity={0.6} color={0xffffff} />
      <directionalLight position={[-15, -10, -15]} intensity={0.4} color={0x4488ff} />
      <LensMesh eq={eq} eqR={eqR} aperture={aperture} />
      <Rays
        eq={eq}
        eqR={eqR}
        aperture={aperture}
        angle={angle}
        n={n}
        rayCount={rayCount}
        box={box}
        useReflections={useReflections}
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
    const math = applied.useReflections ? M : M_OLD;
    return math.sampleLens(applied.eq, applied.eqR);
  }, [applied.eq, applied.eqR, applied.useReflections]);

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
        scaleRef={scaleRef}
        init={init}
        useReflections={applied.useReflections}
      />
    </Canvas>
  );
}
