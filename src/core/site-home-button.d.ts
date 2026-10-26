import type { DetailedHTMLProps, HTMLAttributes } from "react";

declare global {
  namespace JSX {
    interface IntrinsicElements {
      "site-home-button": DetailedHTMLProps<
        HTMLAttributes<HTMLElement> & {
          href?: string;
          label?: string;
        },
        HTMLElement
      >;
    }
  }
}

export {};
