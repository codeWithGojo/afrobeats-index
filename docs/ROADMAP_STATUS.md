# Afri Index roadmap status — 7 September 2026

## Delivered in this release

- Supabase Auth SDK replaces the discarded-refresh-token session implementation. Browser sessions persist and refresh; sign-out uses the provider. Email, code and expired-link errors appear beside the sign-in control. Canonical callback: `/account`. Legacy `/studio/board` redirects there.
- Private receipt saving uses the same refreshed account session. Owner-only downloads work without making receipts public. Public publication remains an explicit action.
- Public `/boards` pages: nine women in the Current 50, thirteen sourced veterans, forty guest-credit artists across 104 explicit-feature recordings, and a coverage-limited producer-credit index across eight recordings. Final Current scores are preserved; women/veterans have separate initial weekly publication records.
- Forty sourced career biographies and nine women's eligibility records. Career eligibility uses calendar-year precision. Missing identities/years are excluded, not guessed.
- `/calendar/awards`, `/calendar/live`, `/calendar/certifications`: 31 newly sourced records, 40 merged awards/live records and 26 existing certification records. Grammys, Headies, Trace, BET and TurnTable are represented; confirmed future Grammy milestones and Tyla/Asake listings retain source links. Exact days and sold-out flags are never inferred.
- `/api/data` now feeds the main site's existing award/tour views from the same export. Artist pages expose the calendar, certifications and geographic-data coverage.
- The sandbox live-reorders a two-streaming-input scenario for the Current 50. Nine missing editorial marks stay disabled. Complete/partial published matrices can be consumed when supplied; missing selected inputs exclude only affected artists. Derived streaming indices are explicitly distinguished from the official score.
- `/collaborations` is an interactive SVG artist/producer credit network with click-to-expand artist nodes and supporting recordings.
- Dated Spotify JSON imports produce annual African listening-event/minute summaries and Wrapped exports. Raw exports stay in the browser; saved receipts contain only selected summary fields. Coverage is explicit; streaming API rolling ranges are not described as complete calendar years.
- `/api/edition?week=YYYY-Www` produces a five-page Current 50 PDF with date, scores, movement and page counts. Browser print and broadsheet views remain available.
- Opt-in weekly web push: public VAPID configuration, authenticated subscription controls, protected sender configuration, deployed Edge sender, and daily edition check at 18:15 UTC. Per-edition/endpoint delivery claims prevent duplicate sends. Expired endpoints are removed. Sender currently processes at most 1,000 subscriptions per run; failed deliveries do not retry the same edition.
- Public command navigation on the homepage and secondary pages. Finished board/calendar destinations are available without going through Studio.

## Previously implemented and retained

Receipt themes, country/genre/rising markers, discovery, Spotify/Apple Music/manual modes; public receipt URLs and PNG previews; comparisons and 3–8-receipt group images; ranking-card Story/OG PNGs; profiles/watchlists; correction and moderated-comment queues; catalogue stream concentration; two/three-artist comparison; authenticated weekly matchup voting; JSON/CSV/widget exports; scoped offline public-chart caching; nightly monthly-listener refresh with retain-last-good failure handling.

## Remaining acceptance criteria and external dependencies

1. **Production login acceptance is still pending.** Email auth is enabled in Supabase; social providers are disabled. The app uses the public project configuration, not a server-side SMTP environment variable. Available management tools cannot inspect/change Supabase Auth redirect allowlists or SMTP configuration, or inspect Vercel environment variables. Set Site URL to `https://afrobeats-index.vercel.app` and allow `https://afrobeats-index.vercel.app/account` (retain the legacy callback during migration). A real user must complete sign-in, refresh and sign-out before account-dependent features are called end-to-end verified. If the provider reports restricted delivery, configure a production SMTP sender.
2. **Full official sandbox:** every stored factors array is empty; neither the repository nor database contains the original 50×11 published marks. Supply the original nine editorial inputs and scales. Current derived stream previews are useful but do not reconstruct those missing marks.
3. **Local/international streams:** connected public totals and listener feeds contain no complete country-origin stream counts. An authorized artist/distributor export is required. Nationality and regional chart samples cannot substitute. Coverage pages show the gap instead of fabricated percentages.
4. **Full new boards:** Current 51–75, entry forecasts and a complete Producer/Songwriter 25 need additional ranked candidates, source credits and scoring evidence. Current 50 contains only nine eligible women; no filler ranks are published. Guest reach is association, not causal guest-verse uplift. Producer points divide the observed recording streams equally among credited producers, not royalty splits.
5. **Weekly specialist maintenance:** initial women/veteran editions are stored; editorial publication must create subsequent board editions for movement histories. Guest/producer credit samples are not yet separately archived locked editions. No historical movement is invented.
6. **Award impact/annual discovery:** results are tied to the published 8% Awards factor, but no unsupported per-win point schedule exists. An import's first observed play is not proof of the user's first-ever discovery. Partial-year exports remain labelled partial coverage.
7. **Push/user flows:** the sender ran successfully with zero subscriptions. Actual opted-in device delivery and logged-in receipt/profile/group interaction still require a real user session. Bracket is a single weekly matchup, not a multi-round tournament.
8. **Data freshness:** newly researched entries are checked 2026-09-07. Inherited certification records retain their original dates; the release does not falsely claim they were all reverified today.

## Verification and security

- Nine local tests cover genuine scenario reshuffling/immutability, partial-input exclusion, explicit-credit deduplication, evidence/score preservation, calendar provenance, exact Story/OG PNG sizes, unknown-artist rejection, public-only shared configuration, and dated-history filtering/privacy.
- Build, JavaScript syntax and whitespace checks pass. The PDF renderer produced a valid five-page document and was visually inspected.
- Existing RLS tests checked owner access, cross-user invisibility and rejected cross-user insertion. New notification settings/delivery tables have RLS and no client privileges/policies: intentionally service-only. Advisor informational notices identify those intentional no-policy tables. Password leak protection is disabled on this email-passwordless project; no password login was introduced.
- Weekly push Edge Function is active, scheduled, and returned a successful zero-recipient run. Actual notification receipt is not yet verified.
- Service secrets exist only in protected database/runtime configuration. Only publishable keys are shipped to browsers. Raw provider tokens and history exports are not persisted as receipt data.
- Official archived ranks remain independent of nightly observations and scenario sliders. Public API rate limiting is per instance, not a global quota; user content has database-enforced daily limits.

Deployment and browser acceptance results are recorded with the release verification rather than inferred from a successful local build.
