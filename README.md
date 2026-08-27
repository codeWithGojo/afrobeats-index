# AFR/INDEX — The Living Afrobeats Index

An editorial Afrobeats ranking that shows its work across eras.

## What is included

- All-Time 50 and a recomputed Current 50
- Eleven weighted Current inputs with an inspectable score ledger
- Structured award records scored by tier and result
- TurnTable certification plaques folded into Commercial Power
- A 45/30/25 Spotify, Boomplay, and YouTube stream model that reweights verified snapshots automatically
- Weekly movement, Compare Eras, source links, and update notes
- Fifty locally cached artist portraits and original editorial profiles

## Live site

https://afrobeats-index.vercel.app/

## Data note

The Current chart uses dated editorial snapshots. Spotify is verified across the Current 50; Boomplay and YouTube fields are integrated and remain explicitly marked pending until verified snapshots are entered. Missing platform values are never guessed.

## Maintenance

Run `npm test` before publishing. If `scripts/ranking-upgrade.js` changes, run `npm run embed` to refresh its embedded copy in `index.html`.
