import { cards } from "./cards";
import { useI18n } from "../i18n";

export default function HomePage({ onNavigate }) {
  const { t } = useI18n();
  return (
    <div
      className="home-page"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        transition: "background 0.4s ease",
      }}
    >
      <style>{`
        @keyframes fadeInDown {
          from { opacity: 0; translate: 0 -20px; }
          to { opacity: 1; translate: 0 0; }
        }
        @keyframes fadeInUp {
          from { opacity: 0; translate: 0 20px; }
          to { opacity: 1; translate: 0 0; }
        }

        .home-page {
          position: relative;
          min-height: 100vh;
          min-height: 100dvh;
          background: var(--bg);
          padding: calc(48px + env(safe-area-inset-top)) 20px
            calc(32px + env(safe-area-inset-bottom));
          overflow-x: hidden;
          overflow-y: auto;
        }

        .home-title { animation: fadeInDown 0.8s ease both; }
        .card-wrap {
          position: relative;
          animation: fadeInUp 0.7s ease both;
          border-radius: 28px;
          isolation: isolate;
          transform: translateZ(0);
          transition: transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .card-wrap:nth-child(1) { animation-delay: 0.1s; }
        .card-wrap:nth-child(2) { animation-delay: 0.2s; }

        @media (hover: hover) {
          .card-wrap:hover { transform: translateY(-4px) scale(1.01); }
        }

        .home-card {
          position: relative;
          z-index: 1;
          display: flex;
          flex-direction: column;
          padding: 28px;
          color: inherit;
          cursor: pointer;
          height: 100%;
          overflow: hidden;
          transition: box-shadow 0.35s ease, background 0.35s ease;
          /* backdrop-filter на соседних карточках + transform = глитч в Chrome;
             на однотонном фоне blur всё равно незаметен */
          backdrop-filter: none;
          -webkit-backdrop-filter: none;
        }
        @media (hover: hover) {
          .card-wrap:hover .home-card {
            box-shadow: 0 20px 60px rgba(0,0,0,0.15), var(--glass-shadow);
            background: var(--card-hover);
          }
          .card-wrap:hover .card-action { color: var(--accent); }
          .card-wrap:hover .card-arrow {
            transform: translateX(3px);
            background: rgba(0,212,255,0.12);
          }
        }

        .card-icon {
          width: 48px;
          height: 48px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 22px;
          margin-bottom: 18px;
          flex-shrink: 0;
          background: linear-gradient(135deg, rgba(0,212,255,0.15), rgba(0,119,182,0.15));
          border: 1px solid rgba(0,212,255,0.25);
          color: var(--accent);
        }

        .home-card h2 {
          font-size: 20px;
          font-weight: 700;
          margin-bottom: 8px;
          letter-spacing: -0.3px;
          padding-right: 80px;
        }

        .home-card p {
          font-size: 14px;
          color: var(--text-sec);
          line-height: 1.5;
          flex: 1;
        }

        .card-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: 20px;
        }

        .card-action {
          font-size: 13px;
          font-weight: 600;
          color: var(--text-sec);
        }

        .card-arrow {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: rgba(255,255,255,0.05);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.2s, background 0.2s;
          flex-shrink: 0;
        }
        .card-arrow::after {
          content: '';
          width: 6px;
          height: 6px;
          border-right: 2px solid var(--accent);
          border-top: 2px solid var(--accent);
          transform: rotate(45deg);
          margin-left: -1px;
        }

        .readme-badge {
          position: absolute;
          top: 20px;
          right: 20px;
          padding: 6px 12px;
          border-radius: 100px;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.6px;
          text-decoration: none;
          color: var(--text-sec);
          background: rgba(128, 128, 128, 0.12);
          border: 1px solid var(--glass-border);
          box-shadow: var(--glass-shadow);
          z-index: 5;
          transition: color 0.2s ease, border-color 0.2s ease, background 0.2s ease;
        }
        @media (prefers-color-scheme: light) {
          .readme-badge {
            background: rgba(0, 0, 0, 0.06);
          }
        }
        .readme-badge:hover {
          color: var(--accent);
          border-color: var(--accent);
          background: var(--card-hover);
        }

        @media (max-width: 480px) {
          .home-page { padding-left: 14px; padding-right: 14px; }
          .home-title { margin-bottom: 32px; }
          .home-title h1 { font-size: 32px; letter-spacing: -1px; }
          .home-card { padding: 22px; }
          .home-card h2 { font-size: 18px; padding-right: 56px; }
          .card-icon { width: 42px; height: 42px; font-size: 19px; }
        }
      `}</style>

      <header className="home-title" style={{ textAlign: "center", marginBottom: 48, position: "relative", zIndex: 1 }}>
        <h1
          style={{
            fontSize: 42,
            fontWeight: 900,
            fontFamily: "'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
            letterSpacing: "-1.5px",
            background: "linear-gradient(135deg, var(--accent), #7ec8e3)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          Pet projects
        </h1>
      </header>

      <div
        style={{
          position: "relative",
          zIndex: 1,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(min(300px, 100%), 1fr))",
          gap: 20,
          width: "100%",
          maxWidth: 960,
        }}
      >
        {cards.map(function (card) {
          return (
            <div className="card-wrap" key={card.id}>
              <div
                className="glass home-card"
                onClick={() => onNavigate(card.id)}
              >
                <div className="card-icon">{card.icon}</div>
                <h2>{t(card.titleKey)}</h2>
                <p>{t(card.descKey)}</p>
                <div className="card-footer">
                  <span className="card-action">{t("home.open")}</span>
                  <div className="card-arrow"></div>
                </div>
              </div>
              <a
                href={card.readmeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="readme-badge"
              >
                📄 Readme
              </a>
            </div>
          );
        })}
      </div>
    </div>
  );
}
