# AFR/INDEX — The Living Afrobeats Index

An editorial Afrobeats ranking that shows its work across eras.

## What is included

- All-Time 50 and a researched Current 50
- Weekly movement indicators and update log
- Side-by-side Compare Eras view
- Current scoring v2: 35% recent streams, 25% momentum, 25% editorial with review-date decay, 15% activity (see docs/v2-phase-1-trend-scoring.md)
- Unified tracked audio-stream totals, separate video views and per-platform source dates
- Fifty locally cached artist portraits and original editorial profiles
- Inline methodology explanations for every metric
- Music Receipt generator with African-artist matching, PNG export, native sharing and print support

## Live site

https://afrobeats-index.vercel.app/

## Data note

Sources checked on 28 November 2026 for all 50 Current artists: 100 Kworb song/album ledgers and 50 Apple release-identity lookups. Publisher observation dates range from 28 September–27 November; a check date does not mean that the publisher updated that day. The official TurnTable songs/albums pages supply 13–19 November 2026, rechecked on 28 November. Eleven additional chart categories retain their individual publisher periods. The 2026 release cohort currently includes 35 matched albums/EPs and 334 recordings. Certification registers and the 2027 Grammy nominations were also rechecked on 28 November; each certification keeps its publisher issue date separate from the check date.

Current uses trend scoring (v2): recent Spotify streams over 28 days on a log scale, momentum against each artist’s own 4-week baseline, the editorial score with review-date decay, and dated activity signals. Scores are a 4-week average with an 8-place weekly movement cap. Formula and windows: `trend-model.js` and /method#current-formula. Platform coverage must be identical across all 50 candidates to enter scoring; the currently comparable provider is Spotify. The All-Time formula is unchanged.

`npm run refresh:data` collects source packets, compiles the release-year cohort, checks TurnTable and builds shared browser/API artifacts. Failed providers retain last-good data with original source dates. `npm test` verifies scoring, coverage, recording deduplication and release identities.

See [streaming methodology](docs/streaming-methodology.md) for provider integration and the cross-platform observation format.

## Music Receipt platform setup

The browser adapters share `getTopTracks(timeRange)` and `getTopArtists(timeRange)` methods through `window.AFRI_MUSIC_SOURCES`.

- Spotify uses OAuth Authorization Code with PKCE and the `user-top-read` scope. Set the public app identifier once at `window.AFRI_MUSIC_CONFIG.spotifyClientId`; visitors then get a single **Connect Spotify** button and never see developer credentials. Add the exact production page URL as a Spotify redirect URI. Never expose the Client Secret.
- Apple Music uses MusicKit JS. Configure `window.AFRI_MUSIC_CONFIG.appleDeveloperTokenEndpoint` to return `{ "token": "..." }` from a same-origin server route. A directly injected `appleDeveloperToken` is also supported for short-lived deployments; never ship the Apple private key.
- Manual Afri Index artist selection and CSV, JSON, or text import remain available alongside Spotify and Apple Music.

OAuth access tokens remain in memory. Imported listening data and manual picks stay in the browser and are not uploaded by the feature.

## Personal stats (/stats)

Sources implement one provider interface in `stats-providers.js` (`topArtists`, `topTracks`, `recent`), so new sources plug in without rewrites. Matching and aggregation live in `stats-model.js`. Database: apply `database/personal_stats.sql`.

- **Spotify (beta).** Since February 2026, Spotify Development Mode apps serve at most **5 allowlisted users** and the app owner needs Premium. Extended Quota Mode is only for registered organisations with at least 250k monthly active users. Add testers in the Spotify Developer Dashboard (Users Management) and add `https://afrobeats-index.vercel.app/stats` as a Redirect URI. Scopes: `user-top-read user-read-recently-played`.
- **Last.fm (open to everyone).** Set `LASTFM_API_KEY` (free key from https://www.last.fm/api/account/create). Requests go through `/api/product?service=stats&action=lastfm`, so the key never reaches the browser.
- **History import.** Users request "Extended streaming history" at https://www.spotify.com/account/privacy/ (it can take days or weeks). The zip or JSON is parsed in the browser; only African-artist totals can be saved (Pro).
- **Apple Music.** Off unless `APPLE_MUSIC_ENABLED=true`; while off, the page shows "Coming soon" and an opt-in email waitlist (`feature_waitlist`). To build it you need: an Apple Developer Program membership, a MusicKit identifier and private key (.p8), your Team ID and Key ID, and a server route that signs a short-lived developer token (ES256) from those. Never ship the private key to the browser.
