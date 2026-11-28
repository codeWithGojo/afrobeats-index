/* My Index (Phase 4): personal and community charts built from 1-10 grades.
   Reuses the weight sandbox engine (lib/board-engine.cjs scenario). Never writes to the official chart. */
(function(root,factory){const api=factory(typeof module==='object'&&module.exports?require('./lib/board-engine.cjs'):root.AfriBoardEngine);if(typeof module==='object'&&module.exports)module.exports=api;else root.AfriMyIndex=api;})(typeof window==='object'?window:globalThis,function(engine){
 'use strict';
 // Default metrics. `official` says where a fallback value comes from when an artist is not graded.
 const METRICS=[
  {key:'streams',label:'Streams',hint:'How much people actually play them',official:'recent-streams'},
  {key:'vocals',label:'Vocals',hint:'Tone, control and range'},
  {key:'lyricism',label:'Lyricism',hint:'Words, wit and storytelling'},
  {key:'live',label:'Live shows',hint:'How they carry a stage'},
  {key:'influence',label:'Influence',hint:'How much the scene follows them',official:'editorial'},
  {key:'longevity',label:'Longevity',hint:'Years at a high level',official:'career-years'},
  {key:'innovation',label:'Innovation',hint:'New sounds and risks'},
  {key:'vibes',label:'Vibes',hint:'The feeling the music gives you'},
  {key:'replay',label:'Replay value',hint:'Do you keep coming back?'}];
 const LIMITS={free:{metrics:3,indexes:1},pro:{metrics:8,indexes:Infinity}};
 const byKey=new Map(METRICS.map(m=>[m.key,m]));
 const customKey=label=>'custom-'+String(label).toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,30);

 // Official fallback on the 1-10 scale, only where sourced data exists.
 function official(artist,key,now=new Date()){
  const m=byKey.get(key),b=artist.scoreBreakdown;if(!m?.official||!b)return null;
  if(m.official==='recent-streams'&&Number.isFinite(b.components?.recentStreams))return Math.max(1,Math.round(b.components.recentStreams)/10);
  if(m.official==='editorial'&&Number.isFinite(b.components?.editorial))return Math.max(1,b.components.editorial/10);
  if(m.official==='career-years'&&Number.isInteger(artist.careerStarted))return Math.max(1,Math.min(10,(now.getUTCFullYear()-artist.careerStarted)/2.5));
  return null;
 }
 function validateSet(set,{pro=false}={}){
  const errors=[],lim=pro?LIMITS.pro:LIMITS.free,metrics=set.metrics||[];
  if(metrics.length<3)errors.push('Pick at least 3 metrics.');
  if(metrics.length>lim.metrics)errors.push(pro?'Pick at most 8 metrics.':'Free My Index uses 3 metrics. Pro unlocks up to 8.');
  if(new Set(metrics.map(m=>m.key)).size!==metrics.length)errors.push('Each metric can be used once.');
  if(metrics.some(m=>!byKey.has(m.key)&&!/^custom-[a-z0-9-]{2,30}$/.test(m.key)))errors.push('Unknown metric.');
  if(!metrics.some(m=>m.weight>0))errors.push('Give at least one metric some weight.');
  return errors;
 }
 /* Personal chart. grades: {slug:{metric:1-10}}. Returns ranked rows with what was graded vs filled.
    Any artist with a grade or sourced official data for at least one weighted metric is ranked; rows say which. */
 function personalChart(artists,set,grades,{now=new Date()}={}){
  const keys=set.metrics.map(m=>m.key),weights=set.metrics.map(m=>Number(m.weight)||0);
  let pool=artists;if(set.pool==='outside-top-20')pool=artists.filter(a=>a.rank>20);
  const candidates=pool.map(a=>{const g=grades[a.slug]||{},filled=[];const components=keys.map(k=>{if(Number.isFinite(g[k]))return g[k]*10;const o=official(a,k,now);if(o!=null){filled.push(k);return o*10;}return null;});return {...a,components,filled,graded:keys.filter(k=>Number.isFinite(g[k]))};});
  return engine.scenario(candidates,weights,{partial:'renormalize'}).map(a=>({slug:a.slug,name:a.name,image:a.image,country:a.country,rank:a.rank,officialRank:a.officialRank,score:a.score/10,coverage:a.coverage,graded:a.graded,filled:a.filled,notGraded:!a.graded.length}));
 }
 // Your top 10 vs the official chart, and the biggest disagreements anywhere in your chart.
 function compare(rows){
  const top10=rows.slice(0,10).map(r=>({...r,delta:r.officialRank-r.rank}));
  const gaps=rows.filter(r=>r.graded.length).map(r=>({...r,delta:r.officialRank-r.rank})).filter(r=>r.delta!==0).sort((a,b)=>Math.abs(b.delta)-Math.abs(a.delta)).slice(0,5);
  return {top10,gaps,agreement:top10.length?top10.filter(r=>r.officialRank<=10).length:0};
 }
 /* Community Index from community_index() rows [{artist_slug,metric,score,n}].
    Each artist's score is the mean of its metric scores; sample size is the smallest n across those metrics. */
 function community(artists,rows,{minSample=5}={}){
  const per=new Map();for(const r of rows){if(!byKey.has(r.metric))continue;const p=per.get(r.artist_slug)||{metrics:{},n:Infinity};p.metrics[r.metric]={score:Number(r.score),n:Number(r.n)};p.n=Math.min(p.n,Number(r.n));per.set(r.artist_slug,p);}
  const ranked=artists.map(a=>{const p=per.get(a.slug);if(!p)return null;const vals=Object.values(p.metrics);return {slug:a.slug,name:a.name,officialRank:a.rank,score:vals.reduce((n,v)=>n+v.score,0)/vals.length,n:p.n,metrics:p.metrics};}).filter(x=>x&&x.n>=minSample).sort((a,b)=>b.score-a.score||a.officialRank-b.officialRank).map((x,i)=>({...x,rank:i+1}));
  const hotTakes=ranked.map(x=>({...x,gap:x.officialRank-x.rank})).filter(x=>x.gap!==0).sort((a,b)=>Math.abs(b.gap)-Math.abs(a.gap)).slice(0,10);
  return {ranked,hotTakes,minSample,graded:per.size};
 }
 return {METRICS,LIMITS,customKey,official,validateSet,personalChart,compare,community};
});
