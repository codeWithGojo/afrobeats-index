// Presentation only. Source figures, artist biographies and announcement notes stay intact.
const fs=require('node:fs');
const {element,replace}=require('../lib/html-fragments.cjs');
const {escape:e}=require('../lib/shared.cjs');
const artists=require('../data/current.json').artists;
const news=require('../data/editorial-news.json').items;
const chevron='<svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M4 6.5L8 10.5L12 6.5"/></svg>';
const portrait=(slug,size=160)=>{const path=slug==='davido'&&fs.existsSync('davido.jpg')?'davido.jpg':`artists/${slug}.webp`;return fs.existsSync(path)?`<img src="/${e(path)}" alt="" width="${size}" height="${size}" loading="lazy" decoding="async">`:'';};
const formula=`<div class="editorial-score-visual" role="img" aria-label="Current: editorial contribution normalized to 83 points, plus up to 17 streaming points"><div class="editorial-score-bar"><span>83</span><span>17</span></div><div class="editorial-score-key"><span>Editorial contribution</span><span>Tracked streams</span></div></div>`;
function discussion(){return `<p class="index-eyebrow">BEHIND THE POSITIONS</p><h2>Discussion</h2><p class="editorial-page-intro">Three ways to read the index. See the idea, then get into the detail.</p><div class="discussion-grid visual-discussion">
<article data-visual-reveal><div class="editorial-era-visual" aria-hidden="true"><span><i>◉</i>Records</span><b>→</b><span><i>▥</i>Radio</span><b>→</b><span><i>≋</i>Streaming</span></div><p class="visual-kicker">01 / ACROSS GENERATIONS</p><h3>Why All-Time excludes streams</h3><p>All-Time compares careers across eras using nine editorial factors. Streaming totals are excluded because platform coverage is uneven across generations.</p><a class="editorial-read-link" href="/all-time">Explore the legacy <span aria-hidden="true">→</span></a></article>
<article data-visual-reveal><div class="editorial-tie-visual" aria-hidden="true">${['burna-boy','davido','wizkid'].map(slug=>`<div>${portrait(slug)}<span>T-1</span></div>`).join('')}</div><p class="visual-kicker">02 / A SHARED FIRST PLACE</p><h3>Why the Big 3 are tied</h3><p>Burna Boy, Davido and Wizkid share first place by editorial decision. Their strengths differ across catalogue, cultural influence and live performance. This is a shared placement, not evidence of equal calculated scores.</p><a class="editorial-read-link" href="/compare">Compare their careers <span aria-hidden="true">→</span></a></article>
<article data-visual-reveal>${formula}<p class="visual-kicker">03 / THE CURRENT PICTURE</p><h3>How Current differs</h3><p>Current combines the locked editorial contribution, normalized to 83 points, with up to 17 points from comparable tracked audio streams. It reflects the published snapshot; All-Time emphasizes career legacy.</p><a class="editorial-read-link" href="/current">Open the Current 50 <span aria-hidden="true">→</span></a></article></div>`;}
for(const file of fs.readdirSync('.').filter(x=>x.endsWith('.html'))){
 let html=fs.readFileSync(file,'utf8');
 if(!html.includes('class="app-topbar"'))continue;
 if(!html.includes('href="/publication-visuals.css"'))html=html.replace('</head>','<link rel="stylesheet" href="/publication-visuals.css"></head>');
 if(!html.includes('src="/publication-motion.js"'))html=html.replace('</head>','<script src="/publication-motion.js" defer></script></head>');
 if(file==='discussion.html')html=replace(html,'discuss',discussion());
 if(file==='artists.html'){
  const section=element(html,'artists');
  if(section)html=replace(html,'artists',section.body.replace(/<article id="([a-z0-9-]+)"><h3>([\s\S]*?)<\/h3><p>([\s\S]*?)<\/p><p>([\s\S]*?)<\/p>([\s\S]*?)<\/article>/g,(_,slug,name,meta,bio,link)=>`<article id="${slug}" class="visual-archive-card" data-visual-reveal><div class="archive-portrait">${portrait(slug,320)}<span>ARTIST ARCHIVE</span></div><div class="archive-card-copy"><h3>${name}</h3><p class="archive-meta">${meta}</p><details class="visual-disclosure archive-biography"><summary>Artist notes ${chevron}</summary><div><p>${bio}</p></div></details>${link}</div></article>`));
 }
 if(file==='news.html'){
  const items=news.map(item=>{
   const artist=artists.find(a=>a.name.toLowerCase()===item.artist?.toLowerCase());
   return `<article class="news-item visual-news-item" data-visual-reveal><div class="news-visual" aria-hidden="true">${artist?portrait(artist.slug,320):'<span class="news-source-mark">A/</span>'}<span>${e(item.artist||item.source||'AFR / INDEX')}</span></div><div class="news-copy"><h3>${e(item.headline)}</h3><p>${e(item.summary)}</p><small>${e(item.date)} · ${e(item.artist)} · <a href="${e(item.url)}">${e(item.source)} ↗</a></small></div></article>`;
  }).join('');
  const content=`<p class="eyebrow">Sourced editorial notes</p><h2>Artist News</h2><p class="supplement-intro">Short, reverse-chronological updates. Every item links to a checkable source or an Afri Index audit page; this is manually curated alongside the data refresh.</p><div class="news-list">${items}</div>`;
  if(element(html,'news'))html=replace(html,'news',content);
  else if(element(html,'main-content'))html=replace(html,'main-content',element(html,'main-content').body+`<section id="news" class="tab-content supplement-section active">${content}</section>`);
 }
 if(file==='newsletter.html'){
  html=html.replace(/(<ol class="brief-top10">)([\s\S]*?)(<\/ol>)/,(_,start,rows,end)=>start+rows.replace(/(<a href="https:\/\/afrobeats-index\.vercel\.app\/current\/([a-z0-9-]+)">)/g,(_,tag,slug)=>portrait(slug,48)+tag)+end);
  html=html.replace('<div class="brief-edition">','<div class="brief-edition visual-brief-edition"><div class="brief-issue-art" aria-hidden="true"><small>AFR / INDEX</small><div class="brief-issue-record"></div><strong>THE SUNDAY<br>BRIEF.</strong><span>A WEEK WORTH HEARING.</span></div>');
 }
 if(file==='method.html'){
  const history=element(html,'data-updates');
  if(history){const body=history.body.replace(/<h2[^>]*>[\s\S]*?<\/h2>/,'');html=html.slice(0,history.start)+`<details class="data-update-history visual-disclosure method-evidence" id="data-updates"><summary id="data-updates-title"><span><strong>Sources & update history</strong><small>10 datasets · observation dates & evidence</small></span>${chevron}</summary><div class="method-evidence-body">${body}</div></details>`+html.slice(history.closeEnd);}
 }
 fs.writeFileSync(file,html);
}
console.log('Rendered release visuals, editorial illustrations, artist portraits and compact source disclosures.');
