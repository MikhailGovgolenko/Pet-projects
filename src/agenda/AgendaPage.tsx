import { useState } from "react";
import { useI18n } from "../i18n";

function renderText(text: string) {
  return text.split("\n").map((line, i, arr) => (
    <span key={i}>
      {line}
      {i < arr.length - 1 && <br />}
    </span>
  ));
}

export default function AgendaPage() {
  const { t } = useI18n();
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2000);
  };

  return (
    <div
      style={{
        height: "100dvh",
        width: "100%",
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "calc(48px + env(safe-area-inset-top)) 20px calc(48px + env(safe-area-inset-bottom))",
        position: "relative",
      }}
    >
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; translate: 0 16px; }
          to { opacity: 1; translate: 0 0; }
        }
        @keyframes fadeOut {
          from { opacity: 1; }
          to { opacity: 0; }
        }
        .agenda-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          width: 100%;
          max-width: 1000px;
          margin: auto 0;
          animation: fadeIn 0.6s ease both;
        }
        .agenda-card {
          min-width: 0;
        }
        .agenda-card:nth-child(1) { animation-delay: 0s; }
        .agenda-card:nth-child(2) { animation-delay: 0.1s; }
        .agenda-section {
          background: var(--glass-bg);
          border: 1px solid var(--glass-border);
          border-radius: 20px;
          padding: 28px;
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          display: flex;
          flex-direction: column;
        }
        .agenda-section h2 {
          font-size: 18px;
          font-weight: 700;
          margin: 0 0 2px;
          letter-spacing: -0.3px;
        }
        .agenda-section .agenda-subtitle {
          font-size: 13px;
          color: var(--text-sec);
          font-style: italic;
          margin: 0 0 14px;
          opacity: 0.8;
        }
        .agenda-section p {
          font-size: 14px;
          color: var(--text);
          line-height: 1.6;
          margin: 0 0 18px;
          white-space: pre-line;
        }
        .agenda-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 600;
          border: 1px solid var(--glass-border);
          background: linear-gradient(135deg, rgba(0,212,255,0.12), rgba(0,119,182,0.12));
          color: var(--accent);
          cursor: pointer;
          transition: background 0.2s, border-color 0.2s, transform 0.2s;
        }
        .agenda-btn:hover {
          background: linear-gradient(135deg, rgba(0,212,255,0.22), rgba(0,119,182,0.22));
          border-color: var(--accent);
          transform: translateY(-1px);
        }
        .agenda-btn:active {
          transform: translateY(0);
        }
        .agenda-toast {
          position: fixed;
          bottom: 40px;
          left: 50%;
          transform: translateX(-50%);
          padding: 12px 24px;
          border-radius: 12px;
          background: var(--glass-bg);
          border: 1px solid var(--glass-border);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          font-size: 14px;
          font-weight: 600;
          color: var(--accent);
          z-index: 200;
          animation: fadeIn 0.25s ease;
          pointer-events: none;
        }
        .agenda-toast.hide {
          animation: fadeOut 0.3s ease forwards;
        }
        @media (max-width: 700px) {
          .agenda-row {
            grid-template-columns: 1fr;
            max-width: 480px;
          }
        }
      `}</style>

      <div className="agenda-row">
        <div className="agenda-card agenda-section">
          <h2>{t("agenda.west.title")}</h2>
          <div className="agenda-subtitle">{t("agenda.west.subtitle")}</div>
          <p>{renderText(t("agenda.west.desc"))}</p>
          <div style={{ marginTop: "auto" }}>
            <button className="agenda-btn" onClick={() => showToast("Coming soon")}>
              📄 {t("agenda.west.btn")}
            </button>
          </div>
        </div>

        <div className="agenda-card agenda-section">
          <h2>{t("agenda.kremlin.title")}</h2>
          <div className="agenda-subtitle">{t("agenda.kremlin.subtitle")}</div>
          <p>{renderText(t("agenda.kremlin.desc"))}</p>
          <div style={{ marginTop: "auto" }}>
            <button className="agenda-btn" onClick={() => showToast("Coming soon")}>
              📄 {t("agenda.kremlin.btn")}
            </button>
          </div>
        </div>
      </div>

      {toast && <div className="agenda-toast">{toast}</div>}
    </div>
  );
}
