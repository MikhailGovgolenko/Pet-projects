import { lazy } from "react";
import type { ProjectModule } from "../../core/types";
import { ru } from "./i18n/ru";
import { en } from "./i18n/en";
import manifest from "./manifest.json";
import previewLight from "./assets/preview-light.png";
import previewDark from "./assets/preview-dark.png";
import "./styles.css";

const Page = lazy(() => import("./LensPage"));

const project: ProjectModule = {
  manifest,
  Page,
  translations: { ru, en },
  card: { previewLight, previewDark },
};

export default project;