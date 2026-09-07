# Afri Index — Full Feature Build Prompts

## Implementation status

See [ROADMAP_STATUS.md](ROADMAP_STATUS.md) for the current release, verification results, and remaining data/service dependencies. The requirements below remain the acceptance criteria.

Organized by phase. Each phase is a self-contained prompt you can hand to a coding assistant. Build roughly in order — later phases depend on things earlier phases establish (persisted receipts, the ranking engine, etc).

---

## Phase 1 — Music Receipt v2 (polish existing feature)

> Extend the existing Afri Index "Music Receipt" feature (afrobeats-index.vercel.app) with:
>
> 1. **Genre breakdown line** — tag each track with a genre (Afrobeats, Amapiano, Alté, Afro-fusion, Hip-hop, R&B, etc.) from the Afri Index artist database. Add a genre-distribution summary line below "Top African Artists," e.g. "70% Afrobeats · 20% Amapiano · 10% Alté."
> 2. **Country flags** — show the artist's country flag next to their name in the track list and "Top African Artists" section, sourced from the artist database.
> 3. **Rising artist flag** — cross-reference each artist against Afri Index's own ranking/trend data. If an artist has moved up recently (e.g. +5 positions in 30 days, or an existing "trending" flag), show a 🔥 "Rising" badge next to their name.
> 4. **Discovery suggestions** — below the receipt, recommend 3-5 rising or sonically-similar African artists not already in the user's top list, pulled from Afri Index's own database. Link each to their Afri Index profile.
> 5. **Custom themes** — build 4 selectable themes, all keeping the same layout (centered AFR/INDEX wordmark, dashed dividers, itemized list, barcode footer), palette/mood only changing: 
>    - **Classic** — cream bg #F5F0E1, near-black text #2C2A22, muted tan dashed dividers #B5B09A, black barcode.
>    - **Amapiano dark** — near-black bg #1C1C1A, off-white text #E8E6D8, lime-yellow accent #D7F04A on wordmark/barcode, dark-gray dashed dividers #4A4940. The flagship "flex" screenshot theme.
>    - **Naija Owambe** — deep brown/gold bg #3B2A0F, thin gold border #C9962F framing the receipt, gold wordmark #EFCB7A, warm cream text #F0DCAE, bronze dashed dividers #8A6A2F. Premium/celebratory — base for Afri Wrapped.
>    - **Monochrome** — near-white bg #FAFAF8, black wordmark, dark gray text #333, light gray solid (not dashed) dividers #DDD, black barcode. Reuse the same logo/wordmark asset recolored per theme. Build a live preview switcher with the selected theme visually indicated. Spend real design attention on spacing/contrast per theme — 4 intentionally art-directed looks, not one template with a background swap.
> 6. **Comparison mode** — new page: paste two receipt share-links/IDs, generate a side-by-side overlap view (shared artists, shared tracks, percentage-match score, a fun verdict line like "You and @friend are 40% music twins"). Requires receipts to be persisted with shareable IDs (see Phase 1b).
>
> Keep genre/country/trending data centralized in the existing artist database, not hardcoded.

---

## Phase 1b — Persisted, shareable receipts (foundation for comparison + profile)

> Persist each generated Music Receipt with a unique ID and serve it at `afrobeats-index.vercel.app/receipt/[id]`. Add Open Graph meta tags so the link unfurls with the receipt image when shared on social. This is required infrastructure for Comparison Mode (Phase 1, item 6), the public profile page (Phase 4), and Group Receipts (Phase 5).

---

## Phase 2 — Yearly "Afri Wrapped"

> Build a special expanded receipt format for end-of-year (auto-triggered in December, or via a "Wrapped" mode toggle year-round for testing), based on the Naija Owambe theme but bigger and bolder. Show: top artist/track/genre of the year, total minutes/streams (if the connected platform provides it), the "rising artist" the user discovered early, and export as a 1080×1920 Instagram Story-sized image. This is the flagship annual shareable moment — highest design priority of any single screen in the product.

---

## Phase 3 — Shareable ranking cards (the viral engine)

> Auto-generate a clean, branded ranking card for every artist's current chart position, exportable as both:
>
> - A 1080×1920 share image (X/IG Story/WhatsApp format)
> - An Open Graph card image for link previews
>
> Content: artist name, current rank (e.g. "#7 Current"), movement since last week (e.g. "+3"), and the Afri Index wordmark/logo. Style should match the Amapiano-dark receipt theme (black bg, lime accent) for brand consistency and shareability.
>
> Add a one-tap share button (X, IG, WhatsApp) on every artist page and on the homepage "Movers of the week" module (see Phase 6). This card format should feel like the site's signature social object — the thing people repost weekly, more than the receipt itself.

---

## Phase 4 — Personal accounts: watchlist + profile page

> 1. **Watchlist ("my board")** — let logged-in users save 5-10 artists to a personal watchlist. Send (or show in-app) a mini digest when a watched artist moves rank, gets a new certification, or enters/exits the Current 50 — e.g. "Seyi Vibez moved +3 this week."
> 2. **Public profile page** — `afrobeats-index.vercel.app/u/[username]`, showing the user's latest Music Receipt and their public "my board" (optional per-user visibility toggle). This turns one-time visitors into accounts.
> 3. **Group receipt** — let 3-8 friends combine their individual top-10s into one "house ranking" receipt, shareable as a single image (WhatsApp-group-friendly).
>
> Needs basic auth (magic link or OAuth) and a lightweight user/profile data model.

---

## Phase 5 — Ranking transparency features (kills "this list is biased")

> 1. **Public weight-slider sandbox** — expose the ranking's underlying metrics (the 11 factors used) as draggable sliders on a public "sandbox" page. As users adjust weights, reshuffle a live preview of the Current 50 in real time using client-side or fast server-side recomputation. The **official published ranking stays locked** and unaffected — this is a "show your work" transparency tool, not a way to change the real chart.
> 2. **One-hit vs catalogue toggle** — resort the Current 50 by what percentage of an artist's score comes from a single song vs. spread across their catalogue. Frame as "How much of this ranking rides on one record."
> 3. **Submit a correction / source** — a small form on artist/song pages: "This award is missing," "This stream count is stale," with a field for source link. Routes to a moderation queue; keeps Afri Index editorial while crowdsourcing accuracy.

---

## Phase 6 — Homepage & discovery modules

> 1. **Movers of the week** — homepage module surfacing biggest risers, biggest drops, new entries, and a "one to watch" pick, styled like a sports scores ticker. Link each entry to its Phase 3 ranking card.
> 2. **Debut watch** — a secondary board for artists ranked 51-75 (just outside the Current 50), with status tags like "2 weeks from entry" or "peaked at 47." Positions Afri Index as tracking the next generation, not just the established top artists.
> 3. **Collab graph** — an interactive graph showing who features whom and who produced whom. Clicking an artist (e.g. Asake) expands their connection web. Should be visually distinct and screenshot-worthy — this is a flagship "shows the culture" feature.

---

## Phase 7 — Specialized boards (spin-off rankings using the same engine)

> Build each of these as a separate locked board reusing the existing ranking methodology/engine, just filtered or re-scored:
>
> 1. **Featured-on index** — ranks artists by the value/impact of their guest verses (e.g. Odumodublvck, Shallipopi, Tems-type profiles).
> 2. **Producer & songwriter index** — a parallel 25-person board for producers (Sarz, P.Priime, Magicsticks, London, Kel-P, Rage, GuiltyBeatz etc.), scored on the chart impact of records they touched.
> 3. **Diaspora vs. home split** — segment by where streams actually originate: UK-Naija, Canada, US, South Africa, Ghana, East Africa. Frame explicitly as **local vs. international streams**, not a cultural/patriotic framing.
> 4. **Women's Current 25** — a standalone locked board (not nested inside the main 50) for artists like Ayra Starr, Tems, Tyla, Moliy, Amaarae, Fave.
> 5. **Veterans' board** — anyone with 15+ years in the industry (2Baba, Tiwa Savage, Wizkid, D'banj, P-Square), framed as a living hall of fame, not a static museum page.
>
> Each board needs its own landing page, its own "movers" logic if it updates periodically, and clear framing/copy explaining what makes it different from the main Current 50.

---

## Phase 8 — Community & structured debate

> 1. **Weekly head-to-head bracket** — expand the existing Head to Head feature into a structured weekly bracket (e.g. "Wizkid vs Davido, Current only"). One vote per browser/session. Results published every Sunday alongside the official chart update.
> 2. **Optional 3-way compare** — extend Head to Head to allow comparing 3 artists at once as an opt-in mode alongside the standard 1v1.
> 3. **Comments — artist pages only** — enable comments on individual artist profile pages, but explicitly NOT on ranking/chart pages (to avoid "this list is biased" pile-ons). Standard moderation/report tooling required.

---

## Phase 9 — Data credibility & live-feel

> 1. **Nightly Spotify monthly-listener layer** — pull and display monthly listener counts nightly (even if the full ranking recompute is weekly), with a visible "as of [date/time]" stamp so numbers never look frozen/stale.
> 2. **Certifications tracker** — RIAA, BPI, TurnTable Charts, Music Canada certification badges shown on artist and song pages, updated as new certifications land.
> 3. **Tour / live calendar** — since "Live" is already a ranking metric, surface upcoming tour dates, sold-out flags, and festival slot confirmations on artist pages.
> 4. **Awards calendar** — track Headies, Grammys, Trace Awards, BET Awards, TurnTable Awards nominations/wins, and show how each nomination factors into the existing Awards metric.

---

## Phase 10 — Distribution & power-user tooling

> 1. **Embeddable widget** — a lightweight `<iframe>` embed of "Current Top 10 this week" that other blogs/fan sites can drop into their own pages, driving backlinks and brand exposure.
> 2. **Public API / CSV export** — expose the current and historical rankings via a simple public API and downloadable CSV, so researchers and fan accounts can pull and cite the data directly. Rate-limit appropriately; consider requiring free API key signup for attribution tracking.
> 3. **Command palette** — press `/` anywhere on the site to open a fast search/nav palette (jump to an artist, a week's archive, "receipt," "west africa" region board, etc.).
> 4. **Deep links for everything** — ensure every meaningful view has a real shareable URL: `/current/[artist]`, `/week/[yyyy-Www]`, `/receipt/[id]`, `/vs/[artist1]/[artist2]`. Treat "if it can't be shared, it doesn't exist" as a hard requirement for any new feature going forward.

---

## Phase 11 — Print, offline & PWA polish

> 1. **Print / PDF weekly edition** — a formatted "AFR/INDEX · Week [N] · [N] pages" PDF export of that week's chart and movers, styled to actually look frameable/printable — lean into the existing serif + acid-green brand identity.
> 2. **Broadsheet toggle** — a stripped-down view mode: white paper background, black ink only, single column, no site chrome. A "Sunday morning reading" mode.
> 3. **PWA offline polish** — the manifest already exists; add: caching of the last locked weekly chart so the app opens with data even fully offline, a proper home-screen icon so it feels like a native app, and an opt-in weekly push notification for when the new chart drops.

---

### Notes for whoever builds this

- Every phase should reuse the existing artist database and ranking engine as the single source of truth — avoid forking data models per feature.
- Phase 1b (persisted receipts) and the ranking engine's weight/metric exposure (used in Phase 5's sandbox) are the two pieces of infrastructure most other phases depend on — prioritize getting those right early even if the features built on top of them come later.
- Keep the "official ranking is locked and editorial" framing consistent across every feature that lets users manipulate or vote on rankings (sandbox, brackets, 3-way compare) — this is what protects Afri Index's credibility while still being interactive.