# 15 October 2026 release and editorial audit

The refreshed page is a **2026 release cohort ordered by global catalogue totals**, not a calendar-year consumption chart. The old page mixed Kworb global recording totals with Nigeria chart totals, displayed a hardcoded 31 August date, credited HYBRID to FOLA and omitted newer projects. Those claims and dates are corrected. The Current 50 editorial ranking itself remains the 5 October snapshot; its rank, scores, certifications and listeners are preserved.

The audit collected song and album ledgers for all 50 Current artists and Apple artist-ID album catalogues, retaining normalized evidence in `data/releases-2026-sources.json`. The compiler matches primary artist identity, project title, year, a date no later than the audit, and at least four tracks. It rejects feature-only album rows, which can describe just the artist's guest tracks rather than an entire project. Songs match the previously reviewed artist catalogue and use the earliest matching recording date in that packet. No inference of original historical release outside that source coverage is made.

There are 29 matched released projects and 271 matched recordings. The visible edition displays the largest ten project totals and fifteen recording totals, with a Spotify link, Kworb ledger date and Apple release-record link for each. Project totals can include advance-single streams from an earlier year. Shared recording totals are not a claim that a guest artist personally generated every play. Kworb remains a third-party tracker, not Spotify's own audit service. Provider dates range from September to October and remain visible per row rather than being relabelled fresh on 15 October. Coverage is bounded by these 50 artist files, available catalogue metadata and publisher ledgers; no exhaustive pan-African or year-to-date claim is made.

`data/nigeria-top100.json` now retains all 100 official TurnTable ranks for 2–8 October, checked on 15 October. This weekly, multi-signal Nigerian chart remains separate from global Spotify release totals. Editorial notes use the publisher's 13 October Ilome chart report, 13 October ZUKO rollout preview and 9 October FOLA album review. Pointers and publication dates are retained in `data/editorial-news.json`.

To reproduce a new edition:

```sh
python scripts/research/audit-2026-releases.py
python scripts/research/compile-2026-releases.py
npm test
npm run build
```

The collector uses a dated, ignored raw cache, so checks on a new day fetch new downloads. Clear that day’s folder for a fresh same-day pull. The builder generates the small browser payload and embeds the chart and editorial JSON. The older general streaming collector no longer writes cumulative figures into calendar-year fields.

Quiz covers keep a deterministic interior crop and progressively raise its sample resolution from 14 to 256 over the existing twenty-second wall-clock deadline. This changes visual clarity while preserving the crop, timeout scoring and shared challenge identity. The mobile header now reserves four columns for Current 50, Receipt, Fan Quiz and More; the fourth control no longer wraps below the header.
