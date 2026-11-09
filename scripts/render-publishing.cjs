// One edition label and one metadata description per page. Dataset evidence lives
// on Method; neither rebuilding nor formatting a page invents a verification date.
const fs=require('node:fs');
const {escape:e}=require('../lib/shared.cjs');
const {formatDate}=require('../trust-model.js');
const edition=require('../data/edition.json'),current=require('../data/current.json');
const stamp=`Updated · <time datetime="${edition.updatedAt}">${formatDate(edition.updatedAt)}</time>`;
const descriptions={
  index:'Follow the artists shaping African music. Explore the rankings, understand the legacy and discover your next favourite. A source behind every number.',
  current:'The Afri Index Current 50: artist scores, chart movement and sourced streaming figures.',
  'all-time':'The careers, cultural influence and records behind the Afri Index All-Time rankings.',
  method:'How Afri Index ranks African artists, checks its sources and records dataset update dates.',
  albums:'Explore the most-streamed albums in our tracked African music catalogue, with sources.',
  releases:'Explore released 2026 songs and albums ranked by their reported lifetime Spotify totals.',
  news:'Source-linked updates on African music, artists and official chart news.',
  newsletter:'The Afri Index Sunday brief: Top 10, chart movement, one comparison and an artist to watch.'
};
function provenance(){
  const d=edition.datasets,dates=[
    ['Current 50, regions & artist totals',formatDate(d.streaming.checkedAt),`${d.streaming.ledgersRefreshed}/100 ledgers refreshed across 50 artists. Publisher observations: ${formatDate(d.streaming.sourceStart)} – ${formatDate(d.streaming.sourceEnd)}.`, '/streams'],
    ['Songs, albums & 2026 release charts',formatDate(d.streaming.checkedAt),'Source-linked Spotify totals, daily observations and Apple release identities. 2026 lists rank releases by lifetime totals; they are not catalogue-wide year-to-date gains.','/streams?year=2026'],
    ['TurnTable Top 100 songs',formatDate(d.turntableSongs.checkedAt),`Official chart period: ${formatDate(d.turntableSongs.weekStart)} – ${formatDate(d.turntableSongs.weekEnd)}. Latest publisher snapshot available when checked.`,d.turntableSongs.sourceUrl],
    ['TurnTable Top 100 albums',formatDate(d.turntableAlbums.checkedAt),`Official chart period: ${formatDate(d.turntableAlbums.weekStart)} – ${formatDate(d.turntableAlbums.weekEnd)}. Latest publisher snapshot available when checked.`,d.turntableAlbums.sourceUrl],
    ['Upcoming releases',formatDate(d.upcoming.checkedAt),`${d.upcoming.count} scheduled music releases checked against Release-Cal. Announcement dates may change.`,'/upcoming'],
    ['News',formatDate(d.news.checkedAt),`Latest indexed article: ${formatDate(d.news.latestArticle)}. Article dates stay attached to the original reporting.`,'/news'],
    ['Editorial ranking factors & All-Time','Retained evidence','The locked editorial baseline is dated 5 Oct 2026. All-Time placements were reviewed for presentation; no new editorial marks or awards were invented.','/all-time'],
    ['Certifications',formatDate(d.certifications?.checkedAt||current.meta.certificationsCheckedAt),d.certifications?.note||'Badge evidence and certificate dates remain attached to their original authorities.','/method'],
    ['Awards calendar',formatDate(d.awardsCalendar?.checkedAt||require('../data/awards-seasons.json').checkedAt),'Organiser dates rechecked for the Grammys, Headies and AFRIMA. Submissions remain separate from nominations.','/calendar/awards'],
    ['Artist biographies',d.biographies?formatDate(d.biographies.checkedAt):'Retained evidence',d.biographies?`${d.biographies.rechecked} of 50 career-source pages rechecked. Missing evidence retains its original date.`:'Career sources retain their individual verification dates.','/artists'],
    ['Release identities',d.releaseIdentities?formatDate(d.releaseIdentities.checkedAt):formatDate(d.streaming.checkedAt),'Apple release metadata is checked independently from Spotify stream observations. Future releases are excluded from released-record tables.','/releases'],
    ['Net Worth',formatDate(current.site.financials.map(x=>x.lastVerifiedAt).filter(Boolean).sort()[0]),'Estimates from public reports. This edition does not represent a new financial verification.','/net-worth'],
    ['Artists to Watch',formatDate(require('../data/watch-artists.json').updatedAt),'Directory revision; individual artist verification notes remain visible.','/watch']
  ];
  const rows=dates.map(([name,date,note,href])=>`<tr role="row"><th scope="row" role="rowheader"><a href="${e(href)}">${e(name)}${href.startsWith('https://')?' ↗':''}</a></th><td role="cell"><span class="source-history-label" aria-hidden="true">Checked / evidence date</span>${e(date)}</td><td role="cell"><span class="source-history-label" aria-hidden="true">What this means</span>${e(note)}</td></tr>`).join('');
  return `<section class="data-update-history" id="data-updates" aria-labelledby="data-updates-title"><h2 id="data-updates-title">Sources & update history</h2><p>${stamp}. This is the edition date. Each source keeps its own observation date or chart period below. A source check can confirm the same figures; it does not create new chart positions.</p><div class="source-history-scroll" role="region" aria-label="Dataset update history" tabindex="0"><table class="source-history-table" role="table"><caption class="sr-only">Dataset checks and retained source evidence</caption><thead role="rowgroup"><tr role="row"><th scope="col" role="columnheader">Dataset</th><th scope="col" role="columnheader">Checked / evidence date</th><th scope="col" role="columnheader">What this means</th></tr></thead><tbody role="rowgroup">${rows}</tbody></table></div><div id="ranking-movement"><h3>Why an artist moved</h3><p>Current combines the fixed editorial contribution, normalized to 83 points, with up to 17 points from comparable tracked Spotify totals. Each artist’s streaming total is divided by the largest total in the chart. Positions can change when an artist’s score or a peer’s score changes.</p><p>Arrows compare this edition with <time datetime="${require('../data/previous-ranking.json').asOf}">${formatDate(require('../data/previous-ranking.json').asOf)}</time>, the previous published snapshot. They do not imply that those snapshots are exactly seven days apart. Each mover’s note shows the change in streaming points; the artist profile shows the score and sources.</p></div></section>`;
}
function internalArrows(html){
  return html.replace(/<a\b[^>]*href="([^"]*)"[^>]*>[\s\S]*?<\/a>/g,(tag,href)=>{
    if(/^https?:\/\//.test(href)&&!href.startsWith('https://afrobeats-index.vercel.app/'))return tag;
    return tag.replaceAll('↗','→');
  });
}
for(const file of fs.readdirSync('.').filter(x=>x.endsWith('.html'))){
  let html=fs.readFileSync(file,'utf8');
  if(!html.includes('class="app-topbar"'))continue;
  html=html.replace(/<p class="section-updated"[\s\S]*?<\/p>/g,'').replace(/<p[^>]*data-section-updated="footer"[\s\S]*?<\/p>/g,'').replace(/<details id="section-freshness">[\s\S]*?<\/details>/g,'');
  html=html.replace(/(<p[^>]*id="premium-edition-label"[^>]*>)[\s\S]*?<\/p>/,`$1${stamp}</p>`);
  html=html.replace(/Edition checked/g,'Updated');
  if(file!=='index.html')html=html.replace(/(<main\b[^>]*>)/,`$1<p class="edition-updated">${stamp} <a href="/method#data-updates">Source dates</a></p>`);
  html=html.replace('<footer class="trust-footer">','<footer class="trust-footer"><p class="publication-source-link"><a href="/method#data-updates">Sources & update history</a></p>');
  if(file==='method.html')html=html.replace(/(<section id="method"[^>]*>)/,`$1${provenance()}`);
  const key=file.slice(0,-5),description=descriptions[key]||html.match(/<meta name="description" content="([^"]*)"/)?.[1]||'African music, in context. Explore the artists and the evidence with Afri Index.';
  html=html.replace(/<meta\b[^>]*(?:name="(?:description|twitter:description)"|property="(?:og:description|twitter:description)")[^>]*>/g,'');
  html=html.replace('</head>',`<meta name="description" content="${e(description)}"><meta property="og:description" content="${e(description)}"><meta name="twitter:description" content="${e(description)}"></head>`);
  html=html.replace(/<img\b[^>]*>/g,tag=>tag.replace(/src="(\/?artists\/[^"?]+)\.jpg"/,(_,base)=>fs.existsSync(base.replace(/^\//,'')+'.webp')?`src="${base}.webp"`:`src="${base}.jpg"`));
  fs.writeFileSync(file,internalArrows(html));
}
console.log('Rendered one edition date, source history and consistent metadata.');
module.exports={internalArrows};
