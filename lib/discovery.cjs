const underground = require('../data/underground.json');
const { escape: e } = require('./shared.cjs');

function discoveryBoard(current, edition = underground) {
  const excluded = new Set(current.artists.map(a => a.slug));
  const artists = edition.artists.filter(a => !excluded.has(a.slug))
    .slice().sort((a, b) => a.order - b.order)
    .map((a, i) => ({ ...a, rank: i + 1, previousRank: null }));
  return { ...edition, artists, spotlight: artists.find(a => a.slug === edition.spotlightSlug) || artists[0] || null };
}

function signupMarkup(id, source) {
  return `<section class="afri-signup" id="${e(id)}" data-newsletter-signup data-source="${e(source)}" aria-labelledby="${e(id)}-title">
    <div><p class="discovery-kicker">THE SUNDAY BRIEF</p><h2 id="${e(id)}-title">Your next favourite. In your inbox.</h2><p>The Top 10, the biggest movers, one head-to-head and an underground artist to put on repeat. One email each Sunday.</p><a href="/newsletter">Read the latest brief ↗</a></div>
    <form><label for="${e(id)}-email">Email address</label><div class="signup-controls"><input id="${e(id)}-email" name="email" type="email" autocomplete="email" placeholder="you@example.com" maxlength="254" required disabled><button disabled>Get the Sunday brief</button></div><label class="signup-consent"><input name="consent" type="checkbox" required disabled> Send me Afri Index's weekly brief, including labelled sponsor placements.</label><div class="signup-trap" aria-hidden="true"><label>Website<input name="website" tabindex="-1" autocomplete="off"></label></div><p class="signup-status" role="status" aria-live="polite">Checking signup availability…</p><small>Confirm your email to join. Unsubscribe whenever you like. <a href="/newsletter#privacy">Privacy</a></small></form>
  </section>`;
}

function discoveryMarkup(board, { compact = false } = {}) {
  const spotlight = board.spotlight;
  return `<div class="discovery-head"><div><p class="discovery-kicker">AFRI INDEX · DISCOVERY DESK</p><h${compact ? '2' : '1'}>Underground <span>${board.artists.length}</span></h${compact ? '2' : '1'}><p>A ranking of what to hear next.</p></div><div class="discovery-edition"><strong>Edition ${e(board.edition)}</strong><span>${e(board.scope)}</span><a href="#underground-method">How we choose ↘</a></div></div>
  <p class="discovery-intro">A separate stage for artists building their own sound. Press play, find someone new, and help the music travel.</p>
  ${spotlight ? `<article class="discovery-spotlight" id="spotlight"><div class="spotlight-monogram" aria-hidden="true">${e(spotlight.name.slice(0, 1).toUpperCase())}<span>01 / ON REPEAT</span></div><div><p class="discovery-kicker">ARTIST TO PUT ON · EDITORIAL PICK</p><h2>${e(spotlight.name)}</h2><p>${e(spotlight.note)}</p><p class="spotlight-track">Start here: <strong>${e(spotlight.track)}</strong></p><div class="discovery-actions"><a class="discovery-button" href="${e(spotlight.listenUrl)}" target="_blank" rel="noopener noreferrer">Listen ↗</a><a href="${e(spotlight.profileUrl)}" target="_blank" rel="noopener noreferrer">Follow the artist ↗</a><button type="button" data-share-underground="${e(spotlight.slug)}" data-artist="${e(spotlight.name)}">Put someone on ↗</button></div><p class="discovery-fine">Chosen for discovery. This placement is unpaid.</p></div></article>` : ''}
  <div class="discovery-chart-head"><span>THE LISTENING ORDER</span><span>ENTRY POINT</span></div><ol class="discovery-ranking">${board.artists.map(a => `<li id="underground-${e(a.slug)}"><span class="discovery-position">${String(a.rank).padStart(2,'0')}</span><div class="discovery-artist"><h3>${e(a.name)}</h3><span>${e(a.sound)} · ${a.previousRank === null ? 'First edition' : 'Editorial pick'}</span><p>${e(a.note)}</p></div><div class="discovery-listen"><a href="${e(a.listenUrl)}" target="_blank" rel="noopener noreferrer">${e(a.track)} <span aria-hidden="true">↗</span></a><button type="button" data-share-underground="${e(a.slug)}" data-artist="${e(a.name)}" aria-label="Share ${e(a.name)}">Share artist</button><a class="discovery-fine" href="${e(a.profileUrl)}" target="_blank" rel="noopener noreferrer">Artist profile ↗</a></div></li>`).join('')}</ol><p class="discovery-fine">First edition: movement will appear only when a second editorial edition is published. <a href="/newsletter#signup">Get this in your inbox ↗</a></p>
  <details class="discovery-method" id="underground-method"><summary>What these positions mean</summary><p>${e(board.method)}</p><p>Source checks establish songs and artist activity. The listening order belongs to Afri Index; it is not The FADER's ranking.</p><a href="${e(board.source.url)}" target="_blank" rel="noopener noreferrer">${e(board.source.label)} ↗</a><p>Sources checked ${e(board.source.checkedAt)}. No follower counts, stream totals or score estimates are used.</p></details>
  <section class="discovery-watchlist"><p class="discovery-kicker">STILL ON OUR RADAR</p><h2>The watchlist stays.</h2><p>These names remain from our original watchlist. Each needs a completed source review before entering the ranked edition.</p><div>${board.watchlist.map(a => `<span>${e(a.name)}${a.track ? `<small>Previously listed: ${e(a.track)}</small>` : ''}</span>`).join('')}</div></section>`;
}
module.exports = { discoveryBoard, discoveryMarkup, signupMarkup };
