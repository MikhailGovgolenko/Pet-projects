import { useEffect, useState, type CSSProperties } from "react";

const SELECTORS = ["#root", "#canvas-container", "canvas", "#controls", ".glass"];
const FONT = '10px/1.5 "SF Mono", ui-monospace, monospace';

type Box = {
  label: string;
  top: number;
  left: number;
  width: number;
  height: number;
};

function readSafeArea() {
  const mk = (css: string) => {
    const el = document.createElement("div");
    el.style.cssText =
      "position:fixed;left:0;top:0;pointer-events:none;visibility:hidden;width:1px;height:1px;" + css;
    return el;
  };
  const topEl = mk("top: env(safe-area-inset-top);");
  const rightEl = mk("top: 0; left: auto; right: env(safe-area-inset-right);");
  const bottomEl = mk("top: auto; left: 0; bottom: env(safe-area-inset-bottom);");
  const leftEl = mk("left: env(safe-area-inset-left);");
  document.body.append(topEl, rightEl, bottomEl, leftEl);

  const top = topEl.getBoundingClientRect().top;
  const right = window.innerWidth - rightEl.getBoundingClientRect().left;
  const bottom = window.innerHeight - bottomEl.getBoundingClientRect().top;
  const left = leftEl.getBoundingClientRect().left;

  [topEl, rightEl, bottomEl, leftEl].forEach((el) => el.remove());
  return { top: Math.max(0, top), right: Math.max(0, right), bottom: Math.max(0, bottom), left: Math.max(0, left) };
}

export default function DebugOverlay() {
  const [open, setOpen] = useState(true);
  const [outline, setOutline] = useState(false);
  const [lines, setLines] = useState<string[]>([]);
  const [boxes, setBoxes] = useState<Box[]>([]);

  useEffect(() => {
    const tick = () => {
      const vv = window.visualViewport;
      const sa = readSafeArea();
      const mode = matchMedia("(display-mode: standalone)").matches ? "standalone" : "browser";

      const out: string[] = [
        `viewport ${window.innerWidth} x ${window.innerHeight}  dpr=${window.devicePixelRatio}`,
        `scroll   y=${Math.round(window.scrollY)}  docH=${document.documentElement.scrollHeight}`,
        vv
          ? `visual  ${Math.round(vv.width)} x ${Math.round(vv.height)}  off=${Math.round(vv.offsetTop)},${Math.round(vv.offsetLeft)}  scale=${vv.scale}`
          : "visual  n/a",
        `safe    t=${sa.top} r=${sa.right} b=${sa.bottom} l=${sa.left}`,
        `mode    ${mode}`,
      ];

      const bs: Box[] = [];
      const seen = new Set<string>();
      for (const sel of SELECTORS) {
        const els = document.querySelectorAll<HTMLElement>(sel);
        for (const el of els) {
          const key = el.id ? "#" + el.id : `${sel}[${el.className}]`;
          if (seen.has(key)) continue;
          seen.add(key);
          const r = el.getBoundingClientRect();
          if (!r.width && !r.height) continue;
          const cs = getComputedStyle(el);
          let z = cs.zIndex;
          let extra = "";
          if (z && z !== "auto") extra += " z=" + z;
          if (cs.overflow !== "visible") extra += " overflow=" + cs.overflow;
          bs.push({ label: key, top: r.top, left: r.left, width: r.width, height: r.height });
          out.push(
            `${key}  ${Math.round(r.width)}x${Math.round(r.height)} @${Math.round(r.left)},${Math.round(r.top)} b=${Math.round(r.bottom)} pos=${cs.position}${extra}`
          );
        }
      }
      setLines(out);
      setBoxes(bs);
    };

    tick();
    const t = window.setInterval(tick, 400);
    window.addEventListener("resize", tick);
    window.visualViewport?.addEventListener("resize", tick);
    window.visualViewport?.addEventListener("scroll", tick);
    window.addEventListener("scroll", tick, true);
    return () => {
      clearInterval(t);
      window.removeEventListener("resize", tick);
      window.visualViewport?.removeEventListener("resize", tick);
      window.visualViewport?.removeEventListener("scroll", tick);
      window.removeEventListener("scroll", tick, true);
    };
  }, []);

  const btn: CSSProperties = {
    border: "none",
    background: "rgba(255,255,255,0.15)",
    color: "#fff",
    borderRadius: 6,
    padding: "3px 8px",
    marginTop: 6,
    cursor: "pointer",
    font: FONT,
    fontWeight: 700,
  };

  const panel: CSSProperties = {
    position: "fixed",
    top: "calc(8px + env(safe-area-inset-top))",
    right: "8px",
    zIndex: 99999,
    boxSizing: "border-box",
    maxWidth: "min(92vw, 400px)",
    background: "rgba(0, 0, 0, 0.82)",
    color: "#7dfc9a",
    font: FONT,
    padding: "8px 10px",
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.25)",
    boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
    whiteSpace: "pre-line",
    overflow: "auto",
    maxHeight: "70dvh",
    pointerEvents: "auto",
    display: "flex",
  };

  if (!open) {
    return (
      <div
        onClick={() => setOpen(true)}
        title="debug"
        style={{
          position: "fixed",
          top: "calc(8px + env(safe-area-inset-top))",
          right: "8px",
          width: 30,
          height: 30,
          zIndex: 99999,
          borderRadius: "50%",
          background: "rgba(0,0,0,0.7)",
          border: "1px solid rgba(255,255,255,0.3)",
          color: "#7dfc9a",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 14,
          cursor: "pointer",
        }}
      >
        🛠
      </div>
    );
  }

  return (
    <>
      {outline && <style>{`*{outline:1px solid rgba(255,80,90,0.7)!important}`}</style>}
      {boxes.map((b, i) => (
        <div
          key={i}
          style={{
            position: "fixed",
            left: b.left,
            top: b.top,
            width: b.width,
            height: b.height,
            boxSizing: "border-box",
            border: "1px solid rgba(0,255,150,0.9)",
            pointerEvents: "none",
            zIndex: 99998,
          }}
        >
          <span
            style={{
              position: "absolute",
              top: -13,
              left: 0,
              background: "rgba(0,255,150,0.9)",
              color: "#000",
              fontSize: 9,
              fontWeight: 700,
              padding: "0 4px",
              borderRadius: 3,
              font: FONT,
              whiteSpace: "nowrap",
            }}
          >
            {b.label} {Math.round(b.width)}x{Math.round(b.height)}
          </span>
        </div>
      ))}

      <div style={panel}>
        <div style={{ flex: 1, minWidth: 0 }}>
          {lines.map((l, i) => (
            <div key={i} style={{ whiteSpace: "pre-wrap" }}>
              {l}
            </div>
          ))}
          <div style={{ display: "flex", gap: 6 }}>
            <button style={btn} onClick={() => setOutline((v) => !v)}>
              outline: {outline ? "on" : "off"}
            </button>
            <button style={btn} onClick={() => setOpen(false)}>
              hide
            </button>
          </div>
        </div>
      </div>
    </>
  );
}