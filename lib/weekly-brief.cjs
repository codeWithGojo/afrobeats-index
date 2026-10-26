const { origin, escape: e } = require('./shared.cjs');
const { discoveryBoard } = require('./discovery.cjs');

function sundayDate(now = new Date()) {
  // Lagos has a fixed UTC+1 offset; issue keys follow the reader's local Sunday.
  const date = new Date(now.getTime() + 3600000);
  date.setUTCDate(date.getUTCDate() - date.getUTCDay());
  return date.toISOString().slice(0, 10);
}
function buildBrief(data, now = new Date()) {
  const artists = data.artists.map(({slug,name,rank,previousRank,score}) => ({slug,name,rank,previousRank,score})).sort((a,b) => a.rank - b.rank);
  const top10 = artists.slice(0,10);
  const movers = artists.filter(a => Number.isInteger(a.previousRank) && a.previousRank > a.rank)
    .map(a => ({...a, movement: a.previousRank - a.rank}))
    .sort((a,b) => b.movement - a.movement || a.rank - b.rank).slice(0,5);
  const pair = top10.slice(0,2);
  const headToHead = pair.length === 2 && pair.every(a => Number.isFinite(a.score))
    ? { artists: pair, gap: Math.abs(pair[0].score - pair[1].score), metric: 'published index points' } : null;
  return {
    issue: sundayDate(now), chartAsOf: data.asOf, top10, movers, headToHead,
    rising: discoveryBoard(data).spotlight,
    commentary: [
      top10[0] ? `${top10[0].name} leads the published Current chart. The Top 10 below follows that edition's order.` : 'The next chart edition is still being prepared.',
      'This issue opens a door into Artists to Watch. Start with the featured song, then pass it to a friend.'
    ],
    movementNote: 'Movement compares the published rank with its stored previous rank. These are available snapshots, not a complete seven-day tracking series.'
  };
}
function briefMarkup(brief) {
 const watch=brief.watchUpdates?.length?`<section class="brief-section"><h2>Artists you watch</h2><ul>${brief.watchUpdates.map(x=>`<li><a href="${e(/^https:\/\//.test(x.source_url||'')?x.source_url:origin+'/watch')}">${e(x.title)}</a> · ${e(String(x.event_date).slice(0,10))}</li>`).join('')}</ul></section>`:'';
  return `<div class="brief-edition"><p class="discovery-kicker">SUNDAY ${e(brief.issue)}</p><h1>The week.<br><span>Worth a listen.</span></h1><p>Top 10 · Movers · Head-to-head · One artist to watch</p><p class="discovery-fine">Chart snapshot checked ${e(String(brief.chartAsOf).slice(0,10))}. Issue date and source date are shown separately.</p></div>
    <div class="brief-commentary">${brief.commentary.map(line=>`<p>${e(line)}</p>`).join('')}</div>
    <section class="brief-section"><p class="discovery-kicker">01 / THE FRONT ROW</p><h2>The Top 10</h2><ol class="brief-top10">${brief.top10.map(a=>`<li><span>${String(a.rank).padStart(2,'0')}</span><a href="${origin}/current/${e(a.slug)}">${e(a.name)}</a><strong>${Number(a.score).toFixed(1)}<small>index points</small></strong></li>`).join('')}</ol></section>
    <section class="brief-section"><p class="discovery-kicker">02 / ON THE MOVE</p><h2>Movers of the Week</h2>${brief.movers.length ? `<ul class="brief-movers">${brief.movers.map(a=>`<li><strong>↑ ${a.movement}</strong> <a href="${origin}/current/${e(a.slug)}">${e(a.name)}</a><span>#${a.previousRank} → #${a.rank}</span></li>`).join('')}</ul>` : '<p>No upward movement is recorded in the available snapshots.</p>'}<p class="discovery-fine">${e(brief.movementNote)}</p></section>
    <section class="brief-section"><p class="discovery-kicker">03 / SIDE BY SIDE</p><h2>One head-to-head</h2>${brief.headToHead ? `<p class="brief-versus">${e(brief.headToHead.artists[0].name)} <span>vs</span> ${e(brief.headToHead.artists[1].name)}</p><p><strong>${brief.headToHead.gap.toFixed(2)} ${e(brief.headToHead.metric)}</strong> separate the first two artists in this edition. Both scores use the same published chart model.</p>` : '<p>A comparable pair is not available in this edition.</p>'}</section>
    <section class="brief-section"><p class="discovery-kicker">04 / PUT SOMEONE ON</p><h2>An artist to watch</h2>${brief.rising ? `<h3>${e(brief.rising.name)}</h3><p>${e(brief.rising.note)}</p><p>Start with <a href="${e(brief.rising.listenUrl)}">${e(brief.rising.track)} ↗</a>.</p><p class="discovery-fine">Unpaid editorial pick · Directory updated ${e(require('../data/watch-artists.json').updatedAt)}.</p><a href="${origin}/watch">Explore Artists to Watch ↗</a>` : '<p>A sourced artist spotlight will appear in the next edition.</p>'}</section>${watch}`;
}
function emailDocument(brief, sponsors = [], footer = 'You opted in to the Afri Index Sunday brief. Use the unsubscribe link provided with this email.') {
  const safeSponsors = sponsors.slice(0,1).filter(s => /^https:\/\//.test(s.url || ''));
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Afri Index · Sunday brief ${e(brief.issue)}</title><style>body{margin:0;background:#f4f2eb;color:#181917;font:16px/1.65 Arial,sans-serif}main{max-width:640px;margin:auto;padding:32px 20px}a{color:#324c13}h1{font-size:46px;line-height:1.1}h2{font-size:27px}.brief-section{border-top:1px solid #c5c7b9;padding:24px 0}.discovery-kicker{font-size:12px;letter-spacing:2px}.discovery-fine,small{font-size:12px;color:#595b52}.brief-top10{padding:0;list-style:none}.brief-top10 li{padding:9px 0;border-bottom:1px solid #ddd}.brief-top10 span{display:inline-block;width:30px}.brief-top10 strong{float:right}.brief-top10 small{display:block}.brief-movers{padding-left:18px}.brief-movers span{margin-left:12px}aside{padding:20px;border:1px solid #b0b3a5}footer{border-top:1px solid #c5c7b9;padding-top:24px}</style></head><body><main><p><strong>AFR / INDEX</strong> · THE SUNDAY BRIEF</p>${safeSponsors.map(s=>`<aside><small>Paid sponsor</small><h2>${e(s.name)}</h2><p>${e(s.copy)}</p><a href="${e(s.url)}">${e(s.label)}</a></aside>`).join('')}${briefMarkup(brief)}<footer><p><a href="${origin}/newsletter#signup">Get this in your inbox</a> · <a href="${origin}">Read Afri Index</a></p><p>${footer}</p></footer></main></body></html>`;
}
module.exports = { sundayDate, buildBrief, briefMarkup, emailDocument };
