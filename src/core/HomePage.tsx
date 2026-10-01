import { projects } from "../projects";
import { useI18n } from "./i18n";

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
          padding: calc(48px + env(safe-area-inset-top))
            calc(20px + env(safe-area-inset-right))
            calc(32px + env(safe-area-inset-bottom))
            calc(20px + env(safe-area-inset-left));
          overflow-x: hidden;
          overflow-y: auto;
        }

        .home-title { animation: fadeInDown 0.8s ease both; }
        .card-wrap {
          position: relative;
          animation: fadeInUp 0.7s ease both;
          border-radius: 28px;
          isolation: isolate;
          /* Контейнер для cqw: все внутренние размеры карточки заданы в
             процентах от её ширины (база — 306.7px, колонка на ПК). Благодаря
             этому карточка на мобильном (362px) — это ровно тот же макет,
             масштабированный в 1.18 раза, а не другой набор отступов. */
          container-type: inline-size;
        }
        .card-wrap:nth-child(1) { animation-delay: 0.1s; }
        .card-wrap:nth-child(2) { animation-delay: 0.2s; }
        .card-wrap:nth-child(3) { animation-delay: 0.3s; }

        .home-card {
          position: relative;
          z-index: 1;
          display: flex;
          flex-direction: column;
          padding: 28px;
          padding: 9.13cqw;
          /* радиус .glass задан в px — переопределяем, чтобы скругление
             масштабировалось вместе с карточкой */
          border-radius: 24px;
          border-radius: 7.83cqw;
          color: inherit;
          cursor: pointer;
          height: 100%;
          overflow: hidden;
          /* Обводку .glass снимаем: overflow: hidden клипает фото по padding box,
             поэтому 1px бордера оставался поверх фото светлой полосой по всему
             периметру. Без обводки padding box = border box и фото доходит до
             самого скругления, а линию рисует ::after ниже. */
          border-width: 0;
          transition:
            transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1),
            box-shadow 0.35s ease,
            background 0.35s ease;
          /* backdrop-filter на соседних карточках + transform = глитч в Chrome;
             на однотонном фоне blur всё равно незаметен */
          backdrop-filter: none;
          -webkit-backdrop-filter: none;
        }
        /* Обводка рисуется поверх фото, а не под ним: ::after лежит над
           картинкой (z-index 2) и кладёт 1px прямо на её пиксели, поэтому
           зазора между фото и линией нет. Цвет — токен темы, в тёмной теме
           это светлая линия: граница карточки должна быть видна, иначе на
           почти чёрном фото карточка сливается со страницей. */
        .home-card::after {
          content: "";
          position: absolute;
          inset: 0;
          border-radius: inherit;
          box-shadow: inset 0 0 0 1px var(--glass-border);
          pointer-events: none;
          z-index: 2;
        }
        @media (hover: hover) {
          .card-wrap:hover .home-card {
            transform: translateY(-4px) scale(1.01);
            box-shadow: 0 20px 60px rgba(0,0,0,0.15), var(--glass-shadow);
          }
          .card-wrap:hover .card-action { color: var(--accent); }
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

        /* Сплит-карточка: эмодзи-герой на левой половине, описание — справа */
        .card-split {
          display: flex;
          flex-direction: column;
          gap: 0;
          padding: 0;
          margin: -29px -29px 0;
          flex: 1;
          min-height: 0;
          overflow: hidden;
        }

        .card-split-visual {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          flex: 0 0 200px;
          height: 200px;
          background: radial-gradient(
            ellipse at 50% 56%,
            rgba(180, 220, 90, 0.2),
            transparent 72%
          );
          overflow: hidden;
        }
        .card-split-visual::after {
          content: "";
          position: absolute;
          left: 0;
          right: 0;
          bottom: 0;
          height: 60px;
          pointer-events: none;
          background: linear-gradient(
            to bottom,
            rgba(0, 0, 0, 0) 0%,
            var(--card-fade) 100%
          );
        }
        .card-emoji-hero {
          font-size: 96px;
          line-height: 1;
          filter: drop-shadow(0 12px 30px rgba(0, 0, 0, 0.25));
          animation: fadeInDown 0.7s ease both;
          transform: none;
        }
        .card-split-body {
          display: flex;
          flex-direction: column;
          flex: 1 1 auto;
          min-height: 0;
          padding: 0 28px;
        }
        .card-split-body h2 { margin-top: 10px; }
        .card-split-body p { flex: 1; margin: 0 0 20px; }

        /* Фото растягивается на всю карточку (cover тянет, потом обрезает) и
           становится её фоном. Сам блок .card-hero остаётся в потоке и держит
           прежнюю высоту, поэтому текст описания не двигается; он лишь перестаёт
           быть containing block для фото и градиента — они раскрываются на
           границы карточки. */
        .card-hero {
          position: static;
          margin: -28px -28px 0;
          margin: -9.13cqw -9.13cqw 0;
          height: 200px;
          height: 65.21cqw;
          border-radius: 24px 24px 0 0;
          border-radius: 7.83cqw 7.83cqw 0 0;
          overflow: visible;
          /* Сжиматься герой может только до минимума — если описание вдруг
             станет длиннее (другой язык), сжимается фото, а не текст. */
          min-height: 110px;
          min-height: 35.86cqw;
          flex: 0 1 auto;
        }
        .card-hero picture {
          display: block;
        }
        /* Фото занимает всю карточку, но на 10% выше и на 10% крупнее: без
           вертикального запаса (фото ровно в высоту карточки) сдвинуть его
           вверх нельзя — появилась бы полоса снизу. Лишнее уходит под нижнюю
           плотную часть градиента и обрезается по скруглению карточки. */
        .card-preview {
          position: absolute;
          inset: 0;
          display: block;
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center top;
        }

        .card-preview-canvas {
          background: radial-gradient(
            ellipse at 50% 42%,
            rgba(0, 212, 255, 0.1),
            transparent 72%
          );
          display: block;
        }
        /* Градиент цвета темы от низа: нижние 36% высоты плотные, дальше к
           верху уходит в прозрачность. */
        .card-hero-fade {
          position: absolute;
          inset: 0;
          height: auto;
          pointer-events: none;
          background: linear-gradient(
            to top,
            var(--card-fade) 0%,
            var(--card-fade) 36%,
            rgba(0, 0, 0, 0) 100%
          );
        }
        /* в светлой теме --card-fade почти белый: прозрачный стоп должен быть
           того же оттенка, иначе фейд уходит в серый через rgba(0,0,0,0) */
        @media (prefers-color-scheme: light) {
          .card-hero-fade {
            background: linear-gradient(
              to top,
              var(--card-fade) 0%,
              var(--card-fade) 26%,
              rgba(255, 255, 255, 0) 100%
            );
          }
        }

        /* Текст описания поднимаем над фото и градиентом — его позиции от этого
           не меняются, он просто перестаёт перекрываться. */
        .home-card h2,
        .home-card p,
        .card-footer {
          position: relative;
          z-index: 1;
        }

        .home-card h2 {
          font-size: 20px;
          font-size: 6.52cqw;
          font-weight: 700;
          margin-bottom: 8px;
          margin-bottom: 2.61cqw;
          letter-spacing: -0.3px;
          margin-top: 10px;
          margin-top: 3.26cqw;
        }

        .home-card p {
          font-size: 14px;
          font-size: 4.57cqw;
          color: var(--text-sec);
          line-height: 1.5;
          flex: 1;
        }

        .card-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: 20px;
          margin-top: 6.52cqw;
        }

        .card-action {
          font-size: 13px;
          font-size: 4.24cqw;
          font-weight: 600;
          color: var(--text-sec);
        }

        .readme-link {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          gap: 1.96cqw;
          padding: 7px 12px;
          padding: 2.28cqw 3.91cqw;
          border-radius: 100px;
          font-size: 12px;
          font-size: 3.91cqw;
          font-weight: 700;
          text-decoration: none;
          color: var(--text-sec);
          background: rgba(128, 128, 128, 0.12);
          border: 1px solid var(--glass-border);
          flex-shrink: 0;
          transition: color 0.2s ease, border-color 0.2s ease, background 0.2s ease;
        }
        .readme-link:hover {
          color: var(--accent);
          border-color: var(--accent);
          background: var(--card-hover);
        }

        @media (max-width: 480px) {
          .home-page { padding-left: 14px; padding-right: 14px; }
          .home-title { margin-bottom: 32px; }
          .home-title h1 { font-size: 32px; letter-spacing: -1px; }
          /* Внутри карточки мобильных переопределений больше нет: отступы,
             фото, шрифты и радиусы заданы в cqw, поэтому на мобиле карточка
             выглядит как точная копия пк-версии, масштабированная по ширине.
             Остаётся только зафиксировать соотношение сторон (на ПК высота
             карточки 306.7 x 367 = 0.8356 — при 2 строках описания; у карточки
             с описанием в одну строку без него карточки были бы ниже). */
          .home-card {
            height: auto;
            aspect-ratio: 0.8356;
          }
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
        {projects.map((project) => {
          const m = project.manifest;
          const title = t(`card.${m.id}.title`) || m.title;
          const desc = t(`card.${m.id}.desc`) || m.description;
          const previewLight = project.card?.previewLight;
          const previewDark = project.card?.previewDark;
          const heroEmoji = project.card?.heroEmoji;
          return (
            <div className="card-wrap" key={m.id}>
              <div
                className="glass home-card"
                onClick={() => onNavigate(m.id)}
              >
                {heroEmoji ? (
                  <div className="card-split">
                    <div className="card-split-visual">
                      <div className="card-emoji-hero" aria-hidden="true">
                        {heroEmoji}
                      </div>
                    </div>
                    <div className="card-split-body">
                      <h2>{title}</h2>
                      <p>{desc}</p>
                      <div className="card-footer">
                        <span className="card-action">
                          {t("home.open")}
                        </span>
                        <a
                          className="readme-link"
                          href={m.readme ?? "#"}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                        >
                          📄 Readme
                        </a>
                      </div>
                    </div>
                  </div>
                ) : previewLight || previewDark ? (
                  <div className="card-hero">
                    <picture>
                      {previewLight && (
                        <source
                          media="(prefers-color-scheme: light)"
                          srcSet={previewLight}
                        />
                      )}
                      <img
                        className="card-preview"
                        src={previewDark || previewLight}
                        alt=""
                        draggable={false}
                      />
                    </picture>
                    <div className="card-hero-fade"></div>
                  </div>
                ) : (
                  <div className="card-icon">{m.icon}</div>
                )}
                {!heroEmoji && (
                  <>
                    <h2>{title}</h2>
                    <p>{desc}</p>
                    <div className="card-footer">
                      <span className="card-action">{t("home.open")}</span>
                      <a
                        className="readme-link"
                        href={m.readme ?? "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                      >
                        📄 Readme
                      </a>
                    </div>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}