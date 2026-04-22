"use client";

import { useEffect } from "react";

/**
 * Idle-time prefetch for all cross-page images so that subsequent
 * navigations render from the HTTP cache with no perceptible load.
 *
 * - Runs only once per session (guarded via sessionStorage).
 * - Waits for `window.load` and `requestIdleCallback` so it never
 *   competes with the current page's critical resources.
 * - Skipped entirely when the browser reports data-saver mode or a
 *   slow effective connection.
 * - The current page's already-loaded images are still listed here;
 *   the browser deduplicates automatically (cache hit on the link).
 *
 * To add new cross-page assets, just append their paths to IMAGES.
 */
const IMAGES: ReadonlyArray<string> = [
  // Hero / closing illustrations
  "/assets/team.svg",
  "/assets/long-term.svg",
  "/assets/train.svg",
  "/assets/tools.svg",
  "/assets/two-chairs.svg",
  "/assets/projects.svg",
  "/assets/projects-bottom2.svg",
  "/assets/home.svg",
  "/assets/musiciens.svg",
  "/assets/viaduc2.svg",
  "/assets/blueprint.svg",
  "/assets/contact-us.svg",
  "/assets/enveloppe.svg",
  // Team portraits
  "/assets/andres.jpeg",
  "/assets/david.jpeg",
  "/assets/maxime.jpeg",
  "/assets/philip.jpeg",
  "/assets/pratik.jpeg",
  "/assets/tarun.jpeg",
  "/assets/illustrations/ariel.jpeg",
  "/assets/illustrations/fabrice.jpeg",
  // Flagship product marks
  "/assets/hologram-logo.svg",
  "/assets/verana-logo.svg",
  // Standards / community logo strip
  "/assets/logos/cosmos-logo-black.svg",
  "/assets/logos/daiaa.avif",
  "/assets/logos/logo-credo.svg",
  "/assets/logos/logo-didcomm.svg",
  "/assets/logos/logo-dif.png",
  "/assets/logos/logo-open-wallet.svg",
  "/assets/logos/logo-trust-over-ip.svg",
  "/assets/logos/logo-w3c.svg",
];

const SESSION_KEY = "2060-images-prefetched";

type NetInformation = {
  saveData?: boolean;
  effectiveType?: string;
};

export default function ImagePreloader() {
  useEffect(() => {
    // Only prefetch once per session.
    try {
      if (sessionStorage.getItem(SESSION_KEY)) return;
    } catch {
      /* storage blocked — proceed anyway */
    }

    // Respect user-expressed bandwidth preferences.
    const conn = (
      navigator as Navigator & { connection?: NetInformation }
    ).connection;
    if (conn?.saveData) return;
    if (conn?.effectiveType === "slow-2g" || conn?.effectiveType === "2g") return;

    function prefetchAll() {
      IMAGES.forEach((href) => {
        const link = document.createElement("link");
        link.rel = "prefetch";
        link.as = "image";
        link.href = href;
        document.head.appendChild(link);
      });
      try {
        sessionStorage.setItem(SESSION_KEY, "1");
      } catch {
        /* ignore */
      }
    }

    function schedule() {
      const ric = (
        window as Window & {
          requestIdleCallback?: (
            cb: () => void,
            opts?: { timeout?: number }
          ) => number;
        }
      ).requestIdleCallback;
      if (typeof ric === "function") {
        ric(prefetchAll, { timeout: 3000 });
      } else {
        setTimeout(prefetchAll, 1000);
      }
    }

    if (document.readyState === "complete") {
      schedule();
    } else {
      window.addEventListener("load", schedule, { once: true });
    }
  }, []);

  return null;
}
