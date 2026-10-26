# Phase 4 — Certifications

Implemented locally; not deployed. Phase 5 and Phase 6 have not been started.

- One shared renderer serves artist profiles and /calendar/certifications.
- Gold has gold metallic records, Platinum has silver records, Multi-Platinum shows one stacked disc per multiple (up to five, then +N), and Diamond uses a faceted gem with a faint sparkle.
- Metallic borders and a one-shot shine are confined to these certification graphics. IntersectionObserver triggers each visible plaque once per page visit, then unobserves it. Reduced motion suppresses both shine and sparkle animation; changing the preference cancels the effect.
- Labels use spaced caps such as 8x PLATINUM. Records sort by Diamond, Multi-Platinum, Platinum, Gold, then descending multiple and stable title/market order.
- Authority and date occupy a single non-wrapping line, for example TurnTable · 6 Feb 2026. Missing dates stay explicit; year/month-only dates retain their precision.
- All 540 source records and their authority links remain intact. No certification data, scoring or routes were changed.
- Fixed a Phase 2 regression discovered while testing the actual artist page: the optional old header search button no longer blocks studio initialization when absent.

## Verification

Build and 78 tests passed. Tests cover tier/multiple order, disc caps/remainders, date precision, escaping and retention of every certification source link. Browser checks confirmed all 33 Wizkid records and all 540 calendar records render, with the calendar starting at Diamond then 8x Platinum. A 360px CSS viewport showed no horizontal overflow and non-wrapping dates; artwork and text have separate grid columns. The first-view observer records and single-iteration CSS animation were checked. Reduced-motion behavior is implemented in CSS and the observer; no physical-device or OS-preference emulation is claimed.

A local QA fixture uses actual records and the production renderer to show every tier. It is not a new public route. Production deployment and the overall Lighthouse/CLS targets remain unverified.
