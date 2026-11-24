// Flutterwave webhook: authenticate with the verif-hash secret, then re-verify the transaction
// with Flutterwave before granting Pro. Amount and currency must match the stored order exactly.
const crypto = require("node:crypto");
const { rest } = require("../lib/product-server.cjs");
const { providers } = require("../lib/payment-providers.cjs");

function hashMatches(header, secret) {
  if (!secret || typeof header !== "string" || !header) return false;
  const a = crypto.createHash("sha256").update(header).digest(),
    b = crypto.createHash("sha256").update(secret).digest();
  return crypto.timingSafeEqual(a, b);
}

function handler({ fetchImpl = fetch, callRpc = (path, init) => rest(path, init), env = process.env } = {}) {
  return async (req, res) => {
    if (req.method !== "POST") {
      res.setHeader("Allow", "POST");
      return res.status(405).end();
    }
    if (!env.FLW_SECRET_KEY || !env.FLW_SECRET_HASH || !env.SUPABASE_SERVICE_ROLE_KEY)
      return res.status(503).end();
    if (!hashMatches(String(req.headers["verif-hash"] || ""), env.FLW_SECRET_HASH))
      return res.status(401).end();
    try {
      const chunks = [];
      let size = 0;
      for await (const chunk of req) {
        size += chunk.length;
        if (size > 262144) return res.status(413).end();
        chunks.push(chunk);
      }
      const event = JSON.parse(Buffer.concat(chunks));
      const data = event.data || {};
      // Acknowledge events we do not act on so Flutterwave stops retrying them.
      if (event.event !== "charge.completed") return res.status(200).end();
      if (typeof data.tx_ref !== "string" || !/^afri_[a-f0-9-]{36}$/.test(data.tx_ref) || !data.id)
        return res.status(200).end();
      const verified = await providers.flutterwave.verify(data.id, env, fetchImpl);
      if (!verified) return res.status(200).end();
      if (verified.reference !== data.tx_ref) return res.status(400).end();
      const applied = await callRpc("rpc/fulfill_pro_payment", {
        method: "POST",
        admin: true,
        body: { ref: verified.reference, paid_amount: verified.amount, paid_currency: verified.currency },
      });
      return res.status(applied ? 200 : 400).end();
    } catch {
      return res.status(503).end();
    }
  };
}

module.exports = handler();
module.exports.handler = handler;
module.exports.hashMatches = hashMatches;
