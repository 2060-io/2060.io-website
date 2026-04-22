# Changelog

## [2.0.0](https://github.com/2060-io/2060.io-website/compare/2060-io-website-v1.0.0...2060-io-website-v2.0.0) (2026-04-22)


### ⚠ BREAKING CHANGES

* migrate site from Hugo to Next.js 15 + Tailwind v4

### Features

* add android assetlinks for dev app ([578e2d3](https://github.com/2060-io/2060.io-website/commit/578e2d37aa7996a62585b4f29d1422234516aab8))
* add android assetlinks for dev app ([4e420da](https://github.com/2060-io/2060.io-website/commit/4e420da7e48f8ee27fbe80434dde26d95b5bb595))
* add android assetlinks for dev app ([0419b06](https://github.com/2060-io/2060.io-website/commit/0419b0616dbeff27364091ead61193624e7c2702))
* add android assetlinks for dev app ([3ee1197](https://github.com/2060-io/2060.io-website/commit/3ee1197e08946bd335bf811ea9a78da0dedc8a9c))
* add android assetlinks for dev app ([eccec67](https://github.com/2060-io/2060.io-website/commit/eccec674435b777a3822aa2e3170f16c3357e780))
* add apple app site association ([ecebcd0](https://github.com/2060-io/2060.io-website/commit/ecebcd0e2ed91e25916a1ce37bb9f17a1b3fe01e))
* add apple app site association ([64d824a](https://github.com/2060-io/2060.io-website/commit/64d824a88e41fca1c9ba298f9a3a815a074be59c))
* add apple app site association file ([3738b9a](https://github.com/2060-io/2060.io-website/commit/3738b9adb2078b1dfd86b38c1ad15e90a7100179))
* add apple app site association file ([b2c33d3](https://github.com/2060-io/2060.io-website/commit/b2c33d3742fd8d943dd6ff13ee3f9d0d48c1d936))
* add apple-app-site-association for provisional 2060 app ([b0f9110](https://github.com/2060-io/2060.io-website/commit/b0f911088a29257bbe85006666103c28d316c98e))
* add Privacy Policy and Terms of Service pages ([204528e](https://github.com/2060-io/2060.io-website/commit/204528ef83418f5a27971b1ff238112fc5b1a5c1))
* added avatar icons ([6485d6c](https://github.com/2060-io/2060.io-website/commit/6485d6c3ff5079c8e18cc887f6e12cc1b6f2114a))
* **deploy:** add Helm chart and CD workflow for Kubernetes (2060.io) ([1180ece](https://github.com/2060-io/2060.io-website/commit/1180ecedfa14a79ab2bfc817b72b0cd901558943))
* **deploy:** Helm chart + CD workflow for 2060.io ([969597e](https://github.com/2060-io/2060.io-website/commit/969597e13f089e7be68b084cc1dd6a8399406a9a))
* logo squared ([2f7ef1a](https://github.com/2060-io/2060.io-website/commit/2f7ef1a56d36b14a6364d2a3adbeb78c4e77fbce))
* migrate site from Hugo to Next.js 15 + Tailwind v4 ([e457867](https://github.com/2060-io/2060.io-website/commit/e457867538c529881e35ff6c7e82ca10fca98d83))
* rebuild site from scratch as a clean Hugo + Tailwind project ([121ba4b](https://github.com/2060-io/2060.io-website/commit/121ba4bbdc99cb597c1a86878baa7622f37e86f3))
* rebuild site from scratch as a clean Hugo + Tailwind project ([9378031](https://github.com/2060-io/2060.io-website/commit/9378031aebdd8c0e425f5f122a04472ed79e8eb5))
* **seo:** add meta_title and meta_description to content pages ([6b9b70c](https://github.com/2060-io/2060.io-website/commit/6b9b70cc4fd47a07688cd81409c9cce5722fa28b))
* **seo:** JSON-LD structured data, Google Analytics, full OG/Twitter cards ([abf814a](https://github.com/2060-io/2060.io-website/commit/abf814ae171b3b1d1eec5549d1a69a4b55a48268))
* **seo:** meta_title + meta_description, JSON-LD, GA, OG/Twitter, Privacy + Terms pages ([aa79fec](https://github.com/2060-io/2060.io-website/commit/aa79fec148250ee75dc759be07da9b5ae3fdade5))
* **seo:** site-wide metadata + home-scoped schema.org graph ([19eb1f2](https://github.com/2060-io/2060.io-website/commit/19eb1f212ce77b639984171562e0e58c87771ced))
* **seo:** site-wide OG/Twitter metadata + home-scoped schema.org graph ([95bd82b](https://github.com/2060-io/2060.io-website/commit/95bd82b52017b7c8605167dfc40435fdb5d0e6f9))
* update .well-known config for android and ios ([ad45e8a](https://github.com/2060-io/2060.io-website/commit/ad45e8a0d2d9bc3e81cf01c11b7d018e83384da9))


### Bug Fixes

* team ([9339c24](https://github.com/2060-io/2060.io-website/commit/9339c241c246d420162204266a507d7d28f8d693))
* team ([a62aa3c](https://github.com/2060-io/2060.io-website/commit/a62aa3c4131ed618a6e2a3958ef617aed5c20314))
* update apple-app-site-association ([64a0ab9](https://github.com/2060-io/2060.io-website/commit/64a0ab9db94b92bb0ca64b2bc45aaeacb53f6afa))
* update apple-app-site-association ([db84d7e](https://github.com/2060-io/2060.io-website/commit/db84d7ec1d265043388a3d44b6cf28a4b50c472b))

## 1.0.0

Initial release of the Next.js + Tailwind v4 rewrite of the 2060.io website.

### Pages

- Home, Projects, Team, Investors, Contact, Privacy.

### Stack

- Next.js 15 (App Router) with React 19.
- Tailwind v4 (CSS-first `@theme` configuration).
- TypeScript, strict mode.
- Docker image `io2060/website` published on release.
- Release management via `release-please` (`release-type: node`).
