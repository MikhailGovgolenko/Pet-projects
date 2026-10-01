import { lazy } from "react";
import type { ProjectModule } from "../../core/types";
import { ru } from "./i18n/ru";
import { en } from "./i18n/en";
import manifest from "./manifest.json";
import previewLight from "./assets/preview-light.png";

const Page = lazy(() => import("./PlayerPage"));

const project: ProjectModule = {
  manifest,
  Page,
  translations: { ru, en },
  // Обложка не зависит от темы, поэтому один и тот же файл на светлую и тёмную схемы.
  card: { previewLight },
};

export default project;