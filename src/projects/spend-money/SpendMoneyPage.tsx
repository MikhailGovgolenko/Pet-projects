import { useEffect, useState } from "react";
import { useI18n } from "../../core/i18n";
import { getDonationPaymentUrl } from "./config";

export default function SpendMoneyPage() {
  const { t } = useI18n();
  const paymentUrl = getDonationPaymentUrl();
  const configured = paymentUrl !== null;
  const [wobble, setWobble] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="spend-page">
      <style>{`
        .spend-page {
          position: relative;
          min-height: 100vh;
          min-height: 100dvh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 20px;
          text-align: center;
          padding: calc(96px + env(safe-area-inset-top))
            calc(20px + env(safe-area-inset-right))
            calc(48px + env(safe-area-inset-bottom))
            calc(20px + env(safe-area-inset-left));
        }

        .spend-title {
          font-size: clamp(34px, 6vw, 54px);
          font-weight: 900;
          font-family: "Roboto", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          letter-spacing: -1.5px;
          background: linear-gradient(135deg, var(--accent), #7ec8e3);
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: spendFadeUp 0.8s ease both;
        }

        .spend-subtitle {
          font-size: 15px;
          color: var(--text-sec);
          line-height: 1.6;
          max-width: 420px;
          animation: spendFadeUp 0.8s ease 0.08s both;
        }

        .spend-btn-wrap {
          margin-top: 12px;
          animation: spendFadeUp 0.7s ease 0.16s both;
        }

        .spend-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 20px 46px;
          border-radius: 100px;
          font-family: inherit;
          font-size: 18px;
          font-weight: 800;
          letter-spacing: 0.3px;
          color: #fff;
          text-decoration: none;
          background: linear-gradient(135deg, rgba(0, 212, 255, 0.9), rgba(0, 119, 182, 0.9));
          box-shadow:
            0 12px 40px rgba(0, 119, 182, 0.35),
            inset 0 0.5px 0 rgba(255, 255, 255, 0.25);
          cursor: pointer;
          user-select: none;
          -webkit-tap-highlight-color: transparent;
          outline-offset: 3px;
          transition:
            transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1),
            box-shadow 0.25s ease,
            opacity 0.25s ease;
        }
        @media (hover: hover) {
          .spend-btn:hover {
            transform: translateY(-2px) scale(1.04);
            box-shadow:
              0 18px 50px rgba(0, 119, 182, 0.45),
              inset 0 0.5px 0 rgba(255, 255, 255, 0.25);
          }
        }
        .spend-btn:active {
          transform: translateY(1px) scale(0.96);
          box-shadow:
            0 6px 20px rgba(0, 119, 182, 0.3),
            inset 0 0.5px 0 rgba(255, 255, 255, 0.15);
        }
        .spend-btn:focus-visible {
          outline: 2px solid var(--accent);
        }

        .spend-btn.wobble {
          animation: spendWobble 0.5s ease;
        }

        @keyframes spendFadeUp {
          from { opacity: 0; transform: translateY(18px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes spendWobble {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-10px) rotate(-2deg); }
          40% { transform: translateX(10px) rotate(2deg); }
          60% { transform: translateX(-6px) rotate(-1deg); }
          80% { transform: translateX(6px) rotate(1deg); }
        }

        .spend-note {
          font-size: 12px;
          color: var(--text-sec);
          min-height: 1.6em;
          line-height: 1.6;
        }

        @media (max-width: 480px) {
          .spend-title { font-size: 32px; }
          .spend-btn { padding: 16px 34px; font-size: 16px; }
        }
      `}</style>

      <h1 className="spend-title">{t("spend.title")}</h1>
      <p className="spend-subtitle">{t("spend.subtitle")}</p>

      <div className="spend-btn-wrap">
        <a
          className={"spend-btn" + (wobble ? " wobble" : "")}
          href={configured ? paymentUrl : undefined}
          target="_blank"
          rel="noopener noreferrer"
          onAnimationEnd={() => setWobble(false)}
          onClick={(e) => {
            if (configured) return;
            e.preventDefault();
            setWobble(true);
          }}
        >
          {t("spend.button")}
        </a>
      </div>

      <p className="spend-note" aria-live="polite">
        {wobble ? t("spend.notConfigured") : ""}
      </p>
    </div>
  );
}
