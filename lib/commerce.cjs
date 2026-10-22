const config = require("../data/product-config.json");
function safeLink(raw) {
  try {
    const u = new URL(raw);
    return u.protocol === "https:" && !u.username && !u.password;
  } catch {
    return false;
  }
}
function affiliateLinks(artist, event) {
  return config.affiliates.filter(
    (l) =>
      l.artist === artist &&
      ["ticket", "merch"].includes(l.kind) &&
      l.label &&
      l.partner &&
      l.checkedAt &&
      safeLink(l.url) &&
      (!l.event || l.event === event),
  );
}
function activeSponsors(today = new Date().toISOString().slice(0, 10)) {
  return config.sponsors.filter(
    (s) =>
      s.start <= today &&
      s.end >= today &&
      safeLink(s.url) &&
      s.name &&
      s.copy &&
      s.label,
  );
}
module.exports = { safeLink, affiliateLinks, activeSponsors };
