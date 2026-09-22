import { lazy } from "react";
import type { ProjectModule } from "../../core/types";
import { ru } from "./i18n/ru";
import { en } from "./i18n/en";
import manifest from "./manifest.json";

const Page = lazy(() => import("./SpendMoneyPage"));

const project: ProjectModule = {
  manifest,
  Page,
  translations: { ru, en },
  card: { heroEmoji: "💸" },
};

export default project;