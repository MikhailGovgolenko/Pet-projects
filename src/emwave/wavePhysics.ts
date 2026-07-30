export const presets = {
  linear: {
    label: "Линейная поляризация",
    build: (kVal, omegaVal) => [
      { A: [1, 0, 0], K: [0, 0, kVal], omega: omegaVal, phase: 0 },
    ],
  },
  circularR: {
    label: "Круговая поляризация (R)",
    build: (kVal, omegaVal) => [
      { A: [1, 0, 0], K: [0, 0, kVal], omega: omegaVal, phase: 0 },
      { A: [0, 1, 0], K: [0, 0, kVal], omega: omegaVal, phase: -Math.PI / 2 },
    ],
  },
  circularL: {
    label: "Круговая поляризация (L)",
    build: (kVal, omegaVal) => [
      { A: [1, 0, 0], K: [0, 0, kVal], omega: omegaVal, phase: 0 },
      { A: [0, 1, 0], K: [0, 0, kVal], omega: omegaVal, phase: Math.PI / 2 },
    ],
  },
  elliptic: {
    label: "Эллиптическая поляризация",
    build: (kVal, omegaVal) => [
      { A: [2, 0, 0], K: [0, 0, kVal], omega: omegaVal, phase: 0 },
      { A: [0, 1, 0], K: [0, 0, kVal], omega: omegaVal, phase: -Math.PI / 2 },
    ],
  },
  standing: {
    label: "Стоячая волна",
    build: (kVal, omegaVal) => [
      { A: [1, 0, 0], K: [0, 0, kVal], omega: omegaVal, phase: 0 },
      { A: [1, 0, 0], K: [0, 0, -kVal], omega: omegaVal, phase: 0 },
    ],
  },
  interference: {
    label: "2D Интерференция",
    build: (kVal, omegaVal) => [
      { A: [1, 0, 0], K: [0, 0, kVal], omega: omegaVal, phase: 0 },
      { A: [1, 0, 0], K: [kVal * 0.5, 0, kVal * 0.866], omega: omegaVal, phase: 0 },
    ],
  },
  spherical: {
    label: "Сферическая волна",
    build: () => [],
    isSpherical: true,
  },
  plane_spherical: {
    label: "Плоская + Сферическая",
    build: (kVal, omegaVal) => [
      { A: [0.5, 0, 0], K: [0, 0, kVal], omega: omegaVal, phase: 0 },
    ],
    hasSpherical: true,
  },
  reflection: {
    label: "Отражение от плоскости",
    build: (kVal, omegaVal, angle) => [
      { A: [0, 1, 0], K: [kVal * Math.sin(angle), 0, -kVal * Math.cos(angle)], omega: omegaVal, phase: 0 },
      { A: [0, -1, 0], K: [kVal * Math.sin(angle), 0, kVal * Math.cos(angle)], omega: omegaVal, phase: 0 },
    ],
  },
};

export function normalize(v) {
  var len = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
  if (len === 0) return [0, 0, 0];
  return [v[0] / len, v[1] / len, v[2] / len];
}

export function cross(a, b) {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
}

export function dot(a, b) {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

export function scale(v, s) {
  return [v[0] * s, v[1] * s, v[2] * s];
}

export function add(a, b) {
  return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
}

export function sub(a, b) {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

export function len(v) {
  return Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
}

export function getPlaneFields(r, t, waves, kVal, omegaVal, ampVal, beamMode, beamWidth) {
  var E = [0, 0, 0];
  var B = [0, 0, 0];
  var avgK = [0, 0, 0];

  for (var wi = 0; wi < waves.length; wi++) {
    var w = waves[wi];
    var phase = dot(w.K, r) - omegaVal * t + w.phase;
    var kDir = normalize(w.K);
    avgK[0] += kDir[0];
    avgK[1] += kDir[1];
    avgK[2] += kDir[2];

    var env = 1;
    if (beamMode) {
      var perpDist = Math.sqrt(
        (r[0] - kDir[0] * dot(r, kDir)) ** 2 +
        (r[1] - kDir[1] * dot(r, kDir)) ** 2 +
        (r[2] - kDir[2] * dot(r, kDir)) ** 2
      );
      env = Math.exp(-(perpDist * perpDist) / (beamWidth * beamWidth));
    }

    var Ei = scale(w.A, ampVal * Math.cos(phase) * env);
    E = add(E, Ei);

    var kCrossE = cross(kDir, Ei);
    B = add(B, kCrossE);
  }

  if (waves.length > 0) {
    avgK = normalize(avgK);
  }

  return { E, B, avgK };
}

export function getSphericalFields(r, t, kVal, omegaVal, ampVal) {
  var posLen = len(r);
  if (posLen < 0.01) return { E: [0, 0, 0], B: [0, 0, 0], avgK: [0, 0, 1] };

  var phase = kVal * posLen - omegaVal * t;
  var amplitude = ampVal * Math.sin(phase) / posLen;

  var eR = normalize(r);
  var eTheta, ePhi;

  var up = [0, 1, 0];
  if (Math.abs(dot(eR, up)) > 0.99) up = [1, 0, 0];
  ePhi = normalize(cross(eR, up));
  eTheta = cross(ePhi, eR);

  var E = scale(eTheta, amplitude);
  var B = scale(ePhi, amplitude);

  return { E, B, avgK: eR };
}

export function getFields(r, t, preset, waves, kVal, omegaVal, ampVal, beamMode, beamWidth) {
  if (preset === "spherical") {
    return getSphericalFields(r, t, kVal, omegaVal, ampVal);
  }
  var fields = getPlaneFields(r, t, waves, kVal, omegaVal, ampVal, beamMode, beamWidth);
  if (preset === "plane_spherical") {
    var sph = getSphericalFields(r, t, kVal, omegaVal, ampVal * 0.6);
    fields.E = add(fields.E, sph.E);
    fields.B = add(fields.B, sph.B);
  }
  return fields;
}
