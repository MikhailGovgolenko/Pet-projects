import { useState } from "react";

export default function GlassPanel({ title, children }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <>
      <div
        id="controls"
        className="glass"
        style={{
          position: "absolute",
          left: "calc(16px + env(safe-area-inset-left))",
          top: "calc(16px + env(safe-area-inset-top))",
          width: "min(320px, calc(100vw - 32px))",
          padding: 12,
          zIndex: 10,
          transition: "transform 0.45s cubic-bezier(0.32,0.72,0,1), opacity 0.35s ease",
          transform: collapsed ? "translateX(calc(-100% - 40px))" : "none",
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
          position: "fixed",
          left: "calc(20px + env(safe-area-inset-left))",
          top: "calc(20px + env(safe-area-inset-top))",
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
