# AFR/INDEX v2 · Final report

Twelve commits on `main` after the imported baseline: Phases 1 to 11 plus one cap-decision note. 214 tests pass (151 of 154 passed at baseline). Per-phase details: `docs/v2-phase-*.md`.

## Setup before deploying (blocking)

| What | Where | Needed for |
|---|---|---|
| Apply migrations | `database/personal_stats.sql`, `my_index.sql`, `user_prefs.sql`, `sponsors.sql`, `usage_events.sql` | Stats, My Index, onboarding sync, sponsors, usage counts |
| `LASTFM_API_KEY` | Vercel env | Last.fm stats |
| `ADMIN_TOKEN` (24+ chars) | Vercel env | Usage summary on /data-health |
| `APPLE_MUSIC_ENABLED` | Vercel env (leave false) | Apple Music placeholder |
| Spotify redirect URI `/stats` plus up to 5 testers | Spotify dashboard | Spotify beta |
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | GitHub Actions secrets | Nightly readings and weekly edition (otherwise dry) |
| Schedule `select public.flag_outlier_graders();` weekly | Supabase | Community Index anti-abuse |

## Full TODO list (unfinished or unverified)

### Data and ranking
- [ ] Editorial reviews are all dated 5 Oct 2026 and start fading after 30 Nov 2026. Re-score in `data/editorial-reviews.json`.
- [ ] The weekly cap holds 35 of 50 artists away from their score rank in the switchover edition (decided: keep the cap).
- [ ] Momentum currently compares with 14 Sep to 5 Oct; nightly readings fix this from the next editions.
- [ ] 20 artists have Kworb readings over 14 days old (see /data-health). TurnTable Nigeria Top 100 is 16 days old.
- [ ] Current 100: 14 of 50 places filled, all provisional (no bio, editorial score, review date or webp photo). 136 charted artists lack a unique Wikidata identity. DJ Snake is excluded pending an editor decision.
- [ ] Activity favours Nigerian artists (TurnTable is Nigerian); no TikTok or Shazam data; touring has 4 historic concerts.
- [ ] 13 black and white portraits fall back to the lime accent.

### Product
- [ ] Spotify login is limited to 5 allowlisted users (Spotify policy); Last.fm and history files are the public paths.
- [ ] Play logging runs only when users open /stats (Spotify returns the last 50 plays).
- [ ] Friend overlap is on /stats, not yet on saved receipt pages.
- [ ] My Index grades the Current 50 only; free tier is 3 metrics and Pro up to 8 (confirm the interpretation).
- [ ] Onboarding favourites are limited to the Current 50.
- [ ] Only 3 releases are announced in `data/upcoming-releases.json`.
- [ ] Sponsor event counts can be inflated (no per-IP rate limit); inquiries are stored but no email alert is sent.
- [ ] Media kit audience figures are "Shared on request" until filled from analytics.
- [ ] Vercel custom events need a paid plan; the first-party counter works on any plan once migrated.
- [ ] Em dashes remain in some pre-existing copy and placeholders (method, compare, net worth, two "no value" placeholders in `current-view.js`).
- [ ] Artist pages use MusicGroup for everyone; All-Time-only artists have no artist pages.
- [ ] The unused 388 KB `assets/motion.js` bundle is still built.

### Not verified (needs a live environment)
- [ ] Every Supabase write, RLS policy and RPC (no database access here).
- [ ] Spotify, Last.fm and Apple flows; real device share sheets (Instagram, TikTok, Snapchat).
- [ ] `/api/card`, `/api/view` and `/api/product` routes in a browser (tested in Node); artist, board and compare pages under Lighthouse.
- [ ] Light-theme visuals beyond spot checks; Safari behaviour; real 2G and 3G devices.
- [ ] Production LCP: measured locally on an uncompressed server only.

## Measured performance (Lighthouse 12.2.1, mobile, simulated Slow 4G 150 ms RTT 1.6 Mbps, 4x CPU)

Served locally without compression; "estimated production" Brotli-compresses the exact files each run requested.

| Page | Requests | Est. production | LCP | CLS | TBT |
|---|---|---|---|---|---|
| Home, Lite, before v2 work | 118 | 1,833 KB | 4.9 s | 0.437 | 3.4 s |
| **Home, Lite, now** | **44** | **184 KB** | **4.5 s** | **0** | 2.6 to 3.3 s |
| Home, full, now | 99 | 455 KB | 4.2 to 5.1 s | 0.002 | 2.5 to 6.3 s |
| /current, Lite, now | 103 | 1,317 KB | 23.7 s | 0.05 | 9.7 s |

Budget (home, Lite): **under 300 KB met. CLS under 0.1 met. LCP under 2.5 s not met locally (4.5 s, pessimistic).** Check production with PageSpeed Insights on `/?lite=1`.

Lighthouse SEO is 100 on all 23 static pages; accessibility is 95 to 100.

**Biggest performance debt:** `/current` reruns the scoring in the browser from about 4 MB of embedded legacy data scripts. It should render from the published JSON.

## Security and privacy gaps noticed

1. **Spotify refresh token in localStorage** when a user ticks "keep tracking". Any XSS could read it. Consider a server-side token store or session-only tokens.
2. **No Content-Security-Policy.** The site uses inline scripts (several pre-existing, plus the media kit form, the /method form and the Lite orbit loader). A CSP would need nonces or hashes.
3. **Unauthenticated public endpoints without rate limits:** the Last.fm proxy (can exhaust the API key), the sponsor event counter, the usage event counter, the Apple waitlist and sponsor inquiries (honeypot only). Add Vercel firewall rate limits.
4. **`ADMIN_TOKEN` is a single shared secret** for the usage summary. Fine for one admin; move to Supabase roles if more people need access.
5. **Listening data retention:** play logs and lifetime totals are kept until the user deletes them. Set a retention period in the Privacy policy, and ideally a scheduled purge.
6. **RLS correctness is untested** against a live database: owner-only policies, `security definer` functions (`taste_soulmates`, `public_taste`, `community_index`, `delete_personal_data`, `copy_index_template`) and Pro checks in triggers. Review before applying.
7. **Photo rights:** Current 50 portraits appear to be cached Spotify artist images (rights belong to artists and labels; Spotify's terms restrict reuse). Wikimedia Commons images need attribution under their licence.
8. **Public Supabase key** in `community-config.json` is a publishable key by design; safety depends entirely on RLS (see 6).
9. **History file imports** contain IP addresses and devices. They are parsed only in the browser and never uploaded; only African-artist totals can be saved (Pro).
10. **Git author** on the v2 commits is a placeholder ("Afri Index <dev@localhost>"). Rewrite or squash before pushing if needed.
