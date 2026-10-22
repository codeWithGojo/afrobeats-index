const { config } = require("./shared.cjs");
const crypto = require("node:crypto");
async function rest(
  path,
  {
    method = "GET",
    body,
    token,
    admin = false,
    schema = "public",
    headers = {},
  } = {},
) {
  const key = admin ? process.env.SUPABASE_SERVICE_ROLE_KEY : config.key;
  if (!key)
    throw Object.assign(Error("Server integration is not configured"), {
      status: 503,
    });
  const response = await fetch(config.url + "/rest/v1/" + path, {
    method,
    headers: {
      apikey: key,
      Authorization: "Bearer " + (token || key),
      "Content-Type": "application/json",
      "Accept-Profile": schema,
      "Content-Profile": schema,
      ...headers,
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    signal: AbortSignal.timeout(8000),
  });
  const text = await response.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    throw Error("Invalid database response");
  }
  if (!response.ok)
    throw Object.assign(Error("Database request failed"), {
      status: response.status >= 500 ? 503 : 400,
    });
  return data;
}
async function user(req) {
  const auth = String(req.headers?.authorization || "");
  if (!auth.startsWith("Bearer "))
    throw Object.assign(Error("Sign in to My board"), { status: 401 });
  const token = auth.slice(7),
    r = await fetch(config.url + "/auth/v1/user", {
      headers: { apikey: config.key, Authorization: auth },
      signal: AbortSignal.timeout(7000),
    });
  if (!r.ok)
    throw Object.assign(Error("Your sign-in expired. Sign in again."), {
      status: 401,
    });
  const data = await r.json();
  if (!data.id || !data.email_confirmed_at)
    throw Object.assign(Error("Verify your email first"), { status: 403 });
  return { data, token };
}
async function hasPro(userId, token) {
  const rows = await rest(
    `pro_subscriptions?user_id=eq.${encodeURIComponent(userId)}&select=expires_at`,
    { token },
  );
  return rows.some((s) => Date.parse(s.expires_at) > Date.now());
}
function signatureValid(raw, signature, secret) {
  if (!secret || !signature || !/^[a-f0-9]{128}$/.test(signature)) return false;
  const expected = crypto.createHmac("sha512", secret).update(raw).digest();
  return crypto.timingSafeEqual(expected, Buffer.from(signature, "hex"));
}
function publicOrigin(req) {
  return (
    !req.headers?.origin ||
    req.headers.origin === "https://afrobeats-index.vercel.app"
  );
}
module.exports = { rest, user, hasPro, signatureValid, publicOrigin };
