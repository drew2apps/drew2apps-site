# drew2apps.com

Small, colorful web apps by Drew Carlson, plus **Thoughts**, a simple blog.

- **[Trace Race](https://drew2apps.com/apps/trace-race/)**: a daily tracing race, one shape a day for everyone
- **[RGB](https://drew2apps.com/apps/rgb/)**: mix colors with RGB, HSV, HSL, CMYK, hex or the color box
- **[Colorize](https://drew2apps.com/apps/colorize/)**: find the one square that's a different color
- **[Drift](https://drew2apps.com/apps/drift/)**: an ambient color clock (formerly Transition)

The same pages power the Android apps on Google Play (wrapped with Capacitor).

## How it's built

Plain HTML, CSS and JavaScript. No framework. `build.mjs` copies the site into `dist/` and turns the Markdown posts in `content/posts/` into the blog, an RSS feed and a sitemap.

```sh
npm install
npm run build   # writes dist/
npm run dev     # builds, then serves dist/ locally
```

Cloudflare Pages runs `npm run build` on every push to `main` and publishes `dist/`.

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
