import { lazy } from "react";
import type { TranslationKey } from "../i18n";

export const cards = [
  {
    id: "lens",
    icon: "🔍",
    previewLight: "lens-preview-light.png",
    previewDark: "lens-preview-dark.png",
    titleKey: "card.lens.title" as TranslationKey,
    descKey: "card.lens.desc" as TranslationKey,
    readmeUrl: "https://github.com/MikhailGovgolenko/Pet-projects/tree/main/src/lens#readme",
    component: lazy(() => import("../lens/LensPage")),
  },
  {
    id: "pet",
    icon: "🐱",
    hero: lazy(() => import("../pet/PetCardPreview")),
    titleKey: "card.pet.title" as TranslationKey,
    descKey: "card.pet.desc" as TranslationKey,
    readmeUrl: "https://github.com/MikhailGovgolenko/Pet-projects/tree/main/src/pet#readme",
    component: lazy(() => import("../pet/PetPage")),
  },
  {
    id: "EMWave",
    icon: "⚡",
    previewLight: "emwave-preview-light.png",
    previewDark: "emwave-preview-dark.png",
    titleKey: "card.emwave.title" as TranslationKey,
    descKey: "card.emwave.desc" as TranslationKey,
    readmeUrl: "https://github.com/MikhailGovgolenko/Pet-projects/tree/main/src/emwave#readme",
    component: lazy(() => import("../emwave/WavePage")),
  },
];
