import { useState, useRef, useEffect } from "react";

export default function CustomSelect({ value, options, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function onClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  var label = (options.find(function (o) { return o.value === value; }) || {}).label || value;

  return (
    <div
      ref={ref}
      className={"custom-select" + (open ? " open" : "")}
      style={{
        position: "relative",
        width: "100%",
        fontSize: 13,
        fontWeight: 500,
        zIndex: 50,
      }}
    >
      <div
        className="select-trigger"
        onClick={() => setOpen(!open)}
        style={{
          padding: "9px 14px",
          borderRadius: 14,
          background: "var(--input-bg)",
          border: "1px solid var(--glass-border)",
          cursor: "pointer",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          transition: "background 0.2s",
          fontSize: 13,
        }}
      >
        {label}
        <span
          style={{
            width: 6,
            height: 6,
            borderRight: "2px solid currentColor",
            borderBottom: "2px solid currentColor",
            transform: open ? "rotate(-135deg)" : "rotate(45deg)",
            transition: "transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
            opacity: 0.55,
            marginRight: 2,
            marginTop: open ? 2 : 0,
          }}
        />
      </div>
      <div
        className="select-options"
        style={{
          position: "absolute",
          top: "calc(100% + 6px)",
          left: 0,
          right: 0,
          background: "var(--select-bg, var(--glass-bg))",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          border: "1px solid var(--glass-border)",
          boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
          borderRadius: 18,
          zIndex: 100,
          opacity: open ? 1 : 0,
          transform: open ? "translateY(0) scale(1)" : "translateY(-8px) scale(0.96)",
          pointerEvents: open ? "auto" : "none",
          transition: "opacity 0.2s ease, transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
          overflow: "hidden",
          padding: "6px 0",
          maxHeight: 280,
          overflowY: "auto",
          overscrollBehavior: "contain",
        }}
      >
        {options.map(function (o) {
          var selected = o.value === value;
          return (
            <div
              key={o.value}
              className={selected ? "selected" : ""}
              onClick={function () {
                onChange(o.value);
                setOpen(false);
              }}
              style={{
                padding: "10px 16px",
                cursor: "pointer",
                transition: "background 0.1s ease",
                fontSize: 13,
                color: selected ? "var(--accent)" : "var(--text)",
                fontWeight: selected ? 700 : 400,
                margin: "0 6px",
                borderRadius: 10,
              }}
              onMouseEnter={function (e) {
                e.currentTarget.style.background = "var(--card-hover)";
              }}
              onMouseLeave={function (e) {
                e.currentTarget.style.background = "transparent";
              }}
            >
              {o.label}
            </div>
          );
        })}
      </div>
    </div>
  );
}
