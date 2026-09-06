import { lazy } from "react";
import type { TranslationKey } from "../i18n";
import { pages } from "../seo-data";

export const cards = pages.map((seo) => {
  const base = {
    icon: seo.id === "lens" ? "🔍" : "📋",
    previewLight: seo.ogImage,
    previewDark: seo.ogImage.replace("-light", "-dark"),
    titleKey: `card.${seo.id}.title` as TranslationKey,
    descKey: `card.${seo.id}.desc` as TranslationKey,
    ogImage: seo.ogImage,
    readmeUrl:
      seo.id === "lens"
        ? "https://github.com/MikhailGovgolenko/Pet-projects/tree/main/src/lens#readme"
        : "#",
  };

  switch (seo.id) {
    case "lens":
      return { ...base, id: seo.id, component: lazy(() => import("../lens/LensPage")) };
    default:
      return { ...base, id: seo.id, component: lazy(() => import("../lens/LensPage")) };
  }
});
