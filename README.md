# akshaysin.github.io

Source for [akshaysin.github.io](https://akshaysin.github.io) — Akshay Sinha's
personal blog on DevOps, infrastructure automation, and machine learning.

Built with [Astro](https://astro.build) and deployed to GitHub Pages.

## Commands

| Command             | Action                                            |
| :------------------ | :------------------------------------------------ |
| `npm install`       | Install dependencies                              |
| `npm run dev`       | Start the dev server at `localhost:4321`          |
| `npm run build`     | Build the production site to `./dist/`            |
| `npm run preview`   | Preview the built site locally                    |
| `npm run check`     | Type-check `.astro` files and frontmatter schemas |
| `npm run clean`     | Remove `dist/` and the `.astro/` cache            |
| `npm run analyze`   | Report on bundle and asset sizes in `dist/`       |

## Writing a post

Add a Markdown file to `src/content/blog/`. The filename becomes the URL, so
`2026-01-15-my-post.md` publishes at `/blog/2026-01-15-my-post/`.

Frontmatter is validated by the schema in [`src/content.config.ts`](src/content.config.ts):

```yaml
---
title: "Post title"
description: "One or two sentences; used for SEO and the RSS feed."
pubDate: 2026-01-15          # or an ISO timestamp with an offset
updatedDate: 2026-01-20      # optional
category: "DevOps"           # optional, rendered as a badge
tags: kafka, ssl             # optional, comma-separated or a YAML list
heroImage: "../../assets/my-image.webp"   # optional, relative to the post
heroImageAlt: "Description of the image." # optional but expected with heroImage
draft: false                 # true keeps the post out of the build entirely
---
```

Hero images live in `src/assets/` (not `public/`) so Astro can optimise them.

### Publishing gate

A post is built only when `draft` is falsy **and** `pubDate` is in the past.
This filter is applied in three places, which must stay in sync:

- [`src/pages/blog/[...slug].astro`](src/pages/blog/[...slug].astro) — the post pages
- [`src/pages/blog/index.astro`](src/pages/blog/index.astro) — the post listing
- [`src/pages/rss.xml.js`](src/pages/rss.xml.js) — the feed

Because the filter runs at build time, a future-dated post does not appear until
the site is rebuilt. The deploy workflow therefore runs on a weekly cron
(Fridays, 09:00 IST) in addition to pushes, so scheduled posts go live without a
release-day commit.

> **Note:** hero images of draft posts are still emitted to `dist/_astro/` under
> hashed filenames, because Astro resolves the whole content collection at build
> time. The filenames are not discoverable from the site, but do not use a hero
> image you would not want served at all.

## Legacy URLs

This site previously ran on Jekyll with flat `/post-name.html` URLs. Those paths
are mapped to their current locations via the `redirects` block in
[`astro.config.mjs`](astro.config.mjs), which Astro emits as meta-refresh pages.
Do not remove them — they are still indexed.

## Deployment

[`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) builds on every
push and pull request to `main`, and deploys to GitHub Pages on pushes to `main`.
The Pages source must be set to **GitHub Actions** in the repository settings.

## Credit

Theme based on [Bear Blog](https://github.com/HermanMartinus/bearblog/).
