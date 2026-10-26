# Phase 5 — Player-card share exports

Design and export integration implemented locally; not deployed. Phase 6 has not been started.

## Delivered

- Reusable `player-card.js` SVG component accepts an artist slug plus the published snapshot. `/api/card?artist={slug}` renders the 1200×630 OG PNG; `&format=story` renders 1080×1920. Existing URLs are unchanged.
- Dark #1d1d1c canvas, lime #d4f24a brand and Current 50 heading, centered clipped-corner card, movement pill, snapshot date, Editorial ranking and the artist URL.
- OVR rounds the published index score. Card includes original rank, country code(s), primary genre and centered name. Rank bands use gold (1–10), silver (11–30), bronze (31–50); absolute rank movements of 3+ places use the lime mover variant.
- Artist profiles show the story card preview. Share/download buttons use the same endpoint; OG metadata retains that endpoint.
- Receipt Wrapped embeds the same story PNG as its top-artist card and preserves track/genre, rising pick and history coverage information. Loading is asynchronous, stale selections are rejected, and failure leaves the previous canvas available. The existing Wrapped layout remains a fallback when no Current artist matches.
- No new runtime dependencies or card animation. PNG rendering uses the existing Resvg/font installation.

## Data gap — not fabricated

The repository publishes the stream component but has null values for the nine individual editorial components. STR is the published 0–100 stream index, linearly normalized and rounded to 0–99. IMP, REA, AWD, LIV and CUL remain null for all 50 artists and display — with a visible unpublished note. Final scores and award totals cannot reliably recover those component scores. `data/player-card-coverage.json` lists the missing marks.

Consequently, the requirement for six real numeric ratings is not fully satisfied until those editorial component values are supplied. No substitute proxy ratings were invented.

No share-use image licence is recorded for the Current artist photos. Cards use monograms. The component supports embedded photos only with explicit approved share-use licence metadata; the production endpoint currently supplies no photos. Website portrait attribution alone is not treated as a reuse licence.

## Verification

Build and 82 tests passed. Tests cover rank bands/mover threshold, immutable inputs, available-only normalization, monogram fallback, exact PNG dimensions and missing slugs. Story and OG images were rendered and visually inspected. Browser verification confirmed the artist preview loads a 1080×1920 image and a five-artist manual Receipt can create and download a 1080×1920 Wrapped PNG. The preview server supplies a locally generated card response rather than executing Vercel functions. Source stats remain unchanged.

Production endpoints, licensed portrait handling with a real licensed asset, missing editorial ratings and the overall Lighthouse/CLS target remain unverified or awaiting data. Samples are in docs/examples.
