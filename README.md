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

## MCP server (VC admin console for AI assistants)

The data room's VC admin console is also a [Model Context Protocol](https://modelcontextprotocol.io) server, same design as the Verana Foundation site (its ADR-0005): Streamable HTTP at `/api/mcp`, stateless, built on `mcp-handler` and the official TypeScript SDK.

- **Who**: VC admins and admins. The owner's role is resolved on every request, so removing a role cuts off their tokens at once.
- **Tokens**: created in `/account/settings` (name, `read` or `write` scope, optional expiry). The secret (`dr_…`) is shown once; only its SHA-256 is stored. The page also prints the `claude mcp add` command and an `mcpServers` JSON snippet.
- **claude.ai connectors** sign in instead: the site is also an OAuth 2.1 authorization server — discovery at `/.well-known/oauth-authorization-server` and `/.well-known/oauth-protected-resource`, open dynamic client registration (`/api/oauth/register`), consent at `/oauth/authorize` (staff only), PKCE-only code exchange and rotating refresh tokens at `/api/oauth/token`, revocation at `/api/oauth/revoke`. The tokens it mints are `ApiToken` rows like the personal ones, bound to a grant and to the MCP URL; "Connected applications" in the settings lists the grants with a Disconnect button. Expired codes and tokens are purged opportunistically on code exchange (no cron here).
- **Tools**: everything the console does — documents (add, replace, remove, order, visibility, covers, previews), invitations (invite, resend, revoke, per-email grants), the invitation email template, meeting booking settings and booked calls, plus read tools (lists, invite details, engagement summary). Uploads travel as base64 (15 MB max); bigger files use the web form.
- **One service layer**: `app/lib/dataroom-service.ts` holds the operations; the server actions and the MCP tools both call it with an `Actor`. Changes made through the MCP are audited with `via: "mcp"`.
- **Safeguards**: 120 requests per minute per token; write tools need a `write` token; the server's instructions ask the assistant to confirm before sending invitations, revoking, removing documents or cancelling calls.

Locally, point a client at `http://localhost:3000/api/mcp` with a token created on the local settings page.
