// Run after publishing a reviewed chart. Existing editions are immutable.
const { data } = require("../lib/shared.cjs");
const { rest } = require("../lib/product-server.cjs");
const { nextWeek } = require("../lib/product.cjs");
(async () => {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY)
    throw Error("Set SUPABASE_SERVICE_ROLE_KEY");
  const date = new Date(data.asOf),
    week = nextWeek(new Date(date.getTime() - 7 * 86400000)).week;
  const fields = [
    "slug",
    "name",
    "rank",
    "score",
    "country",
    "totalSpotifyStreams",
    "dailySpotifyStreams",
    "monthlyListeners",
    "statsLastUpdatedAt",
  ];
  const snapshot = {
    asOf: data.asOf,
    meta: data.meta,
    artists: data.artists.map((a) =>
      Object.fromEntries(fields.map((k) => [k, a[k]])),
    ),
  };
  await rest("chart_editions?on_conflict=week", {
    method: "POST",
    admin: true,
    body: { week, data: snapshot, published_at: data.asOf },
    headers: { Prefer: "resolution=ignore-duplicates" },
  });
  const tracks = new Map();
  for (const artist of data.artists)
    for (const song of artist.songs || []) {
      const day = song.sourceDate;
      if (
        !/^\d{4}-\d{2}-\d{2}$/.test(day || "") ||
        !Number.isSafeInteger(song.dailyStreams) ||
        song.dailyStreams < 0 ||
        !song.spotifyId ||
        !song.sourceUrl
      )
        continue;
      const year = Number(day.slice(0, 4));
      if (day < `${year}-06-01` || day > `${year}-08-31`) continue;
      const key = song.spotifyId + "|" + day;
      if (!tracks.has(key))
        tracks.set(key, {
          season: year,
          track_id: song.spotifyId,
          title: song.title,
          artist_slug: artist.slug,
          daily_streams: song.dailyStreams,
          observed_at: day,
          source_url: song.sourceUrl,
        });
    }
  if (tracks.size)
    await rest("summer_observations?on_conflict=track_id,observed_at", {
      method: "POST",
      admin: true,
      body: [...tracks.values()],
      headers: { Prefer: "resolution=ignore-duplicates" },
    });
  console.log(
    `Published ${week}; ${tracks.size} in-window summer observations. No missing days were inferred.`,
  );
})().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
