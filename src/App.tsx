import { useState, Suspense } from "react";
import { cards } from "./pages/cards";
import HomePage from "./pages/HomePage";

const pageMap = {};
for (const card of cards) {
  pageMap[card.id] = card.component;
}

export default function App() {
  const [tab, setTab] = useState("home");
  const Page = tab !== "home" && pageMap[tab];

  return (
    <div style={{ height: "100%", background: "var(--bg)", position: "relative" }}>
      {tab !== "home" && (
        <div
          onClick={() => setTab("home")}
          className="glass"
          style={{
            position: "fixed",
            top: 16,
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
        {tab === "home" && <HomePage onNavigate={setTab} />}
        {Page && <Page />}
      </Suspense>
    </div>
  );
}
