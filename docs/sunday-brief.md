# Afri Index Sunday brief and Underground 10

The Underground 10 is Afri Index's own editorial listening order. `data/underground.json` owns the edition date, order, song links, source register, watchlist and unpaid spotlight. Source interviews establish the songs and artist activity; they do not establish these ranking positions. Artists already on the Current 50 are excluded. No invented stream counts or movement are displayed. Keep older watchlisted names until their review is complete.

`node scripts/render-discovery.cjs` (also part of `npm run build`) renders the standalone `/underground` and `/newsletter` pages and the homepage underground tab. Both newsletter delivery paths use `lib/weekly-brief.cjs`: the published Top 10, positive rank movement, the index-point gap between the first two artists, one underground spotlight and two editable commentary lines. Issue keys use the most recent Sunday in Africa/Lagos; chart and underground source dates remain separate.

## Connect email signup

1. Create the Afri Index newsletter in Buttondown and configure its sender identity in that account.
2. In Vercel → **afrobeats-index** → Settings → Environment Variables, add `BUTTONDOWN_API_KEY` for Production. Copy it directly from Buttondown into Vercel; do not put it in Git, client-side code or chat.
3. Add a random `CRON_SECRET` in Vercel for Production, then redeploy to apply both values.
4. Open `/newsletter`. Test using an address you own, confirm Buttondown's email and check the subscriber record. Confirm that unsubscribing works. A signup requires explicit consent and double opt-in; existing suppressed addresses are not silently reactivated.

Until the provider is configured, forms explain that signup opens soon, remain disabled, and link to the readable brief. The site never pretends it saved an email. No account is required for Buttondown signup. Existing verified-account newsletter preferences and the legacy Resend delivery path remain available under `/studio/newsletter`.

Official integration references: [subscriber creation](https://docs.buttondown.com/api-subscribers-create), [double opt-in](https://docs.buttondown.com/double-opt-in), [draft creation](https://docs.buttondown.com/api-emails-create), [email listing](https://docs.buttondown.com/api-emails-list).

## Sunday routine

Vercel cron calls `/api/newsletter-draft` at `0 8 * * 0` (09:00 Sunday in Lagos). It requires the native `Authorization: Bearer CRON_SECRET` header and `BUTTONDOWN_API_KEY`. It reads the current repository snapshot and creates an **unsent Buttondown draft**. It checks for an exact issue subject before creation, including issues already sent; existing issues are retained rather than overwritten. On an uncertain error, check Buttondown before retrying. Provider creation has no documented atomic idempotency contract, so avoid concurrent manual job triggers.

Open that draft in Buttondown, check source freshness, edit the two commentary lines, and schedule/send it for Sunday. No subscriber emails are sent by the draft job. Sending and confirmation delivery require a configured Buttondown account; they cannot be verified with mock API tests. The generated brief reflects available chart snapshots, not freshly collected seven-day measurements. Refresh chart data through the existing pipeline before preparing the week's issue.

The read-only `/api/newsletter?action=preview` endpoint always builds the same email template from the current deployed snapshot. No subscriber records are included. `/api/newsletter?action=status` exposes readiness flags only. The subscription endpoint has same-origin checks, a honeypot, per-instance attempt limits and Buttondown's enabled spam checks; the local limiter is not a distributed quota.

## Sponsor and promotion policy

The first edition promotes artists through an unpaid spotlight, direct listening/profile links and share actions. Ranking order cannot be purchased. When the newsletter reaches roughly 500 confirmed subscribers, review whether one sponsor slot per issue is viable. Enter only real contracted placements using the existing sponsor configuration; the email template accepts at most one and labels it **Paid sponsor**. Do not show invented sponsors, subscriber counts or promotion results. Paid advertising must remain outside the editorial list.

## Validation

`npm test` covers independent ranking membership, source-date retention, Sunday boundaries, movement gaps, consent and origin rejection, unconfigured signup, provider failure/collision behavior, authenticated draft creation and retry reconciliation. `npm run build` refreshes the generated pages without adding a Vercel function.
