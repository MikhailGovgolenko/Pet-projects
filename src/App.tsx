import { useState, useEffect, Suspense, lazy } from "react";
import { projects } from "./projects";
import HomePage from "./core/HomePage";
import { useI18n } from "./core/i18n";
import { siteUrl, getSeoForPage, ogImageUrl } from "./core/seo";

const DebugOverlay = lazy(() => import("./components/DebugOverlay"));

const BASE = "/";

const DEBUG =
  typeof location !== "undefined" &&
  new URLSearchParams(location.search).has("debug");

var pageMap = {};
for (const project of projects) {
  pageMap[project.manifest.id] = project.Page;
}

function setMeta(property: string, content: string) {
  var el =
    document.querySelector<HTMLMetaElement>(`meta[property="${property}"]`) ||
    document.querySelector<HTMLMetaElement>(`meta[name="${property}"]`);
  if (el) el.content = content;
}

function updateSeo(cardId: string | null) {
  var seo = getSeoForPage(cardId);
  var fullUrl = seo.id ? `${siteUrl}/${seo.id}/` : `${siteUrl}/`;
  var fullImage = ogImageUrl(seo);
  var title = seo.id ? `${seo.title} | Pet projects` : seo.title;

  document.title = title;
  setMeta("og:title", title);
  setMeta("og:description", seo.description);
  setMeta("og:image", fullImage);
  setMeta("og:url", fullUrl);
  setMeta("og:image:alt", title);
  setMeta("twitter:title", title);
  setMeta("twitter:description", seo.description);
  setMeta("twitter:image", fullImage);

  var canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (canonical) canonical.href = fullUrl;
}

function getTabFromPath() {
  var stored = sessionStorage.redirect;
  if (stored) {
    sessionStorage.removeItem("redirect");
    var recovered = stored.replace(/^\/+|\/+$/g, "") || "home";
    history.replaceState(null, "", recovered === "home" ? BASE : BASE + recovered);
    return recovered;
  }
  return location.pathname.replace(/^\/+|\/+$/g, "") || "home";
}

function updateUrl(tab: string) {
  var path = tab === "home" ? BASE : BASE + tab;
  history.pushState(null, "", path);
}

export default function App() {
  const { t } = useI18n();
  const [tab, setTab] = useState(getTabFromPath);

  useEffect(() => {
    var onPop = () => setTab(getTabFromPath());
    addEventListener("popstate", onPop);
    return () => removeEventListener("popstate", onPop);
  }, []);

  useEffect(() => {
    updateSeo(tab === "home" ? null : tab);
  }, [tab]);

  var Page = tab !== "home" && pageMap[tab];

  return (
    <div
      style={{
        minHeight: "100dvh",
        width: "100%",
        position: "relative",
        background: "var(--bg)",
      }}
    >
      {tab !== "home" && (
        <site-home-button
          href="/"
          label={t("app.home")}
          aria-label={t("app.home")}
          onClick={(event) => {
            event.preventDefault();
            setTab("home");
            updateUrl("home");
          }}
        />
      )}

      <Suspense fallback={null}>
        {tab === "home" && <HomePage onNavigate={(t) => { setTab(t); updateUrl(t); }} />}
        {Page && <Page />}
      </Suspense>

      {DEBUG && (
        <Suspense fallback={null}>
          <DebugOverlay />
        </Suspense>
      )}
    </div>
  );
}