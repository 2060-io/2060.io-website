/**
 * Cookie-consent shared constants.
 *
 * Imported by both `components/CookieConsent.tsx` (the banner) and
 * `components/Analytics.tsx` (the GA4 loader). Keeping them in a
 * single module prevents the two keys from drifting apart.
 *
 * Storage: `localStorage` under STORAGE_KEY. We persist the choice so
 * the banner only shows on the very first visit — not on every page.
 *
 * Coordination: when the user makes a choice, the banner dispatches a
 * `CustomEvent<ConsentValue>` on `window` with EVENT_NAME as its type.
 * The analytics component subscribes to it and mounts / unmounts the
 * gtag scripts accordingly, without requiring a page reload.
 */

export const STORAGE_KEY = "2060-cookie-consent";
export const EVENT_NAME = "2060:cookie-consent-change";

export type ConsentValue = "accepted" | "declined";

export function readStoredConsent(): ConsentValue | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === "accepted" || raw === "declined") return raw;
    return null;
  } catch {
    // localStorage may be disabled (e.g. Safari private mode, or storage
    // quota exceeded). Treat as "undecided" but the caller should not
    // spam the banner — see CookieConsent for the guard.
    return null;
  }
}
