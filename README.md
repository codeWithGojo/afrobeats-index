# AFR/INDEX — The Living Afrobeats Index

An editorial Afrobeats ranking that shows its work across eras.

## What is included

- All-Time 50 and a researched Current 50
- Weekly movement indicators and update log
- Side-by-side Compare Eras view
- Eleven weighted Current metrics
- Monthly Spotify listeners and cumulative tracked Spotify streams
- Fifty locally cached artist portraits and original editorial profiles
- Inline methodology explanations for every metric
- Music Receipt generator with African-artist matching, PNG export, native sharing and print support

## Live site

https://afrobeats-index.vercel.app/

## Data note

Spotify figures are an editorial snapshot dated 7 September 2026. Monthly listeners and tracked catalogue totals change daily; the final ranking combines those signals with nine qualitative and career metrics.

## Music Receipt platform setup

The browser adapters share `getTopTracks(timeRange)` and `getTopArtists(timeRange)` methods through `window.AFRI_MUSIC_SOURCES`.

- Spotify uses OAuth Authorization Code with PKCE and the `user-top-read` scope. Set the public app identifier once at `window.AFRI_MUSIC_CONFIG.spotifyClientId`; visitors then get a single **Connect Spotify** button and never see developer credentials. Add the exact production page URL as a Spotify redirect URI. Never expose the Client Secret.
- Apple Music uses MusicKit JS. Configure `window.AFRI_MUSIC_CONFIG.appleDeveloperTokenEndpoint` to return `{ "token": "..." }` from a same-origin server route. A directly injected `appleDeveloperToken` is also supported for short-lived deployments; never ship the Apple private key.
- YouTube Music and Audiomack use CSV, JSON, text import, or manual Afri Index artist selection because dependable public personal-top APIs are not available.

OAuth access tokens remain in memory. Imported listening data and manual picks stay in the browser and are not uploaded by the feature.
