# 2060.io website

Source for [2060.io](https://2060.io) — the 2060 OÜ public website.

Built with **Next.js 15** (App Router) + **React 19** + **Tailwind CSS v4** + **TypeScript**. Six hand-crafted pages (Home, Projects, Team, Investors, Contact, Privacy) share a theme-aware dark/light design driven by CSS custom properties.

Delivered as a container image (`io2060/website` on Docker Hub), built and published automatically by GitHub Actions.

## Stack

| Piece | What |
|-|-|
| Framework | [Next.js 15](https://nextjs.org) (App Router, `output: "standalone"`) |
| Language | TypeScript, strict mode |
| Styling | [Tailwind v4](https://tailwindcss.com) (CSS-first `@theme` configuration) |
| Fonts | Inter + Space Grotesk via Google Fonts |
| Icons | Font Awesome 6 via cdnjs |
| Runtime | Node 22 (alpine) |
| Container | Multi-stage `Dockerfile`, unprivileged user |
| Release mgmt | [release-please](https://github.com/googleapis/release-please) (`release-type: node`) |

## Repository layout

```text
.
├── app/
│   ├── layout.tsx              Shared HTML shell, fonts, Nav, Footer, theme script
│   ├── globals.css             Tailwind v4 import + all custom CSS (ported from v1)
│   ├── page.tsx                Home (/)
│   ├── projects/page.tsx       /projects
│   ├── team/page.tsx           /team
│   ├── investors/page.tsx      /investors
│   ├── contact/page.tsx        /contact
│   ├── privacy/page.tsx        /privacy
│   └── components/
│       ├── Nav.tsx             Header (client: theme toggle, mobile menu, active link)
│       ├── Footer.tsx          Footer (server)
│       └── Reveals.tsx         IntersectionObserver fade-up (client)
├── public/
│   └── assets/                 Illustrations, logos, favicon, avatars
├── static-old/                 Frozen snapshot of the previous Hugo build's static/
├── .github/workflows/
│   ├── docker-publish.yml      Build + push io2060/website to Docker Hub
│   └── release-please.yml      Conventional-commits driven version bumps + releases
├── Dockerfile                  Multi-stage: deps → build → runner
├── .dockerignore
├── next.config.ts              `output: "standalone"`, strict mode
├── postcss.config.mjs          Tailwind v4 PostCSS plugin
├── tsconfig.json
├── package.json
├── release-please-config.json
└── .release-please-manifest.json
```

## Prerequisites

- Node.js 22+ (LTS)
- npm (bundled with Node)

```bash
brew install node            # macOS
```

## Develop locally

```bash
npm install
npm run dev
```

Open <http://localhost:3000>.

## Build for production

```bash
npm run build
npm start
```

The `standalone` build output lives in `.next/standalone/` and is what the Docker image ships.

## Run the container locally

```bash
docker build -t 2060-website .
docker run --rm -p 3000:3000 2060-website
```

## Theme switching

Dark is the default. A `.light` class on `<html>` flips every CSS variable to the light palette. The class is set by an inline script in `app/layout.tsx` that runs synchronously in `<head>` before first paint, so there is no flash of the wrong theme. The script:

- respects the user's previous choice (`localStorage['2060-theme']`),
- then falls back to `prefers-color-scheme`,
- and persists every subsequent toggle.

The toggle button and mobile menu live in `app/components/Nav.tsx` (client component). IntersectionObserver-based fade-up reveal is handled by `app/components/Reveals.tsx`.

## Adding or editing content

Each page is a single `page.tsx` under `app/` (or a subdirectory of `app/` for subpages). The conversion from the v1 HTML preserves the original section structure and comments — look for `{/* ================== SECTION N ================== */}` markers.

To add a new route:

1. Create `app/<route>/page.tsx` with `export default function Page() { return (<>...</>); }`.
2. Add a link to it in `app/components/Nav.tsx` (the `LINKS` array) and, if appropriate, in `app/components/Footer.tsx`.

## Deployment

`push` to `main` triggers two workflows:

1. **`docker-publish.yml`** — builds a dev-tagged image (`io2060/website:dev`, `io2060/website:dev-YYYYMMDD-HHMMSS`) and pushes it to Docker Hub. Use this for previewing changes on staging.
2. **`release-please.yml`** — opens (or updates) a release PR based on Conventional Commits. Merging the release PR creates a Git tag + GitHub release and re-invokes `docker-publish.yml` with the release version, producing `io2060/website:latest` and `io2060/website:<version>`.

Required GitHub repository secrets:

- `DOCKER_HUB_LOGIN`
- `DOCKER_HUB_PWD`

## Versioning

Versions follow SemVer. Commits on `main` must use [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `chore:`, `docs:`, etc.) so `release-please` can compute the next version and generate `CHANGELOG.md` entries.

## License

See [LICENSE](LICENSE).
