import { useState } from "react";
import GlassPanel from "../components/GlassPanel";
import RangeSlider from "../components/RangeSlider";
import ToggleSwitch from "../components/ToggleSwitch";
import PetScene, { type PetCharacter, type PetConfig } from "./PetScene";
import { useI18n } from "../i18n";

const CHARACTERS: { id: PetCharacter; emoji: string }[] = [
  { id: "pip", emoji: "🔥" },
  { id: "puff", emoji: "☁️" },
  { id: "botty", emoji: "🤖" },
  { id: "spook", emoji: "👻" },
];

const CHARACTER_BUBBLES: Record<PetCharacter, string> = {
  pip: "I talk too 😁",
  puff: "Hi 👋, I am Puff. Please hire me.",
  botty: "BTW I am Botty, I don't care. 😑",
  spook: "Spook here ✌️, I am innocent 🥺",
  custom: "Need any help? 👋",
};

export default function PetPage() {
  const { t } = useI18n();
  const [cfg, setCfg] = useState<PetConfig>({
    characterType: "pip",
    scale: 0.4,
    speed: 0.05,
    wobbleSpeed: 2,
    follow: true,
    showBubble: true,
  });

  const setCharacter = (characterType: PetCharacter) =>
    setCfg((c) => ({ ...c, characterType, bubbleText: CHARACTER_BUBBLES[characterType] }));

  return (
    <div
      style={{
        minHeight: "100dvh",
        width: "100%",
        overflow: "hidden",
        position: "relative",
        background: "var(--bg)",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 0,
        }}
      >
        <PetScene
          {...cfg}
          fallback={
            <div style={{ color: "var(--text-sec)", fontSize: 13, textAlign: "center", padding: 16 }}>
              {t("pet.noWebgl")}
            </div>
          }
        />
      </div>

      <GlassPanel title={t("pet.panel")}>
        <div
          style={{
            display: "flex",
            gap: 8,
            marginBottom: 2,
          }}
        >
          {CHARACTERS.map(({ id, emoji }) => (
            <button
              key={id}
              type="button"
              onClick={() => setCharacter(id)}
              aria-pressed={cfg.characterType === id}
              title={id}
              style={{
                flex: 1,
                height: 40,
                fontSize: 20,
                cursor: "pointer",
                borderRadius: 12,
                border:
                  cfg.characterType === id
                    ? "1px solid var(--accent)"
                    : "1px solid var(--glass-border)",
                background: cfg.characterType === id ? "var(--accent-soft)" : "transparent",
                color: "var(--text)",
                transition: "all 0.15s ease",
              }}
            >
              {emoji}
            </button>
          ))}
        </div>
        <RangeSlider
          name="size"
          label={t("pet.size")}
          min={0.2}
          max={1.2}
          step={0.05}
          value={cfg.scale ?? 1}
          onChange={(v) => setCfg((c) => ({ ...c, scale: v }))}
        />
        <RangeSlider
          name="speed"
          label={t("pet.speed")}
          min={0.01}
          max={0.15}
          step={0.005}
          value={cfg.speed ?? 0.05}
          onChange={(v) => setCfg((c) => ({ ...c, speed: v }))}
          format={() => `${((cfg.speed ?? 0.05) * 100).toFixed(0)}%`}
        />
        <ToggleSwitch
          name="follow"
          label={t("pet.follow")}
          checked={!!cfg.follow}
          onChange={(v) => setCfg((c) => ({ ...c, follow: v }))}
        />
        <ToggleSwitch
          name="bubble"
          label={t("pet.bubble")}
          checked={!!cfg.showBubble}
          onChange={(v) => setCfg((c) => ({ ...c, showBubble: v }))}
        />
      </GlassPanel>

      <div
        style={{
          position: "fixed",
          bottom: "calc(18px + env(safe-area-inset-bottom))",
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 10,
          fontSize: 12.5,
          fontWeight: 600,
          color: "var(--text-sec)",
          textAlign: "center",
          pointerEvents: "none",
          userSelect: "none",
          background: "var(--glass-bg)",
          backdropFilter: "blur(60px) saturate(240%)",
          WebkitBackdropFilter: "blur(60px) saturate(240%)",
          border: "1px solid var(--glass-border)",
          borderRadius: 100,
          padding: "8px 16px",
          boxShadow: "var(--glass-shadow)",
        }}
      >
        {t("pet.hint")}
      </div>
    </div>
  );
}
