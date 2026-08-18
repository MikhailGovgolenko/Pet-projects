import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Language = "ru" | "en";

const ru = {
  "app.home": "На главную",
  "home.open": "Открыть симуляцию",
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
  "card.dither.title": "Dither Engine — 1-битное дизеринг-изображение",
  "card.dither.desc":
    "Живой дизеринг изображений и видео: Bayer, Флойд–Стейнберг, Аткинсон, газетный халфтон, LED-панели, CRT-сканлайны.",
  "card.dither.copyHint": "Скопировать ссылку на компонент во Framer",
  "dither.panel": "Dither Engine",
  "dither.preset": "Пресеты",
  "dither.algorithm": "Алгоритм",
  "dither.shape": "Форма пикселя",
  "dither.colors": "Цвета",
  "dither.fg": "Передний",
  "dither.bg": "Фон",
  "dither.pixel": "Размер пикселя",
  "dither.levels": "Уровни тона",
  "dither.contrast": "Контраст",
  "dither.spacing": "Интервал точек",
  "dither.invert": "Инверсия",
  "dither.animation": "Анимация",
  "dither.cursor": "Эффект курсора",
  "dither.animate": "Анимировать",
  "dither.upload": "Загрузить фото/видео",
  "dither.copyFramer": "Скопировать ссылку Framer",
  "dither.copiedLink": "Ссылка Framer в буфере",
  "dither.copiedTsx": "TSX-код в буфере",
  "dither.copyError": "Не удалось скопировать",
  "dither.copyHint":
    "Копирует ссылку на компонент в маркетплейсе Framer. Если скопировать ссылку не получится, в буфер попадёт весь TSX-код эффекта."
} as const;

export type TranslationKey = keyof typeof ru;

const en: Record<TranslationKey, string> = {
  "app.home": "Home",
  "home.open": "Open simulation",
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
  "card.dither.title": "Dither Engine — 1-bit dithered image",
  "card.dither.desc":
    "Live dithering for images and video: Bayer, Floyd–Steinberg, Atkinson, newspaper halftone, LED walls, CRT scanlines.",
  "card.dither.copyHint": "Copy link to the Framer component",
  "dither.panel": "Dither Engine",
  "dither.preset": "Presets",
  "dither.algorithm": "Algorithm",
  "dither.shape": "Pixel shape",
  "dither.colors": "Colors",
  "dither.fg": "Foreground",
  "dither.bg": "Background",
  "dither.pixel": "Pixel size",
  "dither.levels": "Tone levels",
  "dither.contrast": "Contrast",
  "dither.spacing": "Dot spacing",
  "dither.invert": "Invert",
  "dither.animation": "Animation",
  "dither.cursor": "Cursor effect",
  "dither.animate": "Animate",
  "dither.upload": "Upload photo/video",
  "dither.copyFramer": "Copy Framer link",
  "dither.copiedLink": "Framer link copied",
  "dither.copiedTsx": "TSX code copied",
  "dither.copyError": "Copy failed",
  "dither.copyHint":
    "Copies the link to the component on the Framer marketplace. If the link can't be copied, the full TSX source of the effect goes into the clipboard instead.",
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
