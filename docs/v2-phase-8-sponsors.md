# AFR/INDEX v2 · Phase 8 sponsors

## What changed

- **Three fixed slots only:**
  1. Sunday brief header (email via `lib/product-newsletter.cjs`, and the web issue at /newsletter).
  2. One inline card on Artists to Watch, after the third artist.
  3. "Presented by" on one board (Heat 25), under the title, outside the ranked table.
- **Retired:** the old "sponsored spotlight", which was designed to sit inside the Current 50 rankings section (it was switched off in data). Its code is kept but returns early, so no sponsor content can appear inside rankings, scores or movement explanations.
- **Labelling:** every placement says "Sponsored" with a one-line disclosure ("Sponsors never affect rankings, scores or movement"), a link to the policy, and `rel="sponsored"` links.
- **Switch on or off without a deploy:** `database/sponsor_slots` rows (slot, board, sponsor, copy, URL, `starts_on`, `ends_on`, `active`). The public API serves live rows, cached 5 minutes. A trigger rejects overlapping bookings for the same slot. If the database is unavailable, the old `data/product-config.json` list still fills the newsletter header.
- **Tracking:** one impression per slot per page view (at 50% visible) and every click, counted daily per slot (`sponsor_events`, `sponsor_report` view with click-through rate). Also sent to Vercel Analytics.
- **Sponsor offers** stay opt-in: only placements are added to the shared issue; offers go only to subscribers who ticked the existing sponsor-offers box.
- **/sponsor media kit:** audience, slots, formats (field limits match the database), term, editorial policy (`#policy`), contact email and an inquiry form (consent required, honeypot, stored in `sponsor_inquiries`). Audience figures show "Shared on request" until real analytics are entered in `data/sponsor-kit.json`.
- Privacy page: new "Sponsors" section.

## Admin: run a sponsor

In Supabase, insert into `sponsor_slots`, for example: `slot='board-presented-by', board='heat', sponsor_name='Brand', url='https://…', starts_on='2026-12-01', ends_on='2026-12-31'`. Set `active=false` to pull it early. Reports: `select * from sponsor_report`.

## What to test

1. `npm run build`, `npm test` (202 pass).
2. Apply `database/sponsors.sql`, add a test row, and see it on /watch, /heat or /newsletter within 5 minutes.
3. /sponsor: send the form and check `sponsor_inquiries`.

## TODO (Phase 8)

- [ ] Apply `database/sponsors.sql` in Supabase.
- [ ] Fill `data/sponsor-kit.json` audience from Vercel Analytics with the date range (left as "Shared on request"; nothing estimated).
- [ ] The event endpoint is public (same-origin check only), so counts can be inflated by scripted requests. Add per-IP rate limiting at the edge if sponsors are billed on impressions.
- [ ] Inquiries are stored but no email notification is sent. Wire Resend (already configured for the newsletter) if wanted.
- [ ] Not verified against a live database or real sponsor rows; slot rendering was checked in a browser with a test response.
