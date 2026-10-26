const { data, config, db } = require("../lib/shared.cjs");
const {
  nextWeek,
  scorePrediction,
  playlist,
  timeline,
  signalPreview,
} = require("../lib/product.cjs");
const productConfig = require("../data/product-config.json");
const services = {
  watch: require("../lib/product-watch.cjs"),
  pro: require("../lib/product-pro.cjs"),
  newsletter: require("../lib/product-newsletter.cjs"),
  "paystack-webhook": require("../lib/product-paystack-webhook.cjs"),
};
module.exports = async (req, res) => {
  const service = String(req.query.service || "");
  if (service)
    return Object.hasOwn(services, service)
      ? services[service](req, res)
      : res.status(404).json({ error: "Unknown service" });

  if (req.method && req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).end();
  }
  const action = String(req.query.action || "overview");
  res.setHeader("Cache-Control", "public,max-age=0,s-maxage=60");
  try {
    if (action === "timeline") {
      const rows = timeline(String(req.query.artist || ""));
      return rows
        ? res.json({
            events: rows,
            scope:
              "Dated events and certifications in the source register; not an exhaustive biography.",
          })
        : res.status(404).json({ error: "Artist not found" });
    }
    if (action === "playlist") {
      const result = playlist(String(req.query.board || "current"));
      if (!result) return res.status(404).json({ error: "Board not found" });
      if (req.query.format === "m3u") {
        res.setHeader("Content-Type", "audio/x-mpegurl; charset=utf-8");
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="afri-${result.board}.m3u"`,
        );
        return res.send(
          "#EXTM3U\n" +
            result.tracks
              .map((t) => `#EXTINF:-1,${t.artist} - ${t.title}\n${t.url}`)
              .join("\n"),
        );
      }
      return res.json(result);
    }
    if (action === "analytics") {
      const slug = String(req.query.artist || data.artists[0].slug),
        artist = data.artists.find((a) => a.slug === slug);
      if (!artist) return res.status(404).json({ error: "Artist not found" });
      const editions = await db(
        "chart_editions?select=week,data,published_at&order=week.asc&limit=104",
      );
      const history = editions
        .map((d) => {
          const a = d.data.artists?.find((a) => a.slug === slug);
          return a
            ? {
                week: d.week,
                publishedAt: d.published_at,
                rank: a.rank,
                score: a.score,
                streams: a.totalSpotifyStreams,
                dailyStreams: a.dailySpotifyStreams,
              }
            : null;
        })
        .filter(Boolean);
      return res.json({
        artist: {
          slug: artist.slug,
          name: artist.name,
          rank: artist.rank,
          score: artist.score,
          streams: artist.totalSpotifyStreams,
          dailyStreams: artist.dailySpotifyStreams,
          asOf: data.asOf,
        },
        history,
        coverage: {
          editions: history.length,
          from: history[0]?.publishedAt,
          to: history.at(-1)?.publishedAt,
        },
        signals: await db(
          `signal_observations?artist_slug=eq.${slug}&reviewed=eq.true&order=observed_at.desc&limit=30`,
        ),
        note: "Published chart snapshots, not a complete daily streaming series. Monthly listeners and streams are distinct measures.",
      });
    }
    if (action === "signals") {
      const observations = await db(
        "signal_observations?reviewed=eq.true&order=observed_at.desc&limit=1000",
      );
      const preview = signalPreview(data.artists, observations);
      return res.json({
        ...preview,
        ranked: preview.ranked.map(
          ({ slug, name, rank, score, previewScore }) => ({
            slug,
            name,
            rank,
            score,
            previewScore,
          }),
        ),
        observations,
        note: "Experimental preview only. A signal activates only with all 50 artists covered by the same metric, period and territory. Official Current scores remain published as before.",
      });
    }
    if (action === "predictions")
      return res.json({
        ...nextWeek(),
        artists: data.artists.map(({ slug, name, rank }) => ({
          slug,
          name,
          rank,
        })),
        scoring:
          "3 points per exact position, 1 point if in the top five at another position. Maximum 15. Locked at Monday 00:00 UTC; scored against the published edition for that ISO week.",
      });
    if (action === "outcomes") {
      const week = String(req.query.week || "");
      if (!/^\d{4}-W\d{2}$/.test(week))
        return res.status(400).json({ error: "Invalid week" });
      const rows = await db(
        `chart_editions?week=eq.${week}&select=week,data,published_at`,
      );
      return res.json({
        week,
        published: !!rows.length,
        artists:
          rows[0]?.data.artists
            .slice()
            .sort((a, b) => a.rank - b.rank)
            .slice(0, 5)
            .map((a) => ({ slug: a.slug, name: a.name, rank: a.rank })) || [],
      });
    }
    if (action === "summer") {
      const year = Number(req.query.year || new Date().getUTCFullYear());
      if (!Number.isInteger(year) || year < 2026 || year > 2100)
        return res
          .status(400)
          .json({ error: "Choose a year from 2026 to 2100" });
      const rows = await db(
        `summer_observations?season=eq.${year}&order=observed_at.asc&limit=5000`,
      );
      const totals = new Map();
      for (const row of rows) {
        const p = totals.get(row.track_id) || {
          trackId: row.track_id,
          title: row.title,
          artist: row.artist_slug,
          streams: 0,
          days: new Set(),
          source: row.source_url,
        };
        const day = row.observed_at.slice(0, 10);
        if (
          day >= `${year}-06-01` &&
          day <= `${year}-08-31` &&
          !p.days.has(day)
        ) {
          p.days.add(day);
          p.streams += Number(row.daily_streams);
        }
        totals.set(row.track_id, p);
      }
      return res.json({
        year,
        window: `${year}-06-01 to ${year}-08-31 UTC`,
        ranking: [...totals.values()]
          .sort((a, b) => b.streams - a.streams)
          .map((p, i) => ({ ...p, rank: i + 1, days: p.days.size })),
        nominees: playlist("current").tracks,
        coverage: rows.length,
        note: "Sum of observed daily Spotify streams inside the fixed June–August window. Missing days are not extrapolated. Ballot votes are separate from the measured stream tracker.",
      });
    }
    return res.json({
      round: nextWeek(),
      sponsors: require("../lib/commerce.cjs").activeSponsors(),
      affiliates: productConfig.affiliates,
      billing: {
        configured: !!(
          process.env.PAYSTACK_SECRET_KEY &&
          process.env.AFRI_PRO_AMOUNT &&
          process.env.SUPABASE_SERVICE_ROLE_KEY
        ),
        currency: process.env.AFRI_BILLING_CURRENCY || "NGN",
        amount: Number(process.env.AFRI_PRO_AMOUNT) || null,
      },
      newsletter: {
        deliveryConfigured: !!(
          process.env.RESEND_API_KEY &&
          process.env.NEWSLETTER_FROM &&
          process.env.NEWSLETTER_SIGNING_SECRET &&
          process.env.SUPABASE_SERVICE_ROLE_KEY
        ),
      },
    });
  } catch {
    return res
      .status(503)
      .json({ error: "This feature could not load. Please retry." });
  }
};
