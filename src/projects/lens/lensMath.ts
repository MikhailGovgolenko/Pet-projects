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
      var hr = P.r + th * D.r;
      return { z: safeEval(eq, hr), r: hr };
    }
    f0 = f1;
  }
  return null;
}

function findApertureExit2D(P, D, aperture) {
  if (Math.abs(D.r) < 1e-9) return { z: P.z, r: P.r };
  var targetR = D.r > 0 ? aperture : -aperture;
  var t = (targetR - P.r) / D.r;
  if (t <= 0) return { z: P.z, r: P.r };
  return { z: P.z + t * D.z, r: targetR };
}

function findApertureExit3D(P, D, aperture) {
  var a = D.x * D.x + D.y * D.y;
  if (a < 1e-18) return { x: P.x, y: P.y, z: P.z };
  var b = 2 * (P.x * D.x + P.y * D.y);
  var c = P.x * P.x + P.y * P.y - aperture * aperture;
  var discriminant = b * b - 4 * a * c;
  if (discriminant < 0) return { x: P.x, y: P.y, z: P.z };
  var root = Math.sqrt(discriminant);
  var t0 = (-b - root) / (2 * a);
  var t1 = (-b + root) / (2 * a);
  var t = t0 > 1e-6 ? t0 : t1 > 1e-6 ? t1 : 0;
  return { x: P.x + t * D.x, y: P.y + t * D.y, z: P.z + t * D.z };
}

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
    var ok = false;
    var tir = false;
    var edgeExit = false;
    var end = { z: P.z + 3000 * D.z, r: P.r + 3000 * D.r };
    function reflect2d(I, N) {
      var cosI = -(N.z * I.z + N.r * I.r);
      return { z: I.z + 2 * cosI * N.z, r: I.r + 2 * cosI * N.r };
    }
    if (h1) {
      var N = normVec({ z: -1, r: deriv(eq, h1.r) });
      if (N.z * D.z + N.r * D.r > 0) N = { z: -N.z, r: -N.r };
      var T1 = refract3d(D, N, 1 / n);
      if (T1) {
        var h2p = findIntersection(
          { z: h1.z + 1e-6 * T1.z, r: h1.r + 1e-6 * T1.r },
          T1, eqR, box
        );
        if (h2p) {
          h2 = h2p;
          var N2 = normVec({ z: -1, r: deriv(eqR, h2.r) });
          if (N2.z * T1.z + N2.r * T1.r > 0) N2 = { z: -N2.z, r: -N2.r };
          var T2 = refract3d(T1, N2, n);
          if (T2) {
            ok = true;
            end = { z: h2.z + 3000 * T2.z, r: h2.r + 3000 * T2.r };
          } else {
            var rdir2 = reflect2d(T1, N2);
            tir = true;
            end = { z: h2.z + 3000 * rdir2.z, r: h2.r + 3000 * rdir2.r };
          }
        } else {
          end = findApertureExit2D(h1, T1, aperture);
          edgeExit = true;
        }
      }
    }
    return { P, h1, h2, end, ok, tir, edgeExit, t1: 1, t2: tir ? 0 : 1 };
  }

  function uniform(n) {
    var res = [];
    for (var i = 0; i < n; i++) {
      res.push(n > 1 ? (-aperture + (2 * aperture * i) / (n - 1)) * scale : 0);
    }
    return res;
  }

  var offsets = uniform(count);
  {
    var probe = uniform(Math.max(count, 40));
    var best = null;
    var runStart = -1;
    for (var i = 0; i < probe.length; i++) {
      var probeRay = traceOne(probe[i]);
      var okP = probeRay.ok;
      if (okP && runStart === -1) runStart = i;
      if ((!okP || i === probe.length - 1) && runStart !== -1) {
        var runEnd = okP ? i : i - 1;
        var w = probe[runEnd] - probe[runStart];
        if (!best || w > best.w) best = { lo: probe[runStart], hi: probe[runEnd], w };
        runStart = -1;
      }
    }
    if (!best) return [];
    var span = best.hi - best.lo;
    for (var i = 0; i < count; i++) {
      offsets[i] = count > 1 ? best.lo + (span * i) / (count - 1) : 0.5 * (best.lo + best.hi);
    }
  }

  var rays = [];
  for (var i = 0; i < count; i++) {
    var ray = traceOne(offsets[i]);
    if (!ray.ok) continue;
    rays.push(ray);
  }
  return rays;
}

export function norm3(v) {
  var L = Math.hypot(v.x, v.y, v.z);
  return { x: v.x / L, y: v.y / L, z: v.z / L };
}

export function refract3(I, N, eta) {
  var cosi = -(N.x * I.x + N.y * I.y + N.z * I.z);
  var k = 1 - eta * eta * (1 - cosi * cosi);
  if (k < 0) return null;
  var f = eta * cosi - Math.sqrt(k);
  return { x: eta * I.x + f * N.x, y: eta * I.y + f * N.y, z: eta * I.z + f * N.z };
}

export function findHit3(eq, P, D, box) {
  function r(t) {
    return Math.hypot(P.x + t * D.x, P.y + t * D.y);
  }
  function f(t) {
    return P.z + t * D.z - safeEval(eq, r(t));
  }
  var t0 = 0.2;
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
      return { x: P.x + th * D.x, y: P.y + th * D.y, z: P.z + th * D.z };
    }
    f0 = f1;
  }
  return null;
}

export function traceRay3D(eq, eqR, P, D, n, box, endDist) {
  var end = { x: P.x + endDist * D.x, y: P.y + endDist * D.y, z: P.z + endDist * D.z };
  var h1 = findHit3(eq, P, D, box);
  if (!h1) return { P, h1: null, h2: null, end, ok: false };
  var r1 = Math.hypot(h1.x, h1.y);
  var N = r1 < 1e-9
    ? { x: 0, y: 0, z: -1 }
    : norm3({ x: (deriv(eq, r1) * h1.x) / r1, y: (deriv(eq, r1) * h1.y) / r1, z: -1 });
  if (N.x * D.x + N.y * D.y + N.z * D.z > 0) N = { x: -N.x, y: -N.y, z: -N.z };
  var T1 = refract3(D, N, 1 / n);
  if (!T1) return { P, h1, h2: null, end, ok: false };
  var h2 = findHit3(eqR, { x: h1.x + 1e-6 * T1.x, y: h1.y + 1e-6 * T1.y, z: h1.z + 1e-6 * T1.z }, T1, box);
  if (!h2) {
    return { P, h1, h2: null, end: findApertureExit3D(h1, T1, box.r1), ok: false, edgeExit: true };
  }
  var r2 = Math.hypot(h2.x, h2.y);
  var N2 = r2 < 1e-9
    ? { x: 0, y: 0, z: -1 }
    : norm3({ x: (deriv(eqR, r2) * h2.x) / r2, y: (deriv(eqR, r2) * h2.y) / r2, z: -1 });
  if (N2.x * T1.x + N2.y * T1.y + N2.z * T1.z > 0) N2 = { x: -N2.x, y: -N2.y, z: -N2.z };
  var T2 = refract3(T1, N2, n);
  if (T2) {
    return { P, h1, h2, end: { x: h2.x + endDist * T2.x, y: h2.y + endDist * T2.y, z: h2.z + endDist * T2.z }, ok: true };
  }
  var cosI2 = -(N2.x * T1.x + N2.y * T1.y + N2.z * T1.z);
  var rdir2 = { x: T1.x + 2 * cosI2 * N2.x, y: T1.y + 2 * cosI2 * N2.y, z: T1.z + 2 * cosI2 * N2.z };
  return { P, h1, h2, end: { x: h2.x + endDist * rdir2.x, y: h2.y + endDist * rdir2.y, z: h2.z + endDist * rdir2.z }, ok: false, tir: true };
}
