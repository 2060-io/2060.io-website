import type { Metadata } from "next";
import "./globals.css";
import Nav from "./components/Nav";
import Footer from "./components/Footer";
import Reveals from "./components/Reveals";
import ImagePreloader from "./components/ImagePreloader";

const SITE_URL = "https://2060.io";
const SITE_NAME = "2060";
const SITE_TITLE = "2060 — We Build the Open Trust Layer for the Agentic Internet";
const SITE_DESCRIPTION =
  "An independent research and engineering company inventing, specifying, and shipping the infrastructure that lets humans, services, and AI agents prove who they are and act under verifiable authority.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_TITLE,
    template: "%s — 2060",
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  authors: [{ name: "2060 OÜ", url: SITE_URL }],
  creator: "2060 OÜ",
  publisher: "2060 OÜ",
  keywords: [
    "2060",
    "Hologram",
    "Verana",
    "Verifiable Trust",
    "VPR",
    "agentic AI",
    "decentralized identity",
    "verifiable credentials",
    "trust registry",
    "DIDComm",
    "MCP",
  ],
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    url: SITE_URL,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    locale: "en_US",
    images: [
      {
        url: "/assets/og-image.png",
        width: 1200,
        height: 630,
        alt: SITE_TITLE,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: ["/assets/og-image.png"],
  },
  icons: {
    icon: "/assets/favicon.svg",
  },
};

/**
 * Synchronously sets the theme class on <html> before first paint, to
 * avoid a flash of the wrong theme. Mirrors the IIFE from the original
 * `theme.js`; the rest of theme.js (toggle, mobile menu, reveals) lives
 * in the Nav and Reveals client components.
 */
const themeInitScript = `
(function () {
  try {
    var key = '2060-theme';
    var stored = localStorage.getItem(key);
    var theme = (stored === 'light' || stored === 'dark')
      ? stored
      : (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
    var root = document.documentElement;
    if (theme === 'light') { root.classList.add('light'); root.classList.remove('dark'); }
    else { root.classList.add('dark'); root.classList.remove('light'); }
  } catch (_) { document.documentElement.classList.add('dark'); }
})();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin=""
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap"
          rel="stylesheet"
        />
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css"
          crossOrigin="anonymous"
          referrerPolicy="no-referrer"
        />
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-accent focus:text-fg focus:px-3 focus:py-2"
        >
          Skip to content
        </a>
        <Nav />
        <main id="main">{children}</main>
        <Footer />
        <Reveals />
        <ImagePreloader />
      </body>
    </html>
  );
}
