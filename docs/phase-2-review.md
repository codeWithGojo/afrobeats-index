# Phase 2 — structure and performance

Implemented locally. No production deployment has been performed for Phases 1–2.

- Dedicated pre-rendered routes: /current, /all-time, /albums, /net-worth, /method, /watch, /compare, plus /music-receipt and footer destinations /regions, /releases, /artists, /discussion, /news, /top100.
- Homepage contains only hero/top-three/movers, Receipt teaser, one newsletter and route links. It no longer loads the embedded artist database or chart/Receipt application scripts.
- Desktop navigation: Rankings, Compare, Receipt, Watch, Method, Pro. Mobile uses one bottom tab bar. Secondary tools are linked in the footer sitemap.
- Regional artists, initial head-to-head values, and audited release entries are present in generated first-response HTML. Existing interactive controls progressively replace those initial views.
- Legacy ?tab links have permanent Vercel query redirects and a client fallback preserving fragment anchors. Existing artist, compare, calendar, account and API routes are retained. /underground remains available until its requested Phase 6 migration.
- Newsletter states are explicit: idle, submitting, success, error. Honeypot uses hidden and aria-hidden. Signup remains disabled when the existing provider reports that it is unconfigured. No subscriber messages were sent during verification.
- Artist records expose primaryGenre, tags, and countries arrays; source country display strings remain for existing consumers. AFRO-LIFE and AFRORAVE map to primary AFROBEATS while retaining their original labels as tags. Dual-country flags remain visible. Artist portrait paths use /artists/{slug}.jpg with fixed dimensions, alt text and lazy loading (hero lead image retains high priority).

## Verification

Build and 71 tests passed. Dedicated comparison selectors were checked in the browser. Mobile homepage at a 360px CSS viewport had equal scroll/client widths. Initial HTML was checked with curl on an ephemeral local HTTP test server via `node scripts/verify-routes.cjs`; no JavaScript hydration was involved. This checks generated HTML, not Vercel's production routing engine. Managed preview uses .html URLs because it does not emulate Vercel cleanUrls.

Production redirects, real newsletter delivery and the Lighthouse 85+ target remain unverified until deployment/provider configuration. Phase 3 sorting UX, Phase 4 plaques, Phase 5 share cards and Phase 6 unranked Watch/community features have not been started.

## Build source

`templates/app.html` is the retained full application source. The build applies the existing data/render stages, Phase 1 trust rendering and then Phase 2 route extraction. Do not edit generated index.html to make permanent changes; update the template or renderer.
