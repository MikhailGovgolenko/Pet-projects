import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

const IFRAME_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
  <style>
    html, body { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; background: transparent; }
    #root { width: 100%; height: 100%; position: relative; }
  </style>
</head>
<body><div id="root"></div></body>
</html>`;

/** WebGL canvas lives in an iframe so the parent page has no &lt;canvas&gt; element. */
export default function CanvasIsolationFrame({ children }: { children: ReactNode }) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [mountNode, setMountNode] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const attach = () => {
      const root = iframe.contentDocument?.getElementById("root");
      if (root) setMountNode(root);
    };

    iframe.addEventListener("load", attach);
    attach();
    return () => {
      iframe.removeEventListener("load", attach);
      setMountNode(null);
    };
  }, []);

  return (
    <>
      <iframe
        ref={iframeRef}
        title="Lens 3D"
        srcDoc={IFRAME_HTML}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          border: "none",
          display: "block",
          background: "transparent",
        }}
      />
      {mountNode && createPortal(children, mountNode)}
    </>
  );
}
