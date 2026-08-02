import { lazy } from "react";

export const cards = [
  {
    id: "lens",
    icon: "🔍",
    title: "Симметричная линза без сферической аберрации",
    description: "Моделирование преломления света в симметричной линзе. Визуализация хода лучей, фокусного расстояния и аберраций.",
    readmeUrl: "https://github.com/MikhailGovgolenko/Pet-projects/tree/main/src/lens#readme",
    component: lazy(() => import("../lens/LensPage")),
  },
];
