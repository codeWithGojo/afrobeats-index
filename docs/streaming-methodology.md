# Tracked streaming data

One artist has separate lifetime observations for Spotify, Apple Music, Audiomack, Boomplay and YouTube. Audio plays can form a tracked audio total; video views stay separate. Null means unavailable. A tracked total is not a claim of complete worldwide consumption or unique listeners.

## Sources and updates

The Current 50 song and album ledgers are collected from Kworb, with Apple release metadata validating the primary-artist project and release date. Publisher dates and Afri Index check dates remain separate. Source snapshots can be older than today. Failed fetches retain previous counts and publisher dates. Official TurnTable chart rows retain the original publisher week; refreshing the check date does not invent a newer chart.

`npm run refresh:data` runs collection, cohort compilation, official chart retrieval, then the build. Raw caches are ignored by Git. The API and bundled browser use `streaming-model.js` and the same generated `streaming-snapshot.js`.

## Ranking

The raw published editorial contributions remain locked. Editorial points = 83 × an artist’s locked contribution / the largest contribution in the complete locked baseline. The stream index is 100 × comparable lifetime audio total / the largest comparable total. Current score = editorial points + 0.17 × stream index. This bounds editorial points at 83, stream points at 17 and the total at 100 without clamping or inventing individual component marks. The normalization denominator comes from the entire locked baseline, even when displaying a subset. Monthly listeners have no effect. A new platform enters this index only when every Current artist has a valid observation for that platform. Partial extra-platform observations may appear in tracked totals without distorting the common-coverage rank. YouTube views never enter the audio index. Ties use the previous published rank, then slug.

The previous edition is locked in `data/ranking-baseline-2026-10-05.json`; it must not be regenerated from an already recalculated edition. The historical source does not expose nine individual editorial marks, so the system retains the raw contribution for audit and normalizes the aggregate instead of inventing marks.

Current production coverage is Spotify only: `data/platform-observations.json` contains no additional provider observations. Cross-platform ingestion is supported, but a complete cross-platform total is not yet available.

## Connect another provider

Authorized artist/label reports or licensed provider feeds can populate `data/platform-observations.json`. Entries must have the same artist/catalogue scope and lifetime basis, with permission to publish. Provider reporting overlap must be resolved before ingestion; never add a distributor's all-platform total to constituent platform totals.

```json
{
  "artists": {
    "artist-slug": {
      "boomplay": {
        "value": 123456,
        "metric": "audio_streams",
        "period": "lifetime",
        "scope": "tracked_catalogue",
        "sourceUrl": "https://provider.example/report",
        "observedAt": "2026-10-19T00:00:00Z",
        "sourceDate": "2026-10-18"
      }
    }
  },
  "recordings": {},
  "albums": {}
}
```

The number above is a format example, not production evidence. Rebuild after changing observations. Apple Music provider analytics requires authorized access; the public music catalogue API is not an all-artist stream-count feed. No count is inferred from charts, popularity or monthly audiences.

## Recording and album identity

Spotify recording IDs are deduplicated across artist ledgers, with all associated artist slugs retained. Different recording IDs are kept separate until an ISRC or reviewed identity match establishes equivalence. Identifiers include nullable ISRC; unknown mappings are not fabricated from matching titles. Additional recording observations use `spotify:<track-id>`; album observations use `spotify-album:<album-id>`.

Album editions and featured appearances can overlap. Album rows are never added together to calculate artist streams, and track totals are never added to an already supplied catalogue total. Each sourced album ledger is accessible in the artist dialog.

2026 lists describe verified 2026 releases ranked by lifetime Spotify totals. They are not calendar-year consumption charts. Historic yearly consumption needs actual historical reporting or sufficient comparable daily snapshots.
