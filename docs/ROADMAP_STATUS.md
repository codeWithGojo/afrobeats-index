# Afri Index roadmap status

## Implemented and wired

- Separate Supabase project: Afri Index, `ficjgvrsmrqbpiirrflj`, eu-west-1, free plan quoted $0/month.
- Receipt genres, flags, rising markers, discovery, four palettes. Removed YouTube Music and Audiomack receipt adapters.
- Private persisted receipts for signed-in users; explicit public publication, UUID routes, PNG Open Graph previews, account-owned deletion.
- Shared-receipt comparison by artist Jaccard overlap; track overlap separately. Group ranked-point receipts for 3–8 unique receipt IDs.
- Wrapped Story export at 1080×1920. Uses the selected listening window and clearly states annual totals/discovery dates are unavailable.
- Per-artist 1080×1920 ranking PNGs and 1200×630 Open Graph PNGs; native image share, X and WhatsApp links.
- Email magic-link account UI, profiles, watchlists, rank-change digest, public visibility control; see auth activation dependency below.
- All eleven weight controls and validation; recalculation is gated on complete component-score evidence.
- Catalogue concentration explorer; explicitly a stream proxy, not official score decomposition.
- Sourced corrections queue, pre-moderated artist-only comments, reports; review in protected Supabase dashboard.
- Movers and watch pick from rank snapshots; title-based collaboration explorer with explicit coverage limits.
- Specialist board routes with evidence gates. No invented rankings for unverified fields.
- Two/three-artist comparison; authenticated weekly voting; Sunday result publication job.
- Nightly listener refresh (02:00 UTC), observation timestamps, rounded-count flags, retain-last-good failures. First run updated 49 artists, retained Khaid.
- Current/weekly JSON and CSV, embeddable Top 10, artist/week/receipt/compare/profile routes, command search, printable edition and broadsheet toggle.
- Scoped public-chart service-worker caching, offline reader and generated home-screen icons; no auth/session/private data caches.

## External activation requirements / incomplete acceptance criteria

1. **Public email sign-in:** configure Supabase Auth Site URL and redirect allowlist to `https://afrobeats-index.vercel.app/studio/board` and connect custom SMTP. Supabase default email delivery is restricted; no test messages were sent. Account-dependent features cannot be considered end-to-end verified until a real login succeeds.
2. **Ranking inputs:** supply the original 50×11 component-score matrix and its scales. The existing database only publishes final scores and formula weights. Until then the sandbox does not invent a recomputation.
3. **Specialist data:** verify women’s-board eligibility, career-start years, rank 51–75 candidates, producer/songwriter/feature credits, and territory-level streams. Existing Current 50 alone cannot legitimately produce complete new boards or entry forecasts.
4. **Live events/certifications:** the data model and calendar render verified entries, but additional recording-body results, upcoming dates and award-impact mappings require research/import. Existing source guides are shown unchanged.
5. **Annual Wrapped:** Spotify top ranges and Apple recent listening are not calendar-year histories. Real annual summaries, minutes and discovery dates require dated listening exports or an appropriate provider feed.
6. **Push:** subscription table exists, but collecting subscriptions is gated until a VAPID sender and weekly delivery service are configured.
7. **Design/coverage:** collaboration explorer is currently a linked connection panel derived from explicit song-title credits, not a complete producer/artist visual network. Weekly edition export uses browser print-to-PDF, without custom page-count footer. Weekly bracket currently supports a single editorial matchup, not a multi-round tournament.
8. **New board updates:** data-backed specialist boards need publication records and separate movement histories before they can be described as complete locked boards.

## Verification

- Supabase security advisors returned no warnings after initial schema and jobs.
- Transactional RLS checks passed owner read, cross-user invisibility and cross-user insert rejection; test rows rolled back.
- Actual PNG byte dimensions validated for both share sizes; unknown artist returns 404.
- Nightly Edge Function completed a real run, 49 successes / 1 retained failure; scheduled jobs active.
- JavaScript syntax and local build validated. Public sign-in, human moderation and push delivery remain untested until configuration is supplied.

## Operational details

- Public read key only is in `community-config.json`; service-role access exists only inside Supabase-managed Edge runtime.
- No streaming-provider tokens are persisted to database records.
- Public ranking endpoint: CDN caching plus a per-instance 60/minute throttle; not a global distributed quota.
- Receipt/comment/correction creation: maximum 30 per user per day, enforced at the database.
- Locked weekly data is copied from the same existing artist snapshot by `scripts/export-data.cjs`; live monthly observations never rewrite an archived edition or official rank.
