import React from "react";

interface ToggleSwitchProps {
  label: string;
  checked: boolean;
  onChange?: (checked: boolean) => void;
}

function ToggleSwitch({ label, checked, onChange }: ToggleSwitchProps) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        margin: "5px 0",
        fontSize: 12,
        fontWeight: 500,
      }}
    >
      <span>{label}</span>

      <label
        style={{
          position: "relative",
          width: 34,
          height: 17,
          flexShrink: 0,
          cursor: "pointer",
        }}
      >
        <input
          type="checkbox"
          role="switch"
          aria-label={label}
          checked={checked}
          onChange={(e) => onChange?.(e.target.checked)}
          style={{
            position: "absolute",
            opacity: 0,
            width: 0,
            height: 0,
          }}
        />

        <span
          style={{
            position: "absolute",
            inset: 0,
            background: checked
              ? "linear-gradient(135deg, #00d4ff, #0077b6)"
              : "var(--toggle-off)",
            borderRadius: 17,
            transition: "background 0.25s, box-shadow 0.25s",
            boxShadow: checked ? "none" : "inset 0 0 0 1px var(--glass-border)",
          }}
        >
          <span
            style={{
              position: "absolute",
              top: 3,
              left: 3,
              width: 11,
              height: 11,
              background: "#fff",
              borderRadius: "50%",
              transform: checked ? "translateX(17px)" : "translateX(0)",
              transition: "transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)",
              boxShadow: "0 1px 2px rgba(0,0,0,0.18)",
            }}
          />
        </span>
      </label>
    </div>
  );
}

export default React.memo(ToggleSwitch);
