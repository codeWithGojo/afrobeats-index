function validateSignals(rows, artists, now = Date.now()) {
  if (!Array.isArray(rows) || rows.length > 10000)
    throw Error("Use an array of up to 10,000 observations");
  const known = new Set(artists.map((a) => a.slug));
  return rows.map((r, i) => {
    const fail = (message) => {
      throw Error(`Row ${i + 1}: ${message}`);
    };
    if (!known.has(r.artist_slug)) fail("unknown artist");
    if (!["tiktok", "shazam"].includes(r.platform)) fail("unknown platform");
    if (
      !(
        r.platform === "tiktok"
          ? ["video_creations", "views"]
          : ["shazams", "city_shazams"]
      ).includes(r.metric)
    )
      fail("metric does not match platform");
    if (!Number.isFinite(r.value) || r.value < 0)
      fail("value must be a nonnegative observed count");
    if (!/^https:\/\//.test(r.source_url || ""))
      fail("HTTPS source URL required");
    if (!r.territory || (r.metric === "city_shazams" && !r.city))
      fail("territory and city coverage required");
    if (
      ![r.period_start, r.period_end].every(
        (d) =>
          /^\d{4}-\d{2}-\d{2}$/.test(d) &&
          Number.isFinite(Date.parse(d)) &&
          new Date(d).toISOString().slice(0, 10) === d,
      ) ||
      r.period_end < r.period_start
    )
      fail("invalid comparison period");
    if (
      !Number.isFinite(Date.parse(r.observed_at)) ||
      Date.parse(r.observed_at) > now ||
      Date.parse(r.period_end) > Date.parse(r.observed_at)
    )
      fail("invalid observation date");
    return {
      artist_slug: r.artist_slug,
      platform: r.platform,
      metric: r.metric,
      value: r.value,
      territory: String(r.territory).slice(0, 100),
      city: r.city ? String(r.city).slice(0, 100) : null,
      period_start: r.period_start,
      period_end: r.period_end,
      observed_at: new Date(r.observed_at).toISOString(),
      source_url: r.source_url,
      reviewed: r.reviewed === true,
    };
  });
}
module.exports = { validateSignals };
