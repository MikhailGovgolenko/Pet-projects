import { lazy, useEffect, useState, type ReactNode } from "react";
import type { TranslationKey } from "../i18n";
import DitherEngine from "../dither/DitherEngine";

function DitherCardPreview() {
  const [light, setLight] = useState(
    () => typeof window.matchMedia === "function" && window.matchMedia("(prefers-color-scheme: light)").matches
  );
  useEffect(() => {
    const mql = window.matchMedia("(prefers-color-scheme: light)");
    const onChange = (e: MediaQueryListEvent) => setLight(e.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);
  return (
    <DitherEngine
      preset="monoPrint"
      animMode="none"
      mouseMode="trail"
      mouseRadius={180}
      mouseStrength={0.6}
      autoCursor
      foreground={light ? "#111111" : "#FFFFFF"}
      background={light ? "#F4F4F0" : "#0A0A0A"}
      style={{ height: "var(--card-preview-h, 200px)" }}
    />
  );
}

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
    preview: <DitherCardPreview />,
    titleKey: "card.dither.title" as TranslationKey,
    descKey: "card.dither.desc" as TranslationKey,
    readmeUrl: "https://github.com/MikhailGovgolenko/Pet-projects/tree/main/src/dither",
    component: lazy(() => import("../dither/DitherPage")),
  },
];