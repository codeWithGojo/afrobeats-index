const crypto = require("node:crypto");
const { data } = require("../lib/shared.cjs");
const { digest, boardArtists } = require("../lib/product.cjs");
const {
  rest,
  user,
  hasPro,
  publicOrigin,
} = require("../lib/product-server.cjs");
module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  const action = String(req.query.action || "status");
  try {
    if (!["GET", "POST"].includes(req.method || "GET")) {
      res.setHeader("Allow", "GET, POST");
      return res.status(405).end();
    }
    if (["checkout", "create-key"].includes(action) && req.method !== "POST")
      return res.status(405).json({ error: "Use POST" });
    if (req.method === "POST" && !publicOrigin(req))
      return res.status(403).json({ error: "Origin not allowed" });
    let account,
      token,
      paid = false;
    const bearer = String(req.headers?.authorization || "").replace(
      /^Bearer /,
      "",
    );
    if (bearer.startsWith("afri_") && ["history", "board"].includes(action)) {
      const result = await rest("rpc/consume_api_quota", {
        method: "POST",
        admin: true,
        body: { digest: digest(bearer) },
      });
      if (!result.allowed)
        return res
          .status(result.reason === "quota" ? 429 : 401)
          .json({
            error:
              result.reason === "quota"
                ? "Daily account quota reached"
                : "Invalid, expired or revoked API key",
          });
      res.setHeader("X-RateLimit-Limit", "10000");
      res.setHeader("X-RateLimit-Remaining", String(result.remaining));
      paid = true;
    } else {
      const auth = await user(req);
      account = auth.data;
      token = auth.token;
      paid = await hasPro(account.id, token);
    }
    if (action === "status") return res.json({ pro: paid });
    if (action === "checkout") {
      const amount = Number(process.env.AFRI_PRO_AMOUNT),
        currency = process.env.AFRI_BILLING_CURRENCY || "NGN",
        secret = process.env.PAYSTACK_SECRET_KEY;
      if (
        !secret ||
        !process.env.SUPABASE_SERVICE_ROLE_KEY ||
        !Number.isSafeInteger(amount) ||
        amount <= 0
      )
        return res
          .status(503)
          .json({
            error: "Checkout is not configured. No payment was started.",
          });
      const reference = "afri_" + crypto.randomUUID();
      await rest("rpc/create_pro_order", {
        method: "POST",
        admin: true,
        body: {
          ref: reference,
          owner: account.id,
          price: amount,
          ccy: currency,
        },
      });
      const r = await fetch("https://api.paystack.co/transaction/initialize", {
          method: "POST",
          headers: {
            Authorization: "Bearer " + secret,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: account.email,
            amount,
            currency,
            reference,
            callback_url: "https://afrobeats-index.vercel.app/studio/api",
          }),
          signal: AbortSignal.timeout(10000),
        }),
        d = await r.json();
      if (!r.ok || !d.status || !d.data?.authorization_url)
        throw Object.assign(
          Error(
            "The payment provider could not start checkout. No access has been charged by this request.",
          ),
          { status: 502 },
        );
      const url = new URL(d.data.authorization_url);
      if (url.protocol !== "https:" || url.hostname !== "checkout.paystack.com")
        throw Error("Unexpected checkout URL");
      return res.json({ url: url.href, reference });
    }
    if (!paid)
      return res
        .status(403)
        .json({
          error:
            "An active Pro pass is required. Free CSV remains available at /api/rankings?format=csv.",
        });
    if (action === "create-key") {
      let body = req.body;
      if (typeof body === "string") body = JSON.parse(body);
      const label = String(body?.label || "").trim();
      if (!label || label.length > 80)
        return res
          .status(400)
          .json({ error: "Give the key a label, up to 80 characters." });
      const key = "afri_" + crypto.randomBytes(32).toString("base64url");
      await rest("api_keys", {
        method: "POST",
        token,
        body: {
          user_id: account.id,
          label,
          key_hash: digest(key),
          prefix: key.slice(0, 13),
        },
      });
      return res.json({ key });
    }
    if (action === "board") {
      const board = String(req.query.board || "current"),
        artists = boardArtists(board);
      return artists
        ? res.json({ board, asOf: data.asOf, artists })
        : res.status(404).json({ error: "Board not found" });
    }
    if (action === "history") {
      const slug = String(req.query.artist || "");
      if (!data.artists.some((a) => a.slug === slug))
        return res.status(404).json({ error: "Artist not found" });
      const editions = await rest(
          "chart_editions?select=week,data,published_at&order=week.asc&limit=104",
        ),
        history = editions.flatMap((d) => {
          const a = d.data.artists?.find((a) => a.slug === slug);
          return a
            ? [
                {
                  week: d.week,
                  rank: a.rank,
                  score: a.score,
                  spotifyStreams: a.totalSpotifyStreams,
                  dailySpotifyStreams: a.dailySpotifyStreams,
                  publishedAt: d.published_at,
                },
              ]
            : [];
        });
      if (req.query.format === "csv") {
        const cell = (v) => '"' + String(v ?? "").replaceAll('"', '""') + '"';
        res.setHeader("Content-Type", "text/csv; charset=utf-8");
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="afri-${slug}-history.csv"`,
        );
        return res.send(
          "week,rank,score,spotify_streams,daily_spotify_streams,published_at\n" +
            history.map((p) => Object.values(p).map(cell).join(",")).join("\n"),
        );
      }
      return res.json({ artist: slug, history });
    }
    return res.status(404).json({ error: "Unknown API action" });
  } catch (error) {
    return res
      .status(error.status || 503)
      .json({
        error: error.status
          ? error.message
          : "This request could not be completed. Please retry.",
      });
  }
};
