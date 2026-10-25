# Afri Index premium visual overhaul

This change replaces the presentation layer. Source data, published ranks, scoring weights, database operations, authentication, payment paths and API contracts are retained. Every existing homepage section remains reachable through navigation; all deployed routes remain in place.

## What changed

- One shared navigation shell: compact desktop navigation, an organized Explore directory, sticky mobile logo/search and four bottom tabs (Rankings, Compare, Receipt, Profile).
- Current 50 opening: three portrait cards in official rank order, then a rank-movers strip, then the full chart. Mobile uses a single column.
- Ranking list: compact artwork/name/country/movement/score cards; desktop country/genre sidebar; collapsible phone filters. Search, country and genre filters preserve published ranks and are reapplied after the existing live renderer refreshes its rows.
- Artist files: larger name and artwork, four clear statistics, a published-score visualization, live-date coverage from the existing event snapshot, primary comparison action, and all original share, quiz, watch, source, correction and discussion controls.
- Artist comparison: two columns on desktop, stacked cards on phones, relative bars based on the same published values, navigation selectors and the existing optional third artist. Receipt comparison stays at its original route.
- Music Receipt: calmer source/period controls, four polished theme previews, a centered brand tile/wordmark in the canvas output, preserved paper appearance, generation, sharing, printing and Wrapped controls.
- Near-black `#0B0B0C`, surfaces `#151517`, lime `#D9F24A`, Inter body and Space Grotesk display type. Theme options retain their own intentional receipt palettes.
- The previous competing global visual stylesheets and automatic decorative React/Motion mounts are no longer loaded on these screens. Functional fallback renderers, data calls and routes remain active. CSS feedback runs for 180ms and respects reduced motion.
- Fifty WebP portrait alternatives, fixed image dimensions and lazy loading below the primary podium card. Original portraits and fallback URLs stay available. Self-hosted variable fonts are subset for Latin names and punctuation; their OFL licenses are included.

## Retheme and rebuild

Edit the tokens at the start of `premium.css`: colors (`--af-*`), body/display fonts, spacing, radii, page width and transition duration. `lib/ui-shell.cjs` owns the shared header and bottom navigation. `current-view.js` and `artist-presentation.js` render presentation only. `premium-ui.js` manages visual navigation/filter state and mobile table labels.

Run `npm run build` and `npm test`. The build regenerates the Current 50, discovery/newsletter pages and shared shell. Optimized portraits are checked in; optional regeneration uses `node scripts/optimize-artwork.cjs` with Python/Pillow installed. No new production JavaScript dependencies were added.

## Validation

- Existing chart, source-date, release, quiz, receipt-history and API-route tests pass alongside the visual preservation tests.
- Repository diff checks confirm no edits to `data/`, the ranking model, authentication or commerce logic.
- Desktop preview and phone-frame checks cover home at 360, 768, 1024 and 1440px. No horizontal overflow was observed at those widths. Artist and artist-comparison screens were also inspected at 360px.
- Country plus genre filtering retained Black Sherif at published rank 35; empty state and reset restored all 50 artists. The `/` shortcut opened search. A five-artist manual Receipt generated and its export controls enabled.
- Core text/surface token pairs exceed WCAG AA's 4.5:1 text contrast threshold. Focus styles and reduced-motion rules are explicit; these checks do not constitute a complete assistive-technology certification.
- Responsive frames emulate CSS viewport widths; they are not physical iPhone/Android testing. Signed-in account writes, private receipts and external music-provider authorization were not exercised by this visual change.
- A Lighthouse mobile score of 90+ is a target, not a verified result unless accompanied by a completed production audit. Browser layout checks and successful builds alone do not establish a Lighthouse score.

## Full files

The accompanying update archive contains complete changed files, new source files, self-hosted fonts/licenses and optimized portrait assets, with paths retained. Apply it over the existing repository and rebuild; it is not a standalone replacement for the entire project.
