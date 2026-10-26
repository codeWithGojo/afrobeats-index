# Phase 3 — Rankings UX

Implemented locally; not deployed. No Phase 4–6 work has been started.

- Four sorts: Index score, Daily streams, Total streams, Movers. The big number is the current display position, including consecutive positions within filtered results. Published source ranks and scores are unchanged.
- Right-hand value follows the sort: one decimal for scores, compact one-decimal stream units, signed movement. New entries keep NEW rather than a fabricated prior rank. Non-index sorts show Index #N under the artist name.
- Display ties use the original index rank, then slug. Sort is persisted with history.pushState in ?sort=; initial load, reload and Back/Forward read that parameter. Saved /current links can retain the sort.
- DOM nodes are reused, reordered and animated with FLIP using the Web Animations API for 250ms. Reduced-motion skips that transition and cancels ongoing animations. The old reading-tool sorter and chart entrance/count-up animation no longer compete with the active sort.
- One visible chart search, labelled and placeholder Search artists. The / shortcut focuses it instead of opening a second search dialog.
- Mobile Refine the chart collapses without a leftover sidebar gap. Country/genre selections stay visible as removable chips when collapsed. Reset clears query and filters while preserving the sort.
- Back-to-top appears only after a long scroll, sits above mobile bottom navigation and on the left, away from right-hand scores. Mobile page padding clears the bottom navigation.

## Verification

Build and 74 tests passed. Browser checks covered URL-loaded daily sort, total and movers metrics, single-result search and 50-row reset. A 360px CSS viewport showed equal client and scroll widths, consecutive filtered positions, a collapsed filter panel and active Ghana chip. Preview checks use .html URLs because the preview server does not emulate Vercel cleanUrls.

Production routing and Lighthouse performance remain unverified pending deployment. No claim of physical-device testing or a measured zero CLS result is made.
