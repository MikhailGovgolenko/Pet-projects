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
    ogImage: "lens-preview-light.png",
    readmeUrl: "https://github.com/MikhailGovgolenko/Pet-projects/tree/main/src/lens#readme",
    component: lazy(() => import("../lens/LensPage")),
  },
  {
    id: "agenda",
    icon: "📋",
    previewLight: "agenda-preview-light.png",
    previewDark: "agenda-preview-dark.png",
    titleKey: "card.agenda.title" as TranslationKey,
    descKey: "card.agenda.desc" as TranslationKey,
    ogImage: "agenda-preview-light.png",
    readmeUrl: "#",
    component: lazy(() => import("../agenda/AgendaPage")),
  },
];
