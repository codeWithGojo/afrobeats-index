// Checkout providers for Afri Index Pro. Orders are always stored in minor units (kobo/cents);
// each provider converts at its own boundary. Access is granted only after server-side verification.
const RETURN_URL = "https://afrobeats-index.vercel.app/studio/api";
const PRODUCT = { title: "Afri Index Pro", description: "30-day Pro access" };

function startFailed() {
  return Object.assign(
    Error("The payment provider could not start checkout. No access has been charged by this request."),
    { status: 502 },
  );
}
function hostedUrl(raw, allowed) {
  const url = new URL(raw);
  if (url.protocol !== "https:" || !allowed(url.hostname)) throw Error("Unexpected checkout URL");
  return url.href;
}

const paystack = {
  id: "paystack",
  configured: (env) => !!env.PAYSTACK_SECRET_KEY,
  async start({ amount, currency, reference, email }, env, fetchImpl = fetch) {
    const r = await fetchImpl("https://api.paystack.co/transaction/initialize", {
        method: "POST",
        headers: { Authorization: "Bearer " + env.PAYSTACK_SECRET_KEY, "Content-Type": "application/json" },
        body: JSON.stringify({ email, amount, currency, reference, callback_url: RETURN_URL }),
        signal: AbortSignal.timeout(10000),
      }),
      d = await r.json();
    if (!r.ok || !d.status || !d.data?.authorization_url) throw startFailed();
    return hostedUrl(d.data.authorization_url, (host) => host === "checkout.paystack.com");
  },
};

const flutterwave = {
  id: "flutterwave",
  configured: (env) => !!(env.FLW_SECRET_KEY && env.FLW_SECRET_HASH),
  async start({ amount, currency, reference, email }, env, fetchImpl = fetch) {
    const r = await fetchImpl("https://api.flutterwave.com/v3/payments", {
        method: "POST",
        headers: { Authorization: "Bearer " + env.FLW_SECRET_KEY, "Content-Type": "application/json" },
        body: JSON.stringify({
          tx_ref: reference,
          amount: amount / 100,
          currency,
          redirect_url: RETURN_URL,
          customer: { email },
          customizations: PRODUCT,
        }),
        signal: AbortSignal.timeout(10000),
      }),
      d = await r.json();
    if (!r.ok || d.status !== "success" || !d.data?.link) throw startFailed();
    return hostedUrl(d.data.link, (host) => host === "flutterwave.com" || host.endsWith(".flutterwave.com"));
  },
  // Re-fetches the transaction from Flutterwave; the webhook body is never trusted on its own.
  async verify(transactionId, env, fetchImpl = fetch) {
    const r = await fetchImpl(
        "https://api.flutterwave.com/v3/transactions/" + encodeURIComponent(transactionId) + "/verify",
        { headers: { Authorization: "Bearer " + env.FLW_SECRET_KEY }, signal: AbortSignal.timeout(10000) },
      ),
      body = await r.json();
    if (!r.ok || body.status !== "success" || !body.data) return null;
    const d = body.data;
    if (d.status !== "successful" || typeof d.tx_ref !== "string" || typeof d.currency !== "string" || !Number.isFinite(d.amount)) return null;
    return { reference: d.tx_ref, amount: Math.round(d.amount * 100), currency: d.currency };
  },
};

const providers = { paystack, flutterwave };

// AFRI_PAYMENT_PROVIDER picks explicitly; otherwise Flutterwave when its keys exist, then Paystack.
function activeProvider(env = process.env) {
  const chosen = providers[String(env.AFRI_PAYMENT_PROVIDER || "").toLowerCase()];
  if (chosen) return chosen.configured(env) ? chosen : null;
  return [flutterwave, paystack].find((p) => p.configured(env)) || null;
}

function billingConfigured(env = process.env) {
  const amount = Number(env.AFRI_PRO_AMOUNT);
  return !!(activeProvider(env) && env.SUPABASE_SERVICE_ROLE_KEY && Number.isSafeInteger(amount) && amount > 0);
}

module.exports = { providers, activeProvider, billingConfigured, RETURN_URL };
