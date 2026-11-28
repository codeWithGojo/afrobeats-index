# AFR/INDEX v2 · Phase 7 share everywhere

## What changed

- **One ShareSheet** (`share-sheet.js`, `share-sheet.css`, loaded on every page and on `api/view` pages). Open it with `AfriShare.open({...})` or any element with `data-share-open`.
- **Wired into:** Current 50 ("Share the chart"), Heat 25 and Current 100 ("Share this board"), artist pages (the existing "Share ranking card" button), compare results ("Share this comparison"), Music Receipt ("Share receipt"), personal stats ("Share my stats") and My Index ("Share my top 10").
- **15 targets:** WhatsApp, WhatsApp Status, X, Instagram Stories, Facebook, Telegram, TikTok, Snapchat, LinkedIn, Reddit, Threads, Email, SMS, Copy link, Download image.
  - On phones with file sharing, "Share with your phone…" uses the Web Share API with the image. The image targets (Instagram Stories, WhatsApp Status, TikTok) share the file; where that is unavailable they download it and say what to do next (TikTok also copies the caption).
  - On desktop, link targets use each platform's share URL.
- **Share cards:**
  - `/api/card?board=current|heat|current-100&format=story|og` (new, in the existing card function; 1080×1920 and 1200×630).
  - The artist story card now carries tier-styled certification counts (Diamond, Multi-Platinum, Platinum, Gold) and an updated v2 footer.
  - Compare uses the existing matchup card.
  - Personal stats and My Index cards are drawn in the browser (`AfriShare.card`), so personal data never reaches the server.
- **Links:** every shared link carries `utm_source=share&utm_medium=<platform>&utm_campaign=<kind>`; captions are preset per platform (hashtags on X, Threads, TikTok and Instagram; X is kept under 230 characters).
- **OG:** Heat 25 and Current 100 pages now use their board cards as `og:image` with `summary_large_image`. Artist and compare pages already had cards.
- **Tracking:** `share_open` and `share_click` (platform, kind) through Vercel Web Analytics. Phase 6 toasts and confetti fire on every share and copy.

## What to test

1. `npm run build`, `npm test` (197 pass).
2. On a phone: `/my-index` → Your chart → Share my top 10 → "Share with your phone…" and Instagram Stories.
3. On desktop: `/current` → Share the chart → X, WhatsApp, Copy link; check that the link has the UTM tags.
4. `/api/card?board=heat&format=story` renders (needs `vercel dev` or production).

## TODO (Phase 7)

- [ ] Snapchat's web share URL (`snapchat.com/scan?attachmentUrl=`) opens Snapchat's link sharing; not tested on a device.
- [ ] Instagram and TikTok have no web share URLs; they rely on the phone share sheet or download plus instructions (platform limitation).
- [ ] Vercel custom events need a paid plan (see Phase 5).
- [ ] Not verified in a browser: the artist, compare and board cards from `/api/card` (rendered and dimension-checked in tests; static preview has no API), and real device share sheets.
