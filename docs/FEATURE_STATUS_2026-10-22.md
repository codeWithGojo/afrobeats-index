# Afri Index feature delivery — 22 October 2026

| Feature | Delivered behavior | Coverage / remaining connection |
| --- | --- | --- |
| Regional rankings | Naija, Ghana, South Africa and East Africa boards; official global ranks retained | Existing Current 50 sample, not entire regional markets |
| Artist timelines | Chronological career-start, awards, live dates and dated certifications on `/current/[slug]` | Source precision retained; not an exhaustive career biography |
| TikTok / Shazam | `/studio/signals`, reviewed observation store, validator/importer, comparable-coverage preview | No licensed feed connected. Missing signals never become zero and do not change official Current weights |
| Song of the Summer | `/studio/summer`, fixed June–August stream tracker, account ballots, dated ingestion | No in-window 2026 daily history exists. No winner is inferred; ballot currently closed outside the season |
| GOAT vs Current | Existing All-Time 50, Current 50 and era views | Original methods retained |
| Top-five predictions | `/studio/predictions`, account saving/editing, Monday 00:00 UTC cutoff, historical scoring | Scores await the actual published edition for the target ISO week; 15-point maximum, no cash prizes |
| Board playlists | `/studio/playlists`, deterministic sourced Spotify track queues for Current, four regional boards, Women’s 25 and Veterans; CSV download; private Spotify playlist creation flow | Spotify app must allow the new redirect URI and intended users. Actual provider account authorization was not exercised |
| Newsletter | `/studio/newsletter`, current web issue, verified-account consent, unsubscribe, sponsor placements, authenticated batched sender with duplicate-delivery claims | Sending domain / Resend credentials and a weekly job must be configured. No emails sent during implementation |
| Pro analytics | `/studio/analytics`, artist selector, rank history, dated observations, archive coverage; Pro history CSV | Two actual archived editions (W37 and W43), not fabricated intervening weeks |
| Tickets / merch | Live calendar ticket actions plus reviewed affiliate ticket/merch placements and disclosure | Actual partner links must be placed in `data/product-config.json`; no invented affiliate IDs |
| Paid API | `/studio/api`, 30-day pass checkout adapter, verified Paystack webhook, entitlements, hashed revocable keys, shared 10,000/account/UTC-day quota, history and board endpoints | Paystack, approved price and server service key are not configured. Checkout stays disabled; free JSON/CSV remains available |

## Changed / new files

Shared: existing `shared/motion` components and delegated button/card motion are reused; no shared-motion source changes.

Afri Index:

- `features.js`, `playlist-spotify.js`: product views and Spotify PKCE flow.
- `lib/product.cjs`, `lib/signal-validation.cjs`, `lib/commerce.cjs`, `lib/product-server.cjs`, `lib/newsletter.cjs`: deterministic logic, source validation, entitlements and delivery helpers.
- `api/product.js`, `lib/product-pro.cjs`, `lib/product-paystack-webhook.cjs`, `lib/product-newsletter.cjs`, `vercel.json`: public products, protected API, payment fulfilment and email preferences/delivery.
- `database/product_features.sql`, `database/tests/product_access.sql`: canonical schema and rollback-only access verification. Applied remote migrations: `music_product_features`, `music_product_service_rpcs`, `newsletter_service_delivery_guard`, `newsletter_batched_recipients`, `product_least_privilege_grants`.
- `scripts/import-signals.cjs`, `scripts/publish-feature-data.cjs`: reviewed source imports, immutable chart archive and in-window seasonal observations.
- `data/product-config.json`: real sponsor / partner placements.
- `studio.js`, `studio.css`, `api/view.js`, `api/rankings.js`, `index.html`: routing, navigation, timelines, calendar actions and existing design integration.
- `tests/product-features.test.cjs`: deterministic logic, source coverage, payment signatures and unsubscribe checks.
- `docs/PRODUCT_SETUP.md`: concrete service setup and operational boundaries.

## Verification

44 Node tests pass. Build passes. Browser checks cover all seven product views, artist timelines, actual archive response, board switching, CSV downloads and 320/390/768/1440px layouts with no runtime errors. Live database tests use rollback-only fixtures: owner isolation, closed weeks, duplicate picks, unpaid key denial, verified payment replay, last allowed quota request / overrun, duplicate email claims, and anonymous service-RPC denial. Explicit checks also deny TRUNCATE, editing submitted timestamps and editing key hashes. Prediction duplicate validation, save/edit and newsletter opt-in/out were also exercised in the browser with mocked transport; the real row permissions were tested independently in the live database. No real payment, email campaign, licensed signal import or Spotify account mutation was performed.

The API URLs `/api/pro`, `/api/newsletter` and `/api/paystack-webhook` route through the single `api/product.js` function. This preserves public contracts while keeping the deployment at ten serverless functions, within the current Hobby limit.
