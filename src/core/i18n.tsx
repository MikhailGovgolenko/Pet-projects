import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { projects } from "../projects";

export type Language = "ru" | "en";
export type TranslationKey = string;

const coreRu: Record<string, string> = {
  "app.home": "На главную",
  "home.open": "Открыть",
};

const coreEn: Record<string, string> = {
  "app.home": "Home",
  "home.open": "Open",
};

const ru: Record<string, string> = { ...coreRu };
const en: Record<string, string> = { ...coreEn };

for (const project of projects) {
  Object.assign(ru, project.translations?.ru);
  Object.assign(en, project.translations?.en);
}

const dictionaries: Record<Language, Record<string, string>> = { ru, en };

function detectLanguage(): Language {
  if (typeof navigator !== "undefined") {
    const lang = navigator.language?.toLowerCase() ?? "";
    if (lang.startsWith("ru")) return "ru";
  }
  return "en";
}

interface I18nContextValue {
  lang: Language;
  t: (key: TranslationKey) => string;
}

const I18nContext = createContext<I18nContextValue>({
  lang: "en",
  t: (key) => dictionaries.en[key] ?? key,
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang] = useState<Language>(detectLanguage);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const t = (key: TranslationKey) => dictionaries[lang][key] ?? key;

  return <I18nContext.Provider value={{ lang, t }}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  return useContext(I18nContext);
}