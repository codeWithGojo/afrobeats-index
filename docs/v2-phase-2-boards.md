# AFR/INDEX v2 · Phase 2 boards

## What changed

- **Heat 25** (`/heat`): ranked only by momentum (this week's daily Spotify reading vs the artist's own 4-week baseline). Pool: the Current 50. An artist needs a baseline and a reading no older than 14 days. Legends stay on the Current 50; risers lead Heat.
- **Current 100** (`/current-100`): ranks 1 to 50 are the official Current 50 (unchanged). Ranks 51 to 100 are scored 45% recent streams, 35% momentum, 10% editorial, 10% activity. Ranks 51 to 75 are labelled "Debut watch" and link to Artists to Watch (and back).
- **The 50 line**: relegation zone (#46 to #50) and promotion watch (top 5 below the line, scored with the official formula). Promotions are only *proposed*; an editor confirms them. Provisional artists show "needs review first".
- **Entries and exits** week on week, from `data/board-history.json`.
- **Candidate collection**: `scripts/research/collect-extension.py` (also run by `npm run refresh:data`; failure keeps last week's file). Pool: Kworb Spotify weekly charts for Nigeria and South Africa, plus All-Time 50 artists outside the Current 50. Identity: Wikidata with an African country, matched by exact Spotify ID or by a name that belongs to only one musician worldwide. Deceased artists are skipped. Streams: Kworb artist ledger.
- **New-artist checklist** (`boards-model.js` `completeness`): photo (webp), country flag, streams source, bio (with source), editorial score, review date. Missing items show on the row as "Not yet reviewed". Editorial is set to the Current 50 median until reviewed.
- Files: `boards-model.js`, `scripts/build-boards.cjs`, `scripts/render-boards.cjs`, `data/current-extension.json`, `data/boards.json`, `data/board-history.json`, `tests/boards-v2.test.cjs`. Hub cards, ranking nav, sitemap, ItemList JSON-LD, homepage movers link to Heat 25.

## Editor tasks in `data/current-extension.json`

- Complete a candidate: set `bio`, `bioSource` (https), `editorialScore` (0 to 100), `reviewedAt`, `image` (`/artists/<slug>.webp`) and `imageCredit`.
- Add an artist by hand: append to `manual` with `spotifyId`, `name`, `country`, `countryCodes`, `identitySource` (https).
- Exclude an artist: append to `excluded` with `spotifyId` and `reason`.

## What to test

1. `npm run build`, `npm test` (174 pass).
2. `/heat`: 25 rows, momentum percentages, baseline dates.
3. `/current-100`: 50 compact rows with the line zone marked, the 50 line block, Debut watch table, open places note, method details.
4. `/rankings` hub shows Heat 25 and Current 100; `/watch` links to Debut watch.

## TODO (Phase 2)

- [ ] Only 14 of 50 extension places are filled. 28 candidates have a verified identity; 13 are held because Kworb has not updated their page in 35+ days, and DJ Snake is excluded pending a decision (Wikidata lists Algerian citizenship but describes a French producer). 36 places are open.
- [ ] 136 charted artists (including Peruzzi, Naira Marley, many amapiano acts) have no unique Wikidata match. Add the ones you want through `manual`.
- [ ] All 14 extension artists are provisional: no bio, editorial score, review date or webp photo yet.
- [ ] Photos: no webp encoder in the toolchain (no sharp or Pillow). Wikidata gives a Commons image for some candidates (`photoSource`); Commons images need attribution under their licence. Current 50 portraits appear to be cached Spotify artist images (`imageFallback` is i.scdn.co): rights belong to the artists/labels and Spotify's developer terms restrict reuse. Flagged as a rights risk.
- [ ] Flags exist only for NG, GH, ZA, TZ, GB, SZ. Other countries show no flag.
- [ ] Activity favours Nigerian artists in the extension because TurnTable is a Nigerian chart; South African chart data is not wired in.
- [ ] Momentum for new candidates is neutral until they have a few weekly readings, so the promotion watch compares them at neutral momentum.
- [ ] This edition's candidates were collected 28 Nov while the Current 50 edition is dated 22 Nov. The weekly refresh collects both on the same day from now on.
- [ ] Not verified in a browser: `/current/:artist` links from Heat (need `vercel dev`).
