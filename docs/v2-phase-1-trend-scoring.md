# AFR/INDEX v2 · Phase 0 audit and Phase 1 trend scoring

## Phase 0: how the repo works

- **Stack.** Static multi-page site on Vercel (`cleanUrls`), vanilla JS, Tailwind 3 (CLI), esbuild bundles for a few React/Motion islands (`src/motion`), Node serverless functions in `api/`, Supabase (auth, receipts, comments, Pro, newsletter, watch, ingestion history). Payments through Paystack and Flutterwave webhooks.
- **Routing.** One HTML file per top-level page (`index`, `current`, `all-time`, `compare`, `method`, `music-receipt`, `watch`, `pro`, ...). Dynamic routes (`/current/:artist`, `/vs/:a/:b`, `/studio/*`, `/boards/*`, `/receipt/:id`, `/u/:user`, `/week/:w`) are rewritten to `api/view.js`, which renders `studio.js` views.
- **Build.** `npm run build` (`scripts/build.cjs`): copies `templates/app.html` to `index.html`, then a chain of `scripts/render-*.cjs` and `sync-*.cjs` scripts rewrite the committed HTML and data artifacts in place. Generated output is committed.
- **Data.** `data/*.json` plus embedded browser state (`assets/inline-07.js`) and dated refresh scripts (`refresh-2026-*.js`). Kworb artist song and album ledgers are the stream source (`data/releases-2026-sources.json`), TurnTable for the Nigeria Top 100, Apple lookups for release identities. `npm run refresh:data` collects; the GitHub Actions `data-engine.yml` runs a daily collection into Supabase and a Monday edition build and commit.
- **Scoring (before v2).** `streaming-model.js` `apply()`: 83 × locked editorial contribution (5 Oct 2026 baseline, no component marks) + 17 × lifetime Spotify total / max. It runs at build time (`scripts/sync-streaming.cjs` writes `streaming-snapshot.js`, `scripts/export-data.cjs` writes `data/current.json`) and again in the browser with the same inputs.
- **Existing pieces reused.** Weight sandbox (`/studio/sandbox`, `lib/board-engine.cjs`), movers strip (`current-view.js`), share flows (`api/card.js` story and OG PNGs, `navigator.share` in `studio.js`), JSON-LD `ItemList` on the homepage, `sitemap.xml`, `robots.txt`, `manifest.webmanifest`, `sw.js` (network first, offline edition), Vercel Analytics dependency.
- **Tests.** `npm test` (node:test, 30+ files).

## Phase 1: what changed

New file `trend-model.js` holds the whole formula as pure functions shared by Node and the browser.

| Input | Weight | Source and rule |
|---|---|---|
| Recent streams | 35% | Mean of each artist’s daily Kworb Spotify readings inside a 28-day window, anchored to their latest reading. Log scale: 10,000/day or less = 0, busiest artist = 100. |
| Momentum | 25% | This week vs the artist’s own 4-week baseline. 1x = 50, 2x = 100, 0.5x = 0. If there is a history gap, the latest 4 readings before this week are used when the newest is at most 56 days old; otherwise neutral 50. |
| Editorial | 25% | Locked 5 Oct 2026 contribution scaled 0 to 100. Full weight 8 weeks after `reviewedAt`, then fades toward the median until it keeps 40% of its spread at 12 weeks. |
| Activity | 15% | Release in 28/56/90 days (40/25/10, reissues and DJ mixes excluded), TurnTable Top 100 (30/20/10, +5 for 3+ entries, chart must be 28 days old or less), award win/nomination in 120 days (15/8), verified live date within 30 days (10), reviewed TikTok or Shazam spike (10). Cap 100. |

- Published score = mean of this edition’s raw score and earlier v2 editions from the last 28 days (up to 4).
- Weekly movement cap of 8 places against last week’s rank. New entries are uncapped. The profile shows `targetRank` when the cap applies.
- New data files: `data/stream-history.json` (dated readings, seeded from the 8 published snapshots, appended every build), `data/editorial-reviews.json` (review date per artist, optional new score), `data/score-history.json` (raw v2 scores per edition, for smoothing).
- All config lives in `trend-model.js` `DEFAULTS`.
- UI: movers strip now shows the top 3 risers and fallers, filled by momentum when ranks barely move. Movement reasons explain momentum, activity and the cap. Artist profile shows the four inputs with dates. Sandbox has four sliders (35/25/25/15). `/method#current-formula` publishes the formula in plain language, with an update-history row.
- Sorting by "Index score", regional boards and veterans/women boards now follow the official rank (the cap can place a higher score below a lower one).

## What to test

1. `npm run build` then `npm test` (169 pass).
2. Homepage: Chart movement strip shows Rising and Falling with reasons.
3. `/current` row → artist file: five-cell breakdown and Activity signals.
4. `/studio/sandbox`: four sliders reshuffle; reset returns 35/25/25/15.
5. `/method#current-formula`: four rows and the plain-language rules.

## TODO (Phase 1)

- [x] Switchover cap: decided 28 Nov 2026 to keep the 8-place cap from the first v2 edition. This edition 35 of 50 artists sit away from their score rank because of the cap (switching from v1 ranks), so displayed scores are visibly out of order.
- [ ] Editorial reviews are all dated 5 Oct 2026. They start fading after 30 Nov 2026. Re-score in `data/editorial-reviews.json`.
- [ ] Stream history has a gap from 5 Oct to 21 Nov, so momentum currently compares this week with 14 Sep to 5 Oct. It self-corrects after 4 weekly editions. Reading daily history from Supabase `artist_statistics` would fix it sooner (not wired; needs the service key at build time).
- [ ] Kworb pages for smaller artists update less often (Stonebwoy last 28 Sep, King Promise 16 Oct). Their scores use their latest reading and the profile flags the age.
- [ ] No TikTok or Shazam data exists in the repo (`data/signal-observations.json` is read if added). Touring has 4 historic concerts, so it scores nobody this week.
- [ ] Release signals rely on Apple artist credits; feature-only credits are excluded, co-lead credits count.
- [ ] `data.weights` / `factorNames` (the legacy 10-factor list in `current.json`) are kept for compatibility with older views but no longer describe the score.
- [ ] Not verified: `/studio/sandbox` and `/current/:artist` in a browser (they need `api/view`, i.e. `vercel dev`). Logic is covered by tests.
- [ ] Existing copy outside Phase 1 still contains em dashes (method, compare, net-worth, artist descriptions). Left for the copy pass in Phase 6.
