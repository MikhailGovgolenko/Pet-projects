import { evaluate } from "./expr";

export const DEG = Math.PI / 180;

export function safeEval(expr, r) {
  try {
    return evaluate(expr, r);
  } catch {
    return NaN;
  }
}

export function deriv(expr, r, h?) {
  h = h || 1e-4;
  return (safeEval(expr, r + h) - safeEval(expr, r - h)) / (2 * h);
}

export function normVec(v) {
  var L = Math.hypot(v.z, v.r);
  return { z: v.z / L, r: v.r / L };
}

export function refract3d(I, N, eta) {
  var cosi = -(N.z * I.z + N.r * I.r);
  var k = 1 - eta * eta * (1 - cosi * cosi);
  if (k < 0) return null;
  return {
    z: eta * I.z + (eta * cosi - Math.sqrt(k)) * N.z,
    r: eta * I.r + (eta * cosi - Math.sqrt(k)) * N.r,
  };
}

const MAX_R = 100;

export function sampleLens(eqL, eqR) {
  var L = [];
  var R = [];
  var aperture = 0;
  for (var r = 0; r <= MAX_R; r += 0.2) {
    var zL = safeEval(eqL, r);
    var zR = safeEval(eqR, r);
    if (!isFinite(zL) || !isFinite(zR) || zL > zR) break;
    aperture = r;
    L.push({ z: zL, r: r });
    R.push({ z: zR, r: r });
  }
  if (aperture <= 0) return { L: [], R: [], aperture: 0 };
  for (var r = -0.2; r >= -MAX_R; r -= 0.2) {
    var zL = safeEval(eqL, r);
    var zR = safeEval(eqR, r);
    if (!isFinite(zL) || !isFinite(zR) || zL > zR) break;
    L.unshift({ z: zL, r: r });
    R.unshift({ z: zR, r: r });
  }
  return { L, R, aperture };
}

export function findIntersection(P, D, eq, box) {
  function f(t) {
    return P.z + t * D.z - safeEval(eq, P.r + t * D.r);
  }
  var t0 = 0.2;
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
    if (t1 < 0.2) return null;
    t0 = Math.max(0.2, t0);
    t1 = Math.min(1000, t1);
    if (t0 > t1) return null;
  }
  var f0 = f(t0);
  for (var t = t0 + 0.2; t <= t1; t += 0.2) {
    var f1 = f(t);
    if (isFinite(f0) && isFinite(f1) && f0 * f1 <= 0) {
      var a = t - 0.2;
      var b = t;
      for (var i = 0; i < 20; i++) {
        var m = 0.5 * (a + b);
        if (f(a) * f(m) <= 0) b = m;
        else a = m;
      }
      var th = 0.5 * (a + b);
      return { z: P.z + th * D.z, r: P.r + th * D.r };
    }
    f0 = f1;
  }
  return null;
}

export function traceRays(eq, eqR, aperture, angle, n, count, box) {
  if (aperture <= 0) return [];
  var rays = [];
  var dir = { z: Math.cos(angle), r: Math.sin(angle) };
  var perp = { z: -dir.r, r: dir.z };
  for (var i = 0; i < count; i++) {
    var r0 = -aperture + (2 * aperture * i) / (count - 1);
    var P = {
      z: -80 * dir.z + r0 * perp.z,
      r: -80 * dir.r + r0 * perp.r,
    };
    var D = normVec(dir);
    var h1 = findIntersection(P, D, eq, box);
    if (!h1) continue;
    var N = normVec({ z: -1, r: deriv(eq, h1.r) });
    if (N.z * D.z + N.r * D.r > 0) N = { z: -N.z, r: -N.r };
    var T1 = refract3d(D, N, 1 / n);
    if (!T1) continue;
    var h2 = findIntersection(
      { z: h1.z + 1e-6 * T1.z, r: h1.r + 1e-6 * T1.r },
      T1, eqR, box
    );
    if (!h2) continue;
    var N2 = normVec({ z: -1, r: deriv(eqR, h2.r) });
    if (N2.z * T1.z + N2.r * T1.r > 0) N2 = { z: -N2.z, r: -N2.r };
    var T2 = refract3d(T1, N2, n);
    if (!T2) continue;
    var end = { z: h2.z + 3000 * T2.z, r: h2.r + 3000 * T2.r };
    rays.push({ P, h1, T1, h2, T2, end, disabled: false });
  }
  return rays;
}
