import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import fs from "fs";
import path from "path";

const SITE_URL = "https://pet-projects.govgolenko.ru";

const cards = [
  {
    id: "lens",
    title: "Симметричная линза без сферической аберрации",
    titleEn: "Symmetric lens without spherical aberration",
    desc: "Моделирование преломления света в симметричной линзе. Визуализация хода лучей, фокусного расстояния и аберраций.",
    descEn: "Simulation of light refraction in a symmetric lens. Visualization of ray paths, focal distance and aberrations.",
    ogImage: "lens-preview-light.png",
  },
  {
    id: "agenda",
    title: "Повестки: Запад vs Кремль",
    titleEn: "Agendas: West vs Kremlin",
    desc: "Сравнение двух повесток: что предлагают на Западе и в Кремле. Скачайте PDF и узнайте ключевые отличия.",
    descEn: "Comparison of two agendas: what the West and the Kremlin propose. Download PDFs to see the key differences.",
    ogImage: "agenda-preview-light.png",
  },
];

function ogPagesPlugin(): import("vite").Plugin {
  return {
    name: "og-pages",
    enforce: "post",
    closeBundle() {
      const dist = path.resolve(__dirname, "dist");
      const indexHtml = fs.readFileSync(path.join(dist, "index.html"), "utf-8");

      for (const card of cards) {
        const pageHtml = indexHtml
          .replace(
            /<meta property="og:title" content="[^"]*" \/>/,
            `<meta property="og:title" content="${card.title}" />`
          )
          .replace(
            /<meta\s+property="og:description"\s+content="[^"]*"\s+\/>/,
            `<meta property="og:description" content="${card.desc}" />`
          )
          .replace(
            /<meta property="og:image" content="[^"]*" \/>/,
            `<meta property="og:image" content="${SITE_URL}/${card.ogImage}" />`
          )
          .replace(
            /<link rel="canonical" href="[^"]*" \/>/,
            `<link rel="canonical" href="${SITE_URL}/${card.id}" />`
          )
          .replace(
            /<meta property="og:url" content="[^"]*" \/>/,
            `<meta property="og:url" content="${SITE_URL}/${card.id}" />`
          )
          .replace(
            /<meta name="twitter:title" content="[^"]*" \/>/,
            `<meta name="twitter:title" content="${card.title}" />`
          )
          .replace(
            /<meta\s+name="twitter:description"\s+content="[^"]*"\s+\/>/,
            `<meta name="twitter:description" content="${card.desc}" />`
          )
          .replace(
            /<meta name="twitter:image" content="[^"]*" \/>/,
            `<meta name="twitter:image" content="${SITE_URL}/${card.ogImage}" />`
          )
          .replace(
            /<title>[^<]*<\/title>/,
            `<title>${card.title} | Pet projects</title>`
          );

        const dir = path.join(dist, card.id);
        fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(path.join(dir, "index.html"), pageHtml);
      }

      console.log(`[og-pages] Generated OG pages for: ${cards.map((c) => c.id).join(", ")}`);
    },
  };
}

export default defineConfig({
  plugins: [react(), ogPagesPlugin()],
  base: "/",
  server: { host: "127.0.0.1", port: 4321, open: true },
});
