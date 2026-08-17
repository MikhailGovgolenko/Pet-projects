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
  "lens.useReflections": "Учитывать отражения",
  "emwave.preset": "Пресет",
  "emwave.amp": "Амплитуда",
  "emwave.angle": "Угол падения",
  "emwave.beam": "Гауссов пучок",
  "emwave.beamWidth": "Ширина пучка",
  "emwave.field": "Векторное поле",
  "emwave.front": "Волновой фронт",
  "emwave.lines": "Линии E/B",
  "emwave.arrows": "Стрелки волны",
  "emwave.k": "k-вектор",
  "emwave.envelope": "Огибающая пучка",
  "emwave.legend": "Обозначения",
  "emwave.envelopeLegend": "Огибающая",
  "emwave.physics": "Физика",
  "emwave.badge.wave": "Волна",
  "emwave.preset.linear": "Линейная поляризация",
  "emwave.preset.circularR": "Круговая поляризация (R)",
  "emwave.preset.circularL": "Круговая поляризация (L)",
  "emwave.preset.elliptic": "Эллиптическая поляризация",
  "emwave.preset.standing": "Стоячая волна",
  "emwave.preset.interference": "2D Интерференция",
  "emwave.preset.spherical": "Сферическая волна",
  "emwave.preset.planeSpherical": "Плоская+Сферическая",
  "emwave.preset.reflection": "Отражение от плоскости",
  "emwave.badge.linear": "Плоская волна · Линейная поляризация",
  "emwave.badge.circularR": "Плоская волна · Круговая поляризация (R)",
  "emwave.badge.circularL": "Плоская волна · Круговая поляризация (L)",
  "emwave.badge.elliptic": "Плоская волна · Эллиптическая поляризация",
  "emwave.badge.standing": "Стоячая волна",
  "emwave.badge.interference": "Интерференция плоских волн",
  "emwave.badge.spherical": "Сферическая волна",
  "emwave.badge.planeSpherical": "Рассеяние: плоская + сферическая",
  "emwave.badge.reflection": "Отражение от плоскости",
  "emwave.info.linear": "Бегущая плоская волна с линейной поляризацией. Векторы E, B и k образуют правую тройку.",
  "emwave.info.circularR": "Правая круговая поляризация (R). Конец вектора E описывает круг по часовой стрелке при взгляде навстречу волне.",
  "emwave.info.circularL": "Левая круговая поляризация (L). Конец вектора E описывает круг против часовой стрелки при взгляде навстречу волне.",
  "emwave.info.elliptic": "Эллиптическая поляризация. Амплитуды по осям x и y различны, конец вектора E описывает эллипс.",
  "emwave.info.standing": "Стоячая волна. Узлы E совпадают с пучностями B. Поля сдвинуты по фазе на π/2 в пространстве и времени.",
  "emwave.info.interference": "Интерференция двух плоских волн с углом 60° между волновыми векторами. Образуется пространственно-временная картина биений.",
  "emwave.info.spherical": "Сферическая волна от точечного источника. Поля затухают как 1/r. E ⊥ r, B ⊥ r, E ⊥ B.",
  "emwave.info.planeSpherical": "Суперпозиция плоской волны и сферической (модель рассеяния). Векторное поле показывает интерференцию падающей и рассеянной волн.",
  "emwave.info.reflection": "Отражение s-поляризованной волны от идеальной плоской поверхности под углом {angle}°. В первой среде падающая и отражённая волны интерферируют, образуя стоячую структуру вдоль нормали и бегущую волну вдоль поверхности."
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
  "emwave.preset": "Preset",
  "emwave.amp": "Amplitude",
  "emwave.angle": "Incidence angle",
  "emwave.beam": "Gaussian beam",
  "emwave.beamWidth": "Beam width",
  "emwave.field": "Vector field",
  "emwave.front": "Wave front",
  "emwave.lines": "E/B field lines",
  "emwave.arrows": "Wave arrows",
  "emwave.k": "k-vector",
  "emwave.envelope": "Beam envelope",
  "emwave.legend": "Legend",
  "emwave.envelopeLegend": "Envelope",
  "emwave.physics": "Physics",
  "emwave.badge.wave": "Wave",
  "emwave.preset.linear": "Linear polarization",
  "emwave.preset.circularR": "Circular polarization (R)",
  "emwave.preset.circularL": "Circular polarization (L)",
  "emwave.preset.elliptic": "Elliptic polarization",
  "emwave.preset.standing": "Standing wave",
  "emwave.preset.interference": "2D Interference",
  "emwave.preset.spherical": "Spherical wave",
  "emwave.preset.planeSpherical": "Plane+Spherical",
  "emwave.preset.reflection": "Reflection from a plane",
  "emwave.badge.linear": "Plane wave · Linear polarization",
  "emwave.badge.circularR": "Plane wave · Circular polarization (R)",
  "emwave.badge.circularL": "Plane wave · Circular polarization (L)",
  "emwave.badge.elliptic": "Plane wave · Elliptic polarization",
  "emwave.badge.standing": "Standing wave",
  "emwave.badge.interference": "Interference of plane waves",
  "emwave.badge.spherical": "Spherical wave",
  "emwave.badge.planeSpherical": "Scattering: plane + spherical",
  "emwave.badge.reflection": "Reflection from a plane",
  "emwave.info.linear": "A traveling plane wave with linear polarization. Vectors E, B and k form a right-handed triple.",
  "emwave.info.circularR": "Right circular polarization (R). The tip of E traces a circle clockwise when viewed toward the wave.",
  "emwave.info.circularL": "Left circular polarization (L). The tip of E traces a circle counterclockwise when viewed toward the wave.",
  "emwave.info.elliptic": "Elliptic polarization. The amplitudes along the x and y axes differ, the tip of E traces an ellipse.",
  "emwave.info.standing": "Standing wave. The nodes of E coincide with the antinodes of B. The fields are phase-shifted by π/2 in space and time.",
  "emwave.info.interference": "Interference of two plane waves with a 60° angle between the wave vectors. A spatiotemporal beating pattern forms.",
  "emwave.info.spherical": "Spherical wave from a point source. The fields decay as 1/r. E ⊥ r, B ⊥ r, E ⊥ B.",
  "emwave.info.planeSpherical": "Superposition of a plane wave and a spherical wave (scattering model). The vector field shows interference of the incident and scattered waves.",
  "emwave.info.reflection": "Reflection of an s-polarized wave from an ideal plane surface at an angle of {angle}°. In the first medium the incident and reflected waves interfere, forming a standing structure along the normal and a traveling wave along the surface.",
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
