# Connect the product services

The public tools and owner-bound game/preferences use the existing Afri Index Supabase project. Revenue and delivery adapters remain disabled until their real provider settings exist. Keep all secret values in server environment variables.

## Paid analytics and API

Set `PAYSTACK_SECRET_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `AFRI_PRO_AMOUNT` (integer minor currency units) and `AFRI_BILLING_CURRENCY` (default NGN) in production. The product is a **30-day pass with no automatic renewal**. Choose and approve the actual amount before enabling it.

Point the Paystack webhook at `https://afrobeats-index.vercel.app/api/paystack-webhook`. The handler checks the raw HMAC-SHA512 signature, verifies the transaction with Paystack, compares it with the server-created order and fulfils each reference once. Callback query parameters never grant Pro access. Test a provider sandbox payment, retry and replay before switching to a live secret.

Pro clients use `Authorization: Bearer afri_…` on `/api/pro?action=history&artist=wizkid` or `/api/pro?action=board&board=ghana`. Keys are generated once, hashed at rest, revocable and tied to a current entitlement. The daily 10,000-request quota is atomic and shared by all keys on an account, resetting at UTC midnight. Session-authenticated history export checks the same entitlement. Free `/api/rankings` JSON/CSV stays available.

## Spotify playlists

The existing browser-safe Spotify client ID is reused. Add this exact app redirect URI in the Spotify dashboard:

`https://afrobeats-index.vercel.app/studio/playlists`

Enable the intended app users / quota mode, then verify the `playlist-modify-private` permission and both current endpoints (`POST /me/playlists`, `POST /playlists/{id}/items`). OAuth state and PKCE verifier expire after ten minutes. Access tokens remain in memory and are not saved to a database or browser storage. Creation happens only on the visitor's explicit button action. If adding tracks fails after creation, the UI retains the created playlist URL instead of silently creating another one.

The app-generated queue and downloadable CSV already work without OAuth. They are described as a queue / tracklist, not as an already-created Spotify playlist.

## Newsletter

Set `RESEND_API_KEY`, `NEWSLETTER_FROM` (a verified sending domain), `NEWSLETTER_SIGNING_SECRET`, `NEWSLETTER_JOB_SECRET` and `SUPABASE_SERVICE_ROLE_KEY`.

Schedule a weekly POST to `/api/newsletter?action=send` with `Authorization: Bearer <NEWSLETTER_JOB_SECRET>`. Each invocation processes up to ten unclaimed recipients for the current ISO issue; call again to drain further batches. A recipient must have opted in and have a verified account email. The sender claims each issue/user pair before contacting Resend and uses a provider idempotency key. A delivery left `pending` after interruption requires reconciliation with provider logs before retrying; the job deliberately avoids a blind resend. Review unclaimed/pending rows in `private.email_deliveries` when operating the queue.

Unsubscribe links first show a confirmation form so email-link scanners do not unsubscribe people merely by fetching a URL. The signed POST removes consent. Account newsletter preferences also support opting out. No sender or scheduled production campaign was activated by this release.

Sponsor records in `data/product-config.json` use `{name,copy,url,label,start,end}` with ISO dates and an HTTPS URL. The same active placements render on the web issue and email, labelled **Paid sponsor**.

## TikTok, Shazam and seasonal data

Use `node scripts/import-signals.cjs reviewed-observations.json` to validate without writing. Add `--publish` with the service key only after source/usage-rights review. Required fields are artist slug, platform, metric, nonnegative value, territory, city for city observations, period start/end, observed time, HTTPS source and reviewed status. TikTok supports creations/views; Shazam supports total or city Shazams. A preview metric needs all 50 artists, the same metric/period/territory/city and an observation within 30 days. Nothing changes the locked published method.

After publishing a reviewed chart, run `node scripts/publish-feature-data.cjs` with the service key. It records an immutable lightweight chart edition and seasonal daily song observations only when their **publisher source date** falls inside June–August. It does not backfill or extrapolate missing days. Repeated records are ignored by their unique recording/date key.

## Tickets and merchandise

Add contracted placements as `{artist,kind,label,partner,url,checkedAt,event?}` in `data/product-config.json`. `kind` is `ticket` or `merch`; `artist` is an existing slug; `event` optionally matches a specific event title. Use the actual HTTPS partner URL and source-checked date. Calendar actions show a commission disclosure and `rel=sponsored`. Ordinary source ticket links work now; partner earnings are not claimed without a real agreement.

## Sources

- [Spotify create playlist](https://developer.spotify.com/documentation/web-api/reference/create-playlist), [add items](https://developer.spotify.com/documentation/web-api/reference/add-items-to-playlist).
- [Paystack webhooks](https://paystack.com/docs/payments/webhooks/), [transactions](https://paystack.com/docs/api/transaction/).
- [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security).

The schema is recorded in `database/product_features.sql`; the access verification script rolls back all fixtures. Public provider observations are editorial writes only. Default broad table privileges are explicitly revoked for the new tables before narrow grants are added.
