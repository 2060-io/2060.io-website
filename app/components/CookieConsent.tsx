"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ConsentValue,
  EVENT_NAME,
  STORAGE_KEY,
  readStoredConsent,
} from "../lib/consent";

/**
 * First-visit cookie-approval dialog.
 *
 * Shown only when no prior choice is stored. The two actions are:
 *   - OK     → analytics allowed  (writes `accepted` to localStorage)
 *   - Cancel → analytics blocked  (writes `declined` to localStorage)
 *
 * On either choice we fire a `CustomEvent` so the Analytics component
 * mounts / unmounts its gtag scripts without needing a reload.
 *
 * The banner starts hidden on both server and client; only after we
 * read localStorage on mount do we decide whether to render it. This
 * keeps the SSR output stable and avoids a hydration mismatch.
 */
export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Defer one frame so we don't flash the banner on a cold cache
    // while the page is still painting its hero.
    const id = window.requestAnimationFrame(() => {
      if (readStoredConsent() === null) setVisible(true);
    });
    return () => window.cancelAnimationFrame(id);
  }, []);

  function record(value: ConsentValue) {
    try {
      window.localStorage.setItem(STORAGE_KEY, value);
    } catch {
      // localStorage unavailable — we can't remember, but we still
      // honour the current session by firing the event.
    }
    window.dispatchEvent(
      new CustomEvent<ConsentValue>(EVENT_NAME, { detail: value })
    );
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-labelledby="cookie-consent-title"
      aria-describedby="cookie-consent-body"
      className="fixed inset-x-0 bottom-0 z-50 border-t hairline bg-bg shadow-[0_-8px_24px_-12px_rgba(0,0,0,0.25)]"
    >
      <div className="max-w-6xl mx-auto px-6 py-5 flex flex-col gap-4 md:flex-row md:items-center md:gap-6">
        <div className="flex-1 text-sm leading-relaxed">
          <p
            id="cookie-consent-title"
            className="display text-fg text-base mb-1"
          >
            Cookies
          </p>
          <p id="cookie-consent-body" className="text-muted">
            We use Google Analytics to understand, at an aggregate level,
            how this site is used. Nothing is loaded until you choose. See
            our{" "}
            <Link href="/privacy" className="prose-link text-fg">
              privacy policy
            </Link>{" "}
            for details.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            className="btn"
            onClick={() => record("declined")}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => record("accepted")}
            autoFocus
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}
