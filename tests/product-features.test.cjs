const { test } = require("node:test"),
  assert = require("node:assert/strict"),
  crypto = require("node:crypto");
const {
  nextWeek,
  scorePrediction,
  playlist,
  timeline,
  signalPreview,
  digest,
} = require("../lib/product.cjs");
const { validateSignals } = require("../lib/signal-validation.cjs");
const { signatureValid } = require("../lib/product-server.cjs");
const {
  unsubscribeToken,
  unsubscribeOwner,
  renderIssue,
} = require("../lib/newsletter.cjs");
const data = require("../data/current.json");
test("round boundaries follow Monday UTC including ISO year rollover", () => {
  assert.deepEqual(nextWeek(new Date("2026-10-22T12:00:00Z")), {
    week: "2026-W44",
    closesAt: "2026-10-26T00:00:00.000Z",
  });
  assert.equal(nextWeek(new Date("2026-12-27T23:59:59Z")).week, "2026-W53");
  assert.equal(nextWeek(new Date("2026-12-28T00:00:00Z")).week, "2027-W01");
});
test("top-five scoring distinguishes position from membership", () => {
  const actual = ["a", "b", "c", "d", "e"].map((slug, i) => ({
    slug,
    rank: i + 1,
  }));
  assert.equal(scorePrediction(["a", "b", "c", "d", "e"], actual), 15);
  assert.equal(scorePrediction(["b", "a", "z", "d", "e"], actual), 8);
});
test("each board generates deterministic source-backed unique recordings without changing ranks", () => {
  const before = JSON.stringify(
    data.artists.map((a) => [a.slug, a.rank, a.score]),
  );
  for (const board of [
    "current",
    "naija",
    "ghana",
    "south-africa",
    "east-africa",
    "womens-current-25",
    "veterans",
  ]) {
    const p = playlist(board);
    assert.ok(p.tracks.length > 0);
    assert.equal(new Set(p.tracks.map((t) => t.id)).size, p.tracks.length);
    for (const t of p.tracks) {
      assert.match(t.uri, /^spotify:track:[A-Za-z0-9]{22}$/);
      assert.ok(t.sourceUrl.startsWith("https://"));
    }
  }
  assert.equal(playlist("invalid"), null);
  assert.equal(
    JSON.stringify(data.artists.map((a) => [a.slug, a.rank, a.score])),
    before,
  );
});
test("career timeline is chronological, sourced and supports missing records", () => {
  const t = timeline("tyla");
  assert.ok(t.length > 0);
  assert.deepEqual(
    t.map((t) => t.date),
    t.map((t) => t.date).sort(),
  );
  assert.ok(t.every((t) => t.source.startsWith("https://")));
  assert.equal(timeline("invalid"), null);
});
test("missing signal coverage never becomes zero or changes official order", () => {
  const preview = signalPreview(data.artists, []);
  assert.deepEqual(preview.active, []);
  assert.deepEqual(
    preview.ranked.map((a) => a.slug),
    data.artists.map((a) => a.slug),
  );
  assert.ok(preview.ranked.every((a) => a.previewScore === a.score));
});
test("signals activate only for a common metric, period, territory and city", () => {
  const artists = [
      { slug: "a", rank: 1, score: 90 },
      { slug: "b", rank: 2, score: 89 },
    ],
    now = new Date().toISOString();
  const rows = artists.map((a) => ({
    artist_slug: a.slug,
    platform: "shazam",
    metric: "city_shazams",
    city: "Lagos",
    territory: "NG",
    value: 100,
    period_start: now.slice(0, 10),
    period_end: now.slice(0, 10),
    observed_at: now,
    source_url: "https://example.org/chart",
    reviewed: true,
  }));
  assert.deepEqual(signalPreview(artists, rows).active, ["shazam"]);
  rows[1].city = "Accra";
  assert.deepEqual(signalPreview(artists, rows).active, []);
});
test("signal importer rejects invented counts, invalid periods and identity mismatches", () => {
  const row = {
    artist_slug: "wizkid",
    platform: "tiktok",
    metric: "video_creations",
    value: 40,
    territory: "global",
    period_start: "2026-10-01",
    period_end: "2026-10-07",
    observed_at: "2026-10-08",
    source_url: "https://example.org/chart",
  };
  assert.equal(validateSignals([row], data.artists).length, 1);
  for (const bad of [
    { value: -1 },
    { artist_slug: "wrong" },
    { metric: "shazams" },
    { period_start: "2026-02-30" },
    { observed_at: "2099-01-01" },
  ])
    assert.throws(() => validateSignals([{ ...row, ...bad }], data.artists));
});
test("payment signatures require exact raw bytes and a secret", () => {
  const body = Buffer.from('{"event":"charge.success"}'),
    secret = "test-only-key",
    sig = crypto.createHmac("sha512", secret).update(body).digest("hex");
  assert.equal(signatureValid(body, sig, secret), true);
  assert.equal(signatureValid(Buffer.from("changed"), sig, secret), false);
  assert.equal(signatureValid(body, sig, ""), false);
  assert.equal(signatureValid(body, "bad", secret), false);
});
test("unsubscribe tokens are bound to one user and issue HTML escapes sponsor content", () => {
  const id = "10000000-0000-4000-8000-000000000001",
    token = unsubscribeToken(id, "test-key");
  assert.equal(unsubscribeOwner(token, "test-key"), id);
  assert.equal(unsubscribeOwner(token, "wrong-key"), null);
  assert.equal(
    unsubscribeOwner(token.replace("10000000", "20000000"), "test-key"),
    null,
  );
  const html = renderIssue(
    data,
    [
      {
        name: "<script>",
        copy: "A&B",
        url: "https://example.org",
        label: "Read",
      },
    ],
    id,
    "test-key",
  );
  assert.ok(!html.includes("<script>"));
  assert.ok(html.includes("Paid sponsor"));
  assert.ok(html.includes("Manage unsubscribe"));
  assert.match(digest("secret"), /^[a-f0-9]{64}$/);
});
