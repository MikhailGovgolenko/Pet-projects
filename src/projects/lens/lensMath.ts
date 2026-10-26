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
  // Clamp to reasonable range for numerical stability near edges
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
  // Fallback with smaller step
  hr = Math.max(1e-8, hr * 0.1);
  f1 = safeEval(expr, r + hr);
  f2 = safeEval(expr, r - hr);
  if (isFinite(f1) && isFinite(f2)) {
    return (f1 - f2) / (2 * hr);
  }
  // Last resort forward difference
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
  // Must allow t << 0.2: near the rim the lens is thinner than 0.2 and
  // the second-surface hit would otherwise be skipped (miss vs notebook).
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

  // Expanding step: resolve thin edge gaps, then cover long approach paths
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
 * Ray status contract:
 *   ok   — refracted through both surfaces
 *   tir  — hit second surface, total internal reflection
 *   miss — no valid path (no hit, rim exit, entry failure)
 * Non-reflect rendering must draw only status === "ok".
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

    if (!h1) {
      return { P, h1: null, h2: null, end, ok: false, tir: false, miss: true, status: "miss", t1: 0, t2: 0 };
    }

    var N = faceNormal2(normVec({ z: -1, r: deriv(eq, h1.r) }), D);
    var T1 = refract3d(D, N, 1 / n);
    if (!T1) {
      return { P, h1, h2: null, end: h1, ok: false, tir: false, miss: true, status: "miss", t1: 0, t2: 0 };
    }

    var h2p = findIntersection(
      { z: h1.z + 1e-6 * T1.z, r: h1.r + 1e-6 * T1.r },
      T1, eqR, box
    );
    if (!h2p) {
      // Geometric miss / rim — not TIR; no passthrough
      return {
        P, h1, h2: null, end: h1,
        ok: false, tir: false, miss: true, status: "miss",
        edgeExit: true, t1: 1, t2: 0,
      };
    }

    h2 = h2p;
    var N2 = faceNormal2(normVec({ z: -1, r: deriv(eqR, h2.r) }), T1);
    var T2 = refract3d(T1, N2, n);
    if (!T2) {
      return {
        P, h1, h2, end: h2,
        ok: false, tir: true, miss: false, status: "tir",
        t1: 1, t2: 0,
      };
    }

    end = { z: h2.z + 3000 * T2.z, r: h2.r + 3000 * T2.r };
    return {
      P, h1, h2, end,
      ok: true, tir: false, miss: false, status: "ok",
      t1: 1, t2: 1,
    };
  }

  function uniform(num) {
    // Match notebook verify/draw: sample to 0.995*aperture, not the zero-thickness tip
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
    // Non-reflect: only successfully transmitted rays are drawable
    if (ray.status === "ok") rays.push(ray);
  }
  return rays;
}

export function norm3(v) {
  var L = Math.hypot(v.x, v.y, v.z);
  return { x: v.x / L, y: v.y / L, z: v.z / L };
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
  if (!h1) {
    return { P, h1: null, h2: null, end, ok: false, tir: false, miss: true, status: "miss" };
  }
  var r1 = Math.hypot(h1.x, h1.y);
  var N = faceNormal3(
    r1 < 1e-9
      ? { x: 0, y: 0, z: -1 }
      : norm3({ x: (deriv(eq, r1) * h1.x) / r1, y: (deriv(eq, r1) * h1.y) / r1, z: -1 }),
    D
  );
  var T1 = refract3(D, N, 1 / n);
  if (!T1) {
    return { P, h1, h2: null, end: h1, ok: false, tir: false, miss: true, status: "miss" };
  }
  var h2 = findHit3(
    eqR,
    { x: h1.x + 1e-6 * T1.x, y: h1.y + 1e-6 * T1.y, z: h1.z + 1e-6 * T1.z },
    T1,
    box
  );
  if (!h2) {
    return {
      P, h1, h2: null, end: h1,
      ok: false, tir: false, miss: true, status: "miss", edgeExit: true,
    };
  }
  var r2 = Math.hypot(h2.x, h2.y);
  var N2 = faceNormal3(
    r2 < 1e-9
      ? { x: 0, y: 0, z: -1 }
      : norm3({ x: (deriv(eqR, r2) * h2.x) / r2, y: (deriv(eqR, r2) * h2.y) / r2, z: -1 }),
    T1
  );
  var T2 = refract3(T1, N2, n);
  if (!T2) {
    // TIR: no reflected continuation in non-reflect mode
    return { P, h1, h2, end: h2, ok: false, tir: true, miss: false, status: "tir" };
  }
  return {
    P, h1, h2,
    end: {
      x: h2.x + endDist * T2.x,
      y: h2.y + endDist * T2.y,
      z: h2.z + endDist * T2.z,
    },
    ok: true, tir: false, miss: false, status: "ok",
  };
}
