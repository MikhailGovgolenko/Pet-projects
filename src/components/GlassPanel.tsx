import { useState } from "react";

export default function GlassPanel({ title, children }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <>
      <style>{`
        .controls-panel {
          position: absolute;
          left: calc(16px + env(safe-area-inset-left));
          top: calc(16px + env(safe-area-inset-top));
          width: min(320px, calc(100vw - 32px));
          max-height: calc(100dvh - 32px - env(safe-area-inset-top) - env(safe-area-inset-bottom));
          overflow-y: auto;
          overscroll-behavior: contain;
          -webkit-overflow-scrolling: touch;
          padding: 12px;
          transition: transform 0.45s cubic-bezier(0.32,0.72,0,1), opacity 0.35s ease;
        }
        .controls-panel.collapsed {
          transform: translateX(calc(-100% - 40px));
          opacity: 0;
          pointer-events: none;
        }
        @media (max-width: 640px) {
          .controls-panel {
            left: 12px;
            right: 12px;
            width: auto;
            top: auto;
            bottom: calc(16px + env(safe-area-inset-bottom));
            max-height: 46dvh;
            overflow-y: auto;
            overscroll-behavior: contain;
            -webkit-overflow-scrolling: touch;
            padding: 12px 12px calc(16px + env(safe-area-inset-bottom));
          }
          .controls-panel.collapsed {
            transform: translateY(calc(100% + 48px));
          }
        }
      `}</style>

      <div
        id="controls"
        className={"glass controls-panel" + (collapsed ? " collapsed" : "")}
        style={{
          zIndex: 10,
          opacity: collapsed ? 0 : 1,
          pointerEvents: collapsed ? "none" : "auto",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 8,
          }}
        >
          <span style={{ fontWeight: 700, fontSize: 14 }}>{title}</span>
          <div
            onClick={() => setCollapsed(true)}
            style={{
              width: 26,
              height: 26,
              borderRadius: "50%",
              background: "var(--input-bg)",
              border: "1px solid var(--glass-border)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "background 0.2s, transform 0.2s",
              flexShrink: 0,
            }}
            onMouseEnter={e => e.currentTarget.style.background = "rgba(128,128,128,0.15)"}
            onMouseLeave={e => e.currentTarget.style.background = "var(--input-bg)"}
          >
            <span
              style={{
                display: "block",
                width: 5,
                height: 5,
                borderLeft: "2px solid currentColor",
                borderBottom: "2px solid currentColor",
                transform: "rotate(45deg)",
                marginLeft: 2,
                opacity: 0.8,
              }}
            />
          </div>
        </div>
        {children}
      </div>

      <div
        onClick={() => setCollapsed(false)}
        style={{
          position: "absolute",
          left: "calc(14px + env(safe-area-inset-left))",
          top: "calc(14px + env(safe-area-inset-top))",
          width: 44,
          height: 44,
          borderRadius: "50%",
          display: collapsed ? "flex" : "none",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          zIndex: 20,
          transition: "transform 0.2s",
          background: "var(--glass-bg)",
          backdropFilter: "blur(80px) saturate(260%)",
          WebkitBackdropFilter: "blur(80px) saturate(260%)",
          border: "1px solid var(--glass-border)",
          boxShadow: "var(--glass-shadow)",
        }}
      >
        <span
          style={{
            display: "block",
            width: 7,
            height: 7,
            borderRight: "2px solid currentColor",
            borderTop: "2px solid currentColor",
            transform: "rotate(45deg)",
            marginRight: 2,
            opacity: 0.8,
          }}
        />
      </div>
    </>
  );
}
