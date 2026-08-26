import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Language = "ru" | "en";

const ru = {
  "app.home": "На главную",
  "home.open": "Открыть",
  "card.lens.title": "Симметричная линза без сферической аберрации",
  "card.lens.desc":
    "Моделирование преломления света в симметричной линзе. Визуализация хода лучей, фокусного расстояния и аберраций.",
  "lens.panel": "Линза",
  "lens.mode3d": "3D-вид",
  "lens.useField": "Использовать поле для уравнения",
  "lens.refraction": "Преломление n",
  "lens.beamAngle": "Угол пучка (°)",
  "lens.rayCount": "Кол-во лучей",
  "lens.keepFailed": "Показывать непреломлённые лучи",
  "lens.polynomial": "Полином z(r)=z₀+a₂r²+a₄r⁴+a₆r⁶",
  "lens.scale": "Масштаб",
  "lens.resetView": "Сбросить вид",
  "lens.eqError": "Ошибка формулы",
  "lens.noWebgl": "WebGL недоступен в этом браузере",
  "lens.viewError": "Ошибка отрисовки сцены",
  "lens.retry": "Повторить",
  "lens.useReflections": "Учитывать отражения",
  "card.agenda.title": "Повестки: Запад vs Кремль",
  "card.agenda.desc":
    "Сравнение двух повесток: что предлагают на Западе и в Кремле. Скачайте PDF и узнайте ключевые отличия.",
  "agenda.west.title": "Западная повестка",
  "agenda.west.subtitle": "(или «Доктрина общего блага, НАТО и внезапных исключений»)",
  "agenda.west.desc":
    "Демократия, права человека, свободный рынок, зелёный переход, НАТО и санкции.\nУкраину поддерживаем, Россию сдерживаем, Китай: внимательно наблюдаем.\n\nГлавный принцип: «Мы за мир, но сначала давайте согласуем пакет помощи».\n\nСвободный рынок работает отлично, пока стратегически важная компания не становится китайской. Тогда рынок внезапно получает геополитическую проблему и новый пакет регулирования.\n\n198 страниц.\nНа 1-й: «Мы едины».\nНа 198-й: «Приложение: почему Венгрия опять не согласна».",
  "agenda.west.btn": "Скачать западную повестку PDF",
  "agenda.kremlin.title": "Кремлёвская повестка",
  "agenda.kremlin.subtitle": "(или «Концепция суверенитета, многополярности и импортозамещения с китайским интерфейсом»)",
  "agenda.kremlin.desc":
    "Суверенитет, традиционные ценности, многополярность, сильное государство и стратегическая автономия.\n\nУкраина — главная тема внешней политики, Запад — коллективный источник угроз, Китай — стратегический партнёр, а импортозамещение — уникальная программа, в рамках которой отечественная промышленность героически осваивает технологии, произведённые в Китае.\n\nГлавный принцип: «Мы сами решаем, что нам нужно. Особенно если это уже есть у китайцев».\n\n214 страниц.\nНа 1-й: «Мы полностью самостоятельны».\nНа 214-й: «Список стратегических партнёров, у которых можно купить всё остальное».",
  "agenda.kremlin.btn": "Скачать кремлёвскую повестку PDF",
} as const;

export type TranslationKey = keyof typeof ru;

const en: Record<TranslationKey, string> = {
  "app.home": "Home",
  "home.open": "Open",
  "card.lens.title": "Symmetric lens without spherical aberration",
  "card.lens.desc":
    "Simulation of light refraction in a symmetric lens. Visualization of ray paths, focal distance and aberrations.",
  "lens.panel": "Lens",
  "lens.mode3d": "3D view",
  "lens.useField": "Use equation field",
  "lens.refraction": "Refraction n",
  "lens.beamAngle": "Beam angle (°)",
  "lens.rayCount": "Ray count",
  "lens.keepFailed": "Show non-refracted rays",
  "lens.polynomial": "Polynomial z(r)=z₀+a₂r²+a₄r⁴+a₆r⁶",
  "lens.scale": "Scale",
  "lens.resetView": "Reset view",
  "lens.eqError": "Formula error",
  "lens.noWebgl": "WebGL is unavailable in this browser",
  "lens.viewError": "Scene render error",
  "lens.retry": "Retry",
  "lens.useReflections": "Consider reflections",
  "card.agenda.title": "Agendas: West vs Kremlin",
  "card.agenda.desc":
    "Comparison of two agendas: what the West and the Kremlin propose. Download PDFs to see the key differences.",
  "agenda.west.title": "Western Agenda",
  "agenda.west.subtitle": "(or The Doctrine of Common Good, NATO, and Sudden Exceptions)",
  "agenda.west.desc":
    "Democracy, human rights, free market, green transition, NATO and sanctions.\nWe support Ukraine, contain Russia, and carefully watch China.\n\nThe main principle: We are for peace, but first let's approve an aid package.\n\nThe free market works perfectly until a strategically important company becomes Chinese. Then the market suddenly gets a geopolitical problem and a new regulatory package.\n\n198 pages.\nPage 1: We are united.\nPage 198: Appendix: Why Hungary disagrees again.",
  "agenda.west.btn": "Download Western Agenda PDF",
  "agenda.kremlin.title": "Kremlin Agenda",
  "agenda.kremlin.subtitle": "(or The Concept of Sovereignty, Multipolarity, and Import Substitution with a Chinese Interface)",
  "agenda.kremlin.desc":
    "Sovereignty, traditional values, multipolarity, strong state and strategic autonomy.\n\nUkraine is the main topic of foreign policy, the West is a collective source of threats, China is a strategic partner, and import substitution is a unique program under which domestic industry heroically masters technologies produced in China.\n\nThe main principle: We decide what we need. Especially if the Chinese already have it.\n\n214 pages.\nPage 1: We are completely independent.\nPage 214: List of strategic partners from whom everything else can be purchased.",
  "agenda.kremlin.btn": "Download Kremlin Agenda PDF",
};

const dictionaries: Record<Language, Record<TranslationKey, string>> = { ru, en };

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
  t: (key) => dictionaries.en[key],
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang] = useState<Language>(detectLanguage);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const t = (key: TranslationKey) => dictionaries[lang][key];

  return <I18nContext.Provider value={{ lang, t }}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  return useContext(I18nContext);
}
