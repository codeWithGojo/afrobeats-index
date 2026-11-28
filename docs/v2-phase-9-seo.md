# AFR/INDEX v2 · Phase 9 SEO

## What changed

- **Meta on every page:** each indexable page has a unique title and description (tested), canonical, OG title, description, image and URL, and a Twitter card. `/newsletter` gained canonical and OG tags. `/offline`, `/quiz` (the shell; `/quiz` is served by `api/quiz-page`) and `/404` are `noindex`. `/underground` is a redirect stub whose canonical points at `/watch`.
- **One `<h1>` per page:** 11 app-style pages (including `/current`) had none; they get a visually hidden `<h1>` naming the page.
- **JSON-LD (`lib/seo.cjs`, `scripts/render-seo.cjs`):**
  - Organization and WebSite on the homepage.
  - ItemList on Current 50, All-Time 50, TurnTable Top 100 songs and albums (plus the existing Heat 25, Current 100 and homepage lists).
  - BreadcrumbList on every page.
  - MusicGroup on every artist page (name, URL, image, bio, genres, country, career start, Spotify and Wikipedia `sameAs`).
- **Server-rendered content (`api/view.js`):**
  - Artist pages already rendered their header. They now also render a "Related on AFR/INDEX" block: collaborators from explicit feature credits, chart neighbours with compare links, and their boards.
  - Country and genre boards now render the full ranked list on the server.
  - Compare pages link back to both artist profiles.
- **Programmatic pages with real content only:**
  - 8 genre boards (`genre-boards.js`). A genre is published only with 5 or more artists, so Highlife (4) returns 404 and stays out of the sitemap.
  - Compare pairs in the sitemap are top-20 chart neighbours and the biggest explicit collaborations (up to 40).
- **Sitemap and robots:** `sitemap.xml` is regenerated from pages and data on every build (148 URLs: pages, all 50 artists, 4 country boards, 8 genre boards, 4 specialist boards, compare pairs), with `lastmod` set to the edition date on chart pages. `robots.txt` allows `/api/card` (share images) and disallows other `/api/`, `/account` and `/studio/api`. The weekly data job runs the build, so both refresh after each data update.
- **Accessibility fixes from Lighthouse:** onboarding step dots now have `role="img"`; footer links are 44px tall.

## Lighthouse (local static server, mobile emulation)

Lighthouse 12.2.1, SEO / Accessibility:

| Page | SEO | A11y | | Page | SEO | A11y |
|---|---|---|---|---|---|---|
| / | 100 | 100 (was 93) | | /watch | 100 | 100 |
| /current | 100 | 100 | | /sponsor | 100 | 100 |
| /heat | 100 | 100 | | /rankings | 100 | 100 |
| /current-100 | 100 | 100 | | /top100 | 100 | 96 |
| /all-time | 100 | 100 (was 96) | | /newsletter | 100 | 100 |
| /compare | 100 | 100 | | /news | 100 | 100 |
| /method | 100 | 100 | | /artists | 100 | 95 |
| /music-receipt | 100 | 100 | | /albums | 100 | 100 |
| /stats | 100 | 100 | | /releases | 100 | 96 |
| /my-index | 100 | 100 | | /regions | 100 | 95 |
| /net-worth | 100 | 100 | | /discussion | 100 | 100 |
| /streams | 100 | 100 | | | | |

No page is under 90. Fixed: onboarding dots role, 44px footer links, and All-Time lime badges whose text a global rule had turned near-white (1.06:1). Only static pages were measured. `api/view` routes (artist, board and compare pages) need `vercel dev` or production.

## What to test

1. `npm run build`, `npm test` (205 pass).
2. Google Rich Results Test on `/current/<artist>` and `/current` once deployed.
3. Submit `https://afrobeats-index.vercel.app/sitemap.xml` in Google Search Console.

## TODO (Phase 9)

- [ ] Run Lighthouse on artist, board and compare routes after deploy.
- [ ] Artist pages use MusicGroup for everyone; solo artists could add Person where a reliable source distinguishes them.
- [ ] All-Time artists outside the Current 50 have no artist pages yet, so they are not in the sitemap.
