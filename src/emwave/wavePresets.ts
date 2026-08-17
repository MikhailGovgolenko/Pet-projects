export const badgeKeys = {
  linear: "emwave.badge.linear",
  circularR: "emwave.badge.circularR",
  circularL: "emwave.badge.circularL",
  elliptic: "emwave.badge.elliptic",
  standing: "emwave.badge.standing",
  interference: "emwave.badge.interference",
  spherical: "emwave.badge.spherical",
  plane_spherical: "emwave.badge.planeSpherical",
  reflection: "emwave.badge.reflection",
};

export const presetInfo = {
  linear: {
    descKey: "emwave.info.linear",
    formulas: ["E = E₀ cos(kz − ωt) x̂", "B = k̂ × E"],
  },
  circularR: {
    descKey: "emwave.info.circularR",
    formulas: ["E = E₀[cos(kz−ωt) x̂ + sin(kz−ωt) ŷ]", "B = k̂ × E"],
  },
  circularL: {
    descKey: "emwave.info.circularL",
    formulas: ["E = E₀[cos(kz−ωt) x̂ − sin(kz−ωt) ŷ]", "B = k̂ × E"],
  },
  elliptic: {
    descKey: "emwave.info.elliptic",
    formulas: ["Eₓ = 2E₀ cos(kz−ωt)", "Eᵧ = E₀ sin(kz−ωt)"],
  },
  standing: {
    descKey: "emwave.info.standing",
    formulas: ["E = 2E₀ cos(kz) cos(ωt) x̂", "B = (2E₀/c) sin(kz) sin(ωt) ŷ"],
  },
  interference: {
    descKey: "emwave.info.interference",
    formulas: ["E = E₁ + E₂", "k₁ · k₂ = |k|² cos 60°"],
  },
  spherical: {
    descKey: "emwave.info.spherical",
    formulas: ["E = E₀ (sin(kr−ωt)/r) θ̂", "B = E₀ (sin(kr−ωt)/r) φ̂"],
  },
  plane_spherical: {
    descKey: "emwave.info.planeSpherical",
    formulas: ["E = E_plane + E_sphere", "B = B_plane + B_sphere"],
  },
  reflection: {
    descKey: "emwave.info.reflection",
    formulas: [
      "E_inc = E₀ e^{i(ωt−kᵢ·r)} ŷ",
      "E_ref = −E₀ e^{i(ωt−kᵣ·r)} ŷ",
      "E = −2E₀ sin(kz cosθ) sin(ωt−kx sinθ) ŷ",
    ],
  },
};