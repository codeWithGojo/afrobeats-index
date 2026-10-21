# 19 October 2026 release and editorial audit

The refreshed page is a **2026 release cohort ordered by global catalogue totals**, not a calendar-year consumption chart. The old page mixed Kworb global recording totals with Nigeria chart totals, displayed a hardcoded 31 August date, credited HYBRID to FOLA and omitted newer projects. Those claims and dates are corrected. Current 50 uses the locked 5 October editorial baseline, normalized to a maximum of 83 points, plus up to 17 points from comparable audio streams. Ranks are recalculated; certifications are preserved and monthly listeners have no scoring weight.

The audit collected song and album ledgers for all 50 Current artists and Apple artist-ID album catalogues, retaining normalized evidence in `data/releases-2026-sources.json`. The compiler matches primary artist identity, project title, year, a date no later than the audit, and at least four tracks. It rejects feature-only album rows, which can describe just the artist's guest tracks rather than an entire project. Songs match the previously reviewed artist catalogue and use the earliest matching recording date in that packet. No inference of original historical release outside that source coverage is made.

There are 30 matched released projects and 273 matched recordings. The visible edition displays the largest ten project totals and fifteen recording totals, with a Spotify link, Kworb ledger date and Apple release-record link for each. Project totals can include advance-single streams from an earlier year. Shared recording totals are not a claim that a guest artist personally generated every play. Kworb remains a third-party tracker, not Spotify's own audit service. Provider dates range from September to October and remain visible per row rather than being relabelled fresh on the check date. Coverage is bounded by these 50 artist files, available catalogue metadata and publisher ledgers; no exhaustive pan-African or year-to-date claim is made.

`data/nigeria-top100.json` now retains all 100 official TurnTable ranks for 2–8 October, checked on 19 October. This weekly, multi-signal Nigerian chart remains separate from global Spotify release totals. Editorial notes use the publisher's 13 October Ilome chart report, 13 October ZUKO rollout preview and 9 October FOLA album review. Pointers and publication dates are retained in `data/editorial-news.json`.

To reproduce a new edition:

```sh
python scripts/research/audit-2026-releases.py
python scripts/research/compile-2026-releases.py
npm test
npm run build
```

The collector uses a dated, ignored raw cache, so checks on a new day fetch new downloads. Clear that day’s folder for a fresh same-day pull. The builder generates the small browser payload and embeds the chart and editorial JSON. The older general streaming collector no longer writes cumulative figures into calendar-year fields.

Quiz covers keep a deterministic interior crop and progressively raise its sample resolution from 14 to 256 over the existing twenty-second wall-clock deadline. This changes visual clarity while preserving the crop, timeout scoring and shared challenge identity. The mobile header now reserves four columns for Current 50, Receipt, Fan Quiz and More; the fourth control no longer wraps below the header.

## Launch corrections and remaining verification

The yearly renderer initializes after all source scripts have loaded. It reads `total_streams` for audited rows, retains the historical catalogue fallback, sorts by the displayed metric and exposes stream-ledger, publisher-date, Spotify and release-record links. Switching away from and back to 2026 must never display NaN. External source links do not open the artist profile.

Top 100 re-entries with a negative last-position sentinel display RE rather than a fictitious downward move. Source freshness is not inferred from an Afri Index check: publisher ledgers in this packet range from 28 September to 18 October. Editorial news remains the sourced 9–13 October selection checked on 15 October; no new reporting is claimed here.

Additional-provider observations are empty. Production ranking coverage is Spotify alone; no Apple Music, Audiomack, Boomplay or YouTube counts have been invented. The release compiler still matches catalogue metadata by title within artist packets. Cross-provider recording identifiers and original-release dates need editorial review for ambiguous editions.

The existing quiz deadline, progressive crop and embedded Music Receipt/ Wrapped watermark are preserved. Remaining release gates: real mobile and desktop checks of quiz loading, timeout, background/resume, artwork failures and shared rounds; receipt export readability in all themes; real Spotify/Apple authorization. Career supplements currently cover 39 of 79 artists. These integration and editorial checks are not replaced by unit tests.


## 21 October interface release

The home cover, chart, receipt studio and quiz share an editorial visual system. Current's initial HTML, enhanced rows and ItemList metadata now use one renderer and the generated official snapshot. Local chart filters preserve published ranks and show an explicit empty state. Artist files show the Current score in place of a duplicated Spotify total.

Receipt starts with manual picks, labels unavailable Apple Music authorization before a user tries it, and only offers listening periods for Spotify. Export watermarks and themes remain intact. Spotify and account email authorization still require an actual account walkthrough; no successful external authorization is claimed. Ranking coverage and the 2026 release-cohort definition remain unchanged.
