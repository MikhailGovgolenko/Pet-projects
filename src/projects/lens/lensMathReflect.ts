import { evaluate } from "./expr";

export const DEG = Math.PI / 180;

export function safeEval(expr, r) {
  try {
    var v = evaluate(expr, r);
    if (!isFinite(v)) return NaN;
    return v;
  } catch {
    return NaN;
  }
}

export function deriv(expr, r, h?) {
  var hr = h;
  if (hr === undefined || hr === null) hr = 1e-5;
  var absR = Math.abs(r);
  if (absR > 1e-12) {
    hr = Math.min(hr, Math.max(1e-7, absR * 2e-5));
  } else {
    hr = Math.min(hr, 1e-6);
  }
  var f1 = safeEval(expr, r + hr);
  var f2 = safeEval(expr, r - hr);
  if (isFinite(f1) && isFinite(f2)) {
    return (f1 - f2) / (2 * hr);
  }
  hr = Math.max(1e-8, hr * 0.1);
  f1 = safeEval(expr, r + hr);
  f2 = safeEval(expr, r - hr);
  if (isFinite(f1) && isFinite(f2)) {
    return (f1 - f2) / (2 * hr);
  }
  var f0 = safeEval(expr, r);
  f1 = safeEval(expr, r + hr);
  if (isFinite(f0) && isFinite(f1)) {
    return (f1 - f0) / hr;
  }
  return 0;
}

export function normVec(v) {
  var L = Math.hypot(v.z, v.r);
  if (L < 1e-18) return { z: -1, r: 0 };
  return { z: v.z / L, r: v.r / L };
}

function faceNormal2(N, I) {
  if (N.z * I.z + N.r * I.r > 0) return { z: -N.z, r: -N.r };
  return N;
}

/** Snell refraction. eta = n1/n2. Returns null on TIR (k < 0). */
export function refract3d(I, N, eta) {
  var cosi = -(N.z * I.z + N.r * I.r);
  if (cosi > 1.0) cosi = 1.0;
  if (cosi < -1.0) cosi = -1.0;
  var k = 1 - eta * eta * (1 - cosi * cosi);
  if (k < 0) return null;
  var cosT = Math.sqrt(k);
  var f = eta * cosi - cosT;
  var outZ = eta * I.z + f * N.z;
  var outR = eta * I.r + f * N.r;
  var Lout = Math.hypot(outZ, outR);
  if (Lout < 1e-18) return null;
  return {
    z: outZ / Lout,
    r: outR / Lout,
  };
}

const MAX_R = 100;

function findEdge(eqL, eqR, a, b) {
  for (var i = 0; i < 50; i++) {
    var m = 0.5 * (a + b);
    var zL = safeEval(eqL, m);
    var zR = safeEval(eqR, m);
    if (!isFinite(zL) || !isFinite(zR)) {
      b = m;
      continue;
    }
    if (zL > zR) b = m;
    else a = m;
  }
  return 0.5 * (a + b);
}

export function sampleLens(eqL, eqR) {
  var L = [];
  var R = [];
  var aperture = 0;
  for (var r = 0; r <= MAX_R; r += 0.2) {
    var zL = safeEval(eqL, r);
    var zR = safeEval(eqR, r);
    if (!isFinite(zL) || !isFinite(zR)) break;
    if (zL > zR) {
      var re = findEdge(eqL, eqR, Math.max(0, r - 0.2), r);
      var ze = safeEval(eqL, re);
      aperture = re;
      L.push({ z: ze, r: re });
      R.push({ z: ze, r: re });
      break;
    }
    aperture = r;
    L.push({ z: zL, r: r });
    R.push({ z: zR, r: r });
  }
  if (aperture <= 0) return { L: [], R: [], aperture: 0, eq: eqL, eqR };
  for (var r = -0.2; r >= -MAX_R; r -= 0.2) {
    var zL = safeEval(eqL, r);
    var zR = safeEval(eqR, r);
    if (!isFinite(zL) || !isFinite(zR)) break;
    if (zL > zR) {
      var re = findEdge(eqL, eqR, r + 0.2, r);
      var ze = safeEval(eqL, re);
      L.unshift({ z: ze, r: re });
      R.unshift({ z: ze, r: re });
      break;
    }
    L.unshift({ z: zL, r: r });
    R.unshift({ z: zR, r: r });
  }
  return { L, R, aperture, eq: eqL, eqR };
}

export function findIntersection(P, D, eq, box) {
  function f(t) {
    var rr = P.r + t * D.r;
    var zr = P.z + t * D.z;
    var ze = safeEval(eq, rr);
    if (!isFinite(ze)) return NaN;
    return zr - ze;
  }
  // Allow t << 0.2 so thin-edge second-surface hits are not skipped
  var EPS = 1e-8;
  var t0 = EPS;
  var t1 = 1000;
  if (box) {
    var rLo = -box.r1;
    var rHi = box.r1;
    var zLo = box.z0 - 2;
    var zHi = box.z1 + 2;
    if (Math.abs(D.z) < 1e-9) {
      if (P.z < zLo || P.z > zHi) return null;
    } else {
      var tA = (zLo - P.z) / D.z;
      var tB = (zHi - P.z) / D.z;
      t0 = Math.max(t0, Math.min(tA, tB));
      t1 = Math.min(t1, Math.max(tA, tB));
    }
    if (Math.abs(D.r) < 1e-9) {
      if (P.r < rLo || P.r > rHi) return null;
    } else {
      var tC = (rLo - P.r) / D.r;
      var tD = (rHi - P.r) / D.r;
      t0 = Math.max(t0, Math.min(tC, tD));
      t1 = Math.min(t1, Math.max(tC, tD));
    }
    t0 = Math.max(EPS, t0);
    t1 = Math.min(1000, t1);
    if (!(t0 < t1)) return null;
  }

  function refine(a, b) {
    for (var i = 0; i < 48; i++) {
      var m = 0.5 * (a + b);
      var fm = f(m);
      if (!isFinite(fm)) {
        a = m;
        continue;
      }
      var fa = f(a);
      if (isFinite(fa) && fa * fm <= 0) b = m;
      else a = m;
    }
    var th = 0.5 * (a + b);
    var hr = P.r + th * D.r;
    if (!isFinite(hr)) return null;
    var zh = safeEval(eq, hr);
    if (!isFinite(zh)) return null;
    return { z: zh, r: hr };
  }

  var tLo = t0;
  var fLo = f(tLo);
  var step = 1e-4;
  while (tLo < t1) {
    var tHi = Math.min(t1, tLo + step);
    var fHi = f(tHi);
    if (isFinite(fLo) && isFinite(fHi) && fLo * fHi <= 0) {
      return refine(tLo, tHi);
    }
    tLo = tHi;
    fLo = fHi;
    step = Math.min(step * 1.6, 0.2);
  }
  return null;
}

/**
 * Ray status: ok | tir | miss (same contract as lensMath).
 * Reflect mode may keep tir rays for internal bounce visualization;
 * primary transmitted exit exists only when status === "ok".
 */
export function traceRays(eq, eqR, aperture, angle, n, count, box) {
  var dir = { z: Math.cos(angle), r: Math.sin(angle) };
  var perp = { z: -dir.r, r: dir.z };
  var scale = Math.abs(Math.cos(angle));

  function traceOne(r0) {
    var P = {
      z: -120 * dir.z + r0 * perp.z,
      r: -120 * dir.r + r0 * perp.r,
    };
    var D = normVec(dir);
    var h1 = findIntersection(P, D, eq, box);
    var h2 = null;
    var end = { z: P.z, r: P.r };
    var inner = [];
    var esc = [];
    var t1 = 0;
    var t2 = 0;
    var r1 = 0;
    var rdir = null;
    var MAX_DEPTH = 50;
    var THRESHOLD = 1e-6;

    function normal2d(surf, p) {
      return Math.abs(p.r) < 1e-6
        ? { z: -1, r: 0 }
        : normVec({ z: -1, r: deriv(surf, p.r) });
    }

    function reflect2d(I, N) {
      var cosI = -(N.z * I.z + N.r * I.r);
      return { z: I.z + 2 * cosI * N.z, r: I.r + 2 * cosI * N.r };
    }

    function bounce(cp, cdir, ci, depth) {
      if (ci <= THRESHOLD || depth > MAX_DEPTH) return;
      var surf = depth % 2 === 0 ? eq : eqR;
      var hp = findIntersection({ z: cp.z + 1e-6 * cdir.z, r: cp.r + 1e-6 * cdir.r }, cdir, surf, box);
      if (!hp) return;
      var Np = faceNormal2(normal2d(surf, hp), cdir);
      var cosIp = -(Np.z * cdir.z + Np.r * cdir.r);
      var Rp = fresnelReflectance(cosIp, n, 1);
      if (ci > THRESHOLD) inner.push({ a: cp, b: hp, i: ci });
      var Tdir = refract3d(cdir, Np, n);
      if (Tdir) {
        var trans = ci * fresnelTransmittance(cosIp, n, 1);
        if (trans > THRESHOLD) {
          esc.push({ p: hp, dir: Tdir, i: trans });
        }
      }
      bounce(hp, reflect2d(cdir, Np), ci * Rp, depth + 1);
    }

    if (!h1) {
      return {
        P, h1: null, h2: null, end,
        ok: false, tir: false, miss: true, status: "miss",
        t1: 0, t2: 0, r1: 0, rdir: null, inner, esc,
      };
    }

    var N = faceNormal2(normal2d(eq, h1), D);
    var cosI1 = -(N.z * D.z + N.r * D.r);
    r1 = fresnelReflectance(cosI1, 1, n);
    t1 = fresnelTransmittance(cosI1, 1, n);
    rdir = reflect2d(D, N);
    var T1 = refract3d(D, N, 1 / n);
    if (!T1) {
      return {
        P, h1, h2: null, end: h1,
        ok: false, tir: false, miss: true, status: "miss",
        t1: 0, t2: 0, r1, rdir, inner, esc,
      };
    }

    var h2p = findIntersection(
      { z: h1.z + 1e-6 * T1.z, r: h1.r + 1e-6 * T1.r },
      T1, eqR, box
    );
    if (!h2p) {
      return {
        P, h1, h2: null, end: h1,
        ok: false, tir: false, miss: true, status: "miss",
        edgeExit: true, t1, t2: 0, r1, rdir, inner, esc,
      };
    }

    h2 = h2p;
    var N2 = faceNormal2(normal2d(eqR, h2), T1);
    var cosI2 = -(N2.z * T1.z + N2.r * T1.r);
    var R2 = fresnelReflectance(cosI2, n, 1);
    t2 = fresnelTransmittance(cosI2, n, 1);
    var rdir2 = reflect2d(T1, N2);
    var T2 = refract3d(T1, N2, n);
    if (T2) {
      end = { z: h2.z + 3000 * T2.z, r: h2.r + 3000 * T2.r };
      bounce(h2, rdir2, t1 * R2, 0);
      return {
        P, h1, h2, end,
        ok: true, tir: false, miss: false, status: "ok",
        t1, t2, r1, rdir, inner, esc,
      };
    }

    // TIR on exit: no passthrough; reflect mode may still show bounce chain
    end = { z: h2.z, r: h2.r };
    bounce(h2, rdir2, t1 * Math.max(R2, 1), 0);
    return {
      P, h1, h2, end,
      ok: false, tir: true, miss: false, status: "tir",
      t1, t2: 0, r1, rdir, inner, esc,
    };
  }

  function uniform(num) {
    // Match notebook: sample to 0.995*aperture, not the zero-thickness tip
    var ap = aperture * 0.995;
    var res = [];
    for (var i = 0; i < num; i++) {
      res.push(num > 1 ? (-ap + (2 * ap * i) / (num - 1)) * scale : 0);
    }
    return res;
  }

  // Uniform over usable aperture — no probe shrink
  var offsets = uniform(count);
  var rays = [];
  for (var i = 0; i < count; i++) {
    var ray = traceOne(offsets[i]);
    // Drop pure misses; keep ok + tir (tir for bounce viz in reflect mode)
    if (ray.status === "miss") continue;
    rays.push(ray);
  }
  return rays;
}

export function norm3(v) {
  var L = Math.hypot(v.x, v.y, v.z);
  return { x: v.x / L, y: v.y / L, z: v.z / L };
}

export function fresnelReflectance(cosI, n1, n2) {
  var sinT2 = (n1 / n2) * (n1 / n2) * (1 - cosI * cosI);
  if (sinT2 >= 1) return 1;
  var cosT = Math.sqrt(1 - sinT2);
  var rs = (n1 * cosI - n2 * cosT) / (n1 * cosI + n2 * cosT);
  var rp = (n2 * cosI - n1 * cosT) / (n2 * cosI + n1 * cosT);
  return 0.5 * (rs * rs + rp * rp);
}

export function fresnelTransmittance(cosI, n1, n2) {
  return 1 - fresnelReflectance(cosI, n1, n2);
}

function faceNormal3(N, I) {
  if (N.x * I.x + N.y * I.y + N.z * I.z > 0) {
    return { x: -N.x, y: -N.y, z: -N.z };
  }
  return N;
}

export function refract3(I, N, eta) {
  var cosi = -(N.x * I.x + N.y * I.y + N.z * I.z);
  if (cosi > 1.0) cosi = 1.0;
  if (cosi < -1.0) cosi = -1.0;
  var k = 1 - eta * eta * (1 - cosi * cosi);
  if (k < 0) return null;
  var f = eta * cosi - Math.sqrt(k);
  var out = { x: eta * I.x + f * N.x, y: eta * I.y + f * N.y, z: eta * I.z + f * N.z };
  var L = Math.hypot(out.x, out.y, out.z);
  if (L < 1e-18) return null;
  return { x: out.x / L, y: out.y / L, z: out.z / L };
}

export function findHit3(eq, P, D, box) {
  function r(t) {
    return Math.hypot(P.x + t * D.x, P.y + t * D.y);
  }
  function f(t) {
    return P.z + t * D.z - safeEval(eq, r(t));
  }
  var EPS = 1e-8;
  var t0 = EPS;
  var t1 = 1000;
  if (box) {
    var zLo = box.z0 - 2;
    var zHi = box.z1 + 2;
    if (Math.abs(D.z) < 1e-9) {
      if (P.z < zLo || P.z > zHi) return null;
    } else {
      var tA = (zLo - P.z) / D.z;
      var tB = (zHi - P.z) / D.z;
      t0 = Math.max(t0, Math.min(tA, tB));
      t1 = Math.min(t1, Math.max(tA, tB));
    }
    var rs = Math.hypot(P.x, P.y);
    var rv = Math.hypot(D.x, D.y);
    if (rv < 1e-9) {
      if (rs > box.r1) return null;
    } else {
      t1 = Math.min(t1, (rs + box.r1) / rv);
      t0 = Math.max(t0, (rs - box.r1) / rv);
    }
    t0 = Math.max(EPS, t0);
    t1 = Math.min(1000, t1);
    if (!(t0 < t1)) return null;
  }

  function refine(a, b) {
    for (var i = 0; i < 48; i++) {
      var m = 0.5 * (a + b);
      var fa = f(a);
      var fm = f(m);
      if (!isFinite(fm) || !isFinite(fa)) {
        a = m;
        continue;
      }
      if (fa * fm <= 0) b = m;
      else a = m;
    }
    var th = 0.5 * (a + b);
    return { x: P.x + th * D.x, y: P.y + th * D.y, z: P.z + th * D.z };
  }

  var tLo = t0;
  var fLo = f(tLo);
  var step = 1e-4;
  while (tLo < t1) {
    var tHi = Math.min(t1, tLo + step);
    var fHi = f(tHi);
    if (isFinite(fLo) && isFinite(fHi) && fLo * fHi <= 0) {
      return refine(tLo, tHi);
    }
    tLo = tHi;
    fLo = fHi;
    step = Math.min(step * 1.6, 0.2);
  }
  return null;
}

export function traceRay3D(eq, eqR, P, D, n, box, endDist) {
  var end = { x: P.x, y: P.y, z: P.z };
  var h1 = findHit3(eq, P, D, box);
  var h2 = null;
  var inner = [];
  var esc = [];
  var t1 = 0;
  var t2 = 0;
  var r1 = 0;
  var rdir = null;
  var MAX_DEPTH = 50;
  var THRESHOLD = 1e-6;

  function normal(surf, p) {
    var r = Math.hypot(p.x, p.y);
    return r < 1e-9
      ? { x: 0, y: 0, z: -1 }
      : norm3({ x: (deriv(surf, r) * p.x) / r, y: (deriv(surf, r) * p.y) / r, z: -1 });
  }

  function reflect(I, N) {
    var cosI = -(N.x * I.x + N.y * I.y + N.z * I.z);
    return { x: I.x + 2 * cosI * N.x, y: I.y + 2 * cosI * N.y, z: I.z + 2 * cosI * N.z };
  }

  function bounce(cp, cdir, ci, depth) {
    if (ci <= THRESHOLD || depth > MAX_DEPTH) return;
    var surf = depth % 2 === 0 ? eq : eqR;
    var hp = findHit3(surf, { x: cp.x + 1e-6 * cdir.x, y: cp.y + 1e-6 * cdir.y, z: cp.z + 1e-6 * cdir.z }, cdir, box);
    if (!hp) return;
    var Np = faceNormal3(normal(surf, hp), cdir);
    var cosIp = -(Np.x * cdir.x + Np.y * cdir.y + Np.z * cdir.z);
    var Rp = fresnelReflectance(cosIp, n, 1);
    inner.push({ a: cp, b: hp, i: ci });
    var Tdir = refract3(cdir, Np, n);
    if (Tdir) {
      esc.push({ p: hp, dir: Tdir, i: ci * fresnelTransmittance(cosIp, n, 1) });
    }
    bounce(hp, reflect(cdir, Np), ci * Rp, depth + 1);
  }

  if (!h1) {
    return {
      P, h1: null, h2: null, end,
      ok: false, tir: false, miss: true, status: "miss",
      t1: 0, t2: 0, r1: 0, rdir: null, inner, esc,
    };
  }

  var N = faceNormal3(normal(eq, h1), D);
  var cosI1 = -(N.x * D.x + N.y * D.y + N.z * D.z);
  r1 = fresnelReflectance(cosI1, 1, n);
  t1 = fresnelTransmittance(cosI1, 1, n);
  rdir = reflect(D, N);
  var T1 = refract3(D, N, 1 / n);
  if (!T1) {
    return {
      P, h1, h2: null, end: h1,
      ok: false, tir: false, miss: true, status: "miss",
      t1: 0, t2: 0, r1, rdir, inner, esc,
    };
  }

  var h2p = findHit3(
    eqR,
    { x: h1.x + 1e-6 * T1.x, y: h1.y + 1e-6 * T1.y, z: h1.z + 1e-6 * T1.z },
    T1,
    box
  );
  if (!h2p) {
    return {
      P, h1, h2: null, end: h1,
      ok: false, tir: false, miss: true, status: "miss",
      edgeExit: true, t1, t2: 0, r1, rdir, inner, esc,
    };
  }

  h2 = h2p;
  var N2 = faceNormal3(normal(eqR, h2), T1);
  var cosI2 = -(N2.x * T1.x + N2.y * T1.y + N2.z * T1.z);
  var R2 = fresnelReflectance(cosI2, n, 1);
  t2 = fresnelTransmittance(cosI2, n, 1);
  var rdir2 = reflect(T1, N2);
  var T2 = refract3(T1, N2, n);
  if (T2) {
    end = {
      x: h2.x + endDist * T2.x,
      y: h2.y + endDist * T2.y,
      z: h2.z + endDist * T2.z,
    };
    bounce(h2, rdir2, t1 * R2, 0);
    return {
      P, h1, h2, end,
      ok: true, tir: false, miss: false, status: "ok",
      t1, t2, r1, rdir, inner, esc,
    };
  }

  end = { x: h2.x, y: h2.y, z: h2.z };
  bounce(h2, rdir2, t1 * Math.max(R2, 1), 0);
  return {
    P, h1, h2, end,
    ok: false, tir: true, miss: false, status: "tir",
    t1, t2: 0, r1, rdir, inner, esc,
  };
}
