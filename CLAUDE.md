# drew2apps-site

drew2apps.com: Drew's personal hobby site and the **Thoughts** blog. Read README.md first.

- The apps moved to strobi.dev (repo `strobi-site`) in Oct 2026. Don't add apps here; link to strobi.dev instead.
- Keep EosLog and Strobi business content off this site.
- Plain HTML/CSS/JS, no framework. `build.mjs` copies the site to `dist/` and renders `content/posts/*.md` into the blog, RSS and sitemap.
  - `npm run build` (writes `dist/`, which is gitignored) · `npm run dev` (build + serve locally)
- Blog posts: `content/posts/YYYY-MM-DD-slug.md` with `title`, `date`, `description`, `draft` frontmatter. Leave new posts as `draft: true` unless Drew says publish.
- `_redirects` keeps old `/apps/...`, `/trace` and `/stampede` links pointing at strobi.dev. Don't break them.
- Deploy: Cloudflare Pages builds every push to `main`. Use `[skip ci]` for docs-only commits.
- UI changes: mock-ups first, then build.
