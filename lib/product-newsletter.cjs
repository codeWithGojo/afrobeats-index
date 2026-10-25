const { data, escape: e } = require("../lib/shared.cjs");
const { rest } = require("../lib/product-server.cjs");
const {
  unsubscribeToken,
  unsubscribeOwner,
  renderIssue,
} = require("../lib/newsletter.cjs");
const { nextWeek } = require("../lib/product.cjs");
const config = require("../data/product-config.json");
module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  const action = String(req.query.action || "");
  if (await require('./newsletter-public.cjs').handlePublicNewsletter(req, res, action)) return;
  if (action === "unsubscribe") {
    const token = String(req.query.token || ""),
      id = unsubscribeOwner(token, process.env.NEWSLETTER_SIGNING_SECRET);
    if (!id)
      return res
        .status(400)
        .send(
          "This unsubscribe link is invalid. You can change your preference in My board.",
        );
    if (req.method === "GET") {
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      return res.send(
        `<!doctype html><html lang="en"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Unsubscribe · Afri Index</title><body style="font:18px system-ui;padding:32px;max-width:640px"><h1>Stop the weekly email?</h1><p>Confirm to remove your subscription. Your Afri Index account stays available.</p><form method="post" action="/api/newsletter?action=unsubscribe&amp;token=${e(token)}"><button style="min-height:44px">Unsubscribe</button></form><p><a href="/studio/newsletter">Back to the newsletter</a></p></body></html>`,
      );
    }
    if (req.method !== "POST") return res.status(405).end();
    try {
      await rest(`newsletter_subscriptions?user_id=eq.${id}`, {
        method: "PATCH",
        admin: true,
        body: { consent: false },
      });
      return res.send(
        "Unsubscribed. You can subscribe again from your newsletter preferences.",
      );
    } catch {
      return res
        .status(503)
        .send("Could not update your preference. Please retry.");
    }
  }
  if (action !== "send" || req.method !== "POST") return res.status(404).end();
  if (
    !process.env.NEWSLETTER_JOB_SECRET ||
    req.headers.authorization !== "Bearer " + process.env.NEWSLETTER_JOB_SECRET
  )
    return res.status(401).end();
  if (
    !process.env.RESEND_API_KEY ||
    !process.env.NEWSLETTER_FROM ||
    !process.env.NEWSLETTER_SIGNING_SECRET ||
    !process.env.SUPABASE_SERVICE_ROLE_KEY
  )
    return res.status(503).json({ error: "Email delivery is not configured" });
  try {
    const week = nextWeek(new Date(Date.now() - 7 * 86400000)).week;
    const recipients = await rest("rpc/newsletter_batch", {
        method: "POST",
        admin: true,
        body: { issue: week },
      }),
      today = new Date().toISOString().slice(0, 10),
      sponsors = require("../lib/commerce.cjs").activeSponsors(today);
    let sent = 0;
    for (const recipient of recipients.slice(0, 500)) {
      const claimed = await rest("rpc/claim_newsletter_delivery", {
        method: "POST",
        admin: true,
        body: { issue: week, owner: recipient.user_id },
      });
      if (!claimed) continue;
      const url =
        "https://afrobeats-index.vercel.app/api/newsletter?action=unsubscribe&token=" +
        unsubscribeToken(
          recipient.user_id,
          process.env.NEWSLETTER_SIGNING_SECRET,
        );
      const r = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: "Bearer " + process.env.RESEND_API_KEY,
            "Content-Type": "application/json",
            "Idempotency-Key": `afri-${week}-${recipient.user_id}`,
          },
          body: JSON.stringify({
            from: process.env.NEWSLETTER_FROM,
            to: [recipient.email],
            subject: "Afri Index · Your weekly chart brief",
            html: renderIssue(
              data,
              sponsors,
              recipient.user_id,
              process.env.NEWSLETTER_SIGNING_SECRET,
            ),
            headers: { "List-Unsubscribe": `<${url}>` },
          }),
          signal: AbortSignal.timeout(10000),
        }),
        result = await r.json();
      if (!r.ok) throw Error("Email provider failed");
      await rest("rpc/record_newsletter_delivery", {
        method: "POST",
        admin: true,
        body: { issue: week, owner: recipient.user_id, provider: result.id },
      });
      sent++;
    }
    res.json({
      sent,
      batchLimit: 10,
      note: "Call again to process remaining unclaimed recipients. Pending deliveries require review before retry.",
    });
  } catch {
    res.status(503).json({
      error:
        "The newsletter job did not finish. Check delivery logs before retrying.",
    });
  }
};
