import { lazy } from "react";
import type { TranslationKey } from "../i18n";

export const cards = [
  {
    id: "lens",
    icon: "🔍",
    titleKey: "card.lens.title" as TranslationKey,
    descKey: "card.lens.desc" as TranslationKey,
    readmeUrl: "https://github.com/MikhailGovgolenko/Pet-projects/tree/main/src/lens#readme",
    component: lazy(() => import("../lens/LensPage")),
  },
];
