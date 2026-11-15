# Touring operations

Touring is independent of Current 50 and All-Time 50. It uses existing artist slugs, authentication, Supabase and the existing product/view functions. There are no new APIs to subscribe to, infrastructure purchases, cron jobs, or plan changes. Usage still counts toward existing hosting/database quotas.

## Data and publication

Apply `database/touring.sql`, then `database/touring-access-hardening.sql` once. Both are additive; they touch only new touring resources. Row-level security protects editor membership, drafts and audit rows. Raw publication documents are service-role-only. The API removes private permission evidence and unpublished records. Default Supabase grants are explicitly revoked, including TRUNCATE.

Add an existing, confirmed auth user to `touring_editors` through trusted database administration. Never expose the service-role key to browsers. Membership is checked on every administrative API request. The initial owner account was explicitly nominated by the owner; no other users are authorized.

At `/studio/touring`, sign in with the existing Afri Index account. Add source and venue records, then concerts/tours and financial reports. IDs are stable references; retain them during corrections. Existing artist IDs are listed in the editor. Changes remain in the workspace until saved or published. Import previews show records and errors before applying them to the workspace. CSV verification labels never approve records automatically.

Validate, write a review note, save a draft or publish. Publishing validates again on the server. An optimistic publication version plus transactional database lock prevents lost updates. Every publication is immutable and audited; draft creation is audited. Rankings recalculate from eligible evidence at publication/read time. Movement snapshots are generated from actual publications; imported positions cannot manufacture history. Public caching lasts up to 30 seconds. There is no background scraper.

The bounded document-edition model follows the existing chart-edition pattern. Each edition is limited to 1.5 MB. This is appropriate for a manually curated initial dataset, not millions of concerts; normalize/archive into relational event tables before that limit becomes restrictive. Tables paginate 25 rows in the browser; the rankings API paginates 50 rows. Full published data is fetched once per page.

## Source rules

`public-facts` permits independently recorded event facts from original public reporting, with attribution and a review note. It does not authorize copying financial datasets or streaming totals. Financial reports require a documented permission/licence/public-domain basis. An unknown publication date remains null with an access date; it must not be guessed.

Initial history contains four physical events: Burna Boy at London Stadium (3 June 2023); Global Citizen Accra (24 September 2022); Global Citizen Lagos (18 September 2021, distinct from its broadcast date); and Global Citizen New York (25 September 2021). Only existing Afri Index artists are attached, so festival lineups are incomplete. Sources are London Stadium's summer recap and Global Citizen's original recaps. No event images, article prose, paid datasets, ticket totals, attendance or grosses were copied. Existing Spotify catalogue observations are reused with their original dates.

No financial reports or historic achievements have been approved. No touring figures alter overall artist scores. Missing measurements are null, never zero. Pending/disputed/retracted financials are excluded. A pending revision does not remove an approved result; an approved replacement, dispute or retraction suppresses its predecessor. Active overlapping financial coverage is rejected. Multi-night reports remain whole and are never divided across nights, years or geography. Shared bills and festivals never contribute to solo financial rankings.

CSV fields include artist_id, tour_name, event_date, venue, city, country, region, subregion, gross, currency, tickets_sold, attendance, source_url, source_date, publisher, verification_status, billing and event_status. Region/source date are required. African venues require a subregion. Optional financial blanks become null. Import sources start unconfirmed, events/reports pending. Review source permission evidence and statuses manually before publication. A second report-only format accepts id,eventIds,sourceId,reportedAt,gross,currency,tickets; eventIds are pipe-separated. Use JSON for a sourced FX object (`rate`, `date`, `to: USD`, `sourceId`) or a financial report revision (`supersedes`).

## Recovery and verification

If the live publication API fails, visitors receive a labelled build-time edition and a Retry control. The build-time fallback does not include later admin updates or retractions; disable it or rebuild promptly if a correction must remain unavailable during an outage. Do not silently present fallback as current.

Draft restore is local until another validated publication is made. Database migration rollback is not needed to roll back application code: unused additive tables may stay in place. Do not drop them as routine rollback.

Run `npm test`, `npm run build`, and `node scripts/dev-touring.cjs` for a read-only local preview on port 4173. Local preview does not connect to production or grant an editor session. Existing TS entrypoints can be checked with `tsc --noEmit --target ES2022 --jsx react-jsx --esModuleInterop --lib DOM,DOM.Iterable,ES2022 --skipLibCheck --module esnext --moduleResolution node src/motion/index.tsx src/motion/Glass.tsx`. There was no pre-existing lint command; syntax checks and tests are recorded separately from linting.

Before merging, verify 360/390px, tablet and desktop layouts, light/dark themes, keyboard navigation, reduced motion, authenticated draft/import/publication flow and the final Vercel preview. Source-backed financial fixtures belong only in tests, never production. Merge requires the owner's separate approval.
