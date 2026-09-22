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
  if (aperture <= 0) return { L: [], R: [], aperture: 0 };
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

export function traceRays(eq, eqR, aperture, angle, n, count, box, keepFailed) {
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
    var end = { z: P.z + 3000 * D.z, r: P.r + 3000 * D.r };
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
      var Np = normal2d(surf, hp);
      if (Np.z * cdir.z + Np.r * cdir.r > 0) Np = { z: -Np.z, r: -Np.r };
      var cosIp = -(Np.z * cdir.z + Np.r * cdir.r);
      var Rp = fresnelReflectance(cosIp, n, 1);
      // push inner segment only if visible
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

    if (h1) {
      var N = normal2d(eq, h1);
      if (N.z * D.z + N.r * D.r > 0) N = { z: -N.z, r: -N.r };
      var cosI1 = -(N.z * D.z + N.r * D.r);
      r1 = fresnelReflectance(cosI1, 1, n);
      t1 = fresnelTransmittance(cosI1, 1, n);
      rdir = reflect2d(D, N);
      var T1 = refract3d(D, N, 1 / n);
      if (T1) {
        var h2p = findIntersection(
          { z: h1.z + 1e-6 * T1.z, r: h1.r + 1e-6 * T1.r },
          T1, eqR, box
        );
        if (h2p) {
          h2 = h2p;
          var N2 = normal2d(eqR, h2);
          if (N2.z * T1.z + N2.r * T1.r > 0) N2 = { z: -N2.z, r: -N2.r };
          var cosI2 = -(N2.z * T1.z + N2.r * T1.r);
          var R2 = fresnelReflectance(cosI2, n, 1);
          t2 = fresnelTransmittance(cosI2, n, 1);
          var rdir2 = reflect2d(T1, N2);
          var T2 = refract3d(T1, N2, n);
          if (T2) {
            ok = true;
            end = { z: h2.z + 3000 * T2.z, r: h2.r + 3000 * T2.r };
          } else {
            tir = true;
            end = { z: h2.z + 3000 * rdir2.z, r: h2.r + 3000 * rdir2.r };
          }
          bounce(h2, rdir2, t1 * R2, 0);
        } else {
          end = { z: h1.z + 3000 * T1.z, r: h1.r + 3000 * T1.r };
        }
      }
    }
    return { P, h1, h2, end, ok, tir, t1, t2, r1, rdir, inner, esc };
  }

  function uniform(n) {
    var res = [];
    for (var i = 0; i < n; i++) {
      res.push(n > 1 ? (-aperture + (2 * aperture * i) / (n - 1)) * scale : 0);
    }
    return res;
  }

  var offsets = uniform(count);
  if (keepFailed === false) {
    var probe = uniform(Math.max(count, 40));
    var best = null;
    var runStart = -1;
    for (var i = 0; i < probe.length; i++) {
      var pr = traceOne(probe[i]);
      var okP = pr.ok || pr.tir;
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
    if (keepFailed === false && !ray.ok && !ray.tir) continue;
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
  var h2 = null;
  var ok = false;
  var tir = false;
  var t1 = 0;
  var t2 = 0;
  var r1 = 0;
  var rdir = null;
  var inner = [];
  var esc = [];
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
    var Np = normal(surf, hp);
    if (Np.x * cdir.x + Np.y * cdir.y + Np.z * cdir.z > 0) Np = { x: -Np.x, y: -Np.y, z: -Np.z };
    var cosIp = -(Np.x * cdir.x + Np.y * cdir.y + Np.z * cdir.z);
    var Rp = fresnelReflectance(cosIp, n, 1);
    inner.push({ a: cp, b: hp, i: ci });
    var Tdir = refract3(cdir, Np, n);
    if (Tdir) {
      esc.push({ p: hp, dir: Tdir, i: ci * fresnelTransmittance(cosIp, n, 1) });
    }
    bounce(hp, reflect(cdir, Np), ci * Rp, depth + 1);
  }

  if (h1) {
    var N = normal(eq, h1);
    if (N.x * D.x + N.y * D.y + N.z * D.z > 0) N = { x: -N.x, y: -N.y, z: -N.z };
    var cosI1 = -(N.x * D.x + N.y * D.y + N.z * D.z);
    r1 = fresnelReflectance(cosI1, 1, n);
    t1 = fresnelTransmittance(cosI1, 1, n);
    rdir = reflect(D, N);
    var T1 = refract3(D, N, 1 / n);
    if (T1) {
      var h2p = findHit3(eqR, { x: h1.x + 1e-6 * T1.x, y: h1.y + 1e-6 * T1.y, z: h1.z + 1e-6 * T1.z }, T1, box);
      if (h2p) {
        h2 = h2p;
        var N2 = normal(eqR, h2);
        if (N2.x * T1.x + N2.y * T1.y + N2.z * T1.z > 0) N2 = { x: -N2.x, y: -N2.y, z: -N2.z };
        var cosI2 = -(N2.x * T1.x + N2.y * T1.y + N2.z * T1.z);
        var R2 = fresnelReflectance(cosI2, n, 1);
        t2 = fresnelTransmittance(cosI2, n, 1);
        var rdir2 = reflect(T1, N2);
        var T2 = refract3(T1, N2, n);
        if (T2) {
          ok = true;
          end = { x: h2.x + endDist * T2.x, y: h2.y + endDist * T2.y, z: h2.z + endDist * T2.z };
        } else {
          tir = true;
          end = { x: h2.x + endDist * rdir2.x, y: h2.y + endDist * rdir2.y, z: h2.z + endDist * rdir2.z };
        }
        bounce(h2, rdir2, t1 * R2, 0);
      } else {
        end = { x: h1.x + endDist * T1.x, y: h1.y + endDist * T1.y, z: h1.z + endDist * T1.z };
      }
    }
  }
  return { P, h1, h2, end, ok, tir, t1, t2, r1, rdir, inner, esc };
}
