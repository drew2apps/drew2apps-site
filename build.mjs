// Builds drew2apps.com into ./dist
//  1. copies the static site (everything except build files) into dist/
//  2. turns content/posts/*.md into the "Thoughts" blog: /blog/, /blog/<slug>/, /blog/feed.xml
//  3. writes /sitemap.xml
//
// Posts are Markdown files with a small header, for example:
//   ---
//   title: Bringing three old apps back
//   date: 2026-10-13
//   description: One line that shows up in the list and in link previews.
//   draft: true          (optional; drafts are skipped)
//   ---
//   The post, in Markdown.
//
// Run: npm run build   (Cloudflare Pages runs this on every push)
import { marked } from "marked";
import fs from "node:fs";
import path from "node:path";

const ROOT = path.dirname(new URL(import.meta.url).pathname);
const OUT = path.join(ROOT, "dist");
const POSTS = path.join(ROOT, "content", "posts");
const SITE = "https://drew2apps.com";
const SKIP = new Set(["dist", "content", "node_modules", ".git", ".github", "build.mjs", "package.json", "package-lock.json", "README.md", ".gitignore", ".DS_Store"]);

// ---------- 1. static files ----------
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
for (const name of fs.readdirSync(ROOT)) {
  if (SKIP.has(name)) continue;
  fs.cpSync(path.join(ROOT, name), path.join(OUT, name), { recursive: true });
}

// ---------- 2. posts ----------
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
function parse(file) {
  const raw = fs.readFileSync(file, "utf8").replace(/\r\n/g, "\n");
  const m = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  const meta = {};
  if (m) {
    for (const line of m[1].split("\n")) {
      const i = line.indexOf(":");
      if (i > 0) meta[line.slice(0, i).trim()] = line.slice(i + 1).trim().replace(/^["']|["']$/g, "");
    }
  }
  const body = m ? m[2] : raw;
  const base = path.basename(file, ".md");
  const slug = (meta.slug || base.replace(/^\d{4}-\d{2}-\d{2}-/, "")).toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "");
  const date = meta.date || (base.match(/^(\d{4}-\d{2}-\d{2})/) || [])[1];
  if (!meta.title || !date) throw new Error(`${base}.md needs a title and a date in its header`);
  const words = body.split(/\s+/).filter(Boolean).length;
  return { ...meta, slug, date, draft: /^(true|yes)$/i.test(meta.draft || ""), html: marked.parse(body), minutes: Math.max(1, Math.round(words / 230)) };
}
const all = fs.existsSync(POSTS) ? fs.readdirSync(POSTS).filter((f) => f.endsWith(".md")).map((f) => parse(path.join(POSTS, f))) : [];
const posts = all.filter((p) => !p.draft).sort((a, b) => (a.date < b.date ? 1 : -1));
const prettyDate = (d) => new Date(d + "T12:00:00Z").toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" });

const page = ({ title, description, url, body, type = "website" }) => `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(description)}">
  <meta property="og:type" content="${type}">
  <meta property="og:url" content="${SITE}${url}">
  <link rel="canonical" href="${SITE}${url}">
  <link rel="alternate" type="application/rss+xml" title="Drew's thoughts" href="/blog/feed.xml">
  <meta name="theme-color" content="#fbf8f3" media="(prefers-color-scheme: light)">
  <meta name="theme-color" content="#121016" media="(prefers-color-scheme: dark)">
  <link rel="icon" href="/favicon.svg" type="image/svg+xml">
  <link rel="preload" href="/assets/fonts/bricolage.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="preload" href="/assets/fonts/inter.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="stylesheet" href="/assets/css/site.css">
</head>
<body>
  <header class="site-header">
    <div class="wrap">
      <a class="logo" href="/" aria-label="drew2apps home">drew<span class="two">2</span>apps</a>
      <nav class="nav" aria-label="Main">
        <a href="/#apps">Apps</a>
        <a href="/blog/" aria-current="page">Thoughts</a>
        <a href="/about/">About</a>
      </nav>
    </div>
  </header>

  <main>
${body}
  </main>

  <footer class="site-footer">
    <div class="wrap">
      <span>© <span data-year>2026</span> Drew Carlson · Made in San Diego</span>
      <span><a href="/#apps">Apps</a> · <a href="/blog/feed.xml">RSS</a> · <a href="/privacy/">Privacy</a> · <a href="mailto:drew@drew2apps.com">drew@drew2apps.com</a></span>
    </div>
  </footer>
  <div class="rgb-bar" aria-hidden="true"><i style="background:var(--red)"></i><i style="background:var(--green)"></i><i style="background:var(--blue)"></i></div>

  <script src="/assets/js/site.js" defer></script>
</body>
</html>
`;

const listItem = (p) => `        <li>
          <a class="post-link" href="/blog/${p.slug}/">
            <time datetime="${p.date}">${prettyDate(p.date)}</time>
            <h2>${esc(p.title)}</h2>
            ${p.description ? `<p>${esc(p.description)}</p>` : ""}
          </a>
        </li>`;

fs.mkdirSync(path.join(OUT, "blog"), { recursive: true });
fs.writeFileSync(path.join(OUT, "blog", "index.html"), page({
  title: "Thoughts · drew2apps",
  description: "Notes from Drew Carlson on what he's building, what he's learning, and whatever else is on his mind.",
  url: "/blog/",
  body: `    <section class="blog-hero">
      <div class="wrap narrow">
        <div class="eyebrow"><span class="dots"><i style="background:var(--red)"></i><i style="background:var(--green)"></i><i style="background:var(--blue)"></i></span> Thoughts</div>
        <h1>Drew's thoughts</h1>
        <p class="lede">What I'm building, what I'm learning, and the occasional rant. <a href="/blog/feed.xml">RSS</a></p>
      </div>
    </section>
    <section>
      <div class="wrap narrow">
${posts.length ? `      <ol class="post-list">\n${posts.map(listItem).join("\n")}\n      </ol>` : `      <p class="empty-note">Nothing here yet. The first post is on its way.</p>`}
      </div>
    </section>`,
}));

posts.forEach((p, i) => {
  const newer = posts[i - 1], older = posts[i + 1];
  const dir = path.join(OUT, "blog", p.slug);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "index.html"), page({
    title: `${p.title} · drew2apps`,
    description: p.description || p.title,
    url: `/blog/${p.slug}/`,
    type: "article",
    body: `    <article class="post">
      <div class="wrap narrow">
        <a class="back" href="/blog/">← All thoughts</a>
        <header class="post-head">
          <h1>${esc(p.title)}</h1>
          <p class="post-meta"><time datetime="${p.date}">${prettyDate(p.date)}</time> · ${p.minutes} min read</p>
        </header>
        <div class="prose">
${p.html}
        </div>
        <nav class="post-nav" aria-label="More posts">
          ${newer ? `<a href="/blog/${newer.slug}/"><small>Newer</small>${esc(newer.title)}</a>` : "<span></span>"}
          ${older ? `<a class="older" href="/blog/${older.slug}/"><small>Older</small>${esc(older.title)}</a>` : "<span></span>"}
        </nav>
      </div>
    </article>`,
  }));
});

// RSS
const rfc822 = (d) => new Date(d + "T12:00:00Z").toUTCString();
fs.writeFileSync(path.join(OUT, "blog", "feed.xml"), `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">
<channel>
  <title>Drew's thoughts</title>
  <link>${SITE}/blog/</link>
  <atom:link href="${SITE}/blog/feed.xml" rel="self" type="application/rss+xml"/>
  <description>Notes from Drew Carlson on what he's building and learning.</description>
  <language>en-us</language>
${posts.slice(0, 30).map((p) => `  <item>
    <title>${esc(p.title)}</title>
    <link>${SITE}/blog/${p.slug}/</link>
    <guid>${SITE}/blog/${p.slug}/</guid>
    <pubDate>${rfc822(p.date)}</pubDate>
    <description>${esc(p.description || "")}</description>
    <content:encoded><![CDATA[${p.html}]]></content:encoded>
  </item>`).join("\n")}
</channel>
</rss>
`);

// ---------- 3. sitemap ----------
const pages = ["/", "/about/", "/privacy/", "/blog/", "/apps/trace-race/", "/apps/rgb/", "/apps/colorize/", "/apps/drift/", ...posts.map((p) => `/blog/${p.slug}/`)];
fs.writeFileSync(path.join(OUT, "sitemap.xml"), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.map((u) => `  <url><loc>${SITE}${u}</loc></url>`).join("\n")}
</urlset>
`);
fs.writeFileSync(path.join(OUT, "robots.txt"), `User-agent: *\nAllow: /\nSitemap: ${SITE}/sitemap.xml\n`);

console.log(`Built dist/ with ${posts.length} post(s)${all.length - posts.length ? ` (${all.length - posts.length} draft skipped)` : ""}.`);
