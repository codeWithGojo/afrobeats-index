# Afri Index fan quizzes

The quiz directory merges the Current 50 and All-Time 50 by artist identity. The shared final All-Time slot is expanded into separate Bracket, Olu Maintain and Skales banks, giving 79 unique artist files.

Each artist has 100 distinct questions. Ten are served per round. Categories cover songs and releases, named featured credits, cover artwork, track order and positions, release metadata, catalogue chronology, and release sizes.

## Evidence and validation

- The catalogue collector uses Apple's public iTunes Search and ID lookup APIs. Artist IDs, candidate names, source URLs and checked timestamps remain in `data/quiz/catalogues/`.
- Current identities are checked against matching track titles in the project's existing Spotify ledger. Legacy identities are checked against landmark recordings in their returned catalogues. Candidate IDs remain available for audit.
- DJ mixes, future-dated releases and records without an explicit artist connection are excluded from questions.
- Every question stores source record IDs, URLs and the exact metadata used to derive the answer. Automated tests compare those fields back to the collected records and check the answer by question type.
- Release dates describe the specific recording/edition in the provider metadata. They are not asserted to be the first historical release date. Reissues are explicitly qualified in the UI.
- Weird MC's smaller digital catalogue is supplemented with the 11-track physical CD edition of *After Da Storm* listed by Afro Crafters. That source is named separately, and no original release year is inferred for the physical edition.
- The bank has catalogue fact checks and artist identity checks. It is not a claim that a human manually fact-checked 7,900 independent prose answers against multiple sources.

## Rebuild source data

Run, in order:

```sh
python scripts/research/collect-quiz-catalogues.py
python scripts/research/review-quiz-identities.py
python scripts/research/supplement-quiz-catalogues.py
python scripts/research/build-quiz-banks.py
npm test
npm run build
```

Requests are spaced to stay below 20 per minute. Raw responses are locally cached but excluded from git. Normalized catalogue records and compiled banks are retained in the repository. Review any unresolved artist identity before generating its bank.

## Routes and rounds

- `/quiz` — searchable artist directory, with both list filters.
- `/quiz/:artist` — artist intro, ten-question round, answer review and score card.
- `/api/quiz` — directory manifest.
- `/api/quiz?artist=:slug` — compiled artist bank.

A challenge URL carries a round seed, difficulty and bank version. Questions and options are shuffled deterministically. Both players receive the same set. An outdated bank version produces a fresh-round prompt instead of silently giving the friend different questions.

Scores are casual client-side game results. They are not trusted competition or prize leaderboard entries.
