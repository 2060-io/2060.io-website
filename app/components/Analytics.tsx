"use client";

import Script from "next/script";
import { useEffect, useState } from "react";
import { EVENT_NAME, readStoredConsent } from "../lib/consent";

/**
 * Google Analytics 4 tag (gtag.js), gated on explicit user consent.
 *
 * The measurement ID is hardcoded to the 2060 GA4 property. It can be
 * overridden via the NEXT_PUBLIC_GA_ID env var (e.g. for staging or
 * review deployments). GA4 anonymizes IPs by default.
 *
 * Nothing is loaded until the user clicks "OK" in the cookie consent
 * banner. We subscribe to the shared `cookie-consent-change` event so
 * the scripts mount without a reload once consent is granted, and
 * unmount immediately if consent is revoked in-session.
 *
 * Loaded with strategy="afterInteractive" so it doesn't block initial
 * paint; gtag is queued before the script arrives.
 */
const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_ID || "G-9H5406F02W";

export default function Analytics() {
  const [consented, setConsented] = useState(false);

  useEffect(() => {
    setConsented(readStoredConsent() === "accepted");

    function handleChange(e: Event) {
      const detail = (e as CustomEvent<"accepted" | "declined">).detail;
      setConsented(detail === "accepted");
    }
    window.addEventListener(EVENT_NAME, handleChange as EventListener);
    return () =>
      window.removeEventListener(EVENT_NAME, handleChange as EventListener);
  }, []);

  if (!GA_MEASUREMENT_ID || !consented) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />
      <Script id="gtag-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_MEASUREMENT_ID}');
        `}
      </Script>
    </>
  );
}
