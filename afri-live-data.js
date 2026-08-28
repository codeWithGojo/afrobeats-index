(function () {
  "use strict";

  const escapeHtml = (value) => String(value ?? "").replace(/[&<>'"]/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;"
  })[char]);

  const compact = (value) => Number.isFinite(Number(value))
    ? new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: Number(value) >= 1e9 ? 2 : 1 }).format(Number(value))
    : "—";

  const dateLabel = (value, withTime = false) => {
    if (!value || Number.isNaN(Date.parse(value))) return "Not verified yet";
    return new Intl.DateTimeFormat("en-GB", withTime
      ? { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }
      : { day: "numeric", month: "short", year: "numeric" }
    ).format(new Date(value));
  };

  const titleKey = (value) => String(value ?? "")
    .toLowerCase()
    .replace(/\((?:feat\.?|ft\.?)\s+[^)]*\)/g, "")
    .replace(/\b(?:feat\.?|ft\.?)\s+.*$/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

  const levelWeight = (level) => level === "Diamond" ? 10 : level === "Gold" ? 1 : level === "Platinum" ? 2 : Number(String(level).match(/^(\d+)xPlatinum$/)?.[1] || 0) + 1;
  const levelLabel = (level) => String(level || "").replace(/^(\d+)xPlatinum$/, "$1× Platinum");

  function streamCoverageLabel(artist) {
    const coverage = artist.scoreBreakdown?.streamCoverage || [];
    if (!coverage.length) return "No platform data";
    return coverage.map((item) => item === "spotify" ? "Spotify" : item === "boomplay" ? "Boomplay" : "YouTube").join(" + ");
  }

  function mergeArtists(state) {
    const current = Array.isArray(window.AFRI_CURRENT_ARTISTS) ? window.AFRI_CURRENT_ARTISTS : [];
    const incoming = new Map((state.artists || []).map((artist) => [artist.slug, artist]));
    current.forEach((artist) => {
      const fresh = incoming.get(artist.slug);
      if (fresh) Object.assign(artist, fresh);
    });
    document.querySelectorAll(".current-row[data-artist-slug]").forEach((row) => {
      const artist = incoming.get(row.dataset.artistSlug);
      if (!artist) return;
      row.dataset.rank = artist.rank;
      const rank = row.querySelector(".current-rank");
      if (rank) rank.textContent = String(artist.rank).padStart(2, "0");
      const metricBlocks = row.querySelectorAll(".current-streams span");
      if (metricBlocks[0]) metricBlocks[0].querySelector("strong").textContent = compact(artist.monthlyListeners);
      if (metricBlocks[1]) metricBlocks[1].querySelector("strong").textContent = compact(artist.totalSpotifyStreams);
      if (!metricBlocks[2]) row.querySelector(".current-streams")?.insertAdjacentHTML("beforeend", `<span class="platform-blend"><small>Blended streams</small><strong></strong><em></em></span>`);
      const blend = row.querySelector(".platform-blend");
      if (blend) {
        blend.querySelector("strong").textContent = Number(artist.scoreBreakdown?.streamsScore ?? 0).toFixed(1);
        blend.querySelector("em").textContent = streamCoverageLabel(artist);
      }
      const score = row.querySelector(".current-score strong");
      if (score) score.textContent = Number(artist.score).toFixed(1);
      row.querySelector(".current-score i")?.style.setProperty("--score", `${artist.score}%`);
      metricBlocks.forEach((block, index) => {
        const small = block.querySelector("small");
        const updatedAt = index === 0 ? artist.monthlyListenersLastUpdatedAt : artist.statsLastUpdatedAt;
        if (small && !small.querySelector("em")) small.insertAdjacentHTML("beforeend", `<em>Updated ${escapeHtml(dateLabel(updatedAt))}</em>`);
      });
    });
    const list = document.querySelector(".current-ranking");
    if (list) [...state.artists].sort((a, b) => a.rank - b.rank).forEach((artist) => {
      const row = list.querySelector(`[data-artist-slug="${CSS.escape(artist.slug)}"]`);
      if (row) list.append(row);
    });
  }

  function legacyAllTimeDetails() {
    const details = new Map();
    document.querySelectorAll("#alltime > .border-t > div").forEach((row) => {
      const name = row.querySelector("h3")?.textContent.trim();
      if (!name) return;
      details.set(titleKey(name), {
        image: row.querySelector("img")?.getAttribute("src") || "",
        kicker: row.querySelector("p.text-\\[10px\\]")?.textContent.trim() || "All-time file",
        blurb: row.querySelector("h3 + p")?.textContent.trim() || "Cross-era editorial record",
        country: row.querySelector(".hidden.sm\\:flex p")?.textContent.trim() || "Africa"
      });
    });
    return details;
  }

  function renderAllTimeRanking(state) {
    const section = document.getElementById("alltime");
    if (!section || section.querySelector(".all-time-live-ranking") || !state.allTimeArtists?.length) return;
    const legacy = legacyAllTimeDetails();
    const currentBySlug = new Map((state.artists || []).map((artist) => [artist.slug, artist]));
    const ranked = [...state.allTimeArtists].sort((a, b) => a.rank - b.rank);
    const topLabel = section.querySelector(":scope > p.text-xs");
    const oldGrid = section.querySelector(":scope > .grid");
    const oldList = section.querySelector(":scope > .border-t");
    if (!oldGrid || !oldList) return;
    const detailsFor = (entry) => {
      const current = currentBySlug.get(entry.slug);
      return current ? { image: current.image, kicker: current.tagline, blurb: current.bio, country: current.country } : legacy.get(titleKey(entry.name)) || { image: "", kicker: "All-time file", blurb: "Cross-era editorial record", country: "Africa" };
    };
    const top = ranked.slice(0, 3);
    oldGrid.innerHTML = top.map((entry) => {
      const details = detailsFor(entry);
      return `<button type="button" class="big-three-card relative border border-gray-200 overflow-hidden group text-left" data-all-time-slug="${escapeHtml(entry.slug)}"><div class="big-three-media aspect-[3/4] bg-gray-200">${details.image ? `<img src="${escapeHtml(details.image)}" alt="${escapeHtml(entry.name)}" loading="lazy">` : `<span class="all-time-initial">${escapeHtml(entry.name.slice(0, 1))}</span>`}</div><div class="absolute top-3 left-3 serif text-5xl text-white drop-shadow-lg">${entry.rank}</div><div class="p-3"><p class="current-kicker">${escapeHtml(details.kicker)}</p><h3 class="font-semibold">${escapeHtml(entry.name)}</h3><p class="text-xs text-gray-500">Score ${Number(entry.score).toFixed(1)} · awards ${Number(entry.scoreBreakdown?.awardScore ?? 0).toFixed(1)} · plaques ${Number(entry.scoreBreakdown?.certificationScore ?? 0).toFixed(1)}</p></div></button>`;
    }).join("");
    if (topLabel) topLabel.textContent = "Recomputed top 3 · tiered awards + certification evidence";
    oldList.className = "all-time-live-ranking";
    oldList.innerHTML = ranked.slice(3).map((entry) => {
      const details = detailsFor(entry);
      return `<button type="button" class="all-time-live-row" data-all-time-slug="${escapeHtml(entry.slug)}"><span class="all-time-rank">${String(entry.rank).padStart(2, "0")}</span><span class="all-time-avatar">${details.image ? `<img src="${escapeHtml(details.image)}" alt="" loading="lazy">` : escapeHtml(entry.name.slice(0, 1))}</span><span class="all-time-copy"><small>${escapeHtml(details.kicker)}</small><strong>${escapeHtml(entry.name)}</strong><em>${escapeHtml(details.blurb)}</em></span><span class="all-time-evidence"><small>Awards ${Number(entry.scoreBreakdown?.awardScore ?? 0).toFixed(1)}</small><small>Plaques ${Number(entry.scoreBreakdown?.certificationScore ?? 0).toFixed(1)}</small></span><span class="all-time-score">${Number(entry.score).toFixed(1)}</span></button>`;
    }).join("");
    section.querySelectorAll("[data-all-time-slug]").forEach((row) => row.addEventListener("click", () => {
      if (currentBySlug.has(row.dataset.allTimeSlug) && typeof window.openCurrentArtist === "function") window.openCurrentArtist(row.dataset.allTimeSlug);
    }));
  }

  const regionFor = (country) => {
    const value = String(country || "").toLowerCase();
    if (/south africa|eswatini|zimbabwe|zambia|namibia|botswana|mozambique|lesotho/.test(value)) return "Southern Africa";
    if (/tanzania|kenya|uganda|ethiopia|rwanda|burundi|somalia/.test(value)) return "East Africa";
    if (/cameroon|congo|gabon|angola|chad|central african/.test(value)) return "Central Africa";
    if (/egypt|morocco|algeria|tunisia|libya|sudan/.test(value)) return "North Africa";
    return "West Africa";
  };

  function renderRegionalIndex(state) {
    const root = document.getElementById("regional-index");
    if (!root) return;
    const regions = ["West Africa", "East Africa", "Southern Africa", "Central Africa", "North Africa"];
    const available = regions.filter((region) => state.artists.some((artist) => regionFor(artist.country) === region));
    root.innerHTML = `<div class="region-tabs" role="tablist">${available.map((region, index) => `<button type="button" class="region-tab${index === 0 ? " is-active" : ""}" data-region="${escapeHtml(region)}">${escapeHtml(region)}</button>`).join("")}</div><div class="regional-list"></div>`;
    const list = root.querySelector(".regional-list");
    const paint = (region) => {
      const artists = state.artists.filter((artist) => regionFor(artist.country) === region).sort((a, b) => b.score - a.score);
      list.innerHTML = artists.map((artist, index) => `<button class="regional-row" type="button" data-artist-slug="${escapeHtml(artist.slug)}"><span class="regional-rank">${String(index + 1).padStart(2, "0")}</span><span class="regional-person"><img src="${escapeHtml(artist.image)}" alt="" loading="lazy"><span><strong>${escapeHtml(artist.name)}</strong><small>${escapeHtml(artist.country)} · global #${artist.rank}</small></span></span><span class="regional-metrics"><strong>${compact(artist.monthlyListeners)}</strong><small>monthly listeners</small></span><span class="regional-score">${Number(artist.score).toFixed(1)}</span></button>`).join("") || `<p class="tour-empty">No Current 50 artists are assigned to this region yet.</p>`;
    };
    paint(available[0]);
    root.querySelectorAll(".region-tab").forEach((button) => button.addEventListener("click", () => {
      root.querySelectorAll(".region-tab").forEach((tab) => tab.classList.toggle("is-active", tab === button));
      paint(button.dataset.region);
    }));
    root.addEventListener("click", (event) => {
      const row = event.target.closest("[data-artist-slug]");
      if (row && typeof window.openCurrentArtist === "function") window.openCurrentArtist(row.dataset.artistSlug);
    });
  }

  function renderTrending(state) {
    const section = document.getElementById("current");
    if (!section || section.querySelector(".trending-module")) return;
    const snapshots = [...(state.streamSnapshots || [])].sort((a, b) => Date.parse(a.capturedAt) - Date.parse(b.capturedAt));
    const latest = snapshots.at(-1);
    if (!latest) return;
    const target = Date.parse(latest.capturedAt) - 7 * 86_400_000;
    const previous = [...snapshots].reverse().find((item) => Date.parse(item.capturedAt) <= target + 2 * 86_400_000);
    const rows = state.artists.map((artist) => {
      const now = latest.artists?.[artist.slug];
      const then = previous?.artists?.[artist.slug];
      const delta = now && then ? Math.max(0, now.totalSpotifyStreams - then.totalSpotifyStreams) : Number(now?.dailySpotifyStreams || artist.dailySpotifyStreams || 0) * 7;
      return { artist, delta };
    }).sort((a, b) => b.delta - a.delta).slice(0, 5);
    const module = document.createElement("section");
    module.className = "trending-module";
    module.innerHTML = `<div class="trending-head"><div><p>${previous ? "7-day stream change" : "Momentum baseline"}</p><h3>Trending this week</h3></div><small>${previous ? `${dateLabel(previous.capturedAt)} → ${dateLabel(latest.capturedAt)}` : "History is collecting; estimated from current daily pace"}</small></div><div class="trending-grid">${rows.map(({ artist, delta }, index) => `<button type="button" data-artist-slug="${escapeHtml(artist.slug)}"><span>${String(index + 1).padStart(2, "0")}</span><strong>${escapeHtml(artist.name)}</strong><em>+${compact(delta)} streams</em></button>`).join("")}</div>`;
    section.querySelector("h2 + p")?.insertAdjacentElement("afterend", module);
  }

  function renderAlbums(state) {
    const section = document.getElementById("albums");
    if (!section || !state.albums?.length) return;
    const albums = [...state.albums].sort((a, b) => b.streams - a.streams);
    const max = albums[0]?.streams || 1;
    const grid = section.querySelector(":scope > .grid");
    if (!grid) return;
    grid.innerHTML = albums.map((album, index) => `<article class="album-card"><div class="album-rank">${String(index + 1).padStart(2, "0")}</div><h3 class="font-semibold text-lg">${escapeHtml(album.title)}</h3><p class="text-sm text-gray-500 mb-2">${escapeHtml(album.artistName)}${album.year ? ` · ${album.year}` : ""}</p><p class="album-streams-value">${compact(album.streams)}</p><p class="text-xs text-gray-500 mt-1">${compact(album.dailyStreams)} daily · updated ${escapeHtml(dateLabel(album.lastVerifiedAt))}</p><div class="w-full h-1.5 bg-gray-100 rounded mt-3"><div class="album-streams-fill" style="width:${Math.max(2, Math.round(album.streams / max * 100))}%"></div></div><p class="text-xs text-gray-600 mt-3">${escapeHtml(album.note || "Curated Afri Index project.")}</p><a class="album-source" href="${escapeHtml(album.sourceUrl)}" target="_blank" rel="noopener noreferrer">Kworb source ↗</a></article>`).join("");
    const note = section.querySelector(":scope > p:last-child");
    if (note) note.innerHTML = `Exact Spotify album totals and daily movement are stored from the last successful Kworb refresh. A failed scrape never removes the previous verified count. Editorial shortlist; compilations are excluded.`;
  }

  function renderFinancials(state) {
    const records = state.financials || [];
    const tbody = document.querySelector("#networth tbody");
    if (tbody && records.length) tbody.innerHTML = records.sort((a, b) => a.rank - b.rank).map((record) => `<tr><td class="py-3 pr-4 serif text-lg text-[#0047ff]">${record.rank}</td><td class="py-3 pr-4 font-medium">${escapeHtml(record.artistName)}</td><td class="py-3 pr-4">${escapeHtml(record.netWorthRange)}</td><td class="py-3 text-gray-500 hidden sm:table-cell">${escapeHtml(record.primaryDrivers)}</td></tr>`).join("");
    const byName = new Map(records.map((record) => [record.artistName.toLowerCase(), record]));
    document.querySelectorAll("#artists > div.grid > div").forEach((card) => {
      const name = card.querySelector("h3")?.textContent.trim().toLowerCase();
      const record = byName.get(name);
      if (!record) return;
      card.querySelectorAll(".metric-label").forEach((label) => {
        if (/annual earnings/i.test(label.textContent)) label.nextElementSibling.textContent = record.annualEarningsRange || "Not separately estimated";
        if (/net worth/i.test(label.textContent)) label.nextElementSibling.textContent = record.netWorthRange;
      });
    });
    const intro = document.querySelector("#networth h2 + p");
    if (intro) intro.textContent = `Editorial estimate ranges from one shared financial ledger · last reviewed ${dateLabel(records[0]?.lastVerifiedAt)}. These are not audited financial filings.`;
  }

  function renderSpotlight(state) {
    const item = state.spotlight;
    const section = document.getElementById("current");
    if (!item?.active || !section || section.querySelector(".sponsored-spotlight")) return;
    const now = Date.now();
    if ((item.startsAt && Date.parse(item.startsAt) > now) || (item.endsAt && Date.parse(item.endsAt) < now)) return;
    const artist = state.artists.find((entry) => entry.slug === item.artistSlug);
    if (!artist) return;
    const module = document.createElement("aside");
    module.className = "sponsored-spotlight";
    module.innerHTML = `<img src="${escapeHtml(artist.image)}" alt="${escapeHtml(artist.name)}"><div><p>Sponsored${item.sponsorName ? ` · ${escapeHtml(item.sponsorName)}` : ""}</p><h3>${escapeHtml(item.headline || artist.name)}</h3><span>${escapeHtml(item.copy)}</span>${item.ctaUrl ? `<a href="${escapeHtml(item.ctaUrl)}" target="_blank" rel="sponsored noopener">${escapeHtml(item.ctaLabel || "Learn more")} ↗</a>` : ""}<small>Paid placement · no effect on editorial rankings</small></div>`;
    section.querySelector("h2 + p")?.insertAdjacentElement("afterend", module);
  }

  function updatePageFreshness(state) {
    const edition = document.querySelector("body > div:first-child span:last-child");
    if (edition && state.meta?.streamsUpdatedAt) edition.textContent = `Living index · Updated ${dateLabel(state.meta.streamsUpdatedAt)}`;
    const stamp = document.querySelector(".update-date time");
    if (stamp && state.meta?.streamsUpdatedAt) {
      const date = new Date(state.meta.streamsUpdatedAt);
      stamp.dateTime = date.toISOString().slice(0, 10);
      stamp.innerHTML = `${date.getUTCDate()} ${date.toLocaleString("en", { month: "short", timeZone: "UTC" })}<br>${date.getUTCFullYear()}`;
    }
    const log = document.querySelector(".weekly-log");
    if (log && !log.querySelector(".live-data-status")) {
      const staleCount = state.audit?.staleEntries?.length || 0;
      log.insertAdjacentHTML("beforeend", `<p class="live-data-status${staleCount ? " is-stale" : ""}">Data desk synced ${escapeHtml(dateLabel(state.meta?.streamsUpdatedAt, true))}. ${staleCount ? `${staleCount} maintenance item${staleCount === 1 ? "" : "s"} flagged for review.` : "No stale records flagged."}</p>`);
    }
  }

  function songRows(artist) {
    const songs = Array.isArray(artist.songs) ? artist.songs.filter((song) => !song.manualOnly).slice(0, 8) : [];
    if (!songs.length) return `<p class="tour-empty">Song-level totals are queued for the next Kworb audit. The artist totals above remain the last verified values.</p>`;
    return `<div class="live-song-list">${songs.map((song) => `
      <div class="live-song">
        <div><strong>${escapeHtml(song.title)}</strong><small>Verified ${escapeHtml(dateLabel(song.lastVerifiedAt))}</small></div>
        <div class="live-song-metric"><strong>${compact(song.streams)}</strong><small>${compact(song.dailyStreams)} daily</small></div>
      </div>`).join("")}</div>`;
  }

  function fifaRows(artist, state) {
    const flags = (state.fifaFlags || []).filter((flag) => flag.artistSlug === artist.slug);
    if (!flags.length) return `<p class="tour-empty">No verified FIFA or EA SPORTS FC soundtrack appearance is currently recorded for this artist.</p>`;
    const artistSongs = Array.isArray(artist.songs) ? artist.songs : [];
    return `<div class="fifa-feature-list">${flags.map((flag) => {
      const song = artistSongs.find((entry) => titleKey(entry.title) === titleKey(flag.title));
      return `<div class="fifa-feature-item">
        <div><strong>${escapeHtml(flag.title)}</strong><small>Verified soundtrack placement · listed independently of streaming rank</small>${(flag.fifaEditions || []).map((edition) => `<a class="fifa-badge" href="${escapeHtml(flag.sourceUrl || "#")}" target="_blank" rel="noopener noreferrer">${escapeHtml(edition)}</a>`).join("")}</div>
        <div class="live-song-metric"><strong>${song && !song.manualOnly ? compact(song.streams) : "Cultural flag"}</strong><small>${song && !song.manualOnly ? `${compact(song.dailyStreams)} daily` : "Not required to rank in top streams"}</small></div>
      </div>`;
    }).join("")}</div>`;
  }

  function collaboratorsFor(artist) {
    const counts = new Map();
    for (const song of artist.songs || []) {
      const title = String(song.title || "");
      const feature = title.match(/\((?:feat\.?|ft\.?)\s+([^)]+)\)/i)?.[1] || title.match(/\b(?:feat\.?|ft\.?)\s+(.+)$/i)?.[1];
      if (!feature) continue;
      feature.split(/,|&|\bx\b|\band\b/i).map((name) => name.trim()).filter(Boolean).forEach((name) => counts.set(name, (counts.get(name) || 0) + 1));
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 10);
  }

  function collaborationSection(artist) {
    const collaborators = collaboratorsFor(artist);
    return `<section><div class="live-section-head"><div><p>Catalogue relationships</p><h3>Collaboration network</h3></div><p>From tracked Kworb song credits</p></div>${collaborators.length ? `<div class="collab-network">${collaborators.map(([name, count]) => `<span><strong>${escapeHtml(name)}</strong><small>${count} tracked credit${count === 1 ? "" : "s"}</small></span>`).join("")}</div>` : `<p class="tour-empty">No collaborator credits have been extracted from the current tracked song titles yet.</p>`}</section>`;
  }

  function awardsSection(artist, state) {
    const records = [...(state.awards?.[artist.slug] || [])].sort((a, b) => a.tier - b.tier || Number(b.result === "won") - Number(a.result === "won") || b.year - a.year);
    const wins = records.filter((record) => record.result === "won");
    const item = (record) => `<a class="award-item" href="${escapeHtml(record.sourceUrl)}" target="_blank" rel="noopener noreferrer"><span class="award-result ${escapeHtml(record.result)}">${escapeHtml(record.result)}</span><span><strong>${escapeHtml(record.body)} · ${record.year}</strong><small>${escapeHtml(record.category)}${record.work ? ` · ${escapeHtml(record.work)}` : ""}</small></span><b class="award-tier">T${record.tier}</b></a>`;
    return `<section><div class="live-section-head"><div><p>Tier-weighted culture ledger</p><h3>Award tracker</h3></div><p>Score ${Number(artist.scoreBreakdown?.awardScore ?? 0).toFixed(1)} · ${records.length} verified results</p></div>${records.length ? `<div class="award-badge-strip">${(wins.length ? wins : records).slice(0, 4).map((record) => `<a href="${escapeHtml(record.sourceUrl)}" target="_blank" rel="noopener noreferrer"><small>Tier ${record.tier} · ${record.year}</small><strong>${escapeHtml(record.body)}</strong><span>${escapeHtml(record.category)}</span></a>`).join("")}</div><details class="award-details"><summary>View all ${records.length} award result${records.length === 1 ? "" : "s"}</summary><div class="award-list">${records.map(item).join("")}</div></details>` : `<p class="tour-empty">No supported award result has been verified for this artist yet. Their baseline editorial score is retained instead of treating missing research as zero.</p>`}</section>`;
  }

  function certificationCard(record) {
    const tierClass = record.level === "Gold" ? "gold" : record.level === "Diamond" ? "diamond" : /^\d+x/.test(record.level) ? "multi-platinum" : "platinum";
    return `<a class="certification-card" href="${escapeHtml(record.sourceUrl)}" target="_blank" rel="noopener noreferrer"><span class="cert-disc ${tierClass}" aria-hidden="true"></span><span class="cert-copy"><strong>${escapeHtml(record.title)}</strong><small>${escapeHtml(record.creditedArtist)} · ${escapeHtml(record.market)} · ${escapeHtml(dateLabel(record.certifiedDate))}</small></span><span class="cert-level ${tierClass}">${escapeHtml(levelLabel(record.level))}</span></a>`;
  }

  function certificationSection(artist, state) {
    const records = [...(state.certifications?.[artist.slug] || [])].sort((a, b) => levelWeight(b.level) - levelWeight(a.level) || Date.parse(b.certifiedDate) - Date.parse(a.certifiedDate));
    const songs = records.filter((record) => record.format === "Single").slice(0, 5);
    const projects = records.filter((record) => record.format === "Album" || record.format === "EP").slice(0, 5);
    const turntableCount = records.filter((record) => record.authority === "TurnTable Charts").length;
    return `<section class="certification-section"><div class="certification-heading"><div><p>Official sales milestones</p><h3>Certified records</h3></div><small>Commercial score ${Number(artist.scoreBreakdown?.certificationScore ?? 0).toFixed(1)}</small></div><p class="certification-note">The five strongest plaques per format are shown. TurnTable certification points are folded into Commercial power; international plaques remain visible for context.</p>${records.length ? `<div class="certification-groups">${songs.length ? `<div><h4>Songs</h4><div class="certification-list">${songs.map(certificationCard).join("")}</div></div>` : ""}${projects.length ? `<div><h4>Albums & EPs</h4><div class="certification-list">${projects.map(certificationCard).join("")}</div></div>` : ""}</div><p class="certification-attribution"><a href="https://www.turntablecharts.com/certification" target="_blank" rel="noopener noreferrer">Certification data via TurnTable Charts ↗</a> · ${turntableCount} Nigerian plaque${turntableCount === 1 ? "" : "s"} matched · refreshed periodically</p>` : `<p class="certification-empty">No verified Gold or Platinum record has been added for this artist yet.</p>`}</section>`;
  }

  function platformStreamSection(artist, state) {
    const platform = state.platformStreams?.[artist.slug] || {};
    const cells = [
      { label: "Spotify catalogue", value: compact(artist.totalSpotifyStreams), updated: artist.statsLastUpdatedAt, url: artist.sources?.catalogue, note: "45% of blended Streams" },
      { label: "Boomplay streams", value: Number(platform.boomplayStreams) > 0 ? compact(platform.boomplayStreams) : "Pending", updated: platform.boomplayLastUpdatedAt, url: platform.boomplaySourceUrl, note: "30% · manually verified" },
      { label: "YouTube channel views", value: Number(platform.youtubeViews) > 0 ? compact(platform.youtubeViews) : "Pending", updated: platform.youtubeLastUpdatedAt, url: platform.youtubeSourceUrl, note: "25% · Data API v3" }
    ];
    return `<section><div class="live-section-head"><div><p>Cross-platform evidence</p><h3>Blended streams</h3></div><p>Score ${Number(artist.scoreBreakdown?.streamsScore ?? 0).toFixed(1)} · ${escapeHtml(streamCoverageLabel(artist))}</p></div><div class="platform-stream-grid">${cells.map((cell) => `<article><small>${escapeHtml(cell.label)}</small><strong>${escapeHtml(cell.value)}</strong><span>${escapeHtml(cell.note)}</span><em>${escapeHtml(dateLabel(cell.updated))}</em>${cell.url ? `<a href="${escapeHtml(cell.url)}" target="_blank" rel="noopener noreferrer">Source ↗</a>` : ""}</article>`).join("")}</div><p class="platform-note">Missing platforms are not treated as zero: available weights are rebalanced until a verified value is entered. Failed refreshes retain the last good count.</p></section>`;
  }

  function scoreBreakdownSection(artist) {
    const score = artist.scoreBreakdown || {};
    return `<section class="score-breakdown"><div class="live-section-head"><div><p>Recomputed ranking input</p><h3>Why this score moved</h3></div><p>Current score ${Number(artist.score).toFixed(1)}</p></div><div><span><small>Editorial baseline · 77%</small><strong>${Number(score.baselineScore ?? artist.score).toFixed(1)}</strong></span><span><small>Awards · 9%</small><strong>${Number(score.awardScore ?? 0).toFixed(1)}</strong></span><span><small>Certification sub-score · 4%</small><strong>${Number(score.certificationScore ?? 0).toFixed(1)}</strong></span><span><small>Blended streams · 10%</small><strong>${Number(score.streamsScore ?? 0).toFixed(1)}</strong></span></div></section>`;
  }

  function eventRows(events) {
    if (!events.length) return `<p class="tour-empty">No verified dates are currently listed. A failed or unavailable provider refresh never removes the previous good schedule.</p>`;
    return events.map((event) => `
      <div class="tour-event">
        <div><strong>${escapeHtml(event.title || "Live date")}</strong><small><span class="tour-city">${escapeHtml(event.city)}</span> · ${escapeHtml(event.venue)}</small></div>
        <div class="live-song-metric"><strong>${escapeHtml(dateLabel(event.date))}</strong>${event.ticketUrl || event.sourceUrl ? `<small><a class="live-source-link" href="${escapeHtml(event.ticketUrl || event.sourceUrl)}" target="_blank" rel="noopener noreferrer">Details ↗</a></small>` : ""}</div>
      </div>`).join("");
  }

  function touringSection(artist, state) {
    const snapshot = state.events?.[artist.slug];
    const upcoming = (snapshot?.events || []).filter((event) => Date.parse(event.date) >= Date.now()).sort((a, b) => Date.parse(a.date) - Date.parse(b.date));
    const activeCutoff = Date.now() + 60 * 86_400_000;
    const active = upcoming.filter((event) => Date.parse(event.date) <= activeCutoff);
    return `<section>
      <div class="live-section-head"><div><p>Live desk</p><h3>Touring & cities</h3></div><p>${snapshot ? `${escapeHtml(snapshot.provider)} · ${escapeHtml(dateLabel(snapshot.updatedAt))}` : "Provider connection pending"}</p></div>
      <div class="tour-tabs" role="tablist"><button class="tour-tab is-active" type="button" data-tour-tab="active">Currently touring</button><button class="tour-tab" type="button" data-tour-tab="upcoming">Upcoming</button></div>
      <div class="tour-list" data-tour-panel="active">${eventRows(active)}</div>
      <div class="tour-list" data-tour-panel="upcoming" hidden>${eventRows(upcoming)}</div>
    </section>`;
  }

  function performanceSection(artist, state) {
    const records = state.performances?.[artist.slug] || [];
    return `<section><div class="live-section-head"><div><p>Manual editorial record</p><h3>Notable performances</h3></div><p>Attendance first · verified significance fallback</p></div>${records.length ? `<div class="performance-list">${records.map((item) => `
      <div class="performance-item"><div><strong><a class="live-source-link" href="${escapeHtml(item.sourceUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(item.name)} ↗</a></strong><small>${escapeHtml(item.venueOrFestival)} · ${escapeHtml(item.year)}</small></div><div class="performance-metric">${escapeHtml(item.metric)}</div></div>`).join("")}</div>` : `<p class="tour-empty">No performance has been added without a defensible attendance, view-count or cultural-significance source. This record remains editable from the maintenance desk.</p>`}</section>`;
  }

  function enhanceOpenDialog() {
    const state = window.AFRI_LIVE_STATE;
    const dialog = document.getElementById("current-artist-dialog");
    const slug = dialog?.dataset.artistSlug;
    if (!state || !dialog || !slug || !dialog.open) return;
    const artist = state.artists?.find((entry) => entry.slug === slug);
    const copy = dialog.querySelector(".artist-dialog-copy");
    if (!artist || !copy || copy.querySelector(".artist-live-panel")) return;
    copy.querySelector(".artist-dialog-bio")?.insertAdjacentHTML("afterend", certificationSection(artist, state));
    copy.querySelector(".artist-dialog-footer")?.insertAdjacentHTML("beforebegin", `<div class="artist-live-panel"><p class="live-data-status">Streaming stats last verified ${escapeHtml(dateLabel(artist.statsLastUpdatedAt, true))}. Each failed refresh keeps the previous good figures.</p>${platformStreamSection(artist, state)}${scoreBreakdownSection(artist)}<section><div class="live-section-head"><div><p>Kworb streaming ledger</p><h3>Top streamed songs</h3></div><p>Daily and lifetime Spotify totals</p></div>${songRows(artist)}</section><section class="fifa-soundtrack-section"><div class="live-section-head"><div><p>Football culture archive</p><h3>FIFA / EA SPORTS FC soundtrack</h3></div><p>Placement flag · not a streaming rank</p></div><p class="fifa-meaning">The football badge means the song was officially featured in a FIFA or EA SPORTS FC soundtrack. Verified soundtrack songs remain listed here even when they are outside the artist’s top-streamed tracks.</p>${fifaRows(artist, state)}</section>${collaborationSection(artist)}${awardsSection(artist, state)}${touringSection(artist, state)}${performanceSection(artist, state)}</div>`);
    copy.querySelectorAll("[data-tour-tab]").forEach((button) => button.addEventListener("click", () => {
      const panelName = button.dataset.tourTab;
      copy.querySelectorAll("[data-tour-tab]").forEach((tab) => tab.classList.toggle("is-active", tab === button));
      copy.querySelectorAll("[data-tour-panel]").forEach((panel) => { panel.hidden = panel.dataset.tourPanel !== panelName; });
    }));
  }

  async function loadLiveState() {
    const applyState = (state) => {
      window.AFRI_LIVE_STATE = state;
      mergeArtists(state);
      renderAllTimeRanking(state);
      updatePageFreshness(state);
      renderTrending(state);
      renderRegionalIndex(state);
      renderAlbums(state);
      renderFinancials(state);
      renderSpotlight(state);
      enhanceOpenDialog();
    };
    try {
      const response = await fetch("/api/data", { headers: { accept: "application/json" } });
      if (!response.ok) throw new Error(`Data API returned ${response.status}`);
      applyState(await response.json());
    } catch (error) {
      console.warn("Afri Index is using the bundled last-good snapshot", error);
      if (window.AFRI_EMBEDDED_STATE) applyState(window.AFRI_EMBEDDED_STATE);
    }
  }

  document.addEventListener("click", (event) => {
    if (event.target.closest("[data-artist-slug]")) setTimeout(enhanceOpenDialog, 30);
  }, true);
  window.addEventListener("load", loadLiveState, { once: true });
})();
