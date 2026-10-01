import { useCallback, useEffect, useRef, useState } from "react";
import { useI18n } from "../../core/i18n";
import { track } from "./track";

function formatTime(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) seconds = 0;
  const total = Math.floor(seconds);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s < 10 ? "0" : ""}${s}`;
}

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true">
      <path d="M8 5.5v13l11-6.5z" fill="currentColor" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true">
      <path d="M8 5h3v14H8zM13 5h3v14h-3z" fill="currentColor" />
    </svg>
  );
}

function StopIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
      <rect x="6" y="6" width="12" height="12" rx="2.5" fill="currentColor" />
    </svg>
  );
}

function VolumeIcon({ muted }: { muted: boolean }) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
      <path d="M4 9.5h3.5L12 5.5v13L7.5 14.5H4z" fill="currentColor" />
      {muted ? (
        <path
          d="M15.5 9.5l5 5M20.5 9.5l-5 5"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          fill="none"
        />
      ) : (
        <path
          d="M15.4 9a4.4 4.4 0 010 6M18 6.6a7.8 7.8 0 010 10.8"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          fill="none"
        />
      )}
    </svg>
  );
}

export default function PlayerPage() {
  const { t } = useI18n();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const barRef = useRef<HTMLDivElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const scrubRef = useRef(false);
  const paintedRef = useRef(-1);

  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  /* Обложка в уведомлении системы и в блоке «Сейчас играет» на iPhone/ iPad
     берётся из Media Session API. Без неё ОС показывает заглушку. Ссылка
     должна быть обычным URL (Vite отдаёт хэшированный путь до ассета), blob
     и data-URI платформы не подхватывают. */
  useEffect(() => {
    const session = navigator.mediaSession;
    if (!session || typeof MediaMetadata === "undefined") return;
    session.metadata = new MediaMetadata({
      title: track.title,
      artist: track.artist,
      album: track.artist,
      artwork: [{ src: track.cover, sizes: "1000x1000", type: "image/png" }],
    });
    return () => {
      session.metadata = null;
    };
  }, []);

  // Заполнение ползунка рисуется напрямую в DOM: обновлять его через React
  // на каждом кадре слишком дорого (ререндер всей карточки с backdrop-filter),
  // а через CSS-переход по width он вовсе «залипает»: цель меняется каждый кадр,
  // переход перезапускается и интерполированное значение почти не растёт.
  const paintProgress = useCallback((position: number, total: number) => {
    const track = trackRef.current;
    if (!track) return;
    const p = total > 0 ? clamp01(position / total) : 0;
    if (Math.abs(p - paintedRef.current) < 0.00002) return;
    paintedRef.current = p;
    track.style.setProperty("--p", p.toFixed(6));
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    paintProgress(audio.currentTime, audio.duration);
  }, [paintProgress]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onMeta = () => {
      setDuration(Number.isFinite(audio.duration) ? audio.duration : 0);
      paintProgress(audio.currentTime, audio.duration);
    };
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onTime = () => {
      setTime(audio.currentTime);
      paintProgress(audio.currentTime, audio.duration);
    };
    const onSeeked = () => {
      setTime(audio.currentTime);
      paintProgress(audio.currentTime, audio.duration);
    };
    const onEnded = () => {
      setPlaying(false);
      setTime(audio.duration || 0);
      paintProgress(audio.duration || 0, audio.duration || 0);
    };

    audio.addEventListener("loadedmetadata", onMeta);
    audio.addEventListener("durationchange", onMeta);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("seeked", onSeeked);
    audio.addEventListener("ended", onEnded);
    if (audio.readyState >= 1) onMeta();

    return () => {
      audio.removeEventListener("loadedmetadata", onMeta);
      audio.removeEventListener("durationchange", onMeta);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("seeked", onSeeked);
      audio.removeEventListener("ended", onEnded);
    };
  }, [paintProgress]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = muted ? 0 : volume;
  }, [volume, muted]);

  // Ползунок обязан идти за реальной позицией трека. rAF даёт плавность,
  // но он придушается в Low Power Mode / фоновой вкладке — поэтому
  // дополнительно синхронизируем положение по таймеру.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    let frame = 0;
    let lastFrame = 0;
    let shownSecond = Math.floor(audio.currentTime);

    const sync = () => {
      const now = audio.currentTime;
      paintProgress(now, audio.duration);
      // React перерисовываем только на смену секунды: текст времени и
      // aria-valuenow раз в секунду, заполнение — каждый кадр напрямую.
      const second = Math.floor(now);
      if (second !== shownSecond) {
        shownSecond = second;
        setTime(now);
      }
    };

    const loop = () => {
      lastFrame = performance.now();
      sync();
      frame = requestAnimationFrame(loop);
    };
    if (playing) frame = requestAnimationFrame(loop);

    const timer = window.setInterval(() => {
      if (!playing || performance.now() - lastFrame > 200) sync();
    }, 200);

    return () => {
      cancelAnimationFrame(frame);
      window.clearInterval(timer);
    };
  }, [playing, paintProgress]);

  const toggle = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      if (audio.ended || audio.currentTime >= (audio.duration || 0)) {
        audio.currentTime = 0;
        setTime(0);
        paintProgress(0, audio.duration);
      }
      audio.play().catch(() => setPlaying(false));
    } else {
      audio.pause();
    }
  }, [paintProgress]);

  // Пробел — play/pause. На кнопках и в полях ввода он уже работает
  // штатно, поэтому там не перехватываем (иначе сработает дважды).
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.code !== "Space" || event.repeat) return;
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      if (target?.closest("button, input, textarea, select, [contenteditable]")) return;
      event.preventDefault();
      toggle();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [toggle]);

  // Кнопки в уведомлении ОС без обработчиков просто ничего не делают.
  useEffect(() => {
    const session = navigator.mediaSession;
    if (!session?.setActionHandler) return;
    const handlers: Array<[MediaSessionAction, MediaSessionActionHandler]> = [
      ["play", () => {
        if (audioRef.current?.paused) toggle();
      }],
      ["pause", () => {
        const audio = audioRef.current;
        if (audio && !audio.paused) audio.pause();
      }],
    ];
    for (const [action, handler] of handlers) {
      try {
        session.setActionHandler(action, handler);
      } catch {
        /* действие не поддерживается платформой */
      }
    }
    return () => {
      for (const [action] of handlers) {
        try {
          session.setActionHandler(action, null);
        } catch {
          /* см. выше */
        }
      }
    };
  }, [toggle]);

  const stop = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    audio.currentTime = 0;
    setTime(0);
    paintProgress(0, audio.duration);
  }, [paintProgress]);

  const seekToRatio = useCallback(
    (ratio: number) => {
      const audio = audioRef.current;
      if (!audio || !duration) return;
      const next = clamp01(ratio) * duration;
      audio.currentTime = next;
      setTime(next);
      paintProgress(next, duration);
    },
    [duration, paintProgress]
  );

  const seekFromClientX = useCallback(
    (clientX: number) => {
      const bar = barRef.current;
      if (!bar) return;
      const rect = bar.getBoundingClientRect();
      if (rect.width <= 0) return;
      seekToRatio((clientX - rect.left) / rect.width);
    },
    [seekToRatio]
  );

  return (
    <div className="player-page">
      <style>{`
        .player-page {
          position: relative;
          min-height: 100vh;
          min-height: 100dvh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: calc(84px + env(safe-area-inset-top))
            calc(18px + env(safe-area-inset-right))
            calc(40px + env(safe-area-inset-bottom))
            calc(18px + env(safe-area-inset-left));
        }

        .player-card {
          width: 100%;
          max-width: 400px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 18px;
          padding: 30px 26px 26px;
          border-radius: 30px;
          animation: playerRise 0.7s ease both;
        }

        .player-title {
          display: flex;
          align-items: center;
          font-size: 20px;
          font-weight: 700;
          letter-spacing: -0.3px;
        }

/* Обложка всегда занимает один и тот же бокс — высота карточки не
           меняется. На паузе уменьшается только сама картинка (transform),
           как в Apple Music: layout не пересчитывается, а анимация идёт
           на композиторе. */
        .player-cover-wrap {
          position: relative;
          width: min(300px, 74vw);
          aspect-ratio: 1 / 1;
          display: flex;
        }

        .player-cover {
          position: relative;
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: 22px;
          box-shadow: 0 18px 44px rgba(0, 0, 0, 0.42);
          transform: scale(0.74);
          transition: transform 0.45s cubic-bezier(0.2, 1, 0.36, 1);
        }
        .player-card.is-playing .player-cover {
          transform: scale(1);
        }

        .player-progress {
          width: 100%;
          padding: 12px 0 4px;
          cursor: pointer;
          touch-action: none;
          -webkit-tap-highlight-color: transparent;
        }
        .player-progress-track {
          position: relative;
          height: 6px;
          border-radius: 100px;
          background: var(--input-bg);
          box-shadow: inset 0 0 0 1px var(--glass-border);
          overflow: hidden;
          /* --p: позиция воспроизведения. Заполнение живёт на transform,
             а не на width: transform анимируется композитором, не вызывает
             layout и не квантуется до целых пикселей, поэтому ползунок идёт
             ровно и плавно. */
          --p: 0;
        }
        .player-progress-fill {
          position: absolute;
          inset: 0;
          border-radius: 100px;
          background: linear-gradient(90deg, rgba(0, 119, 182, 0.9), var(--accent));
          transform: scaleX(var(--p));
          transform-origin: left center;
          will-change: transform;
        }
        .player-progress:focus-visible {
          outline: 2px solid var(--accent);
          outline-offset: 6px;
          border-radius: 100px;
        }
        /* Тап мышью или пальцем по ползунку в Safari и Chrome тоже считается
           :focus-visible, поэтому после касания кольцо оставалось висеть.
           Помечаем фокус указателем и убираем кольцо; с клавиатуры оно
           остаётся, иначе непонятно, где фокус. */
        .player-progress.is-pointer-focus:focus-visible {
          outline: none;
        }

        .player-times {
          width: 100%;
          display: flex;
          justify-content: space-between;
          font-size: 11.5px;
          font-variant-numeric: tabular-nums;
          color: var(--text-sec);
        }

        .player-controls {
          display: flex;
          align-items: center;
          gap: 18px;
        }

        .player-btn {
          width: auto;
          margin: 0;
          padding: 0;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          color: var(--text-sec);
          background: var(--input-bg);
          border: 1px solid var(--glass-border);
          box-shadow: none;
          cursor: pointer;
          transition: color 0.2s ease, border-color 0.2s ease, background 0.2s ease,
            transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .player-btn.ghost {
          width: 44px;
          height: 44px;
          font-size: 0;
        }
        /* Заливка — та же акцентная диагональ, что у кнопок на сайте
           (core/theme.css). Без промоушена слоя (translateZ/will-change):
           на элементе с border-radius над backdrop-filter это даёт
           угловатый ореол — «квадрат, вписанный в круг». Рамка тоже
           убрана: прозрачный border поверх размытия давал вторую кромку. */
        .player-btn.main {
          width: 68px;
          height: 68px;
          color: #fff;
          background: linear-gradient(
            315deg,
            rgba(0, 212, 255, 0.85),
            rgba(0, 119, 182, 0.85)
          );
          border: 0;
          box-shadow:
            0 0 0 1px rgba(255, 255, 255, 0.14),
            0 0 18px rgba(0, 140, 255, 0.28);
        }
        .player-btn:focus-visible {
          outline: 2px solid var(--accent);
          outline-offset: 3px;
        }
        .player-btn:hover { opacity: 1; }
        @media (hover: hover) {
          .player-btn.ghost:hover {
            color: var(--accent);
            border-color: var(--accent);
          }
          .player-btn.main:hover {
            transform: translateY(-2px) scale(1.04);
          }
        }
        .player-btn:active {
          transform: scale(0.94);
          opacity: 1;
        }

        .player-volume-wrap {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 10px;
          color: var(--text-sec);
        }

        .player-volume {
          flex: 1;
          -webkit-appearance: none;
          appearance: none;
          /* Зона касания у range — это его собственный бокс, поэтому на
             айфоне полоску в 6px пальцем не поймать. Даём инпуту 26px, а
             видимый трек рисуем на ::-webkit-slider-runnable-track, чтобы
             вид не изменился. Без touch-action iOS отдаёт жест прокрутке
             страницы, и ползунок не двигается вообще. */
          height: 26px;
          background: transparent;
          outline: none;
          cursor: pointer;
          touch-action: none;
          -webkit-tap-highlight-color: transparent;
        }
        .player-volume::-webkit-slider-runnable-track {
          height: 6px;
          border-radius: 100px;
          background: var(--input-bg);
          box-shadow: inset 0 0 0 1px var(--glass-border);
        }
        .player-volume::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 14px;
          height: 14px;
          margin-top: -4px;
          border-radius: 50%;
          background: #fff;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.25);
          cursor: pointer;
        }
        .player-volume::-moz-range-track {
          height: 6px;
          border-radius: 100px;
          background: var(--input-bg);
          box-shadow: inset 0 0 0 1px var(--glass-border);
        }
        .player-volume::-moz-range-thumb {
          width: 14px;
          height: 14px;
          border: none;
          border-radius: 50%;
          background: #fff;
          cursor: pointer;
        }
        .player-volume:focus-visible {
          outline: 2px solid var(--accent);
          outline-offset: 4px;
        }

        @keyframes playerRise {
          from { opacity: 0; transform: translateY(18px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @media (prefers-reduced-motion: reduce) {
          .player-card {
            animation: none !important;
          }
          .player-cover {
            transition: none;
          }
        }

        @media (max-width: 480px) {
          .player-card { padding: 24px 20px 20px; gap: 16px; }
          .player-cover-wrap { width: min(260px, 72vw); }
        }
      `}</style>

      <div className={"glass player-card" + (playing ? " is-playing" : "")}>
        <div className="player-cover-wrap">
          <img
            className="player-cover"
            src={track.cover}
            alt={`${track.title} — ${track.artist}`}
            draggable={false}
          />
        </div>

        <h1 className="player-title">{track.title}</h1>

        <div
          className="player-progress"
          ref={barRef}
          role="slider"
          tabIndex={0}
          aria-label={t("player.seek")}
          aria-valuemin={0}
          aria-valuemax={Math.round(duration)}
          aria-valuenow={Math.round(time)}
          aria-valuetext={`${formatTime(time)} / ${formatTime(duration)}`}
          onPointerDown={(e) => {
            scrubRef.current = true;
            e.currentTarget.classList.add("is-pointer-focus");
            e.currentTarget.setPointerCapture(e.pointerId);
            seekFromClientX(e.clientX);
          }}
          onPointerMove={(e) => {
            if (scrubRef.current) seekFromClientX(e.clientX);
          }}
          onPointerUp={(e) => {
            scrubRef.current = false;
            e.currentTarget.releasePointerCapture(e.pointerId);
          }}
          onPointerCancel={() => {
            scrubRef.current = false;
          }}
          onBlur={(e) => {
            e.currentTarget.classList.remove("is-pointer-focus");
          }}
          onKeyDown={(e) => {
            e.currentTarget.classList.remove("is-pointer-focus");
            const audio = audioRef.current;
            if (!audio || !duration) return;
            const step = 5;
            let next: number | null = null;
            if (e.key === "ArrowRight" || e.key === "ArrowUp") next = audio.currentTime + step;
            else if (e.key === "ArrowLeft" || e.key === "ArrowDown") next = audio.currentTime - step;
            else if (e.key === "Home") next = 0;
            else if (e.key === "End") next = duration;
            if (next === null) return;
            e.preventDefault();
            audio.currentTime = clamp01(next / duration) * duration;
            setTime(audio.currentTime);
            paintProgress(audio.currentTime, duration);
          }}
        >
          <div className="player-progress-track" ref={trackRef}>
            <div className="player-progress-fill" />
          </div>
        </div>

        <div className="player-times">
          <span>{formatTime(time)}</span>
          <span>{formatTime(duration)}</span>
        </div>

        <div className="player-controls">
          <button className="player-btn ghost" onClick={stop} aria-label={t("player.stop")} title={t("player.stop")}>
            <StopIcon />
          </button>
          <button
            className="player-btn main"
            onClick={toggle}
            aria-label={playing ? t("player.pause") : t("player.play")}
            title={playing ? t("player.pause") : t("player.play")}
          >
            {playing ? <PauseIcon /> : <PlayIcon />}
          </button>
          <button
            className="player-btn ghost"
            onClick={() => setMuted((m) => !m)}
            aria-label={muted ? t("player.unmute") : t("player.mute")}
            aria-pressed={muted}
            title={muted ? t("player.unmute") : t("player.mute")}
          >
            <VolumeIcon muted={muted} />
          </button>
        </div>

        <div className="player-volume-wrap">
          <VolumeIcon muted={muted} />
          <input
            className="player-volume"
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={muted ? 0 : volume}
            onChange={(e) => {
              const v = Number(e.target.value);
              setVolume(v);
              if (v > 0 && muted) setMuted(false);
            }}
            aria-label={t("player.volume")}
          />
        </div>
      </div>

      <audio ref={audioRef} src={track.src} preload="metadata" />
    </div>
  );
}