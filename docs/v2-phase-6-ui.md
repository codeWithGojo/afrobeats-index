# AFR/INDEX v2 · Phase 6 UI, micro-interactions and colour type

## Audit first

Much of the brief already existed and was kept: Motion "glass" layer on every page except the homepage (score count-up on view, bar fills, hover lift, press feedback, animated sandbox reshuffle), `rankings-ui.js` row reordering on sort, and the homepage orbit hero (headline over a phone mockup, a ring of artist cards orbiting with GSAP ScrollTrigger, lime glow). The large `assets/motion.js` React bundle is built but not loaded by any page; left as is.

## What changed

- **`afri-ui.js` / `afri-ui.css`** (on every page via `scripts/inject-polish.cjs` and `api/view.js`):
  - Sticky header shrinks on scroll; a lime underline slides between primary tabs; view transitions between pages (200 ms).
  - Buttons scale to 0.97 on press (glass layer changed from 0.96).
  - One-time pulse on movement arrows (green rise, red fall, 280 ms).
  - Chart rows: lift on hover, desktop hover preview (flag, daily streams, sparkline), font weight by rank (700 at #1 down to 500), sparkline in "Stream details" on touch.
  - **Sparklines use published ranks only** (`data/rank-history.json`, last 8 editions; drawn only with 4+ real editions). Score sparklines switch on automatically once 4 editions share the v2 formula. Nothing is faked.
  - Toasts for every share and copy on the site, with a light confetti burst on share.
  - Top 3 slow foil shine; animated lime gradient on the hero headline and top-3 rank numbers, with a solid colour fallback (`@supports`).
  - Headings gain weight on hover (variable Inter and Space Grotesk); light theme is 50 heavier.
  - Per-artist accent colour tints the artist page heading, score and sparkline.
  - Blur-up placeholders behind artist photos.
  - `[data-flip]` opt-in reorder animation for future lists.
- **Compare:** stat bars sit centred and grow outward; each row's sole winner glows lime.
- **Receipt:** prints line by line (stepped reveal), tear-off edge, drag to reorder picks (pointer, works on touch) or Alt + arrow keys, printer sound toggle (off by default, remembered).
- **Images (`npm run images`, `scripts/artist-images.cjs`, dev dependency `sharp`):** WebP for all 27 artists that lacked one plus 19 legacy root portraits (the Davido JPG was `/davido.jpg` on All-Time), 16 px blur placeholders, and accent colours extracted from each photo, adjusted until they pass WCAG AA on both theme surfaces. **Fixed a live bug: `artists/zlatan.webp` was an empty file.** No page loads a JPEG portrait any more (tested).
- **Empty and error states:** "Nobody here. Even the DJ went home.", "Quiet in here.", "Blank charts do not move crowds.", and a new 404 page: "This page left the party early."
- Reduced motion turns decorative motion off; `html.lite` is honoured ahead of Phase 10.

## Contrast

`tests/ui-contrast.test.cjs` checks every artist accent (both themes), the gradient endpoints, toasts, compare winners and movement colours against WCAG AA (4.5:1).

## What to test

1. `npm run build`, `npm test` (192 pass).
2. `/`: gradient headline and orbit hero. `/current`: sort (rows glide), hover a row on desktop (preview), open "Stream details" on a phone (sparkline), top 3 foil.
3. `/music-receipt`: drag picks, generate (prints line by line), tick "Printer sound".
4. `/vs/<a>/<b>`: centred bars and lime winners (needs `vercel dev`).

## TODO (Phase 6)

- [ ] Score sparklines are hidden until 4 v2 editions exist (around 3 more weekly refreshes). Rank sparklines are shown now.
- [ ] 13 portraits are black and white, so their accent falls back to the site lime.
- [ ] Not verified in a browser: compare page and artist pages (`api/view` routes need `vercel dev`), light theme visuals, Safari view transitions (unsupported there; it degrades to a normal page load).
- [ ] The unused 388 KB `assets/motion.js` bundle should be removed or loaded on demand (Phase 10 budget).
- [ ] The glass layer bundle (348 KB with React) loads on most pages; Phase 10 should defer it in Lite mode.
