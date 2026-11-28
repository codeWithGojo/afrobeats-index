// Published rank history for sparklines (data/rank-history.json). Only real published editions are used.
// Score sparklines need 4+ editions on the same formula; until then only rank history is shown.
const fs=require('node:fs');
const read=f=>JSON.parse(fs.readFileSync(f,'utf8'));
const editions=read('data/current-editions.json'),current=read('data/current.json');
const today=String(current.meta.lastRefreshAttemptAt||current.asOf).slice(0,10);
const all={...editions,[today]:Object.fromEntries(current.artists.map(a=>[a.slug,[a.rank,a.score]]))};
const dates=Object.keys(all).sort().slice(-8);
const scores=read('data/score-history.json').editions||{},scoreDates=Object.keys(scores).sort().slice(-8);
const out={note:'Published Current 50 ranks per edition (last 8). Scores are listed only once 4+ editions share the v2 formula.',dates,scoreDates:scoreDates.length>=4?scoreDates:[],artists:{}};
for(const a of current.artists)out.artists[a.slug]={rank:dates.map(d=>all[d]?.[a.slug]?.[0]??null),score:scoreDates.length>=4?scoreDates.map(d=>scores[d]?.[a.slug]??null):null};
fs.writeFileSync('data/rank-history.json',JSON.stringify(out));
console.log(`History · ${dates.length} rank editions · ${out.scoreDates.length} v2 score editions`);
// Compact chart for browser features that need names, ranks and inputs only (Phase 10): ~1% of current.json.
fs.writeFileSync('data/current-lite.json',JSON.stringify({asOf:current.asOf,meta:{lastRefreshAttemptAt:current.meta.lastRefreshAttemptAt},artists:current.artists.map(a=>({slug:a.slug,name:a.name,rank:a.rank,previousRank:a.previousRank,score:a.score,country:a.country,genres:a.genres,careerStarted:a.careerStarted??null,image:a.image,scoreBreakdown:a.scoreBreakdown?{version:a.scoreBreakdown.version,components:a.scoreBreakdown.components,momentum:{ratio:a.scoreBreakdown.momentum?.ratio??null,available:!!a.scoreBreakdown.momentum?.available}}:null}))}));
