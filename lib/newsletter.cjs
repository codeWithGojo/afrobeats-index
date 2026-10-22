const crypto = require("node:crypto");
const { escape: e, origin } = require("./shared.cjs");
function unsubscribeToken(userId, secret) {
  return (
    userId +
    "." +
    crypto
      .createHmac("sha256", secret)
      .update("unsubscribe:" + userId)
      .digest("hex")
  );
}
function unsubscribeOwner(token, secret) {
  if (!/^[a-f0-9-]{36}\.[a-f0-9]{64}$/.test(token || "") || !secret)
    return null;
  const [id] = token.split("."),
    expected = unsubscribeToken(id, secret);
  return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expected))
    ? id
    : null;
}
function renderIssue(data, sponsors, userId, secret) {
  const link =
    origin +
    "/api/newsletter?action=unsubscribe&token=" +
    unsubscribeToken(userId, secret);
  return `<h1>Afri Index · The weekly brief</h1><p>Edition checked ${e(data.asOf.slice(0, 10))}. African music, in context.</p>${sponsors.map((s) => `<aside><small>Paid sponsor</small><h2>${e(s.name)}</h2><p>${e(s.copy)}</p><a href="${e(s.url)}">${e(s.label)}</a></aside>`).join("")}<h2>This week’s top five</h2><ol>${data.artists
    .slice(0, 5)
    .map(
      (a) =>
        `<li><a href="${origin}/current/${a.slug}">${e(a.name)}</a> · ${a.score.toFixed(1)}</li>`,
    )
    .join(
      "",
    )}</ol><p><a href="${origin}/studio/playlists">Hear the boards</a> · <a href="${origin}">Read the full Current 50</a></p><p>You asked for this brief using your verified Afri Index account. <a href="${link}">Manage unsubscribe</a>.</p>`;
}
module.exports = { unsubscribeToken, unsubscribeOwner, renderIssue };
