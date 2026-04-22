import type { Metadata } from "next";
import "./globals.css";
import Nav from "./components/Nav";
import Footer from "./components/Footer";
import Reveals from "./components/Reveals";
import ImagePreloader from "./components/ImagePreloader";

export const metadata: Metadata = {
  title: "2060 — We Build the Open Trust Layer for the Agentic Internet",
  description:
    "An independent research and engineering company inventing, specifying, and shipping the infrastructure that lets humans, services, and AI agents prove who they are and act under verifiable authority.",
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
