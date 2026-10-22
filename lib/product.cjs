const crypto = require("node:crypto");
const current = require("../data/current.json");
const events = require("../data/editorial-events.json");
const regional = require("../regional-boards.js");
function nextWeek(now = new Date()) {
  const d = new Date(now);
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() + ((8 - d.getUTCDay()) % 7 || 7));
  const thursday = new Date(d);
  thursday.setUTCDate(d.getUTCDate() + 3);
  const year = thursday.getUTCFullYear(),
    week = Math.ceil(
      ((thursday - new Date(Date.UTC(year, 0, 1))) / 86400000 + 1) / 7,
    );
  return {
    week: `${year}-W${String(week).padStart(2, "0")}`,
    closesAt: d.toISOString(),
  };
}
function scorePrediction(picks, artists) {
  const actual = [...artists]
    .sort((a, b) => a.rank - b.rank)
    .slice(0, 5)
    .map((a) => a.slug);
  return picks.reduce(
    (score, slug, i) =>
      score + (actual[i] === slug ? 3 : actual.includes(slug) ? 1 : 0),
    0,
  );
}
function boardArtists(board, artists = current.artists) {
  if (board === "current") return [...artists].sort((a, b) => a.rank - b.rank);
  if (board === "womens-current-25")
    return artists
      .filter((a) => a.gender === "female" || a.gender === "woman")
      .sort((a, b) => a.rank - b.rank)
      .slice(0, 25);
  if (board === "veterans")
    return artists
      .filter(
        (a) =>
          Number.isFinite(a.careerStarted) &&
          new Date(current.asOf).getUTCFullYear() - a.careerStarted >= 15,
      )
      .sort((a, b) => a.rank - b.rank);
  if (regional.definitions.some((b) => b.id === board))
    return regional.rank(artists, board);
  return null;
}
function playlist(board) {
  const artists = boardArtists(board);
  if (!artists) return null;
  const seen = new Set(),
    tracks = [];
  for (const a of artists) {
    const song = [...(a.songs || [])]
      .filter((s) => /^[A-Za-z0-9]{22}$/.test(s.spotifyId || ""))
      .sort(
        (a, b) =>
          (b.dailyStreams || 0) - (a.dailyStreams || 0) ||
          b.streams - a.streams,
      )
      .find((s) => !seen.has(s.spotifyId));
    if (song) {
      seen.add(song.spotifyId);
      tracks.push({
        id: song.spotifyId,
        uri: "spotify:track:" + song.spotifyId,
        title: song.title,
        artist: a.name,
        artistSlug: a.slug,
        url: "https://open.spotify.com/track/" + song.spotifyId,
        sourceUrl: song.sourceUrl,
        observedAt: song.lastVerifiedAt,
      });
    }
  }
  return {
    board,
    edition: current.asOf,
    method:
      "One sourced recording per artist, highest observed daily Spotify streams first within each artist; board artist order retained. Duplicate recordings skipped.",
    tracks,
  };
}
function timeline(slug) {
  const a = current.artists.find((a) => a.slug === slug);
  if (!a) return null;
  const rows = events
    .filter((x) => x.artist_slug === slug)
    .map((x) => ({
      title: x.title,
      date: x.event_date || String(x.details?.year || ""),
      precision: x.event_date ? "day" : "year",
      kind: x.kind,
      detail: [x.details?.work, x.details?.result, x.details?.venue]
        .filter(Boolean)
        .join(" · "),
      source: x.source_url,
    }));
  if (a.careerStarted && a.evidence?.biography?.url)
    rows.push({
      title: "Career activity begins",
      date: String(a.careerStarted),
      precision: "year",
      kind: "career",
      detail:
        "Year precision from the source biography; not an exact debut date.",
      source: a.evidence.biography.url,
    });
  for (const c of current.certifications?.[slug] || [])
    if (c.certificationDate)
      rows.push({
        title: `${c.title} · ${c.authority} ${c.tier}`,
        date: c.certificationDate,
        precision: c.certificationDate.length === 4 ? "year" : "day",
        kind: "certification",
        detail: c.market,
        source: c.sourceUrl,
      });
  return rows
    .filter((x) => /^\d{4}/.test(x.date))
    .sort(
      (a, b) => a.date.localeCompare(b.date) || a.title.localeCompare(b.title),
    );
}
function digest(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}
function signalPreview(
  artists,
  observations,
  weights = { tiktok: 5, shazam: 5 },
) {
  const rows = observations.filter(
    (o) =>
      o.reviewed === true &&
      Date.parse(o.observed_at) <= Date.now() &&
      Date.now() - Date.parse(o.observed_at) <= 30 * 86400000 &&
      ["tiktok", "shazam"].includes(o.platform) &&
      Number.isFinite(o.value) &&
      o.value >= 0 &&
      /^https:\/\//.test(o.source_url || ""),
  );
  const data = {};
  for (const platform of ["tiktok", "shazam"]) {
    const candidates = rows
      .filter((o) => o.platform === platform)
      .sort((a, b) => b.observed_at.localeCompare(a.observed_at));
    const latest = new Map();
    for (const row of candidates)
      if (!latest.has(row.artist_slug)) latest.set(row.artist_slug, row);
    const comparable =
      artists.every((a) => latest.has(a.slug)) &&
      new Set(
        [...latest.values()].map(
          (o) =>
            o.metric +
            "|" +
            o.period_start +
            "|" +
            o.period_end +
            "|" +
            (o.territory || "global") +
            "|" +
            (o.city || ""),
        ),
      ).size === 1;
    data[platform] = {
      coverage: artists.filter((a) => latest.has(a.slug)).length,
      comparable,
      max: Math.max(0, ...[...latest.values()].map((o) => o.value)),
      latest,
    };
  }
  const active = ["tiktok", "shazam"].filter((p) => data[p].comparable),
    total = active.reduce((s, p) => s + Number(weights[p] || 0), 0);
  if (total > 30 || total < 0)
    throw Error("Signal preview weights must total 0–30");
  const ranked = artists
    .map((a) => ({
      ...a,
      previewScore:
        a.score * (1 - total / 100) +
        active.reduce(
          (s, p) =>
            s +
            (data[p].max ? data[p].latest.get(a.slug).value / data[p].max : 0) *
              weights[p],
          0,
        ),
    }))
    .sort((a, b) => b.previewScore - a.previewScore || a.rank - b.rank);
  return {
    ranked,
    coverage: Object.fromEntries(
      Object.entries(data).map(([p, v]) => [
        p,
        { count: v.coverage, total: artists.length, comparable: v.comparable },
      ]),
    ),
    active,
  };
}
module.exports = {
  nextWeek,
  scorePrediction,
  boardArtists,
  playlist,
  timeline,
  digest,
  signalPreview,
};
