# AFR/INDEX v2 · Phase 11 PWA and data upkeep

## PWA

- **Manifest:** description, categories, a **maskable** 512 px icon (`assets/icon-maskable-512.png`), and shortcuts to Current 50, Heat 25, My Index, the offline edition and My board.
- **Offline:** the service worker (cache `afri-official-v6`) precaches the offline page, its CSS bundles and scripts (read from the page itself, since bundle names change), and the last published chart (`data/current-lite.json`, about 4 KB). Public page navigations fall back to `/offline.html`, which shows the saved chart with its "as of" date and search.
- **Weekly notifications:** the existing opt-in (`/studio/tools`, Web Push with `push-config.json` and `edge/weekly-push.ts`) is kept, and opting in is now counted.

## Nightly data refresh

- `scripts/research/collect-daily-readings.py` records one Kworb reading per artist (Current 50 plus Current 100 candidates) with the publisher date. Repeated readings are de-duplicated; 90 nights are kept. `AFRI_ROOT` lets it run from a short path on Windows.
- **Workflow:** the existing daily run of `.github/workflows/data-engine.yml` (no new schedule) now does: collect into Supabase (unchanged), nightly readings, `npm test`, then commits `stream-history.json`, `refresh-runs.json` and `data-health.json`. Dry runs publish nothing.
- **The official Current 50 is still published only by the Monday job.** An edition uses only readings captured up to its own edition time, so nightly readings never change a published chart (tested). The next edition gets a true daily 4-week momentum baseline.
- Run locally: 78 readings, 0 failures.

## "As of" on every number

Chart numbers carry their dates: edition date on every board, Kworb reading date per artist (Current 50 Stream details, Heat 25, Current 100), baseline dates for momentum, review dates for editorial, chart weeks for TurnTable, the snapshot date on the offline page and share cards, and source dates on /method.

## Admin data health (`/data-health`, noindex, disallowed in robots.txt)

`scripts/build-health.cjs` writes `data/data-health.json` (also refreshed nightly). The page shows:
- datasets with dates, ages and ok / warn / critical / missing status
- every artist's latest reading
- what needs attention: editorial reviews fading, Current 100 candidates missing bio, score or photo, missing image variants, accent fallbacks, media kit audience
- refresh runs
- feature usage (needs the admin token)

Today it flags: a TurnTable chart 16 days old and 20 artists with Kworb readings over 14 days old (smaller artists' pages update less often).

## Corrections and update history on /method

The update history (`#data-updates`) is kept and has new rows for v2. A new "Send a correction or a source" form (sign-in required, HTTPS source required) writes to the existing `corrections` table for editor review. Artist pages keep their own form.

## Analytics from day one

- Pages: Vercel Web Analytics (already on every page).
- Events through one `AfriTrack` helper, sent to Vercel custom events and to a first-party daily counter (`database/usage_events.sql`, `/api/product?service=events`):
  - share clicks per platform
  - onboarding shown, steps, skips and completion
  - feature views (Heat, Current 100, My Index, stats, Current 50, artist, compare, sponsor, sandbox, receipt)
  - stats connect and import, My Index grading, sandbox use, receipt generation, Lite on and off, push opt-in
- Allowlisted names only, daily totals, no user, IP or device data. The summary needs `ADMIN_TOKEN` (24+ characters).

## Setup needed

- [ ] Apply `database/usage_events.sql`; set `ADMIN_TOKEN` in Vercel.
- [ ] Confirm GitHub Actions has `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` (without them the job stays dry and publishes nothing).
