(function () {
  const VOTE_KEY_PREFIX = "afri-index-vs-vote:";
  function artists() {
    return Array.isArray(window.AFRI_CURRENT_ARTISTS) ? window.AFRI_CURRENT_ARTISTS : [];
  }
  function bySlug(slug) {
    return artists().find((a) => a.slug === slug);
  }
  function compactNumber(value) {
    if (!Number.isFinite(value)) return "—";
    return new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: value >= 1e9 ? 2 : 1 }).format(value);
  }
  function pairKey(slugA, slugB) {
    return VOTE_KEY_PREFIX + [slugA, slugB].sort().join("__");
  }
  function getVotes(slugA, slugB) {
    try {
      const raw = localStorage.getItem(pairKey(slugA, slugB));
      const parsed = raw ? JSON.parse(raw) : {};
      return { [slugA]: parsed[slugA] || 0, [slugB]: parsed[slugB] || 0 };
    } catch (_) {
      return { [slugA]: 0, [slugB]: 0 };
    }
  }
  function castVote(slugA, slugB, pick) {
    const votes = getVotes(slugA, slugB);
    votes[pick] = (votes[pick] || 0) + 1;
    try {
      localStorage.setItem(pairKey(slugA, slugB), JSON.stringify(votes));
      localStorage.setItem(pairKey(slugA, slugB) + ":voted", "1");
    } catch (_) { /* storage unavailable — vote just won't persist */ }
    return votes;
  }
  function hasVoted(slugA, slugB) {
    try {
      return localStorage.getItem(pairKey(slugA, slugB) + ":voted") === "1";
    } catch (_) {
      return false;
    }
  }
  function populateSelects() {
    const list = artists().slice().sort((a, b) => a.name.localeCompare(b.name));
    const selA = document.getElementById("vs-select-a");
    const selB = document.getElementById("vs-select-b");
    if (!selA || !selB || !list.length) return;
    const options = list.map((a) => `<option value="${a.slug}">${a.name}</option>`).join("");
    selA.innerHTML = options;
    selB.innerHTML = options;
    selA.value = list[0]?.slug;
    selB.value = list[1]?.slug || list[0]?.slug;
  }
  function metricRow(label, a, b, formatFn) {
    const av = Number(a) || 0;
    const bv = Number(b) || 0;
    const total = av + bv;
    const leftPct = total ? Math.round((av / total) * 100) : 50;
    const rightPct = 100 - leftPct;
    const aLead = av > bv;
    const bLead = bv > av;
    return `
      <div class="vs-metric">
        <span class="vs-metric-label">${label}</span>
        <span class="vs-metric-val vs-left${aLead ? " vs-lead" : ""}">${formatFn(av)}</span>
        <span></span>
        <span class="vs-metric-val vs-right${bLead ? " vs-lead" : ""}">${formatFn(bv)}</span>
        <div class="vs-metric-bar"><span class="vs-bar-left" style="width:${leftPct}%"></span><span class="vs-bar-right" style="width:${rightPct}%"></span></div>
      </div>`;
  }
  function renderVoteBar(artistA, artistB) {
    const votes = getVotes(artistA.slug, artistB.slug);
    const total = votes[artistA.slug] + votes[artistB.slug];
    const leftPct = total ? Math.round((votes[artistA.slug] / total) * 100) : 50;
    const rightPct = 100 - leftPct;
    const voted = hasVoted(artistA.slug, artistB.slug);
    return `
      <div class="vs-vote">
        <div class="vs-vote-head">
          <p class="eyebrow">Who wins this one? (community pick, this browser)</p>
          <span class="vs-vote-total">${total} vote${total === 1 ? "" : "s"}</span>
        </div>
        <div class="vs-vote-bar">
          <div class="vs-vote-fill vs-fill-left" style="width:${leftPct}%"></div>
          <div class="vs-vote-fill vs-fill-right" style="width:${rightPct}%"></div>
          <button type="button" data-vote-slug="${artistA.slug}" ${voted ? "disabled" : ""}>${artistA.name}<span class="vs-vote-pct">${leftPct}%</span></button>
          <button type="button" data-vote-slug="${artistB.slug}" ${voted ? "disabled" : ""}>${artistB.name}<span class="vs-vote-pct">${rightPct}%</span></button>
        </div>
        ${voted ? '<p class="vs-voted-note">Thanks — your pick is counted for this matchup.</p>' : ""}
      </div>`;
  }
  function renderComparison(slugA, slugB) {
    const output = document.getElementById("vs-output");
    if (!output) return;
    const a = bySlug(slugA);
    const b = bySlug(slugB);
    if (!a || !b) {
      output.innerHTML = `<div class="vs-empty">Pick two artists to compare.</div>`;
      return;
    }
    if (a.slug === b.slug) {
      output.innerHTML = `<div class="vs-empty">Pick two <em>different</em> artists to compare.</div>`;
      return;
    }
    const aWins = a.score > b.score;
    const bWins = b.score > a.score;
    const winner = aWins ? a : bWins ? b : null;
    const imgTag = (artist) => {
      const fallback = (artist.imageFallback || "").replace(/'/g, "\\'");
      return `<img src="${artist.image}" alt="${artist.name}" onerror="if(!this.dataset.tried){this.dataset.tried='1';this.src='${fallback}';}else{this.style.opacity=.25;}">`;
    };
    output.innerHTML = `
      <div class="vs-result">
        <div class="vs-heads">
          <div class="vs-head${aWins ? " vs-winner" : ""}">
            ${aWins ? '<span class="vs-crown">★ Current edge</span>' : ""}
            <div class="vs-head-photo">${imgTag(a)}</div>
            <h3>${a.name}</h3>
            <p class="vs-country">${a.country} · ${a.tagline}</p>
            <div class="vs-genres">${a.genres.map((g) => `<span>${g}</span>`).join("")}</div>
          </div>
          <div class="vs-mid-mark">VS</div>
          <div class="vs-head${bWins ? " vs-winner" : ""}">
            ${bWins ? '<span class="vs-crown">★ Current edge</span>' : ""}
            <div class="vs-head-photo">${imgTag(b)}</div>
            <h3>${b.name}</h3>
            <p class="vs-country">${b.country} · ${b.tagline}</p>
            <div class="vs-genres">${b.genres.map((g) => `<span>${g}</span>`).join("")}</div>
          </div>
        </div>
        <div class="vs-bio-row"><div>${a.bio}</div><div>${b.bio}</div></div>
        ${metricRow("Current Power Score", a.score, b.score, (v) => v.toFixed(1))}
        ${metricRow("Monthly listeners", a.monthlyListeners, b.monthlyListeners, compactNumber)}
        ${metricRow("Total Spotify streams", a.totalSpotifyStreams, b.totalSpotifyStreams, compactNumber)}
        ${metricRow("Daily tracked streams", a.dailySpotifyStreams, b.dailySpotifyStreams, compactNumber)}
        <div class="vs-verdict">
          <p class="eyebrow">Verdict</p>
          ${winner
            ? `<p>On the Current Power Score, <strong>${winner.name}</strong> has the edge right now (${winner.score.toFixed(1)} vs ${(winner === a ? b : a).score.toFixed(1)}). Streaming reach and momentum can shift this week to week — vote below with your own take.</p>`
            : `<p>Dead even on the Current Power Score (${a.score.toFixed(1)}). This one's genuinely a coin flip.</p>`}
        </div>
        ${renderVoteBar(a, b)}
      </div>`;
    output.querySelectorAll("[data-vote-slug]").forEach((button) => {
      button.addEventListener("click", () => {
        if (hasVoted(a.slug, b.slug)) return;
        castVote(a.slug, b.slug, button.dataset.voteSlug);
        renderComparison(a.slug, b.slug);
      });
    });
  }
  function currentPair() {
    const selA = document.getElementById("vs-select-a");
    const selB = document.getElementById("vs-select-b");
    return [selA?.value, selB?.value];
  }
  function syncFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const vs = params.get("vs");
    if (!vs) return false;
    const [slugA, slugB] = vs.split(",").map((s) => s.trim());
    const selA = document.getElementById("vs-select-a");
    const selB = document.getElementById("vs-select-b");
    if (!bySlug(slugA) || !bySlug(slugB) || !selA || !selB) return false;
    selA.value = slugA;
    selB.value = slugB;
    return true;
  }
  function initVsSection() {
    if (!document.getElementById("vs-select-a")) return;
    populateSelects();
    const deepLinked = syncFromUrl();
    const selA = document.getElementById("vs-select-a");
    const selB = document.getElementById("vs-select-b");
    const randomBtn = document.getElementById("vs-random-btn");
    const shareBtn = document.getElementById("vs-share-btn");
    const rerender = () => {
      const [slugA, slugB] = currentPair();
      renderComparison(slugA, slugB);
    };
    selA.addEventListener("change", rerender);
    selB.addEventListener("change", rerender);
    randomBtn?.addEventListener("click", () => {
      const list = artists();
      if (list.length < 2) return;
      let i = Math.floor(Math.random() * list.length);
      let j = Math.floor(Math.random() * list.length);
      while (j === i) j = Math.floor(Math.random() * list.length);
      selA.value = list[i].slug;
      selB.value = list[j].slug;
      rerender();
    });
    shareBtn?.addEventListener("click", async () => {
      const [slugA, slugB] = currentPair();
      const url = new URL(window.location.href);
      url.hash = "";
      url.searchParams.set("vs", `${slugA},${slugB}`);
      const link = url.toString();
      try {
        await navigator.clipboard.writeText(link);
        shareBtn.textContent = "Link copied!";
      } catch (_) {
        window.prompt("Copy this link:", link);
      }
      setTimeout(() => { shareBtn.textContent = "Copy link to this matchup"; }, 1800);
    });
    rerender();
    if (deepLinked && typeof window.showTab === "function") window.showTab("vs");
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initVsSection);
  else initVsSection();
})();
