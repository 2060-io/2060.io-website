import Script from "next/script";

/**
 * Google Analytics 4 tag (gtag.js).
 *
 * The measurement ID is hardcoded to the 2060 GA4 property. It can be
 * overridden via the NEXT_PUBLIC_GA_ID env var (e.g. for staging or
 * review deployments). GA4 anonymizes IPs by default.
 *
 * Loaded with strategy="afterInteractive" so it doesn't block initial
 * paint; gtag is queued before the script arrives.
 */
const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_ID || "G-9H5406F02W";

export default function Analytics() {
  if (!GA_MEASUREMENT_ID) return null;

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
