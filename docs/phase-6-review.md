# Phase 6 — Artists to Watch

Implemented locally for review. No production schema, environment variables, deployment or subscriber email was changed/sent.

## Delivered

- /watch is an alphabetical discovery directory containing the existing ten discovery artists plus eight original watchlist names. No ranks, scores or music grades are shown.
- Each card has the available genre/city, featured listening link, editorial line and watchlist control. Unverified metadata is explicitly missing; old song search links are labelled as legacy searches rather than verified direct song links.
- /underground and /underground.html permanently redirect to /watch. The old file is a fallback redirect document; homepage Underground promotion has been removed. Existing artist fragment anchors are retained as aliases.
- Signed-out watchlists persist in localStorage with validation/deduplication and an explicit sign-in prompt. Signed-in users can sync local picks and manage them in My board. Discovery follows are independent of the existing 5–10 ranked-artist board.
- Public watcher counts expose no follower IDs. Counts update transactionally through a private trigger. Rising means at least three net synced follows during the last seven days; refollow/unfollow pairs cancel. Local-only saves never inflate counts. Counts/growth are not fabricated when the service is unavailable.
- Verified signed-in users can nominate an artist (name, HTTPS links, reason). Nominations enter a private pending queue; users cannot approve them or read others' submissions. A database limit allows five nominations per user per day.
- Weekly release and Current-entry digest logic is integrated into the existing consent-based newsletter sender, with source links, unsubscribe controls and delivery idempotency. It reads reviewed watch activity, existing dated editorial releases and audited release cohorts. It needs a prior chart edition before claiming a new Current entry.
- A Sunday job at 09:00 UTC / 10:00 Africa/Lagos is defined at /api/watch-digest. It requires CRON_SECRET and is disabled unless WATCH_DIGEST_ENABLED=true. It uses the existing signed-in newsletter opt-in rather than silently subscribing watchers.

## Release steps (not yet performed)

1. Review/apply database/artists_to_watch.sql after the existing schema/product feature setup. It adds new tables/triggers and seeds the directory; it does not remove existing rows. Check for prior application before running it twice.
2. Verify owner isolation and public aggregate access on the production database; run Supabase security advisors. The additive schema explicitly enables RLS and removes broad default grants.
3. Ensure SUPABASE_SERVICE_ROLE_KEY stays server-only, and configure/verify the existing RESEND_API_KEY, NEWSLETTER_FROM, NEWSLETTER_SIGNING_SECRET, NEWSLETTER_JOB_SECRET and CRON_SECRET. Enable WATCH_DIGEST_ENABLED only after schema/email verification. No keys are embedded in the browser.
4. Deploy, then test sign-in, sync across two sessions, public counts, authenticated nominations, moderation access, provider delivery and unsubscribe. The digest job must not be invoked against real subscribers as an unannounced test.
5. Verify actual Vercel redirects, Lighthouse mobile 85+ and ranking layout shift. These overall acceptance checks remain pending.

Editorial review uses the protected watch_nominations table through an authorized admin session. Accepted nominations require reviewed directory metadata in data/watch-artists.json and a corresponding watch_artists row; no automatic public publication occurs.

## Verification

- Build and 89 tests passed. Tests cover local slug validation, net growth boundaries, nomination validation, digest relevance and HTML escaping, retired URLs and authentication guards.
- SQL executed in an isolated PGlite 0.5.12 PostgreSQL engine: owner-bound follows, aggregate increments/decrements, private events, nomination moderation, five-per-day cap and anonymous access denial passed. This is not a production Supabase test. To repeat, install @electric-sql/pglite@0.5.12 in a temporary folder and set PGLITE_MODULE to that module path when running node scripts/test-watch-db.cjs.
- Browser: local save persisted through reload; signed-out nomination did not submit; 360px CSS viewport had equal scroll/client widths.
- curl first-HTML checks for regional/compare/release routes still passed on the local test server.

## Remaining content gaps

Most seed records lack a sourced city, and eight legacy names lack reviewed genre details. Five legacy names have no sourced featured track; three have only a legacy song search link. The page marks these gaps instead of inventing metadata. The Phase 5 editorial component scores and photo-licence gaps also remain unresolved.
