# Requested Afri Index features — 22 October 2026

Implementation map for the feature list supplied with the screenshot bugs. Planned rows are not shipped features.

| Request | Status | Implementation or next dependency |
| --- | --- | --- |
| Regional boards | Added | `/boards/naija`, `/boards/ghana`, `/boards/south-africa`, `/boards/east-africa`, linked from Public Boards and Regions. Scope is artist affiliation within the published Current 50. Each row keeps its global rank and score. South Africa includes Amapiano and other genres; nationality is not inferred from genre or audience location. |
| Artist career timelines | Partial | `/current/[slug]` pages already show sourced biographies, awards/live milestones and certifications. A consolidated chronological timeline still needs a shared event model and source-date precision. |
| TikTok/Shazam ranking signals | Planned | Ingestion requires actual dated observations and provenance, comparable coverage, and an explicit published methodology revision. Neither signal was fabricated or silently added to official scores. |
| Song of the Summer | Planned | Agree the season window, territory and stream-growth definition; then store repeat snapshots. Catalogue lifetime totals cannot stand in for seasonal consumption. |
| All-Time GOAT vs Current | Existing | Homepage All-Time 50 and Current 50, plus era comparison, remain separate lists with their original methods. |
| Next-week top-five prediction game | Planned | Requires locked weekly editions, submission cutoff, owner-bound entries, idempotent scoring and outcomes after publication. A PredictArena cross-link can be added without treating predictions as guaranteed outcomes. |
| Board playlists | Planned | Assemble a deterministic track list from sourced recording IDs, then create/update a provider playlist through an authorized app/user connection. Do not label CSV/search links as an actual playable playlist. |
| Weekly sponsored newsletter | Planned | Existing weekly web-push is separate. Email needs explicit subscriptions, unsubscribe/suppression, a verified sending service and editorial sponsor placement. No messages were sent by this release. |
| Pro analytics | Planned | Define historical coverage and analytical measures, organization roles and entitlements before billing. Current snapshots alone do not provide a historical artist analytics product. |
| Ticket and merch affiliate links | Partial | The live calendar has sourced listing/ticket references. Revenue tracking needs actual partner URLs and visible affiliate disclosure; no fake affiliate IDs were inserted. |
| Paid API tier | Planned | Free JSON/CSV exists. Paid access needs billing entitlements, rotated/scoped API keys, shared quota accounting and an explicit API/source-data usage contract. |

## Screenshot correction

Animated daily stream counts now use the same shared compact-unit rules as the chart (`593.4K`, `925.9M`, `1.19B`). The two metric blocks have independent flexible columns, including narrow mobile widths. The official ranks, stream observations and weights are unchanged.

## Delivery order

Regional sub-boards are the first new feature from this list in this release. Follow with career timelines using the existing sourced event records, then the prediction game backed by archived weekly editions. Provider-data and revenue features need their integrations and acceptance criteria before launch.

## Verified for this release

Build and strict motion TypeScript checks passed. All 34 Afri tests passed. Browser checks at 320, 360, 390, 393, 440, 768 and 1440px found no metric overlap or document overflow; all 50 chart rows remained present. Filtering under reduced motion and all four public regional board routes worked. The current sample contains 38 Naija, 6 Ghana, 5 South Africa and 1 East Africa artist; these counts describe this edition, not the full regional music market.
