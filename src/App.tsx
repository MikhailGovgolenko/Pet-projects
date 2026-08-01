import { useState, useEffect, Suspense } from "react";
import { cards } from "./pages/cards";
import HomePage from "./pages/HomePage";

const BASE = "/Pet-projects/";

var pageMap = {};
for (const card of cards) {
  pageMap[card.id] = card.component;
}

function getTabFromPath() {
  var stored = sessionStorage.redirect;
  if (stored) {
    sessionStorage.removeItem("redirect");
    return stored.replace(BASE, "") || "home";
  }
  return location.pathname.replace(BASE, "") || "home";
}

function updateUrl(tab: string) {
  var path = tab === "home" ? BASE : BASE + tab;
  history.pushState(null, "", path);
}

export default function App() {
  const [tab, setTab] = useState(getTabFromPath);

  useEffect(() => {
    var onPop = () => setTab(getTabFromPath());
    addEventListener("popstate", onPop);
    return () => removeEventListener("popstate", onPop);
  }, []);

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
          <span>На главную</span>
        </div>
      )}

      <Suspense fallback={null}>
        {tab === "home" && <HomePage onNavigate={(t) => { setTab(t); updateUrl(t); }} />}
        {Page && <Page />}
      </Suspense>
    </div>
  );
}
