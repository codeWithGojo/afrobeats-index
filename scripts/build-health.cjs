// Data health (Phase 11): which datasets and artist readings are stale or missing. Writes data/data-health.json.
// Runs in the build and after the nightly readings. Thresholds are in days.
const fs=require('node:fs');
const read=(f,fallback=null)=>{try{return JSON.parse(fs.readFileSync(f,'utf8'));}catch{return fallback;}};
const now=Date.now(),day=864e5,age=d=>d&&Number.isFinite(Date.parse(d))?Math.floor((now-Date.parse(d))/day):null;
const status=(a,warn,crit)=>a==null?'missing':a>crit?'critical':a>warn?'warn':'ok';
const current=read('data/current.json',{artists:[],meta:{}}),ext=read('data/current-extension.json',{candidates:[],excluded:[]});
const history=read('data/stream-history.json',{snapshots:[]}),runs=read('data/refresh-runs.json',{runs:[]}),reviews=read('data/editorial-reviews.json',{artists:{}});
const kit=read('data/sponsor-kit.json',{audience:{}}),accents=read('data/artist-accents.json',{artists:{}});
const lastNightly=[...runs.runs].reverse().find(r=>r.job==='nightly-readings');
const ds=(name,date,warn,crit,note)=>({name,date:date?String(date).slice(0,10):null,ageDays:age(date),status:status(age(date),warn,crit),note});
const datasets=[
 ds('Current 50 edition',current.meta?.lastRefreshAttemptAt||current.asOf,8,15,'Published weekly by the Monday job.'),
 ds('Nightly stream readings',lastNightly?.at,2,4,lastNightly?`${lastNightly.ok} artists read, ${lastNightly.failed.length} failed.`:'No nightly run recorded yet.'),
 ds('TurnTable Nigeria Top 100',read('data/nigeria-top100.json',{}).weekEnd,14,21,'Chart week end.'),
 ds('Release identities (Apple)',read('data/release-identities.json',{}).checkedAt,14,30,''),
 ds('Upcoming releases',read('data/upcoming-releases.json',{}).checkedAt,14,30,''),
 ds('Current 100 candidates',ext.checkedAt,9,16,`${ext.candidates.length} candidates, ${ext.excluded?.length||0} excluded.`),
 ds('Artists to Watch',read('data/watch-artists.json',{}).updatedAt,30,60,''),
 ds('Touring records',read('data/touring.json',{}).updatedAt,45,90,'')];
// Per-artist latest reading.
const latest=new Map();for(const s of history.snapshots)for(const [slug,v] of Object.entries(s.artists||{})){const d=v.sourceDate||s.capturedAt;if(!latest.has(slug)||d>latest.get(slug))latest.set(slug,d);}
const artists=[...current.artists.map(a=>({slug:a.slug,name:a.name,board:'Current 50'})),...ext.candidates.map(c=>({slug:c.slug,name:c.name,board:'Current 100 candidate'}))]
 .map(a=>{const d=latest.get(a.slug)||null;return {...a,reading:d?String(d).slice(0,10):null,ageDays:age(d),status:status(age(d),14,35)};});
// Missing or due items editors should act on.
const missing=[];
const defReview=reviews.defaultReviewedAt;
for(const a of current.artists){const r=reviews.artists?.[a.slug]?.reviewedAt||defReview,ag=age(r);if(ag>84)missing.push({kind:'editorial',item:a.name,detail:`Editorial review is ${ag} days old: weight at the floor until re-scored.`,severity:'critical'});else if(ag>56)missing.push({kind:'editorial',item:a.name,detail:`Editorial review is ${ag} days old: fading now.`,severity:'warn'});}
for(const c of ext.candidates){const gaps=['bio','editorialScore','reviewedAt'].filter(k=>c[k]==null);if(!c.image||!/\.webp$/.test(c.image))gaps.push('photo');if(gaps.length)missing.push({kind:'Current 100 candidate',item:c.name,detail:'Missing: '+gaps.join(', '),severity:'warn'});}
for(const a of current.artists){for(const v of ['','-160','-320']){const f=`artists/${a.slug}${v}.webp`;if(!fs.existsSync(f)||fs.statSync(f).size===0)missing.push({kind:'image',item:a.name,detail:`Missing ${f}`,severity:'critical'});}}
const fallbacks=Object.entries(accents.artists||{}).filter(([,x])=>!x.source).map(([k])=>k);if(fallbacks.length)missing.push({kind:'accent',item:`${fallbacks.length} artists`,detail:'Black and white photos use the site lime as accent: '+fallbacks.slice(0,8).join(', '),severity:'info'});
if(Object.values(kit.audience||{}).every(v=>v==null))missing.push({kind:'media kit',item:'Audience figures',detail:'Shown as "Shared on request" until filled from analytics.',severity:'info'});
const count=s=>[...datasets,...artists].filter(x=>x.status===s).length+missing.filter(m=>m.severity===s).length;
const out={generatedAt:new Date(now).toISOString(),thresholds:{note:'Datasets: see each row. Artist readings: warn after 14 days, critical after 35.'},summary:{ok:count('ok'),warn:count('warn'),critical:count('critical')+count('missing')},datasets,artists:artists.sort((a,b)=>(b.ageDays??1e9)-(a.ageDays??1e9)),missing,runs:runs.runs.slice(-14)};
fs.writeFileSync('data/data-health.json',JSON.stringify(out,null,1));
console.log(`Data health · ${out.summary.ok} ok · ${out.summary.warn} warn · ${out.summary.critical} critical or missing`);
