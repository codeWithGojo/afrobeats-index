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
function renderIssue(data, sponsors, userId, secret, watchUpdates=[]) {
  const link =
    origin +
    "/api/newsletter?action=unsubscribe&token=" +
    unsubscribeToken(userId, secret);
  const { buildBrief, emailDocument } = require('./weekly-brief.cjs');
  const brief=buildBrief(data);brief.watchUpdates=watchUpdates;
  return emailDocument(brief, sponsors, `You asked for this brief using your verified Afri Index account. <a href="${e(link)}">Manage unsubscribe</a>.`);
}
module.exports = { unsubscribeToken, unsubscribeOwner, renderIssue };
