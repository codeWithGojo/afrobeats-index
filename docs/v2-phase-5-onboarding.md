# AFR/INDEX v2 · Phase 5 onboarding

## What changed

- **First visit only** (`onboarding.js`, `onboarding.css`, `afri-prefs.js`): a non-modal bottom sheet (side card on desktop) opens 1.2 s after the homepage loads. The page stays usable behind it. Every step has Skip; × and Escape close it and never show it again. `?no-onboarding` suppresses it.
- **Step 1:** pick 3 favourites from the Current 50 (tap cards in official order, or search). **Step 2:** 1 to 3 genres and an optional region (the regional boards). **Step 3:** optional "Connect your listening" (/stats) or "Get the Sunday brief" (/newsletter).
- **Homepage, straight away:** "Your artists this week" after the hero shows rank, movement, score and next announced release (from `data/upcoming-releases.json`), plus more artists in your genres, your region board, and links to Receipt and My Index. "Edit picks" and a footer "Personalise your homepage" link reopen it.
- **Storage:** guests keep picks in this browser (`afri_prefs_v1`). Signed-in users sync to `user_prefs` (`database/user_prefs.sql`); the newer copy wins. The account bundle is only loaded if a session already exists.
- **Reuse:** Music Receipt starts with your picks; My Index grades your favourites first.
- **Drop-off tracking:** events `onboarding_shown`, `onboarding_step` (step), `onboarding_skip` (step), `onboarding_complete` (seconds, counts, option) go to Vercel Web Analytics through `window.va`. No personal data is sent.

## Measured

At 380px in the browser, the full flow (3 picks, 2 genres, region, Done) logged `onboarding_complete` at **7 seconds** with scripted taps. A person reading each step should still be well under 30 seconds.

## What to test

1. `npm run build`, `npm test` (188 pass).
2. Clear site data, open `/`: the sheet appears. Skip each step, or complete it and see "Your artists this week".
3. `/music-receipt` shows your picks; `/my-index` starts grading with them.

## TODO (Phase 5)

- [ ] Apply `database/user_prefs.sql` in Supabase.
- [ ] Vercel Web Analytics custom events need a Vercel Pro (or Enterprise) plan. On Hobby the calls are ignored. Phase 11 should add a fallback store if needed.
- [ ] Only 3 releases are announced in `data/upcoming-releases.json`, so most cards say "No announced release".
- [ ] Favourites are limited to the Current 50; Current 100 and All-Time artists cannot be picked yet.
- [ ] Not verified: sync with a real signed-in account.
