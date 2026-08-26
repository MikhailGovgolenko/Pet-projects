import { useState, useEffect, Suspense } from "react";
import { cards } from "./pages/cards";
import HomePage from "./pages/HomePage";
import { useI18n } from "./i18n";

const BASE = "/";
const SITE_URL = "https://pet-projects.govgolenko.ru";

var pageMap = {};
var cardDataMap: Record<string, (typeof cards)[number]> = {};
for (const card of cards) {
  pageMap[card.id] = card.component;
  cardDataMap[card.id] = card;
}

function setMeta(property: string, content: string) {
  var el =
    document.querySelector<HTMLMetaElement>(`meta[property="${property}"]`) ||
    document.querySelector<HTMLMetaElement>(`meta[name="${property}"]`);
  if (el) el.content = content;
}

function updateSeo(cardId: string | null, t: (key: string) => string) {
  if (!cardId || !cardDataMap[cardId]) {
    var title = "Pet projects";
    var desc = "Interactive simulations and tools";
    var image = SITE_URL + "/og-image.png";
    var url = SITE_URL + "/";
  } else {
    var card = cardDataMap[cardId];
    var title = t(card.titleKey);
    var desc = t(card.descKey);
    var image = SITE_URL + "/" + card.ogImage;
    var url = SITE_URL + "/" + card.id;
  }

  document.title = title + " | Pet projects";
  setMeta("og:title", title);
  setMeta("og:description", desc);
  setMeta("og:image", image);
  setMeta("og:url", url);
  setMeta("twitter:title", title);
  setMeta("twitter:description", desc);
  setMeta("twitter:image", image);

  var canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (canonical) canonical.href = url;
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

  useEffect(() => {
    var onPop = () => setTab(getTabFromPath());
    addEventListener("popstate", onPop);
    return () => removeEventListener("popstate", onPop);
  }, []);

  useEffect(() => {
    if (tab !== "home") {
      window.scrollTo(0, 0);
      document.documentElement.style.overflow = "hidden";
      document.body.style.overflow = "hidden";
    } else {
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
    }
    updateSeo(tab === "home" ? null : tab, t);
  }, [tab, t]);

  var Page = tab !== "home" && pageMap[tab];

  return (
    <div
      style={{
        minHeight: "100dvh",
        width: "100%",
        background: "var(--bg)",
        position: "relative",
        overflow: "hidden",
      }}
    >
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
