import { useCallback, useEffect, useLayoutEffect, useState } from "react";

export const LENS_SCROLL_PAD = 200;

export type LensScrollLayout = {
  enabled: boolean;
  pad: number;
  frameHeight: number;
  bandHeight: number;
};

function measure(): LensScrollLayout {
  if (typeof window === "undefined") {
    return { enabled: false, pad: 0, frameHeight: 0, bandHeight: 0 };
  }
  const enabled = window.innerWidth <= 760;
  const pad = enabled ? LENS_SCROLL_PAD : 0;
  const frameHeight = window.innerHeight;
  return { enabled, pad, frameHeight, bandHeight: frameHeight + pad * 2 };
}

function scrollToAnchor(pad: number) {
  window.scrollTo({ top: pad, left: 0, behavior: "instant" in window ? "instant" : "auto" });
}

/** iOS Safari 26 re-samples tab bar backdrop after a tiny scroll nudge. */
export function nudgeLensSafariChrome(pad: number) {
  scrollToAnchor(pad);
  requestAnimationFrame(() => {
    window.scrollTo(0, pad + 1);
    requestAnimationFrame(() => scrollToAnchor(pad));
  });
}

export function useLensSafariScroll(): LensScrollLayout {
  const [layout, setLayout] = useState(measure);

  const center = useCallback((pad: number) => {
    scrollToAnchor(pad);
    requestAnimationFrame(() => scrollToAnchor(pad));
    setTimeout(() => scrollToAnchor(pad), 50);
  }, []);

  useLayoutEffect(() => {
    const root = document.documentElement;
    root.classList.add("lens-active");

    const update = () => {
      const next = measure();
      setLayout(next);
      if (next.enabled) center(next.pad);
      else if (window.scrollY !== 0) window.scrollTo(0, 0);
    };

    update();
    window.addEventListener("resize", update);
    window.visualViewport?.addEventListener("resize", update);
    window.addEventListener("orientationchange", update);
    return () => {
      root.classList.remove("lens-active");
      window.removeEventListener("resize", update);
      window.visualViewport?.removeEventListener("resize", update);
      window.removeEventListener("orientationchange", update);
      window.scrollTo(0, 0);
    };
  }, [center]);

  useEffect(() => {
    if (!layout.enabled) return;
    const pad = layout.pad;
    const onScroll = () => {
      if (Math.abs(window.scrollY - pad) > 2) scrollToAnchor(pad);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [layout.enabled, layout.pad]);

  return layout;
}
