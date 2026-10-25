export async function renderFeature({
  view,
  root,
  index,
  e,
  api,
  db,
  requireUser,
  status,
  bind,
}) {
  const request = async (action, params = {}) => {
    const r = await fetch(
      "/api/product?" + new URLSearchParams({ action, ...params }),
    );
    const d = await r.json();
    if (!r.ok) throw Error(d.error || "Feature unavailable");
    return d;
  };
  const titles = {
    predictions: "Call next week’s top five.",
    analytics: "A closer read of the chart.",
    playlists: "The boards, on repeat.",
    summer: "Song of the Summer.",
    signals: "Signals beyond the stream.",
    newsletter: "The week, in your inbox.",
    api: "Build with the index.",
  };
  root.innerHTML = `<p class="kicker">AFR / INDEX · ${e(view)}</p><h1>${e(titles[view])}</h1><nav class="feature-nav" aria-label="Index tools">${Object.entries(
    titles,
  )
    .map(
      ([id, title]) =>
        `<a href="/studio/${id}" ${id === view ? 'aria-current="page"' : ""}>${e(id === "api" ? "API" : id[0].toUpperCase() + id.slice(1))}</a>`,
    )
    .join("")}</nav>`;
  const artistOptions = index.artists
    .map((a) => `<option value="${e(a.slug)}">${e(a.name)}</option>`)
    .join("");
  const loader =
    '<div class="panel" data-motion-loader>Loading sourced records…</div>';
  const money = (amount, currency) =>
    new Intl.NumberFormat("en-NG", { style: "currency", currency }).format(
      amount / 100,
    );
  async function entitlement() {
    try {
      const user = await requireUser(),
        rows = await db(
          `pro_subscriptions?user_id=eq.${user.id}&select=expires_at`,
        );
      return rows.some((r) => Date.parse(r.expires_at) > Date.now());
    } catch {
      return false;
    }
  }
  if (view === "predictions") {
    const round = await request("predictions");
    root.innerHTML += `<p class="lede">Pick the artists, in order. Lock your prediction before ${e(new Date(round.closesAt).toUTCString())}.</p><p>${e(round.scoring)} No entry fee or cash prize.</p><form id="prediction-form" class="panel"><h2>${e(round.week)}</h2>${Array.from({ length: 5 }, (_, i) => `<label>Rank ${i + 1}<select required name="pick-${i}" id="pick-${i}"><option value="">Choose artist</option>${artistOptions}</select></label>`).join("")}<button>Save my top five</button><p id="prediction-feedback" role="status"></p></form><section class="panel"><h2>Your past calls</h2><div id="prediction-history">Sign in to My board to save and revisit predictions.</div></section>`;
    const feedback = document.getElementById("prediction-feedback");
    let user = null,
      existing = null;
    try {
      user = await requireUser();
      const entries = await db(
        "chart_predictions?select=week,picks,submitted_at&order=week.desc&limit=20",
      );
      existing = entries.find((r) => r.week === round.week);
      if (existing)
        existing.picks.forEach(
          (slug, i) => (document.getElementById(`pick-${i}`).value = slug),
        );
      const history = document.getElementById("prediction-history");
      history.innerHTML = entries.length
        ? "<p>Checking published results…</p>"
        : "Your first prediction starts here.";
      const markup = await Promise.all(
        entries.map(async (entry) => {
          const result = await request("outcomes", { week: entry.week });
          const actual = result.artists.map((a) => a.slug),
            score = entry.picks.reduce(
              (n, s, i) =>
                n + (actual[i] === s ? 3 : actual.includes(s) ? 1 : 0),
              0,
            );
          return `<article><h3>${e(entry.week)} · ${result.published ? `${score}/15` : "Awaiting published edition"}</h3><ol>${entry.picks.map((s) => `<li>${e(index.artists.find((a) => a.slug === s)?.name || s)}</li>`).join("")}</ol>${result.published ? `<p>Published top five: ${result.artists.map((a) => e(a.name)).join(" → ")}</p>` : ""}</article>`;
        }),
      );
      history.innerHTML =
        markup.join("") || "Your first prediction starts here.";
    } catch (error) {
      feedback.textContent = error.message;
    }
    document.getElementById("prediction-form").onsubmit = async (event) => {
      event.preventDefault();
      const button = event.currentTarget.querySelector("button");
      button.disabled = true;
      try {
        user = await requireUser();
        const picks = Array.from(
          { length: 5 },
          (_, i) => document.getElementById(`pick-${i}`).value,
        );
        if (new Set(picks).size !== 5 || picks.some((s) => !s))
          throw Error("Choose five different artists.");
        if (Date.now() >= Date.parse(round.closesAt))
          throw Error("This round is locked. Refresh for the next round.");
        if (existing)
          await db(
            `chart_predictions?user_id=eq.${user.id}&week=eq.${round.week}`,
            { method: "PATCH", body: JSON.stringify({ picks }) },
          );
        else {
          await db("chart_predictions", {
            method: "POST",
            body: JSON.stringify({ user_id: user.id, week: round.week, picks }),
          });
          existing = { picks };
        }
        feedback.textContent =
          "Saved to your account. You can edit until the cutoff.";
        status("Prediction saved.");
      } catch (error) {
        feedback.textContent = error.message;
      } finally {
        button.disabled = false;
      }
    };
  }
  if (view === "analytics") {
    root.innerHTML += `<p class="lede">Published rank, streaming observations and edition-to-edition changes. Every point keeps its date.</p><label for="analytics-artist">Artist</label><select id="analytics-artist">${artistOptions}</select><div id="analytics-body">${loader}</div>`;
    let generation = 0;
    async function render() {
      const id = ++generation,
        node = document.getElementById("analytics-body");
      node.innerHTML = loader;
      try {
        const d = await request("analytics", {
          artist: document.getElementById("analytics-artist").value,
        });
        if (id !== generation) return;
        node.innerHTML = `<div class="grid"><article class="panel"><small>Current rank</small><h2>#${d.artist.rank}</h2><p>${e(d.artist.name)} · ${e(d.artist.asOf.slice(0, 10))}</p></article><article class="panel"><small>Tracked Spotify catalogue</small><h2>${Number(d.artist.streams).toLocaleString()}</h2><p>${Number(d.artist.dailyStreams).toLocaleString()} daily snapshot</p></article><article class="panel"><small>Archive coverage</small><h2>${d.coverage.editions} editions</h2><p>Only observed publications are plotted; missing weeks stay missing.</p></article></div><section class="panel"><h2>Rank through the archive</h2><div class="analytics-ranks">${d.history.map((p) => `<div><div class="analytics-rank-bar" style="--rank:${Math.max(1, 51 - p.rank)}"><b>#${p.rank}</b></div><small>${e(p.week)}</small></div>`).join("")}</div><div class="stream-table-wrap"><table><thead><tr><th>Edition</th><th>Rank</th><th>Score</th><th>Spotify streams</th><th>Published</th></tr></thead><tbody>${d.history.map((p) => `<tr><td>${e(p.week)}</td><td>#${p.rank}</td><td>${Number(p.score).toFixed(1)}</td><td>${Number(p.streams || 0).toLocaleString()}</td><td>${e(p.publishedAt.slice(0, 10))}</td></tr>`).join("")}</tbody></table></div><p>${e(d.note)}</p></section><div class="actions"><button id="analytics-export">Export artist history CSV · Pro</button><a href="/studio/api">Pro access & API keys →</a></div><p id="analytics-status" role="status"></p>`;
        bind("analytics-export", async () => {
          const session = await window.AfriAccount.session();
          if (!session) throw Error("Sign in to My board first.");
          const r = await fetch(
            "/api/pro?action=history&artist=" + d.artist.slug + "&format=csv",
            { headers: { Authorization: "Bearer " + session.access_token } },
          );
          if (!r.ok) {
            const error = await r.json();
            throw Error(error.error);
          }
          download(await r.blob(), `afri-${d.artist.slug}-history.csv`);
        });
      } catch (error) {
        if (id === generation)
          node.innerHTML = `<p>${e(error.message)}</p><button id="analytics-retry">Retry</button>`;
        bind("analytics-retry", render);
      }
    }
    document.getElementById("analytics-artist").onchange = render;
    await render();
  }
  if (view === "playlists") {
    const boards = [
      ["current", "Current 50"],
      ["naija", "Naija"],
      ["ghana", "Ghana"],
      ["south-africa", "South Africa"],
      ["east-africa", "East Africa"],
      ["womens-current-25", "Women’s Current 25"],
      ["veterans", "Veterans"],
    ];
    root.innerHTML += `<p class="lede">A fresh listening queue from every board. One sourced recording per artist, kept in board order.</p><label for="playlist-board">Board</label><select id="playlist-board">${boards.map(([id, name]) => `<option value="${id}">${name}</option>`).join("")}</select><div id="playlist-body">${loader}</div><p id="playlist-status" role="status"></p>`;
    let generation = 0;
    async function render() {
      const id = ++generation,
        board = document.getElementById("playlist-board").value,
        d = await request("playlist", { board });
      if (id !== generation) return;
      document.getElementById("playlist-body").innerHTML =
        `<p>${d.tracks.length} tracks · Edition ${e(d.edition.slice(0, 10))}. ${e(d.method)}</p><div class="actions"><button id="spotify-playlist">Create private Spotify playlist</button><button id="download-playlist">Download tracklist CSV</button></div><ol class="playlist-tracks">${d.tracks.map((t) => `<li><a href="${e(t.url)}" target="_blank" rel="noopener noreferrer">${e(t.title)}</a><span>${e(t.artist)}</span></li>`).join("")}</ol><p>Spotify creation asks for playlist permission. Playback and availability follow Spotify’s regional catalogue.</p>`;
      bind("download-playlist", async () =>
        download(
          new Blob(
            [
              "artist,title,spotify_url\n" +
                d.tracks
                  .map((t) => [t.artist, t.title, t.url].map(csv).join(","))
                  .join("\n"),
            ],
            { type: "text/csv" },
          ),
          `afri-${board}-tracks.csv`,
        ),
      );
      bind("spotify-playlist", async () => {
        const { startPlaylist } = await import("/playlist-spotify.js");
        await startPlaylist(board, d);
      });
    }
    document.getElementById("playlist-board").onchange = () =>
      render().catch((error) => status(error.message));
    await render();
    const { finishPlaylist } = await import("/playlist-spotify.js");
    await finishPlaylist(request, (message) => {
      document.getElementById("playlist-status").textContent = message;
    });
  }
  if (view === "summer") {
    const year = new Date().getUTCFullYear();
    root.innerHTML += `<p class="lede">A fixed June–August window, observed daily streams and a separate listener ballot.</p><label for="summer-year">Season</label><select id="summer-year"><option>${year}</option><option>${year + 1}</option></select><div id="summer-body">${loader}</div>`;
    async function render() {
      const year = document.getElementById("summer-year").value,
        d = await request("summer", { year });
      document.getElementById("summer-body").innerHTML =
        `<section class="panel"><h2>Stream tracker · ${e(d.window)}</h2><p>${e(d.note)}</p>${d.ranking.length ? `<ol>${d.ranking.map((t) => `<li>${e(t.title)} · ${Number(t.streams).toLocaleString()} observed streams over ${t.days} days</li>`).join("")}</ol>` : "<p>No in-window observations have been collected for this season. No seasonal winner has been inferred from lifetime totals.</p>"}</section><section class="panel"><h2>Your summer pick</h2><label for="summer-track">Nominate a sourced recording</label><select id="summer-track">${d.nominees.map((t) => `<option value="${t.id}">${e(t.artist)} · ${e(t.title)}</option>`).join("")}</select><button id="summer-vote">Save my ballot</button><p id="summer-feedback" role="status">Voting runs 1 June–31 August UTC for the current season.</p></section>`;
      bind("summer-vote", async () => {
        const user = await requireUser(),
          now = new Date().toISOString().slice(0, 10);
        if (now < `${year}-06-01` || now > `${year}-08-31`)
          throw Error("This season’s ballot is closed.");
        const track_id = document.getElementById("summer-track").value;
        const prior = await db(
          `summer_ballots?user_id=eq.${user.id}&season=eq.${year}&select=track_id`,
        );
        if (prior.length)
          await db(`summer_ballots?user_id=eq.${user.id}&season=eq.${year}`, {
            method: "PATCH",
            body: JSON.stringify({ track_id }),
          });
        else
          await db("summer_ballots", {
            method: "POST",
            body: JSON.stringify({
              user_id: user.id,
              season: Number(year),
              track_id,
            }),
          });
        document.getElementById("summer-feedback").textContent =
          "Ballot saved to your account.";
      });
    }
    document.getElementById("summer-year").onchange = () =>
      render().catch((error) => status(error.message));
    await render();
  }
  if (view === "signals") {
    const d = await request("signals");
    root.innerHTML += `<p class="lede">TikTok creations and Shazam city observations, with coverage visible.</p><p>${e(d.note)}</p><div class="grid">${Object.entries(
      d.coverage,
    )
      .map(
        ([p, v]) =>
          `<section class="panel"><h2>${p === "tiktok" ? "TikTok virality" : "Shazam city signals"}</h2><p>${v.count}/${v.total} artists have reviewed observations.</p><strong>${v.comparable ? "Comparable · preview active" : "Awaiting comparable source coverage"}</strong></section>`,
      )
      .join(
        "",
      )}</div><section class="panel"><h2>How the preview works</h2><p>5% TikTok + 5% Shazam when each metric has complete comparable coverage. A missing signal is excluded, never scored as zero. City observations appear as city observations; they do not stand in for worldwide totals.</p><div class="stream-table-wrap"><table><thead><tr><th>Artist</th><th>Signal</th><th>Territory / city</th><th>Observation</th><th>Period</th><th>Source</th></tr></thead><tbody>${d.observations.map((o) => `<tr><td>${e(index.artists.find((a) => a.slug === o.artist_slug)?.name || o.artist_slug)}</td><td>${e(o.platform)} · ${e(o.metric)}</td><td>${e(o.territory)} ${e(o.city || "")}</td><td>${Number(o.value).toLocaleString()}</td><td>${e(o.period_start)} → ${e(o.period_end)}</td><td><a href="${e(o.source_url)}">Source</a></td></tr>`).join("") || '<tr><td colspan="6">No reviewed TikTok or Shazam feed is connected yet.</td></tr>'}</tbody></table></div></section>`;
    if (d.active.length)
      root.innerHTML += `<section class="panel"><h2>Experimental order</h2><ol>${d.ranked.map((a) => `<li>${e(a.name)} · ${a.previewScore.toFixed(2)} <small>Published #${a.rank}</small></li>`).join("")}</ol></section>`;
  }
  if (view === "newsletter") {
    const config = await request("overview");
    root.innerHTML += `<p class="lede">Every Sunday: Top 10, Movers of the Week, one head-to-head and one underground artist. <a href="/newsletter">Read the full issue and join with your email →</a></p><section class="panel"><h2>The published Top 10</h2><p>Checked ${e(index.asOf.slice(0, 10))} · <a href="/">Read the chart</a> · <a href="/studio/playlists">Hear the board</a></p><ol>${index.artists
      .slice(0, 10)
      .map(
        (a) =>
          `<li><a href="/current/${a.slug}">${e(a.name)}</a> · ${a.score.toFixed(1)}</li>`,
      )
      .join(
        "",
      )}</ol></section>${config.sponsors.map((s) => `<aside class="panel"><small>Paid sponsor</small><h2>${e(s.name)}</h2><p>${e(s.copy)}</p><a href="${e(s.url)}" rel="sponsored noopener" target="_blank">${e(s.label)}</a></aside>`).join("")}<section class="panel"><h2>Your email preference</h2><p>Use your verified My board email. Subscription is optional and can be stopped here at any time.</p><label><input type="checkbox" id="newsletter-consent"> Email me the weekly Afri Index brief, including clearly marked sponsor placements.</label><button id="newsletter-save">Save newsletter preference</button><p id="newsletter-feedback" role="status">${config.newsletter.deliveryConfigured ? "Weekly email delivery is configured." : "Email delivery has not been configured yet. You can save your preference now; read the current issue above."}</p></section><section class="panel"><h2>Sponsor a future issue</h2><p>The opening slot sits above the chart; a second slot can sit beside the listening queue. Every placement is labelled. No sponsor is implied by an empty slot.</p></section>`;
    try {
      const user = await requireUser(),
        rows = await db(
          `newsletter_subscriptions?user_id=eq.${user.id}&select=consent`,
        );
      document.getElementById("newsletter-consent").checked =
        rows[0]?.consent === true;
    } catch {}
    bind("newsletter-save", async () => {
      const user = await requireUser();
      if (!user.email_confirmed_at)
        throw Error("Verify your account email first.");
      const consent = document.getElementById("newsletter-consent").checked,
        rows = await db(
          `newsletter_subscriptions?user_id=eq.${user.id}&select=user_id`,
        );
      if (rows.length)
        await db(`newsletter_subscriptions?user_id=eq.${user.id}`, {
          method: "PATCH",
          body: JSON.stringify({ consent }),
        });
      else
        await db("newsletter_subscriptions", {
          method: "POST",
          body: JSON.stringify({ user_id: user.id, consent }),
        });
      document.getElementById("newsletter-feedback").textContent = consent
        ? "Preference saved. You can unsubscribe here at any time."
        : "Unsubscribed from weekly email.";
    });
  }
  if (view === "api") {
    const config = await request("overview"),
      pro = await entitlement();
    root.innerHTML += `<p class="lede">Free chart exports for everyone. Pro adds archive downloads and API keys with shared account quotas.</p><div class="grid"><section class="panel"><h2>Free</h2><p>Current JSON and CSV · source dates · 60 requests/minute per running instance.</p><a href="/api/rankings?format=csv">Download CSV</a></section><section class="panel"><h2>Pro · 30-day pass</h2><p>10,000 authenticated API requests per account per UTC day. Revocable API keys, board endpoints and artist history.</p><p>${pro ? "Your pass is active." : config.billing.configured ? money(config.billing.amount, config.billing.currency) + " · One payment, no automatic renewal." : "Checkout is awaiting payment-provider configuration. No payment will be taken."}</p><button id="pro-checkout" ${config.billing.configured ? "" : "disabled"}>${pro ? "Extend Pro by 30 days" : "Get a 30-day Pro pass"}</button><p id="billing-feedback" role="status"></p></section></div><section class="panel"><h2>API keys</h2><p>Keys are shown once and stored as hashes. Revoke a key immediately if it is exposed.</p><label>Key label<input id="key-label" maxlength="80" placeholder="My dashboard"></label><button id="create-key" ${pro ? "" : "disabled"}>Create API key</button><pre id="new-key" hidden></pre><div id="key-list"></div><p id="key-feedback" role="status"></p></section><section class="panel"><h2>Use the API</h2><pre class="api-example">GET /api/pro?action=history&amp;artist=wizkid\nAuthorization: Bearer YOUR_API_KEY\n\nGET /api/pro?action=board&amp;board=ghana</pre><p>Use keys on your server. Keep attribution and source dates; provider data has its own rights and terms. A Pro pass does not transfer third-party music-data rights.</p><a href="/studio/analytics">Explore analytics →</a></section>`;
    async function secured(action, body) {
      const session = await window.AfriAccount.session();
      if (!session) throw Error("Sign in to My board first.");
      const r = await fetch("/api/pro?action=" + action, {
        method: body ? "POST" : "GET",
        headers: {
          Authorization: "Bearer " + session.access_token,
          "Content-Type": "application/json",
        },
        ...(body ? { body: JSON.stringify(body) } : {}),
      });
      const d = await r.json();
      if (!r.ok) throw Error(d.error);
      return d;
    }
    bind("pro-checkout", async () => {
      const button = document.getElementById("pro-checkout");
      button.disabled = true;
      try {
        const d = await secured("checkout", {});
        location.assign(d.url);
      } finally {
        button.disabled = false;
      }
    });
    async function loadKeys() {
      try {
        const user = await requireUser(),
          keys = await db(
            `api_keys?user_id=eq.${user.id}&select=id,label,prefix,revoked_at&order=created_at.desc`,
          );
        document.getElementById("key-list").innerHTML =
          keys
            .map(
              (k) =>
                `<p>${e(k.label)} · <code>${e(k.prefix)}…</code> ${k.revoked_at ? "Revoked" : `<button data-revoke="${k.id}">Revoke</button>`}</p>`,
            )
            .join("") || "<p>No API keys yet.</p>";
        document.querySelectorAll("[data-revoke]").forEach(
          (b) =>
            (b.onclick = async () => {
              try {
                await db(
                  `api_keys?id=eq.${b.dataset.revoke}&user_id=eq.${user.id}`,
                  {
                    method: "PATCH",
                    body: JSON.stringify({
                      revoked_at: new Date().toISOString(),
                    }),
                  },
                );
                await loadKeys();
              } catch (error) {
                status(error.message);
              }
            }),
        );
      } catch {}
    }
    bind("create-key", async () => {
      const d = await secured("create-key", {
        label: document.getElementById("key-label").value,
      });
      const node = document.getElementById("new-key");
      node.hidden = false;
      node.textContent = d.key;
      document.getElementById("key-feedback").textContent =
        "Copy this key now. It will not be shown again.";
      await loadKeys();
    });
    await loadKeys();
    if (new URL(location.href).searchParams.has("reference"))
      document.getElementById("billing-feedback").textContent =
        "Payment returned. Access activates after the server verifies the payment. Refresh to check your pass.";
  }
}
const csv = (value) => '"' + String(value ?? "").replaceAll('"', '""') + '"';
function download(blob, name) {
  const url = URL.createObjectURL(blob),
    a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
