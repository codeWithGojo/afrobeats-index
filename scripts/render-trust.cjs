const fs=require('node:fs'),crypto=require('node:crypto'),trust=require('../trust-model.js');
const data=JSON.parse(fs.readFileSync('data/current.json')),all=JSON.parse(fs.readFileSync('data/all-time.json'));
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let html=fs.readFileSync('index.html','utf8');
function findSection(id){const open=html.match(new RegExp('<section\\b[^>]*\\bid="'+id+'"[^>]*>'));if(!open)return null;const start=open.index,bodyStart=start+open[0].length;let depth=1;const tags=/<\/?section\b[^>]*>/g;tags.lastIndex=bodyStart;let tag;while((tag=tags.exec(html))){depth+=tag[0].startsWith('</')?-1:1;if(depth===0)return{start,bodyStart,end:tag.index,closeEnd:tags.lastIndex,body:html.slice(bodyStart,tag.index)};}throw Error('Unclosed section '+id);}
function section(id,fn){const part=findSection(id);if(part)html=html.slice(0,part.bodyStart)+fn(part.body)+html.slice(part.end);}

section('networth',body=>body.replace(/(<tbody[^>]*>)[\s\S]*?<\/tbody>/,(_,open)=>`${open}${trust.financials(data.site.financials).map(r=>`<tr><td>${r.rank}</td><td>${esc(r.artistName)}</td><td>${esc(r.netWorthRange)}</td><td>${esc(r.primaryDrivers)}</td></tr>`).join('')}</tbody>`).replace(/(<h2[^>]*>[\s\S]*?<\/h2>\s*<p[^>]*>)[\s\S]*?<\/p>/,'$1Estimates from public reports, not verified</p>'));
section('discuss',()=>`<h2>Discussion</h2><div class="discussion-grid"><article><h3>Why All-Time excludes streams</h3><p>All-Time compares careers across eras using nine editorial factors. Streaming totals are excluded because platform coverage is uneven across generations.</p></article><article><h3>Why the Big 3 are tied</h3><p>Burna Boy, Davido and Wizkid share first place by editorial decision. Their strengths differ across catalogue, cultural influence and live performance. This is a shared placement, not evidence of equal calculated scores.</p></article><article><h3>How Current differs</h3><p>Current combines the locked editorial contribution, normalized to 83 points, with up to 17 points from comparable tracked audio streams. It reflects the published snapshot; All-Time emphasizes career legacy.</p></article></div>`);
section('artists',()=>`<h2>Artist Archive</h2><p>50 artist profiles from the published Current snapshot. Open a profile for its catalogue and sourced evidence.</p><div class="grid archive-trust-grid">${data.artists.map(a=>`<article id="${esc(a.slug)}"><h3>${esc(a.name)}</h3><p>${esc(a.country)} · ${esc(a.genres.join(' / '))}</p><p>${esc(a.bio)}</p><a href="/current/${esc(a.slug)}">Open artist profile ↗</a></article>`).join('')}</div><span id="burna"></span><span id="tiwa"></span><span id="ayra"></span><span id="seyi"></span><span id="fireboy"></span><span id="omah"></span><span id="omahlay"></span><span id="seyivibez"></span><span id="kizzdaniel"></span><p id="yemialade"><a href="/?tab=alltime#legend-yemi-alade">Yemi Alade · All-Time profile</a></p><p id="wandecoal"><a href="/?tab=alltime#legend-wande-coal">Wande Coal · All-Time profile</a></p>`);
// Keep source rows and existing fragment URLs. The source gives one collective #50 score, not three individual scores.
section('alltime',body=>{
 body=body.replace(/<p class="alltime-score-note">[\s\S]*?<\/p>/g,'');
 body=body.replace(/All-Time (?:50|52 artists[^<]*)/,'All-Time 52 artists · 50 placements');
 body=body.replace(/(<div class="absolute top-3 left-3[^>]*>)1(<\/div>)/g,'$1<span class="tie-label" tabindex="0" title="Shared editorial first place. No numeric tiebreak or individual score is published; display order does not break the tie.">T-1</span>$2');
 for(const a of all.artists.slice(0,3)){const re=new RegExp('(<h3[^>]*>'+a.name+'<\\/h3>)');body=body.replace(re,'$1<p class="alltime-score-note">Score not published</p>');}
 body=body.replace(/(<span[^>]*>)50(<\/span>)/,'$1<span class="tie-label" tabindex="0" title="Shared #50 source entry. 40.0 is a collective score; individual artist scores and a tiebreak are not published.">T-50</span>$2');
 body=body.replace(/(<p class="serif text-xl mt-1">)40\.0(?: · group score)*/,'$140.0 · group score');
 body=body.replace(/(<h3[^>]*>Bracket · Olu Maintain · Skales<\/h3>)/,'$1<p class="alltime-score-note">40.0 collective score · individual scores not published</p>');
 return body;
});
html=html.replace(/Real photos\s*·\s*Omah Lay included/g,'Transparent sources');
const manifestPath='data/section-updates.json';const previous=fs.existsSync(manifestPath)?JSON.parse(fs.readFileSync(manifestPath)):{};
const read=f=>JSON.parse(fs.readFileSync('data/'+f+'.json'));
const sourceDates={current:data.asOf,regions:data.asOf,albums:data.asOf,yearly:read('releases-2026').checked_at,certifications:data.meta.certificationsCheckedAt,vs:data.asOf,networth:data.site.financials.map(r=>r.lastVerifiedAt).sort()[0],artists:data.asOf,underground:read('watch-artists').updatedAt,'home-signup':read('underground').edition,receipt:data.asOf,'receipt-signup':read('underground').edition,top100:read('nigeria-top100').checkedAt,news:read('editorial-news').checkedAt};
const sections={};
// Only primary tab sections and home modules; nested input panels are not independent datasets.
for(const id of ['current','alltime','regions','albums','yearly','artists','vs','networth','discuss','method','receipt','underground','home-signup','receipt-signup','top100','news','certifications']){
 const match=findSection(id);
 const body=(match?.body||id).replace(/<p class="section-updated"[\s\S]*?<\/p>/g,'');
 const hash=crypto.createHash('sha256').update(body).digest('hex');
 const updatedAt=sourceDates[id]||(previous[id]?.hash===hash?previous[id].updatedAt:new Date().toISOString());
 sections[id]={label:{certifications:'Certifications',underground:'Artists to Watch',vs:'Head to Head',yearly:'Release lists',networth:'Net Worth',discuss:'Discussion',artists:'Artist Archive',alltime:'All-Time',regions:'Regional Power Index','home-signup':'Newsletter','receipt-signup':'Receipt newsletter'}[id]||id,updatedAt,hash,basis:id==='underground'?'directory revision':sourceDates[id]?'source snapshot':'content revision'};
 if(match)section(id,b=>`<p class="section-updated" data-section-updated="${id}">Last updated · <time datetime="${updatedAt}">${trust.formatDate(updatedAt)}</time> · ${sections[id].basis}</p>`+b.replace(/<p class="section-updated"[\s\S]*?<\/p>/g,''));
}
fs.writeFileSync(manifestPath,JSON.stringify(sections,null,2)+'\n');
const newest=Object.values(sections).map(s=>s.updatedAt).sort().at(-1);
html=html.replace(/<footer\b[\s\S]*?<\/footer>/,`<footer class="trust-footer"><p>AFR/INDEX · African music, in context.</p><p data-section-updated="footer">Last updated · <time datetime="${newest}">${trust.formatDate(newest)}</time></p><details id="section-freshness"><summary>Data freshness</summary><div id="section-freshness-list">${trust.staleSections(sections).map(s=>esc(s.label)+' · '+trust.formatDate(s.updatedAt)).join('; ')}</div></details></footer>`);
html=html.replace(/<script src="\/?trust-model.js"><\/script>/g,'').replace(/<script src="\/?trust-ui.js"[^>]*><\/script>/g,'');
html=html.replace('<script src="assets/inline-08.js">','<script src="/trust-model.js"></script>\n<script src="assets/inline-08.js">');
html=html.replace('</body>','<script src="/trust-ui.js"></script>\n</body>');
fs.writeFileSync('index.html',html);
const flags=trust.streamFlags(data.artists,data.site.streamSnapshots);
fs.writeFileSync('data/stream-review.json',JSON.stringify({generatedAt:new Date().toISOString(),snapshot:data.asOf,policy:'Review flags only; no stream values or scores corrected. Comparing snapshots may expose changed coverage rather than errors.',artists:flags},null,2)+'\n');
const stale=trust.staleSections(sections);
fs.mkdirSync('docs',{recursive:true});fs.writeFileSync('docs/phase-1-review.md',`# Phase 1: Data trust\n\nNet worth is sorted by numeric USD range midpoint. Scores and stream counts remain unchanged. All-Time has 52 named artists in 50 placements; the final collective entry is retained because separate scores do not exist. Big 3 scores are missing and displayed as unpublished. Archive uses all 50 structured Current profiles with no hobby/fun-fact fields.\n\nDates come from source snapshots, or a content hash change for editorial sections. Rebuilds alone do not refresh editorial dates. A content revision is not a data verification.\n\n## Older than 14 days\n${stale.map(s=>`- ${s.label}: ${trust.formatDate(s.updatedAt)} (${s.basis})`).join('\n')}\n\n## Stream figures to verify\nThese are heuristics, not findings of false data. Source corrections, changing coverage and release spikes can explain flags.\n\n| Artist | Daily Spotify | Total Spotify | Reason |\n|---|---:|---:|---|\n${flags.map(a=>`| ${a.name} | ${a.daily.toLocaleString('en')} | ${a.total.toLocaleString('en')} | ${a.reasons.join('; ')} |`).join('\n')}\n\nRaw source links and dates: data/stream-review.json.\n`);
console.log(`Trust presentation: ${flags.length} stream reviews; ${stale.length} stale sections.`);
