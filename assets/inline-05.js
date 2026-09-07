(function () {
  const UPDATE_VERSION = "2026-08-20-current-11-v2";
  const SNAPSHOT_KEY = "afri-index-current-snapshot-v1";
  const currentArtists = Array.isArray(window.AFRI_CURRENT_ARTISTS) ? window.AFRI_CURRENT_ARTISTS : [];

  const metrics = {
    "Impact & legacy": "How much an artist changed the genre — and what remained after the moment passed.",
    "Global reach": "Audience and recognition beyond the artist's home market.",
    "Discography": "Quality, depth and consistency across albums, EPs and singles.",
    "Commercial power": "Sales, chart strength, booking demand and brand pull.",
    "Awards": "Major wins and nominations, weighted by relevance and competitiveness.",
    "Cultural influence": "How strongly the artist shaped sound, style, language and the next wave.",
    "Longevity": "How long the artist stayed relevant at a meaningful level.",
    "Live performance": "Touring scale, ticket demand and reputation on stage.",
    "Feature impact": "How often features improve records, widen reach or create moments.",
    "Total Spotify streams": "Cumulative Spotify streams across the artist's tracked catalogue; updated as an editorial snapshot.",
    "Monthly listeners": "The artist's rolling 28-day Spotify audience — a volatile reach signal, not a fan count."
  };

  const weights = {
    alltime: [["Impact & legacy",18],["Global reach",15],["Discography",14],["Commercial power",14],["Awards",10],["Cultural influence",10],["Longevity",8],["Live performance",6],["Feature impact",5]],
    current: [["Impact & legacy",15],["Global reach",13],["Discography",11],["Commercial power",11],["Awards",8],["Cultural influence",8],["Longevity",6],["Live performance",6],["Feature impact",5],["Total Spotify streams",10],["Monthly listeners",7]]
  };

  function parseRank(value) {
    const match = String(value || "").match(/\d+/);
    return match ? Number(match[0]) : null;
  }

  function rankedRows(sectionId) {
    const section = document.getElementById(sectionId);
    if (!section) return [];
    if (sectionId === "current" && section.querySelector(".current-row")) {
      return Array.from(section.querySelectorAll(".current-row")).map((row) => ({
        name: row.dataset.name,
        rank: Number(row.dataset.rank),
        row
      }));
    }
    return Array.from(section.querySelectorAll(".border-t > div"))
      .map((row) => {
        const name = row.querySelector("h3")?.textContent?.trim();
        const rankNode = row.querySelector(":scope > span.serif");
        const rank = parseRank(rankNode?.textContent);
        return name && rank ? { name, rank, row } : null;
      })
      .filter(Boolean);
  }

  function rankingMap(sectionId) {
    const map = new Map(rankedRows(sectionId).map(({ name, rank }) => [name, rank]));
    if (sectionId === "alltime") {
      document.querySelectorAll("#alltime .grid h3").forEach((heading) => {
        const name = heading.textContent?.trim();
        if (name) map.set(name, 1);
      });
    }
    return map;
  }

  function makeInfoTip(label) {
    const tip = document.createElement("button");
    tip.type = "button";
    tip.className = "info-tip";
    tip.textContent = "i";
    tip.setAttribute("aria-label", `About ${label}`);
    tip.dataset.tooltip = metrics[label];
    tip.addEventListener("click", (event) => {
      event.stopPropagation();
      document.querySelectorAll(".tip-open").forEach((node) => {
        if (node !== tip) node.classList.remove("tip-open");
      });
      tip.classList.toggle("tip-open");
    });
    return tip;
  }

  function compactNumber(value) {
    if (!Number.isFinite(value)) return "—";
    return new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: value >= 1e9 ? 2 : 1 }).format(value);
  }

  function exactNumber(value) {
    if (!Number.isFinite(value)) return "Not available";
    return new Intl.NumberFormat("en").format(value);
  }

  function fixBigThreeCards() {
    const cards = Array.from(document.querySelectorAll("#alltime > .grid > .relative")).slice(0, 3);
    cards.forEach((card) => {
      card.classList.add("big-three-card");
      const media = card.firstElementChild;
      const badge = card.querySelector(":scope > .absolute.bottom-3.left-3");
      if (media && badge) {
        media.classList.add("big-three-media");
        media.append(badge);
      }
    });
  }

  function hydrateKnownPortraits() {
    if (!currentArtists.length) return;
    const byName = new Map(currentArtists.map((artist) => [artist.name.toLowerCase(), artist]));
    document.querySelectorAll("img[alt]").forEach((image) => {
      const artist = byName.get(image.alt.trim().toLowerCase());
      if (!artist) return;
      image.removeAttribute("onerror");
      image.src = artist.image;
      image.dataset.fallbackSrc = artist.imageFallback || "";
      image.decoding = "async";
    });
  }

  function renderCurrentChart() {
    const section = document.getElementById("current");
    if (!section || !currentArtists.length) return;
    const description = section.querySelector("h2 + p");
    if (description) {
      description.innerHTML = `The same nine cross-era signals, plus <strong>Total Spotify streams</strong> and <strong>Monthly listeners</strong> as separate metrics. Open any row for the artist file, exact figures and source links.`;
    }

    const oldList = section.querySelector(":scope > .border-t");
    if (!oldList) return;
    const list = document.createElement("div");
    list.className = "current-ranking";
    list.setAttribute("aria-label", "Current Afrobeats artist ranking");
    list.innerHTML = currentArtists.map((artist) => {
      const tags = artist.genres.map((genre) => `<span>${genre}</span>`).join("");
      return `<button class="current-row" type="button" data-name="${artist.name}" data-rank="${artist.rank}" data-artist-slug="${artist.slug}" aria-label="Open ${artist.name} artist file">
        <span class="current-rank">${String(artist.rank).padStart(2, "0")}</span>
        <span class="current-avatar"><img src="${artist.image}" data-fallback-src="${artist.imageFallback || ""}" alt="${artist.name}" loading="lazy" decoding="async"></span>
        <span class="current-identity">
          <span class="current-kicker">${artist.tagline}</span>
          <span class="current-name-line"><span class="current-name">${artist.name}</span></span>
          <span class="current-blurb">${artist.bio}</span>
          <span class="current-tags">${tags}</span>
        </span>
        <span class="current-streams">
          <span><small>Monthly listeners</small><strong>${compactNumber(artist.monthlyListeners)}</strong></span>
          <span><small>Total Spotify streams</small><strong>${compactNumber(artist.totalSpotifyStreams)}</strong></span>
        </span>
        <span class="current-score"><small>${artist.country}</small><strong>${artist.score.toFixed(1)}</strong><i style="--score:${artist.score}%"></i></span>
      </button>`;
    }).join("");
    oldList.replaceWith(list);

    const note = document.createElement("aside");
    note.className = "stream-source-note";
    note.innerHTML = `<span class="live-dot" aria-hidden="true"></span><p><strong>Data desk · 28 Aug 2026.</strong> Monthly listeners are rolling Spotify audiences; catalogue streams are cumulative tracked totals. Both move daily and are evidence inside the Current formula, not the whole verdict. Portraits use public Spotify artist imagery; image rights remain with the artists and rights-holders. <a href="https://www.musicmetricsvault.com/genres/afrobeats/109" target="_blank" rel="noopener noreferrer">Monthly source ↗</a> <a href="https://kworb.net/spotify/" target="_blank" rel="noopener noreferrer">Stream source ↗</a></p>`;
    list.insertAdjacentElement("afterend", note);

    list.addEventListener("click", (event) => {
      const row = event.target.closest("[data-artist-slug]");
      if (row) openCurrentArtist(row.dataset.artistSlug);
    });
  }

  function ensureArtistDialog() {
    let dialog = document.getElementById("current-artist-dialog");
    if (dialog) return dialog;
    dialog = document.createElement("dialog");
    dialog.id = "current-artist-dialog";
    dialog.className = "artist-dialog";
    dialog.innerHTML = `<div class="artist-dialog-shell"><button class="artist-dialog-close" type="button" aria-label="Close artist file">×</button><div class="artist-dialog-content"></div></div>`;
    dialog.querySelector(".artist-dialog-close").addEventListener("click", () => dialog.close());
    dialog.addEventListener("click", (event) => { if (event.target === dialog) dialog.close(); });
    dialog.addEventListener("close", () => document.body.classList.remove("dialog-open"));
    document.body.append(dialog);
    return dialog;
  }

  function openCurrentArtist(slug) {
    const artist = currentArtists.find((entry) => entry.slug === slug);
    if (!artist) return;
    const dialog = ensureArtistDialog();
    dialog.dataset.artistSlug = slug;
    const previous = artist.previousRank;
    const delta = previous == null ? null : previous - artist.rank;
    const move = previous == null ? "New to the published Current 50" : delta > 0 ? `Up ${delta} from #${previous}` : delta < 0 ? `Down ${Math.abs(delta)} from #${previous}` : `Holding at #${artist.rank}`;
    dialog.querySelector(".artist-dialog-content").innerHTML = `
      <div class="artist-dialog-media"><img src="${artist.image}" data-fallback-src="${artist.imageFallback || ""}" alt="Portrait of ${artist.name}"></div>
      <article class="artist-dialog-copy">
        <p class="eyebrow">Current artist file · #${artist.rank}</p>
        <h2>${artist.name}</h2>
        <p class="artist-dialog-tagline">${artist.tagline}</p>
        <p class="artist-dialog-bio">${artist.bio}</p>
        <div class="artist-dialog-metrics">
          <div><small>Monthly listeners</small><strong>${compactNumber(artist.monthlyListeners)}</strong><span>${exactNumber(artist.monthlyListeners)}</span></div>
          <div><small>Total Spotify streams</small><strong>${compactNumber(artist.totalSpotifyStreams)}</strong><span>${exactNumber(artist.totalSpotifyStreams)}</span></div>
          <div><small>Daily tracked streams</small><strong>${compactNumber(artist.dailySpotifyStreams)}</strong><span>${exactNumber(artist.dailySpotifyStreams)}</span></div>
          <div><small>Chart movement</small><strong>${move}</strong><span>Since the previous editorial snapshot</span></div>
        </div>
        <div class="artist-dialog-footer"><span>${artist.country} · ${artist.genres.join(" / ")}</span><span><a href="${artist.spotifyUrl}" target="_blank" rel="noopener noreferrer">Spotify ↗</a><a href="${artist.sources.catalogue}" target="_blank" rel="noopener noreferrer">Stream ledger ↗</a></span></div>
      </article>`;
    addImageFallbacks(dialog);
    document.body.classList.add("dialog-open");
    if (typeof dialog.showModal === "function") dialog.showModal();
    else dialog.setAttribute("open", "");
  }

  window.openCurrentArtist = openCurrentArtist;

  function addMetricStrips() {
    Object.entries(weights).forEach(([sectionId, list]) => {
      const section = document.getElementById(sectionId);
      if (!section || section.querySelector(".metric-strip, .metric-audit")) return;
      if (sectionId === "current") {
        const audit = document.createElement("section");
        audit.className = "metric-audit";
        audit.setAttribute("aria-label", "Current index weighting table");
        const groups = [
          { title: "Nine cross-era signals", total: 83, items: list.slice(0, 9) },
          { title: "Two streaming metrics", total: 17, items: list.slice(9) }
        ];
        audit.innerHTML = groups.map((group) => `
          <div class="metric-group">
            <div class="metric-group-head"><span>${group.title}</span><strong>${group.total}%</strong></div>
            <div class="metric-group-list">${group.items.map(([label, weight]) => `<span class="metric-chip">${label}<strong>${weight}%</strong></span>`).join("")}</div>
          </div>`).join("");
        audit.querySelectorAll(".metric-chip").forEach((chip) => {
          const label = chip.firstChild.textContent.trim();
          chip.append(makeInfoTip(label));
        });
        const rail = document.createElement("div");
        rail.className = "methodology-rail";
        rail.innerHTML = `<p><strong>How the Current score works</strong>Cross-era evidence keeps the ranking grounded; Spotify catalogue streams and monthly listeners measure present scale without controlling the result.</p><div class="methodology-actions"><button class="methodology-link" type="button" data-method-link>Read full method</button><button class="compare-text" type="button" data-compare-toggle aria-expanded="false">Compare eras ↗</button></div>`;
        rail.querySelector("[data-method-link]").addEventListener("click", () => showTab("method"));
        const description = section.querySelector("h2 + p");
        description?.insertAdjacentElement("afterend", audit);
        audit.insertAdjacentElement("afterend", rail);
        return;
      }
      const strip = document.createElement("div");
      strip.className = "metric-strip";
      strip.setAttribute("aria-label", `${sectionId === "alltime" ? "All-Time" : "Current"} weighted metrics`);
      list.forEach(([label, weight]) => {
        const chip = document.createElement("span");
        chip.className = "metric-chip";
        chip.append(document.createTextNode(label + " "));
        const strong = document.createElement("strong");
        strong.textContent = `${weight}%`;
        chip.append(strong, makeInfoTip(label));
        strip.append(chip);
      });
      const description = section.querySelector("h2 + p");
      description?.insertAdjacentElement("afterend", strip);
    });
  }

  function enhanceMethodMetrics() {
    document.querySelectorAll("#method .flex.justify-between").forEach((row) => {
      const labelNode = row.querySelector("span:last-child");
      if (!labelNode || labelNode.querySelector(".info-tip")) return;
      const label = Object.keys(metrics).find((key) => labelNode.textContent.trim().startsWith(key));
      if (label) labelNode.append(makeInfoTip(label));
    });
  }

  function renderCurrentMethod() {
    const method = document.getElementById("method");
    const columns = method ? Array.from(method.querySelectorAll(":scope > .grid > div")) : [];
    const currentColumn = columns[1];
    if (!currentColumn) return;
    const heading = currentColumn.querySelector("h3");
    const list = currentColumn.querySelector(":scope > .border-t");
    const note = currentColumn.querySelector(":scope > p:last-child");
    if (heading) heading.textContent = "Current (11 weighted metrics)";
    if (list) {
      list.innerHTML = weights.current.map(([label, weight], index) => `<div class="flex justify-between py-2 border-b"><span class="text-[#0047ff]">${String(index + 1).padStart(2, "0")}</span><span${index > 8 ? ' class="font-medium"' : ""}>${label} ${weight}%</span></div>`).join("");
    }
    if (note) note.textContent = "Monthly listeners and total Spotify streams are separate Current signals: one captures recent reach; the other captures catalogue depth. Together they account for 17%, so platform scale informs the ranking without controlling it.";
  }

  function updateDiscussionCopy() {
    document.querySelectorAll("#discuss p").forEach((paragraph) => {
      if (!paragraph.textContent.includes("Current uses the exact same nine metrics")) return;
      paragraph.textContent = "Current keeps the same nine cross-era metrics, then adds two Spotify signals: cumulative catalogue streams and rolling monthly listeners. They are deliberately separated because a deep catalogue and a hot 28-day audience describe different kinds of power.";
    });
  }

  function updateFooter() {
    const footer = document.querySelector("footer p");
    if (footer) footer.textContent = "AFR/INDEX · Living edition 2026 · 50 All-Time · 50 Current · 11 Current metrics · Editorial rankings, transparent sources";
  }

  function addFreshnessModule() {
    const hero = document.querySelector("main > section:first-child");
    if (!hero) return;
    const module = document.createElement("section");
    module.className = "freshness-module";
    module.setAttribute("aria-labelledby", "freshness-title");
    module.innerHTML = `
      <div class="freshness-grid">
        <div class="sync-status">
          <span class="sync-state"><span class="live-dot" aria-hidden="true"></span>Index status <span class="status-pill">LIVE · VERIFIED SNAPSHOT</span></span>
          <span>Last successful data sync · 07 Sep 2026 · 01:00 WAT</span>
        </div>
        <div class="update-stamp">
          <div class="update-pair">
            <div><p class="eyebrow" id="freshness-title">Last updated</p><p class="update-date"><time datetime="2026-08-28">28 Aug<br>2026</time></p></div>
            <div><p class="eyebrow">Next refresh</p><p class="next-refresh"><time datetime="2026-09-14">14 Sep<br>2026</time></p></div>
          </div>
          <p class="update-meta">Current chart · Weekly editorial cadence</p>
        </div>
        <div class="weekly-log">
          <div class="weekly-log-head">
            <p class="eyebrow">Update ledger</p>
          </div>
          <ul>
            <li><span>07 SEP 2026</span><span><strong>All 50 Spotify artist ledgers and the Nigeria Top 100 were refreshed</strong> from their live source pages.</span></li>
            <li><span>28 AUG 2026</span><span><strong>Tems, Rema and Tyla moved into the top four</strong> after the full data refresh.</span></li>
            <li><span>28 AUG 2026</span><span><strong>JAZZWRLD, CIZA and Shoday entered</strong> a broader pan-African Current list.</span></li>
          </ul>
          <div class="chart-tools">
            <p class="eyebrow">Every published change leaves a dated trail.</p>
            <button class="compare-text" type="button" data-compare-toggle aria-expanded="false">Compare eras ↗</button>
          </div>
        </div>
      </div>`;
    hero.insertAdjacentElement("afterend", module);
  }

  function movementClass(delta, isNew) {
    if (isNew) return "movement movement-new";
    if (delta > 0) return "movement movement-up";
    if (delta < 0) return "movement movement-down";
    return "movement movement-flat";
  }

  function addMovements() {
    const rows = rankedRows("current");
    const current = Object.fromEntries(rows.map(({ name, rank }) => [name, rank]));
    const seededPrevious = Object.fromEntries(currentArtists.map((artist) => [artist.name, artist.previousRank]));
    let previous = seededPrevious;

    try {
      const saved = JSON.parse(localStorage.getItem(SNAPSHOT_KEY) || "null");
      if (saved?.version === UPDATE_VERSION && saved.previous) previous = saved.previous;
      else if (saved?.current) previous = saved.current;
      localStorage.setItem(SNAPSHOT_KEY, JSON.stringify({ version: UPDATE_VERSION, previous, current }));
    } catch (_) {
      previous = seededPrevious;
    }

    rows.forEach(({ name, rank, row }) => {
      const heading = row.querySelector(".current-name-line") || row.querySelector("h3");
      if (!heading || heading.querySelector(".movement")) return;
      const oldRank = previous[name];
      const isNew = oldRank == null;
      const delta = isNew ? 0 : oldRank - rank;
      const badge = document.createElement("span");
      badge.className = movementClass(delta, isNew);
      badge.title = isNew ? "New entry this update" : delta > 0 ? `Up ${delta} from #${oldRank}` : delta < 0 ? `Down ${Math.abs(delta)} from #${oldRank}` : "No movement this update";
      badge.setAttribute("aria-label", badge.title);
      badge.textContent = isNew ? "NEW" : delta > 0 ? `↑ ${delta}` : delta < 0 ? `↓ ${Math.abs(delta)}` : "—";
      heading.append(badge);
    });
  }

  function buildCompareView() {
    const alltime = rankingMap("alltime");
    const current = rankingMap("current");
    const names = Array.from(new Set([...alltime.keys(), ...current.keys()])).sort((a, b) => {
      const aRank = current.get(a) ?? 999;
      const bRank = current.get(b) ?? 999;
      return aRank - bRank || (alltime.get(a) ?? 999) - (alltime.get(b) ?? 999) || a.localeCompare(b);
    });

    const section = document.createElement("section");
    section.id = "era-compare";
    section.className = "era-compare";
    section.hidden = true;
    section.innerHTML = `
      <div class="compare-shell">
        <div class="compare-head">
          <div><p class="eyebrow">One artist, two conversations</p><h2>Compare eras.</h2></div>
          <div class="compare-actions">
            <label class="sr-only" for="compare-search">Find an artist</label>
            <input id="compare-search" class="compare-search" type="search" placeholder="Find an artist…" autocomplete="off">
            <button class="compare-close" type="button" aria-label="Close era comparison">×</button>
          </div>
        </div>
        <div class="compare-labels"><span>Artist</span><span>All-Time</span><span>Current</span><span>Read</span></div>
        <div class="compare-results"></div>
      </div>`;

    const results = section.querySelector(".compare-results");
    const render = (query = "") => {
      const filtered = names.filter((name) => name.toLowerCase().includes(query.trim().toLowerCase()));
      results.innerHTML = filtered.length ? filtered.map((name) => {
        const allRank = alltime.get(name);
        const currentRank = current.get(name);
        const state = allRank && currentRank ? "Both charts" : currentRank ? "Current only" : "All-Time only";
        return `<div class="compare-row" data-compare-name="${name.toLowerCase()}">
          <span class="compare-name">${name}</span>
          <span class="compare-rank">${allRank ? `#${allRank}` : "—"}</span>
          <span class="compare-rank compare-current">${currentRank ? `#${currentRank}` : "—"}</span>
          <span class="compare-state">${state}</span>
        </div>`;
      }).join("") : `<p class="compare-empty">No artist matches that search.</p>`;
    };
    render();
    section.querySelector(".compare-search").addEventListener("input", (event) => render(event.target.value));
    section.querySelector(".compare-close").addEventListener("click", () => setCompareOpen(false));
    document.querySelector(".freshness-module")?.insertAdjacentElement("afterend", section);
  }

  function setCompareOpen(open) {
    const section = document.getElementById("era-compare");
    if (!section) return;
    section.hidden = !open;
    document.querySelectorAll("[data-compare-toggle]").forEach((button) => button.setAttribute("aria-expanded", String(open)));
    if (open) {
      section.scrollIntoView({ behavior: "smooth", block: "start" });
      setTimeout(() => section.querySelector(".compare-search")?.focus({ preventScroll: true }), 350);
    }
  }

  function addChartButtons() {
    ["alltime"].forEach((id) => {
      const section = document.getElementById(id);
      const strip = section?.querySelector(".metric-strip");
      if (!strip) return;
      const tools = document.createElement("div");
      tools.className = "chart-tools";
      tools.innerHTML = `<p class="eyebrow">Rankings are easier to argue with when you can see both sides.</p><button class="compare-text" type="button" data-compare-toggle aria-expanded="false">Compare eras ↗</button>`;
      strip.insertAdjacentElement("afterend", tools);
    });
    document.querySelectorAll("[data-compare-toggle]").forEach((button) => button.addEventListener("click", () => {
      const section = document.getElementById("era-compare");
      setCompareOpen(Boolean(section?.hidden));
    }));
  }

  function addMethodStory() {
    const method = document.getElementById("method");
    if (!method || method.querySelector(".method-notes")) return;
    const notes = document.createElement("section");
    notes.className = "method-notes";
    notes.innerHTML = `
      <p class="eyebrow">Behind the index</p>
      <p class="method-intro">I built AFR/INDEX because I got tired of “greatest Afrobeats artists” lists that felt like <em>fan wars with numbers added later.</em> I wanted the argument to start with a method you could inspect — even if you still disagree with the result.</p>
      <div class="build-grid">
        <article class="build-card"><span class="build-number">01</span><h3>Built</h3><p>A cross-era weighting formula that does not punish Fela, 2Baba or P-Square for doing their best work before Spotify existed.</p></article>
        <article class="build-card"><span class="build-number">02</span><h3>Learned</h3><p>Public numbers fight each other. One tracker says one thing, another says something else — and net-worth pages are worse. The honest answer is ranges, source notes and calling an estimate an estimate.</p></article>
        <article class="build-card"><span class="build-number">03</span><h3>Challenge</h3><p>Ranking real people means every score has to survive the obvious question: “Why is this artist above that one?” Being defensible matters more than pretending the list is perfect.</p></article>
      </div>`;
    method.append(notes);
  }

  function addImageFallbacks(root = document) {
    root.querySelectorAll("img").forEach((image) => {
      if (image.dataset.fallbackBound === "true") return;
      image.dataset.fallbackBound = "true";
      const applyFallback = () => {
        if (image.dataset.fallbackSrc && image.dataset.fallbackTried !== "true") {
          image.dataset.fallbackTried = "true";
          image.src = image.dataset.fallbackSrc;
          return;
        }
        const parent = image.parentElement;
        if (!parent || parent.classList.contains("artist-fallback")) return;
        const initials = (image.alt || "AF").split(/\s+/).map((word) => word[0]).join("").slice(0, 2).toUpperCase();
        parent.classList.add("artist-fallback");
        parent.dataset.initials = initials;
      };
      image.addEventListener("error", applyFallback, { once: true });
      if (image.complete && image.naturalWidth === 0) applyFallback();
    });
  }

  function enhanceTabs() {
    document.querySelectorAll("nav").forEach((nav) => nav.setAttribute("role", "tablist"));
    const originalShowTab = window.showTab;
    if (typeof originalShowTab !== "function") return;
    window.showTab = function (id) {
      originalShowTab(id);
      document.querySelectorAll(".nav-btn").forEach((button) => {
        const selected = button.classList.contains("nav-active");
        button.setAttribute("aria-selected", String(selected));
        button.setAttribute("role", "tab");
      });
    };
    window.showTab("current");
  }

  function init() {
    hydrateKnownPortraits();
    fixBigThreeCards();
    renderCurrentChart();
    addFreshnessModule();
    addMetricStrips();
    renderCurrentMethod();
    enhanceMethodMetrics();
    updateDiscussionCopy();
    updateFooter();
    addMovements();
    buildCompareView();
    addChartButtons();
    addMethodStory();
    addImageFallbacks();
    enhanceTabs();
    document.addEventListener("click", () => document.querySelectorAll(".tip-open").forEach((node) => node.classList.remove("tip-open")));
    const edition = document.querySelector("body > div:first-child span:last-child");
    if (edition) edition.textContent = "Living index · Updated 28 Aug 2026";
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
