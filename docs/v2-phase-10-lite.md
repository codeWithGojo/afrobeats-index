# AFR/INDEX v2 · Phase 10 Lite mode and performance

## Lite mode

- **Detection (`theme-init.js`, before first paint, every API guarded):** `navigator.connection.saveData`, `effectiveType` (slow-2g, 2g, 3g), `deviceMemory <= 2`, `hardwareConcurrency <= 4`, `prefers-reduced-motion`.
  - Data Saver or 2G turns Lite on automatically (with a toast saying why).
  - 3G, low memory (alone or with few cores) or reduced motion only show a one-time suggestion.
  - Safari lacks most of these APIs, so nothing turns on there automatically; the toggle always works.
- **Controls:** a footer toggle on every page, a "Lite mode: On / Off / Automatic" setting in Page tools, `?lite=1` or `?lite=0`, stored in `afri-lite`. The user's choice always wins.
- **What Lite turns off or swaps:**
  - No web fonts at all: `@font-face` moved to `fonts.css`, which loads only outside Lite.
  - Off: decorative motion and transitions, the GSAP orbit (42 KB), the glass motion layer (100 KB), the foil, gradient type, confetti, hover previews, blur placeholders and cross-page view transitions.
  - The onboarding picker shows names without photos.
  - Sparklines are static SVG already. Nothing autoplays: embeds load only after a tap.

## For everyone

- **Data:** onboarding, My Index and personal stats now use `data/current-lite.json` (about 4 KB compressed) instead of `data/current.json` (about 252 KB compressed). The first-visit onboarding downloaded the full file before.
- **Images:**
  - Responsive `srcset` and `sizes` with new 160 and 320 px WebP variants (`npm run images`); small avatars point straight at the 160 px file.
  - Onboarding photos were full 640 px images (about 1.3 MB on a first visit); now 160 px.
  - Preloads are WebP with `imagesrcset` (the homepage preloaded `/davido.jpg` twice).
  - Lazy loading below the fold and explicit width and height are kept from the existing markup.
- **CSS:** each page's 20 or so render-blocking stylesheets (plus an `@import` chain) are bundled into one or two files at build time (`scripts/bundle-css.cjs`). Bundles rebuild from source every build (`scripts/unbundle-css.cjs` runs first), never merge across an inline `<style>`, and keep the cascade order.
- **Rendering:** below-the-fold homepage sections use `content-visibility:auto`.
- **Account bundle:** the account bundle (about 50 KB with Supabase) now loads only when a session is stored; guests skip it.
- **Caching:** chart data is stale-while-revalidate in the service worker (cache `afri-official-v5`) and at the CDN (`vercel.json`: `/data/*.json` max-age 60, s-maxage 300, SWR one day). Fonts are cached immutably for a year; artist WebP for a week with SWR.
- **Fonts:** `font-display:swap` is kept, and the fonts are already Latin subsets.
- **Layout shift:** the onboarding sheet now builds its content before it attaches. Lite CLS went from 0.437 to 0.
- **Light-theme bug fixed:** the top-3 rank numbers were invisible (gradient removed by a theme rule while the text was transparent).

## Measured (Lighthouse 12.2.1, mobile, simulated Slow 4G: 150 ms RTT, 1.6 Mbps, 4x CPU)

Served locally without compression, so timings are pessimistic. "Estimated production" Brotli-compresses the exact files each run requested.

| Page | Requests | Est. production transfer | Local uncompressed | LCP | CLS | TBT |
|---|---|---|---|---|---|---|
| Home, Lite (start of phase) | 118 | 1,833 KB | 2,381 KB | 4.9 s | 0.437 | 3.4 s |
| **Home, Lite (now)** | **44** | **184 KB** | 605 KB | **4.5 s** | **0** | 2.6 to 3.3 s |
| Home, full (start) | 120 | 1,878 KB | 2,507 KB | 4.9 s | 0.002 | 6.7 s |
| Home, full (now) | 99 | 455 KB | 905 KB | 4.2 to 5.1 s | 0.002 | 2.5 to 6.3 s |
| /current, Lite (now) | 103 | 1,317 KB | 4,008 KB | 23.7 s | 0.05 | 9.7 s |

Budget (home, Lite): **transfer under 300 KB: met (184 KB). CLS under 0.1: met (0). LCP under 2.5 s: not met in this local measurement (4.5 s).** Most of the gap is the uncompressed local server: the simulation downloads 605 KB instead of about 184 KB. Production needs a real check: run PageSpeed Insights on `https://afrobeats-index.vercel.app/?lite=1`.

## TODO (Phase 10)

- [ ] Measure LCP on production (compressed). If it is still over 2.5 s, inline the critical CSS for the hero and defer the rest.
- [ ] **/current is very heavy:** it reruns the scoring in the browser from about 4 MB of embedded legacy data scripts (`assets/inline-07.js`, `refresh-2026-*.js`, `streaming-snapshot.js`). It should render from the published `data/current.json` (or the lite file) instead. Biggest remaining performance problem on the site.
- [ ] Style and layout take about 5 s at 4x CPU on the homepage (about 1,400 elements, many CSS rules); `reader-tools.js` forces layouts (1.3 s).
- [ ] The unused 388 KB `assets/motion.js` bundle is still built.
- [ ] Not verified on real low-end devices or real 2G and 3G networks.
