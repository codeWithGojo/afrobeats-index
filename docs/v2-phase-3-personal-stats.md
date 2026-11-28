# AFR/INDEX v2 · Phase 3 personal stats

## Spotify API check (28 Nov 2026)

From Spotify's own pages ([February 2026 migration guide](https://developer.spotify.com/documentation/web-api/tutorials/february-2026-migration-guide), [February 2026 changes](https://developer.spotify.com/documentation/web-api/references/changes/february-2026), [quota modes](https://developer.spotify.com/documentation/web-api/concepts/quota-modes), [July 2026 quota update](https://developer.spotify.com/blog/2026-07-23-web-api-quota-updates)):

- **Blocked for a public launch:** Development Mode apps serve at most 5 allowlisted users, and the app owner needs Premium. Extended Quota Mode is only for registered organisations with 250k+ MAU, launched service, key markets; review takes up to 6 weeks.
- **Still available:** `GET /me/top/{type}` and `GET /me/player/recently-played`.
- **Removed fields:** artist `followers` and `popularity`; track `popularity`, `available_markets`, `linked_from`. Genres were not listed as removed, but we do not rely on them: genre, country and era come from our own index.
- Quota is now shared per developer account; 429 responses carry `"reason":"QUOTA_EXCEEDED"`.

**Fallback built:** Last.fm (any public profile, works with Spotify scrobbling) and the Spotify history file import. Spotify login stays as an invite-only beta.

## What changed

- `stats-providers.js`: one interface (`topArtists`, `topTracks`, `recent`) for Spotify (PKCE, `user-top-read user-read-recently-played`), Last.fm (server proxy) and Apple Music (placeholder behind `APPLE_MUSIC_ENABLED`). In-browser zip reader for the history file, no dependency.
- `stats-model.js`: matching to `data/african-artists.json` (116 artists: Current 50, Current 100 candidates, All-Time, Artists to Watch) with an unmatched count; genre mix, country split, old school vs new wave, Current 50 comparison, top albums (when the source gives albums), play log aggregation, lifetime import, Afri Wrapped, taste vectors and similarity.
- `/stats` page (`personal-stats.js`, `stats.css`, `scripts/render-stats.cjs`); linked from Music Receipt and the sitemap.
- `lib/product-stats.cjs` on the existing `/api/product` router: feature flags, Last.fm proxy, Apple Music waitlist. No new serverless function.
- `database/personal_stats.sql`: owner-only tables, Pro-only lifetime saves, opt-in taste sharing, `taste_soulmates`, `public_taste`, `delete_personal_data`.
- Privacy and Terms updated. README lists Spotify, Last.fm and MusicKit setup.
- Free: top African artists and tracks, profile, chart comparison, play log, sharing. Pro: lifetime stats, listening clock, year by year, Afri Wrapped, saving lifetime totals.

## What to test

1. `npm run build`, `npm test` (179 pass).
2. `/stats` with no sign-in: consent box, three sources, history import shows the free headline.
3. With `LASTFM_API_KEY` set (Vercel env): enter a Last.fm username, switch ranges.
4. Signed in after applying the SQL: play log shows "Tracking since", sharing, compare, soulmates, delete.

## Setup needed (blockers)

- [ ] Apply `database/personal_stats.sql` to Supabase (not applied by me).
- [ ] Set `LASTFM_API_KEY` in Vercel. Without it the Last.fm card says "not configured".
- [ ] Spotify Dashboard: add `https://afrobeats-index.vercel.app/stats` as a Redirect URI and add up to 5 testers.

## TODO (Phase 3)

- [ ] Play logging runs when the user opens /stats. Spotify only returns the last 50 plays, so plays are missed if the user stays away longer. Server-side polling would need stored refresh tokens and a scheduled job; not built (security surface, and PRODUCT.md rules out new scheduled jobs).
- [ ] Last.fm recent sync reads up to 10 pages (2,000 scrobbles) per visit.
- [ ] Albums only appear from Spotify top tracks; Last.fm top tracks do not include albums.
- [ ] All-Time and Artists to Watch roster entries have no country or career year, so they show as Unknown in the country and era mix.
- [ ] "Friend overlap on receipts" is built as taste overlap by handle on /stats; it is not yet shown on saved receipt pages.
- [ ] Not verified: Spotify, Last.fm, Supabase writes, Pro view and soulmates against live services (no keys or database in this environment). The Pro lifetime view was not rendered in a browser.
