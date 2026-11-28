# AFR/INDEX v2 · Phase 4 My Index

## What changed

- **/my-index** (`my-index.js`, `my-index-model.js`, `my-index.css`, `scripts/render-my-index.cjs`), linked from the rankings hub, ranking menu and sitemap.
- **Recipe:** 9 default metrics (streams, vocals, lyricism, live shows, influence, longevity, innovation, vibes, replay value) plus custom ones. Weight sliders per metric.
- **Engine reuse:** `lib/board-engine.cjs` `scenario()` (the weight sandbox engine) gained a `partial:'renormalize'` mode. Existing behaviour is unchanged.
- **Grading:** one artist card at a time, 1 to 10 per metric in 44px buttons (2 rows of 5 on phones), auto-advance when an artist is complete, keyboard 1 to 9 and 0. Guests' grades stay in the browser; signed-in grades sync (debounced) to `index_grades`.
- **Fallbacks:** ungraded metrics use official data only where it exists: streams (recent streams), influence (editorial score), longevity (sourced career start). Rows say "not graded yet, placed by official data". Vocals, lyricism, live, innovation, vibes and replay have no official data.
- **Your chart:** live; your top 10 vs the official Current 50; biggest disagreements (graded artists only).
- **Templates:** seeded Balanced (default, so a first visit is never blank), Lyrics Only, Live Performance, Underrated Gems (outside the official top 20 only) and The Greats (Pro). Saved indexes can be published as templates (Pro) and copied or remixed by others (`copy_index_template`).
- **Community Index:** `community_index()` averages grades on the default metrics. Every score shows its sample size n; artists need n of 5 or more. **Hot takes:** the biggest gaps between community and official rank.
- **Anti-abuse (`database/my_index.sql`):** login needed to save or count; one grade per user, artist and metric (primary key); 300 grade writes per 10 minutes; new accounts weigh less (0.25 under 7 days, 0.6 under 30); `flag_outlier_graders()` flags identical-grade or far-from-consensus patterns and excludes them.
- **Free vs Pro (enforced in the database):** free has exactly 3 metrics and 1 saved index; Pro has up to 8 metrics, unlimited indexes, template publishing and top 10 history (`index_history`).
- User grades never touch the official Current 50 (tested).

## What to test

1. `npm run build`, `npm test` (186 pass).
2. `/my-index` as a guest: the Balanced recipe is preloaded, grading taps advance, the chart fills, and the Templates tab switches recipes.
3. Signed in after applying `database/my_index.sql`: grades sync, Save, Community tab.

## Setup needed

- [ ] Apply `database/my_index.sql` in Supabase.
- [ ] Schedule `select public.flag_outlier_graders();` weekly with the service role (for example from the Monday data engine). Not wired, because it needs the database.

## Interpretation to confirm

- The brief says "pick 3 to 8 metrics" and "free tier: 3 metrics". I made free exactly 3 and Pro up to 8 (custom included) rather than truly unlimited, to keep grading usable on a phone.
- The pool is the Current 50. Current 100 extension artists are not gradeable yet.

## TODO (Phase 4)

- [ ] Community Index, templates from the database, saving and history were not run against a live Supabase.
- [ ] The Community Index uses default metrics only; custom metrics stay personal.
- [ ] Account-age weighting uses `auth.users.created_at`; it does not yet consider activity.
- [ ] No share card for My Index yet (Phase 7 ShareSheet).
