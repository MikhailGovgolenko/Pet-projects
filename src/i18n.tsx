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
  "card.dither.copyHint": "Скопировать TSX-код эффекта в буфер",
  "dither.panel": "Dither Engine",
  "dither.preset": "Пресеты",
  "dither.custom": "Свой",
  "dither.media": "Медиа",
  "dither.image": "Фото",
  "dither.video": "Видео",
  "dither.fill": "Заполнить",
  "dither.fitOption": "Вписать",
  "dither.algorithm": "Алгоритм",
  "dither.shape": "Форма пикселя",
  "dither.colors": "Цвета",
  "dither.fg": "Передний",
  "dither.bg": "Фон",
  "dither.gradientA": "Цвет A",
  "dither.gradientB": "Цвет B",
  "dither.angle": "Угол",
  "dither.settings": "Настройки",
  "dither.pixel": "Размер пикселя",
  "dither.levels": "Уровни тона",
  "dither.contrast": "Контраст",
  "dither.brightness": "Яркость",
  "dither.spacing": "Интервал точек",
  "dither.invert": "Инверсия",
  "dither.animation": "Анимация",
  "dither.speed": "Скорость",
  "dither.motionFull": "Весь кадр",
  "dither.motionImage": "Только картинка",
  "dither.cursor": "Эффект курсора",
  "dither.cursorRange": "Радиус курсора",
  "dither.strength": "Сила",
  "dither.radius": "Радиус углов",
  "dither.upload": "Загрузить фото/видео",
  "dither.copyCode": "Код эффекта",
  "dither.copiedCode": "Код в буфере",
  "dither.copyError": "Не удалось скопировать",
  "dither.copyHint":
    "Кнопка кладёт в буфер обмена весь TSX-код эффекта — один файл без зависимостей."
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
  "card.dither.copyHint": "Copy the effect's TSX code to the clipboard",
  "dither.panel": "Dither Engine",
  "dither.preset": "Presets",
  "dither.custom": "Custom",
  "dither.media": "Media",
  "dither.image": "Image",
  "dither.video": "Video",
  "dither.fill": "Fill",
  "dither.fitOption": "Fit",
  "dither.algorithm": "Algorithm",
  "dither.shape": "Pixel shape",
  "dither.colors": "Colors",
  "dither.fg": "Foreground",
  "dither.bg": "Background",
  "dither.gradientA": "Color A",
  "dither.gradientB": "Color B",
  "dither.angle": "Angle",
  "dither.settings": "Settings",
  "dither.pixel": "Pixel size",
  "dither.levels": "Tone levels",
  "dither.contrast": "Contrast",
  "dither.brightness": "Brightness",
  "dither.spacing": "Dot spacing",
  "dither.invert": "Invert",
  "dither.animation": "Animation",
  "dither.speed": "Speed",
  "dither.motionFull": "Full frame",
  "dither.motionImage": "Image only",
  "dither.cursor": "Cursor effect",
  "dither.cursorRange": "Cursor range",
  "dither.strength": "Strength",
  "dither.radius": "Corner radius",
  "dither.upload": "Upload photo/video",
  "dither.copyCode": "Copy code",
  "dither.copiedCode": "Code copied",
  "dither.copyError": "Copy failed",
  "dither.copyHint":
    "Puts the entire TSX source of the effect into the clipboard — a single dependency-free file.",
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
