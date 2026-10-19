# AFR/INDEX — The Living Afrobeats Index

An editorial Afrobeats ranking that shows its work across eras.

## What is included

- All-Time 50 and a researched Current 50
- Weekly movement indicators and update log
- Side-by-side Compare Eras view
- Ten weighted Current metrics: nine editorial factors plus 17% tracked audio streams
- Unified tracked audio-stream totals, separate video views and per-platform source dates
- Fifty locally cached artist portraits and original editorial profiles
- Inline methodology explanations for every metric
- Music Receipt generator with African-artist matching, PNG export, native sharing and print support

## Live site

https://afrobeats-index.vercel.app/

## Data note

Sources checked on 19 October 2026 for all 50 Current artists: song and album ledgers from Kworb plus Apple release identities. Publisher ledger dates range from 28 September–18 October; a check date does not mean that the publisher updated that day. The official TurnTable page still supplies 2–8 October 2026, rechecked on 19 October. Its positions are preserved.

Current uses the fixed published editorial contribution plus 17% × (100 × comparable tracked audio streams / maximum). The former 7% listener weight moves to streams. No new editorial component marks are invented. Platform coverage must be identical across all 50 candidates to enter scoring; the currently comparable provider is Spotify. The All-Time formula is unchanged.

`npm run refresh:data` collects source packets, compiles the release-year cohort, checks TurnTable and builds shared browser/API artifacts. Failed providers retain last-good data with original source dates. `npm test` verifies scoring, coverage, recording deduplication and release identities.

See [streaming methodology](docs/streaming-methodology.md) for provider integration and the cross-platform observation format.

## Music Receipt platform setup

The browser adapters share `getTopTracks(timeRange)` and `getTopArtists(timeRange)` methods through `window.AFRI_MUSIC_SOURCES`.

- Spotify uses OAuth Authorization Code with PKCE and the `user-top-read` scope. Set the public app identifier once at `window.AFRI_MUSIC_CONFIG.spotifyClientId`; visitors then get a single **Connect Spotify** button and never see developer credentials. Add the exact production page URL as a Spotify redirect URI. Never expose the Client Secret.
- Apple Music uses MusicKit JS. Configure `window.AFRI_MUSIC_CONFIG.appleDeveloperTokenEndpoint` to return `{ "token": "..." }` from a same-origin server route. A directly injected `appleDeveloperToken` is also supported for short-lived deployments; never ship the Apple private key.
- Manual Afri Index artist selection and CSV, JSON, or text import remain available alongside Spotify and Apple Music.

OAuth access tokens remain in memory. Imported listening data and manual picks stay in the browser and are not uploaded by the feature.
