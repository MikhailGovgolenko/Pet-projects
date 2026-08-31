import { useEffect, useState } from "react";

/** Extra document scroll runway so iOS 26 Safari Liquid Glass can composite behind the tab bar. */
export const SAFARI_BLEED_PAD = 200;
const MOBILE_MAX_WIDTH = 760;

export type SafariBleedLayout = {
  enabled: boolean;
  pad: number;
  frameHeight: number;
  bandHeight: number;
};

function measureLayout(): SafariBleedLayout {
  if (typeof window === "undefined") {
    return { enabled: false, pad: 0, frameHeight: 0, bandHeight: 0 };
  }
  const enabled = window.innerWidth <= MOBILE_MAX_WIDTH;
  const pad = enabled ? SAFARI_BLEED_PAD : 0;
  const frameHeight = window.innerHeight;
  return {
    enabled,
    pad,
    frameHeight,
    bandHeight: frameHeight + 2 * pad,
  };
}

function scrollToBleedAnchor(pad: number) {
  window.scrollTo({ top: pad, left: 0, behavior: "instant" in window ? "instant" : "auto" });
}

/** Force Safari 26 to re-sample the bar backdrop after canvas paints. */
export function nudgeSafariChrome(pad: number) {
  scrollToBleedAnchor(pad);
  requestAnimationFrame(() => {
    window.scrollTo(0, pad + 1);
    requestAnimationFrame(() => scrollToBleedAnchor(pad));
  });
}

export function useSafariCanvasBleed(): SafariBleedLayout {
  const [layout, setLayout] = useState(measureLayout);

  useEffect(() => {
    const update = () => {
      const next = measureLayout();
      setLayout(next);
      if (next.enabled) {
        requestAnimationFrame(() => nudgeSafariChrome(next.pad));
      } else if (window.scrollY > 0) {
        window.scrollTo(0, 0);
      }
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
  }, []);

  useEffect(() => {
    if (!layout.enabled || !layout.pad) return;
    const pad = layout.pad;
    const onScroll = () => {
      if (Math.abs(window.scrollY - pad) > 1) {
        scrollToBleedAnchor(pad);
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [layout.enabled, layout.pad]);

  return layout;
}
