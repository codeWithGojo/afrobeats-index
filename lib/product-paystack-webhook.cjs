const { rest, signatureValid } = require("../lib/product-server.cjs");
module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).end();
  }
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret || !process.env.SUPABASE_SERVICE_ROLE_KEY)
    return res.status(503).end();
  try {
    const chunks = [];
    let size = 0;
    for await (const chunk of req) {
      size += chunk.length;
      if (size > 262144) return res.status(413).end();
      chunks.push(chunk);
    }
    const raw = Buffer.concat(chunks);
    if (
      !signatureValid(
        raw,
        String(req.headers["x-paystack-signature"] || ""),
        secret,
      )
    )
      return res.status(401).end();
    const event = JSON.parse(raw);
    if (event.event !== "charge.success") return res.status(200).end();
    const reference = event.data?.reference;
    if (
      typeof reference !== "string" ||
      !/^afri_[a-f0-9-]{36}$/.test(reference)
    )
      return res.status(200).end();
    const r = await fetch(
        "https://api.paystack.co/transaction/verify/" +
          encodeURIComponent(reference),
        {
          headers: { Authorization: "Bearer " + secret },
          signal: AbortSignal.timeout(10000),
        },
      ),
      verified = await r.json(),
      d = verified.data;
    if (!r.ok || !verified.status) return res.status(503).end();
    if (
      d.status !== "success" ||
      d.reference !== reference ||
      !Number.isSafeInteger(d.amount) ||
      typeof d.currency !== "string"
    )
      return res.status(400).end();
    const applied = await rest("rpc/fulfill_pro_payment", {
      method: "POST",
      admin: true,
      body: {
        ref: reference,
        paid_amount: d.amount,
        paid_currency: d.currency,
      },
    });
    if (!applied) return res.status(400).end();
    res.status(200).end();
  } catch {
    res.status(503).end();
  }
};
