import type { NextConfig } from "next";

// Thumbnail rendering (app/lib/doc-thumbnail.ts) needs files the tracer can't
// see: pdf.js reads its fonts, CMaps, wasm decoders and ICC profiles from
// disk and loads @napi-rs/canvas through a computed require, and the canvas
// package picks its native binary (@napi-rs/canvas-<platform>) the same way.
// The standalone output only ships traced files, so include them for the
// admin routes that render.
const THUMBNAIL_ASSETS = [
  "./node_modules/pdfjs-dist/legacy/build/pdf.mjs",
  "./node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs",
  "./node_modules/pdfjs-dist/standard_fonts/**",
  "./node_modules/pdfjs-dist/cmaps/**",
  "./node_modules/pdfjs-dist/wasm/**",
  "./node_modules/pdfjs-dist/iccs/**",
  "./node_modules/@napi-rs/canvas/**",
  "./node_modules/@napi-rs/canvas-*/**",
];

const nextConfig: NextConfig = {
  output: "standalone",
  reactStrictMode: true,

  // Thumbnail rendering: native (@napi-rs/canvas, sharp) and ESM-with-worker
  // (pdfjs-dist) packages the bundler must leave to Node's own loader.
  serverExternalPackages: ["pdfjs-dist", "@napi-rs/canvas", "sharp"],

  // Document uploads ride server actions; the default body limit is 1 MB.
  // 64mb gives headroom over the 50 MB per-file cap enforced in the action.
  experimental: { serverActions: { bodySizeLimit: "64mb" } },

  // The NDA template is read from disk at runtime when a VC signs
  // (app/lib/nda-versions.ts). `output: "standalone"` only ships traced files,
  // so include legal/ for the routes that render or sign it.
  outputFileTracingIncludes: {
    "/dataroom/**": ["./legal/**"],
    "/dataroom": ["./legal/**"],
    "/admin/**": ["./legal/**"],
    "/vc-admin/documents": THUMBNAIL_ASSETS,
    "/vc-admin/documents/**": THUMBNAIL_ASSETS,
  },

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
