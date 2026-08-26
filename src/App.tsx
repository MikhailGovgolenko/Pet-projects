import { useState, useEffect, useRef, Suspense } from "react";
import { cards } from "./pages/cards";
import HomePage from "./pages/HomePage";
import { useI18n } from "./i18n";
import { siteUrl, getSeoForPage } from "./seo-data";

const BASE = "/";

var pageMap = {};
for (const card of cards) {
  pageMap[card.id] = card.component;
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
  var fullImage = `${siteUrl}/${seo.ogImage}`;
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
    var recovered = stored.replace(BASE, "") || "home";
    history.replaceState(null, "", recovered === "home" ? BASE : BASE + recovered);
    return recovered;
  }
  return location.pathname.replace(BASE, "") || "home";
}

function updateUrl(tab: string) {
  var path = tab === "home" ? BASE : BASE + tab;
  history.pushState(null, "", path);
}

export default function App() {
  const { t } = useI18n();
  const [tab, setTab] = useState(getTabFromPath);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    var onPop = () => setTab(getTabFromPath());
    addEventListener("popstate", onPop);
    return () => removeEventListener("popstate", onPop);
  }, []);

  useEffect(() => {
    if (rootRef.current) {
      rootRef.current.style.overflow = tab !== "home" ? "hidden" : "";
    }
    updateSeo(tab === "home" ? null : tab);
  }, [tab]);

  var Page = tab !== "home" && pageMap[tab];

  return (
    <div
      ref={rootRef}
      style={{
        minHeight: "100dvh",
        width: "100%",
        position: "relative",
        overflowX: "hidden",
      }}
    >
      <style>{`
        #root::before {
          content: "";
          position: fixed;
          inset: 0;
          background: var(--bg);
          z-index: -1;
        }
      `}</style>
      {tab !== "home" && (
        <div
          onClick={() => { setTab("home"); updateUrl("home"); }}
          className="glass"
          style={{
            position: "fixed",
            top: "calc(16px + env(safe-area-inset-top))",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 100,
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "8px 16px",
            borderRadius: 100,
            cursor: "pointer",
            fontSize: 13,
            fontWeight: 600,
            color: "var(--text-sec)",
            transition: "color 0.2s",
            userSelect: "none",
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = "var(--accent)"}
          onMouseLeave={(e) => e.currentTarget.style.color = "var(--text-sec)"}
        >
          <span style={{ fontSize: 16 }}>🏠</span>
          <span>{t("app.home")}</span>
        </div>
      )}

      <Suspense fallback={null}>
        {tab === "home" && <HomePage onNavigate={(t) => { setTab(t); updateUrl(t); }} />}
        {Page && <Page />}
      </Suspense>
    </div>
  );
}
