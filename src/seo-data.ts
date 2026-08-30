export interface PageSeo {
  id: string;
  title: string;
  description: string;
  ogImage: string;
}

export const siteUrl = "https://pet-projects.govgolenko.ru";

export const homePage: PageSeo = {
  id: "",
  title: "Pet projects",
  description: "Interactive simulations and tools",
  ogImage: "og-image.png",
};

export const pages: PageSeo[] = [
  {
    id: "lens",
    title: "Симметричная линза без сферической аберрации",
    description:
      "Моделирование преломления света в симметричной линзе. Визуализация хода лучей, фокусного расстояния и аберраций.",
    ogImage: "lens-preview-light.png",
  },
  {
    id: "agenda",
    title: "Повестки: Запад vs Кремль. скачать PDF",
    description:
      "Сравнение двух повесток: что предлагают на Западе и в Кремле. Скачайте повестки в формате PDF и узнайте ключевые отличия.",
    ogImage: "agenda-preview-light.png",
  },
];

export function getSeoForPage(pageId: string | null): PageSeo {
  if (!pageId) return homePage;
  return pages.find((p) => p.id === pageId) ?? homePage;
}
