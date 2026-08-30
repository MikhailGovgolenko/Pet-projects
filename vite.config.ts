import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import fs from "fs";
import path from "path";
import { pages, homePage, siteUrl, type PageSeo } from "./src/seo-data";

function buildHeadTags(page: PageSeo, version: string): string {
  const fullUrl = page.id ? `${siteUrl}/${page.id}/` : `${siteUrl}/`;
  const fullImage = `${siteUrl}/${page.ogImage}?v=${version}`;
  const title = page.id ? `${page.title} | Pet projects` : page.title;
  const desc = page.description;

  return `
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Pet projects" />
        <meta property="og:title" content="${escapeAttr(title)}" />
        <meta property="og:description" content="${escapeAttr(desc)}" />
        <link rel="canonical" href="${fullUrl}" />
        <meta property="og:url" content="${fullUrl}" />
        <meta property="og:image" content="${fullImage}" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content="${escapeAttr(title)}" />
        <meta property="og:locale" content="ru_RU" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="${escapeAttr(title)}" />
        <meta name="twitter:description" content="${escapeAttr(desc)}" />
        <meta name="twitter:image" content="${fullImage}" />

        <title>${escapeHtml(title)}</title>`;
}

function escapeAttr(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function ogPagesPlugin(): import("vite").Plugin {
  return {
    name: "og-pages",
    enforce: "post",
    closeBundle() {
      const dist = path.resolve(__dirname, "dist");
      const indexHtml = fs.readFileSync(path.join(dist, "index.html"), "utf-8");

      const socialPreviewBlock = /<!-- Social preview -->[\s\S]*?<title>[^<]*<\/title>/;
      const version = String(Date.now());

      for (const page of [homePage, ...pages]) {
        const newHead = `<!-- Social preview -->${buildHeadTags(page, version)}`;
        const pageHtml = indexHtml.replace(socialPreviewBlock, newHead);

        if (page.id) {
          const dir = path.join(dist, page.id);
          fs.mkdirSync(dir, { recursive: true });
          fs.writeFileSync(path.join(dir, "index.html"), pageHtml);
        } else {
          fs.writeFileSync(path.join(dist, "index.html"), pageHtml);
        }
      }

      console.log(`[og-pages] Generated pages: ${[homePage, ...pages].map((p) => (p.id ? `/${p.id}/` : "/")).join(", ")}`);
    },
  };
}

export default defineConfig({
  plugins: [react(), ogPagesPlugin()],
  base: "/",
  server: { host: "127.0.0.1", port: 4321, open: true },
});
