import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  reactStrictMode: true,

  // By default Next.js serves everything under `public/` with
  // `Cache-Control: public, max-age=0`, which forces the browser to
  // revalidate every image on every navigation (conditional GET → 304,
  // still an RTT to the origin). Override so cross-page assets render
  // from cache with zero network trips after the first visit.
  async headers() {
    return [
      {
        // Site illustrations, team portraits, logos, theme toggle JS,
        // og-image, favicon. These can be refreshed across a release,
        // so we keep freshness bounded but allow stale-while-revalidate
        // so users never block on a background refresh.
        source: "/assets/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=86400, stale-while-revalidate=604800",
          },
        ],
      },
      {
        // Legacy /images/* paths preserved for backward compatibility
        // with inbound links from the old Hugo site — these never change.
        source: "/images/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=604800, stale-while-revalidate=2592000",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
