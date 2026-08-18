import { lazy, type ReactNode } from "react";
import type { TranslationKey } from "../i18n";
import DitherEngine from "../dither/DitherEngine";

export const cards: {
  id: string;
  icon: string;
  previewLight?: string;
  previewDark?: string;
  preview?: ReactNode;
  titleKey: TranslationKey;
  descKey: TranslationKey;
  readmeUrl: string;
  component: ReturnType<typeof lazy>;
}[] = [
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
    id: "dither",
    icon: "🧊",
    preview: (
      <DitherEngine
        config={{
          algorithm: "bayer8",
          shape: "square",
          fg: "#f2e9d8",
          bg: "#0c0a08",
          pixel: 3,
          levels: 2,
          contrast: 18,
          invert: false,
          animation: "none",
          cursorEffect: "reveal",
          animate: true,
        }}
        autoCursor
        style={{ height: 200 }}
      />
    ),
    titleKey: "card.dither.title" as TranslationKey,
    descKey: "card.dither.desc" as TranslationKey,
    readmeUrl: "https://github.com/MikhailGovgolenko/Pet-projects/tree/main/src/dither",
    component: lazy(() => import("../dither/DitherPage")),
  },
];