import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import fs from "fs";
import path from "path";

const SITE_URL = "https://pet-projects.govgolenko.ru";
const PROJECTS_DIR = path.resolve(__dirname, "src", "projects");

interface ProjectSeo {
  id: string;
  route: string;
  title: string;
  description: string;
  ogImage?: string;
}

function readProjectSeos(): ProjectSeo[] {
  const entries = fs
    .readdirSync(PROJECTS_DIR, { withFileTypes: true })
    .filter((e) => e.isDirectory());
  const out: ProjectSeo[] = [];
  for (const entry of entries) {
    const mfPath = path.join(PROJECTS_DIR, entry.name, "manifest.json");
    if (!fs.existsSync(mfPath)) continue;
    const manifest = JSON.parse(fs.readFileSync(mfPath, "utf-8"));
    if (manifest.id !== entry.name) {
      throw new Error(
        `[og-pages] manifest id "${manifest.id}" does not match folder "${entry.name}"`
      );
    }
    out.push({
      id: manifest.id,
      route: manifest.route ?? `/${manifest.id}`,
      title: manifest.title,
      description: manifest.description,
      ogImage: manifest.ogImage,
    });
  }
  return out.sort((a, b) => a.id.localeCompare(b.id));
}

const homePage: ProjectSeo = {
  id: "",
  route: "/",
  title: "Pet projects",
  description: "Interactive simulations and tools",
  ogImage: "og-image.png",
};

function escapeAttr(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function pageImageUrl(page: ProjectSeo): string {
  if (!page.ogImage) return `${SITE_URL}/og-image.png`;
  return page.id
    ? `${SITE_URL}/projects/${page.id}/assets/${page.ogImage}`
    : `${SITE_URL}/${page.ogImage}`;
}

function buildHeadTags(page: ProjectSeo, version: string): string {
  const fullUrl = page.id ? `${SITE_URL}/${page.id}/` : `${SITE_URL}/`;
  const fullImage = `${pageImageUrl(page)}?v=${version}`;
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

function ogPagesPlugin(): import("vite").Plugin {
  return {
    name: "og-pages",
    enforce: "post",
    closeBundle() {
      const dist = path.resolve(__dirname, "dist");
      const indexHtml = fs.readFileSync(path.join(dist, "index.html"), "utf-8");

      const socialPreviewBlock = /<!-- Social preview -->[\s\S]*?<title>[^<]*<\/title>/;
      const version = String(Date.now());

      const projects = readProjectSeos();

      // Копируем assets проекта в dist/projects/<id>/assets — они нужны для og:image.
      for (const p of projects) {
        const srcAssets = path.join(PROJECTS_DIR, p.id, "assets");
        if (!fs.existsSync(srcAssets)) continue;
        const dstDir = path.join(dist, "projects", p.id, "assets");
        fs.mkdirSync(dstDir, { recursive: true });
        for (const file of fs.readdirSync(srcAssets)) {
          fs.copyFileSync(path.join(srcAssets, file), path.join(dstDir, file));
        }
      }

      for (const page of [homePage, ...projects]) {
        const newHead = `<!-- Social preview -->${buildHeadTags(page, version)}`;
        const pageHtml = indexHtml.replace(socialPreviewBlock, newHead);

        if (page.id) {
          const dir = path.join(dist, page.route.replace(/^\/+/, ""));
          fs.mkdirSync(dir, { recursive: true });
          fs.writeFileSync(path.join(dir, "index.html"), pageHtml);
        } else {
          fs.writeFileSync(path.join(dist, "index.html"), pageHtml);
        }
      }

      const urls = [homePage, ...projects]
        .map((p) => {
          const loc = p.id ? `${SITE_URL}/${p.id}/` : `${SITE_URL}/`;
          const priority = p.id ? "0.8" : "1.0";
          return `  <url>\n    <loc>${loc}</loc>\n    <changefreq>monthly</changefreq>\n    <priority>${priority}</priority>\n  </url>`;
        })
        .join("\n");
      fs.writeFileSync(
        path.join(dist, "sitemap.xml"),
        `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`
      );

      console.log(
        `[og-pages] Generated pages: ${[homePage, ...projects]
          .map((p) => (p.id ? `/${p.id}/` : "/"))
          .join(", ")}`
      );
      console.log(`[og-pages] sitemap.xml generated (${projects.length} projects)`);
    },
  };
}

export default defineConfig({
  plugins: [react(), ogPagesPlugin()],
  base: "/",
  server: { host: "127.0.0.1", port: 4321, open: true },
});