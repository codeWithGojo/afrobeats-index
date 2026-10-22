# Afri Index motion and installable app changes

The existing design, routes, published rankings, data sources and export canvas remain in place. Motion enhances the existing vanilla application through small typed React mounts.

| Integration | Files and behaviour |
| --- | --- |
| Rankings | `src/motion/Ranking.tsx`: stable artist keys, spring layout reordering, staggered rows, direction arrows, rising pulse, score bars and number counters. Sandbox/catalogue lists use the same keyed adapter. |
| Comparisons | `LegacyTransition.tsx`: existing two-artist markup and delegated voting, with wait-mode exit/enter, opposing slides and sequential bar fills. Three-way comparison lives in `Ranking.tsx`. |
| Receipt and Wrapped | `Receipt.tsx`: real generated canvas output prints in strips, themes crossfade, exported PNG remains the original canvas. Fullscreen Wrapped uses the actual selection/import, timed progress, previous/next controls and swipes. |
| Search | `NativePalette.tsx`: wait-mode native dialog shell, animated results, Escape/close and restored focus. Existing search nodes/handlers are retained. |
| Collaborations | `Graph.tsx`: real credit edges draw, nodes float, hover/focus emphasizes connections, artist selection retains sourced links. |
| Page experience | `index.tsx`: pathname transitions, published movers ticker, top-three entrance, equalizer, shared overlays, magnetic CTA, tab pills, mobile drawer, success-only vote effects and confetti. |
| Live hydration | `assets/inline-08.js`: fresh data is handed to React-owned ranking rows; legacy DOM updates cannot overwrite counters or move their nodes. |
| Installation | Manifest, icons, installer and existing scoped service worker. Existing offline-reader and app shortcuts retained. |

Shared components and tuning: [shared/motion/README.md](shared/motion/README.md).

Verified: production build, 30 existing tests, strict type-check of all new motion TSX, desktop and 390px mobile, chart filtering, sandbox, two- and three-way comparison, receipt selection/generate/theme/PNG export, Wrapped controls, palette close/reopen, drawer, reduced motion and service-worker readiness. Chromium reports zero installability errors; icons resolve at 192/512 and offline fallback works.

Coverage: published bracket success effects require a real successful account vote; unpublished brackets stay empty. No test votes were sent to production. Charts do not reintroduce monthly listeners removed from the published scoring model. OS installation and physical touch devices were not tested.

## Changed and new files

### Application and build

- `MOTION_CHANGES.md` (new)
- `api/view.js`
- `assets/inline-06.js`
- `assets/inline-08.js`
- `assets/motion.css` (new)
- `assets/motion.js` (new)
- `assets/tailwind.css`
- `index.html`
- `motion.css`
- `motion.js`
- `music-receipt.js`
- `package-lock.json`
- `package.json`
- `quiz.html`
- `scripts/build.cjs`
- `src/motion/Graph.tsx` (new)
- `src/motion/LegacyTransition.tsx` (new)
- `src/motion/NativePalette.tsx` (new)
- `src/motion/Ranking.tsx` (new)
- `src/motion/Receipt.tsx` (new)
- `src/motion/globals.d.ts` (new)
- `src/motion/index.tsx` (new)
- `studio.js`

### Installable app

- `install-app.css` (new)
- `install-app.js` (new)
- `manifest.webmanifest`

### Shared

- `shared/motion/Marquee.tsx` (new)
- `shared/motion/README.md` (new)
- `shared/motion/config.ts` (new)
- `shared/motion/gestures.tsx` (new)
- `shared/motion/overlays.tsx` (new)
- `shared/motion/primitives.tsx` (new)
- `shared/motion/styles.css` (new)
- `shared/motion/useDomMotion.ts` (new)
