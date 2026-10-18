# drew2apps.com

Small, colorful web apps by Drew Carlson, plus **Thoughts**, a simple blog.

The apps moved to strobi.dev in October 2026 (code in github.com/strobidev/strobi-site), and the home page links to them there:

- **[Trace Race](https://strobi.dev/trace-race/)**: a daily tracing race, one shape a day for everyone
- **[RGB](https://strobi.dev/rgb/)**: mix colors with RGB, HSV, HSL, CMYK, hex or the color box
- **[Tilery](https://strobi.dev/tilery/)**: 21 brain games on one grid (Colorize grew into it)
- **[Drift](https://strobi.dev/drift/)**: an ambient color clock (formerly Transition)

`_redirects` sends the old `/apps/...`, `/trace` and `/stampede` links to strobi.dev.

## How it's built

Plain HTML, CSS and JavaScript. No framework. `build.mjs` copies the site into `dist/` and turns the Markdown posts in `content/posts/` into the blog, an RSS feed and a sitemap.

```sh
npm install
npm run build   # writes dist/
npm run dev     # builds, then serves dist/ locally
```

Cloudflare Pages runs `npm run build` on every push to `main` and publishes `dist/`.

## Stampede (early test)

Stampede moved to strobi.dev/stampede/ along with its Pages Function and D1 database binding. drew2apps.com/stampede redirects there.

## Writing a post

Add a file to `content/posts/`, named like `2026-10-13-my-post-title.md`:

```md
---
title: My post title
date: 2026-10-13
description: One line for the post list and link previews.
draft: true
---

The post, in Markdown.
```

Remove `draft: true` (or set it to `false`) to publish. The part of the filename after the date becomes the URL: `drew2apps.com/blog/my-post-title/`.
