import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";

export default function CustomSelect({ value, options, onChange }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState(null);
  const ref = useRef(null);
  const listRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onScroll = (e) => {
      if (listRef.current && listRef.current.contains(e.target)) return;
      if (ref.current && ref.current.contains(e.target)) return;
      setOpen(false);
    };
    const update = () => {
      const r = ref.current.getBoundingClientRect();
      const itemH = 37;
      const fullH = Math.min(options.length * itemH + 12, 272);
      const spaceBelow = window.innerHeight - r.bottom;
      const spaceAbove = r.top;
      const fitsBelow = spaceBelow >= fullH + 8;
      const fitsAbove = spaceAbove >= fullH + 8;
      const openUp = !fitsBelow && fitsAbove;
      const maxH = Math.min(fullH, (openUp ? spaceAbove : spaceBelow) - 8);
      setPos({
        left: r.left,
        top: openUp
          ? Math.max(8, r.top - maxH - 6)
          : Math.min(r.bottom + 6, window.innerHeight - maxH - 8),
        width: r.width,
        openUp,
        maxH,
      });
    };
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", onScroll, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [open, options.length]);

  useEffect(() => {
    function onClick(e) {
      if (!ref.current || ref.current.contains(e.target)) return;
      if (listRef.current && listRef.current.contains(e.target)) return;
      setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  function close() {
    setOpen(false);
  }

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
      {open &&
        pos &&
        createPortal(
          <div
            ref={listRef}
            className="select-options"
            style={{
              position: "fixed",
              left: pos.left,
              top: pos.top,
              width: pos.width,
              background: "var(--select-bg, var(--glass-bg))",
              backdropFilter: "blur(16px)",
              WebkitBackdropFilter: "blur(16px)",
              border: "1px solid var(--glass-border)",
              boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
              borderRadius: 18,
              zIndex: 9999,
              overflow: "hidden",
              padding: 4,
              maxHeight: pos.maxH,
              display: "flex",
              flexDirection: "column",
              animation: "de-select-in 0.18s cubic-bezier(0.34, 1.56, 0.64, 1)",
            }}
          >
            <div
              className="select-list"
              style={{
                overflowY: "auto",
                overscrollBehavior: "contain",
                borderRadius: 14,
                padding: "6px 2px",
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
                      margin: "2px 0",
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
          </div>,
          document.body
        )}
    </div>
  );
}