import { projects } from "../projects";
import type { ProjectManifest } from "./types";

export const siteUrl = "https://pet-projects.govgolenko.ru";

export interface PageSeo {
  id: string;
  title: string;
  description: string;
  ogImage: string;
}

export const homePage: PageSeo = {
  id: "",
  title: "Pet projects",
  description: "Interactive simulations and tools",
  ogImage: "og-image.png",
};

export function getSeoForPage(pageId: string | null): PageSeo {
  if (!pageId) return homePage;
  const project = projects.find((p) => p.manifest.id === pageId);
  if (!project) return homePage;
  const manifest: ProjectManifest = project.manifest;
  return {
    id: manifest.id,
    title: manifest.title,
    description: manifest.description,
    ogImage: manifest.ogImage ?? "",
  };
}

/** Абсолютный URL og:image для страницы. */
export function ogImageUrl(seo: PageSeo): string {
  if (!seo.ogImage) return `${siteUrl}/og-image.png`;
  if (!seo.id) return `${siteUrl}/${seo.ogImage}`;
  return `${siteUrl}/projects/${seo.id}/assets/${seo.ogImage}`;
}