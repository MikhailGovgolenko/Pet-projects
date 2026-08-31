import { useCallback, useEffect, useLayoutEffect, useState } from "react";

/** Scroll runway above/below the lens frame so iOS Safari can bleed under chrome. */
export const LENS_SCROLL_PAD = 200;
const GLASS_LAYOUT_MAX_WIDTH = 760;

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
  const enabled = window.innerWidth <= GLASS_LAYOUT_MAX_WIDTH;
  const pad = enabled ? LENS_SCROLL_PAD : 0;
  const frameHeight = window.innerHeight;
  return {
    enabled,
    pad,
    frameHeight,
    bandHeight: frameHeight + pad * 2,
  };
}

function scrollToAnchor(pad: number) {
  window.scrollTo({ top: pad, left: 0, behavior: "instant" in window ? "instant" : "auto" });
}

/** 1px jiggle — Safari 26 re-samples the tab bar backdrop on scroll/layout change. */
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
  }, []);

  useLayoutEffect(() => {
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
