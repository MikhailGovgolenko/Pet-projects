import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Language = "ru" | "en";

const ru = {
  "app.home": "На главную",
  "home.open": "Открыть симуляцию",
  "card.lens.title": "Симметричная линза без сферической аберрации",
  "card.lens.desc":
    "Моделирование преломления света в симметричной линзе. Визуализация хода лучей, фокусного расстояния и аберраций.",
  "card.pet.title": "Интерактивный 3D-питомец",
  "card.pet.desc":
    "Огненный маскот, который следит за курсором, моргает и болтает с вами. Выбирайте одного из четырёх персонажей — Pip, Puff, Botty или Spook.",
  "card.emwave.title": "Электромагнитная волна",
  "card.emwave.desc":
    "Плоские и сферические электромагнитные волны. Поляризация, стоячие волны, интерференция и гауссовы пучки.",
  "pet.panel": "Питомец",
  "pet.character": "Персонаж",
  "pet.size": "Размер",
  "pet.speed": "Скорость",
  "pet.follow": "Следить за курсором",
  "pet.bubble": "Пузырь сообщений",
  "pet.hint": "Водите курсором — питомец будет следить за ним 👀",
  "pet.noWebgl": "WebGL недоступен в этом браузере",
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
  "lens.useReflections": "Учитывать отражения"
} as const;

export type TranslationKey = keyof typeof ru;

const en: Record<TranslationKey, string> = {
  "app.home": "Home",
  "home.open": "Open simulation",
  "card.lens.title": "Symmetric lens without spherical aberration",
  "card.lens.desc":
    "Simulation of light refraction in a symmetric lens. Visualization of ray paths, focal distance and aberrations.",
  "card.pet.title": "Interactive 3D pet",
  "card.pet.desc":
    "A fiery mascot that follows your cursor, blinks and chats with you. Pick one of four characters — Pip, Puff, Botty or Spook.",
  "card.emwave.title": "Electromagnetic wave",
  "card.emwave.desc":
    "Plane and spherical electromagnetic waves. Polarization, standing waves, interference and Gaussian beams.",
  "pet.panel": "Pet",
  "pet.character": "Character",
  "pet.size": "Size",
  "pet.speed": "Speed",
  "pet.follow": "Follow cursor",
  "pet.bubble": "Speech bubble",
  "pet.hint": "Move your cursor — the pet will follow it 👀",
  "pet.noWebgl": "WebGL is unavailable in this browser",
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
