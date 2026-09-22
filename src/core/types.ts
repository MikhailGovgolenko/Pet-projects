import type { ComponentType } from "react";

export interface ProjectManifest {
  /** Формат архива .project, в котором написан данный manifest. */
  formatVersion: number;
  /** Версия API проекта, с которой совместим модуль (текущая: 1). */
  apiVersion: number;
  /** Уникальный slug проекта, совпадает с именем каталога. */
  id: string;
  /** URL-путь, например "/lens". */
  route: string;
  title: string;
  description: string;
  /** Эмодзи/иконка для карточки на главной. */
  icon: string;
  /** Имя файла в assets/ для og:image (без пути). */
  ogImage?: string;
  /** Внешняя ссылка "Readme" для карточки. */
  readme?: string;
}

export interface ProjectTranslations {
  ru: Record<string, string>;
  en: Record<string, string>;
}

export interface ProjectModule {
  manifest: ProjectManifest;
  Page: ComponentType;
  /** Плоские ключи переводов этого проекта (с префиксом `${id}.`, card.${id}.*). */
  translations?: ProjectTranslations;
  /** Данные карточки, которые не помещаются в manifest (например, превью-картинки). */
  card?: {
    previewLight?: string;
    previewDark?: string;
    /** Большой эмодзи-герой на одной половине карточки (вместо превью-картинки). */
    heroEmoji?: string;
  };
}