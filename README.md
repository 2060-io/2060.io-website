# 2060.io website

Source for [2060.io](https://2060.io) — the 2060 OÜ public website.

Built with **Hugo** + **Tailwind CSS**. Six hand-crafted pages (home, What We Do, Projects, Research, Team, Contact) layered over a shared dark/light theme driven by CSS custom properties.

Deployed automatically to GitHub Pages on every push to `main`.

## Stack

| Piece | What |
|-|-|
| Static site generator | [Hugo extended](https://gohugo.io) (v0.141) |
| Styling | [Tailwind CSS](https://tailwindcss.com) (v3.4, JIT) compiled via the standalone CLI |
| Theme | Custom, no Hugo theme, all layouts live under `layouts/` |
| Fonts | Inter + Space Grotesk via Google Fonts |
| Icons | Font Awesome 6 via cdnjs |
| Hosting | GitHub Pages with custom domain `2060.io` (see `static/CNAME`) |

## Repository layout

```text
.
├── archetypes/              Hugo page templates for `hugo new`
├── assets/
│   └── css/input.css        Tailwind source (compiled to static/css/custom.css at build)
├── content/                 One Markdown file per page, front-matter only
│   ├── _index.md            Home
│   ├── services/_index.md   What We Do
│   ├── projects/_index.md
│   ├── research/_index.md
│   ├── team/_index.md
│   └── contact/_index.md
├── layouts/
│   ├── _default/baseof.html Shared HTML shell (html, head, body, main block)
│   ├── partials/            head.html, nav.html, footer.html
│   ├── index.html           Home page
│   ├── services/list.html   Each section's list layout = the whole page
│   ├── projects/list.html
│   ├── research/list.html
│   ├── team/list.html
│   └── contact/list.html
├── static/                  Copied verbatim into the site root at build
│   ├── CNAME                -> public/CNAME  (GitHub Pages custom domain)
│   └── assets/              illustrations, logos, theme.js, favicon, etc.
├── .github/workflows/
│   └── hugo.yml             Build + deploy to GitHub Pages
├── hugo.yaml                Hugo configuration
├── package.json             Tailwind toolchain
├── tailwind.config.js       Theme tokens, colour palette via CSS vars
└── README.md
```

## Prerequisites

- [Hugo extended](https://gohugo.io/installation/) v0.141 or newer
- Node.js 20+ (for Tailwind)

```bash
brew install hugo node      # macOS
```

## Develop locally

Install the Tailwind toolchain once:

```bash
npm install
```

Then run the dev server. The `npm run dev` script rebuilds Tailwind on every CSS change and boots `hugo server` concurrently:

```bash
npm run dev
```

Open <http://localhost:1313>.

If you prefer two terminals (less noise, easier to debug CSS):

```bash
# terminal 1
npm run dev:css

# terminal 2
npm run dev:hugo
```

## Build for production

```bash
npm run build
```

The output lands in `public/`. That directory is what CI uploads to GitHub Pages.

## Adding or editing content

Most pages are driven directly from their layout file, the Markdown file is just a stub that tells Hugo the page exists and carries its `<title>` / `<meta description>`.

1. To edit existing page copy, open the matching file under `layouts/` (e.g. `layouts/services/list.html`). Every section is marked with an `<!-- SECTION N -->` comment.
2. To change a page's title or description, edit the front-matter in the matching `content/**/_index.md`.
3. To tweak colours or spacing tokens, edit `assets/css/input.css` (CSS variables in the `:root` / `:root.light` blocks) and re-run `npm run build:css`.

## Theme switching

Dark is the default. A `.light` class on `<html>` flips every CSS variable to the light palette. The class is set by `static/assets/theme.js`, which:

- respects the user's previous choice (`localStorage`),
- then falls back to `prefers-color-scheme`,
- and wires up the `[data-theme-toggle]` button and mobile menu.

Adding a new themable colour token only requires editing `assets/css/input.css` — both variants live there, side by side.

## Deployment

Push to `main` → GitHub Actions runs `.github/workflows/hugo.yml` → Hugo build artifact is uploaded → GitHub Pages deploys.

The custom domain `2060.io` is pinned via `static/CNAME`. If that file is removed, GitHub Pages automatically falls back to <https://2060-io.github.io/2060.io-website/>.

## License

See [LICENSE](LICENSE).
