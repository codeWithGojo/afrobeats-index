/* Phase 2 boards: Heat 25 (momentum only) and the Current 100 extension (ranks 51 to 100).
   Neither board changes the official Current 50. Promotion across the 50 line is flagged for an editor. */
(function(root,factory){const api=factory(typeof module==='object'&&module.exports?require('./trend-model.js'):root.AfriTrend);if(typeof module==='object'&&module.exports)module.exports=api;else root.AfriBoards=api;})(typeof window==='object'?window:globalThis,function(T){
 'use strict';
 const HEAT={size:25,maxStaleDays:14};
 const EXTENSION={size:50,firstRank:51,debutWatchTo:75,maxStaleDays:35,lineWatch:5,maxMovePlaces:8,
  // Below the line, streaming and momentum lead; editorial and activity still count.
  weights:{recentStreams:45,momentum:35,editorial:10,activity:10}};
 const FLAG_CODES=new Set(['ng','gh','za','tz','gb','sz']);
 const index=list=>new Map((list||[]).map((slug,i)=>[slug,i+1]));

 // Heat 25: ranked only by momentum. Only artists with a real baseline and a fresh reading qualify.
 function heat(artists,{previous=[],size=HEAT.size,maxStaleDays=HEAT.maxStaleDays}={}){
  const last=index(previous);
  return artists.filter(a=>{const b=a.scoreBreakdown;return b?.momentum?.available&&Number.isFinite(b.momentum.ratio)&&(b.recentStreams?.staleDays??0)<=maxStaleDays;})
   .sort((a,b)=>b.scoreBreakdown.momentum.ratio-a.scoreBreakdown.momentum.ratio||b.scoreBreakdown.recentStreams.dailyAverage-a.scoreBreakdown.recentStreams.dailyAverage||a.slug.localeCompare(b.slug))
   .slice(0,size).map((a,i)=>{const m=a.scoreBreakdown.momentum;return {slug:a.slug,name:a.name,country:a.country,image:a.image,heatRank:i+1,previousHeatRank:last.get(a.slug)??null,officialRank:a.rank,board:a.board||'current',ratio:m.ratio,score:a.scoreBreakdown.components.momentum,thisWeek:m.thisWeek,baseline:m.baseline,baselineFrom:m.baselineFrom,baselineTo:m.baselineTo,readingDate:a.scoreBreakdown.recentStreams.to};});
 }

 // What every new artist needs before it counts as complete (not provisional).
 function completeness(c,{hasFile=()=>false}={}){
  const missing=[];
  if(!(c.image&&/\.webp$/.test(c.image)&&hasFile(c.image)))missing.push('photo (webp)');
  if(!(c.countryCodes||[]).some(code=>FLAG_CODES.has(String(code).toLowerCase())))missing.push('country flag');
  if(!(c.streams&&Number.isFinite(c.streams.daily)&&/^https:\/\//.test(c.streams.url||'')&&c.streams.source_date))missing.push('streams source');
  if(!(c.bio&&/^https:\/\//.test(c.bioSource||'')))missing.push('bio');
  if(!(Number.isFinite(c.editorialScore)&&c.editorialScore>=0&&c.editorialScore<=100))missing.push('editorial score');
  if(!(c.reviewedAt&&Number.isFinite(Date.parse(c.reviewedAt))))missing.push('review date');
  return {complete:!missing.length,missing,reviewed:!missing.includes('editorial score')&&!missing.includes('review date')};
 }

 /* Current 100 extension.
    candidates: data/current-extension.json candidates; current: published Current 50 artists;
    history: stream history snapshots (candidate readings included); ctx: activity context. */
 function extension({candidates,excluded=[],current,history,ctx,asOf,previous=[],hasFile}){
  const out={eligible:[],held:[]},skip=new Set(excluded.map(x=>x.spotifyId)),day=864e5;
  const editorialMedian=current.length?median(current.map(a=>a.scoreBreakdown?.components?.editorial).filter(Number.isFinite)):50;
  for(const c of candidates){
   if(skip.has(c.spotifyId)){out.held.push({...c,reason:'Excluded by an editor'});continue;}
   const reading=c.streams?.source_date,age=reading?(Date.parse(asOf)-Date.parse(reading))/day:Infinity;
   if(!Number.isFinite(c.streams?.daily)){out.held.push({...c,reason:'No Kworb streams reading'});continue;}
   if(age>EXTENSION.maxStaleDays){out.held.push({...c,reason:`Streams reading is ${Math.round(age)} days old`});continue;}
   out.eligible.push({...c,check:completeness(c,{hasFile})});
  }
  const lastRank=index(previous),previousRank=s=>lastRank.has(s)?lastRank.get(s):null;
  const pool=out.eligible.map(c=>({slug:c.slug,name:c.name,previousRank:previousRank(c.slug)}));
  const editorial=Object.fromEntries(out.eligible.map(c=>[c.slug,c.check.reviewed?{score:c.editorialScore,reviewedAt:c.reviewedAt}:{score:editorialMedian,reviewedAt:asOf,provisional:true}]));
  const activity=Object.fromEntries(out.eligible.map(c=>[c.slug,T.activity({slug:c.slug,name:c.name},ctx||{},asOf)]));
  const base={history,editorial,activity,scoreHistory:{}};
  if(!pool.length)return {...out,rows:[],entries:[],exits:previous.map(slug=>({slug})),editorialMedian};
  const ranked=T.score(pool,{...base,config:{weights:EXTENSION.weights,maxMovePlaces:EXTENSION.maxMovePlaces}},asOf);
  // The same inputs under the official weights, for the promotion watch only.
  const official=new Map(T.score(pool,base,asOf).rows.map(r=>[r.a.slug,r.raw]));
  const bySlug=new Map(out.eligible.map(c=>[c.slug,c]));
  const rows=ranked.rows.slice(0,EXTENSION.size).map((r,i)=>{const c=bySlug.get(r.a.slug),rank=EXTENSION.firstRank+i;return {
   slug:c.slug,name:c.name,country:c.country,countryCodes:c.countryCodes,image:c.image,spotifyId:c.spotifyId,rank,previousRank:r.a.previousRank==null?null:EXTENSION.firstRank-1+r.a.previousRank,
   score:Number(r.smoothed.toFixed(3)),officialFormulaScore:Number(official.get(c.slug).toFixed(3)),components:r.parts,
   momentum:{available:r.mom.available,ratio:r.mom.ratio},dailyAverage:r.pace.value,readingDate:r.pace.to,staleDays:r.at.staleDays,
   activitySignals:r.act.signals,provisional:!c.check.reviewed,missing:c.check.missing,debutWatch:rank<=EXTENSION.debutWatchTo,
   identity:c.identity,charts:c.charts,streamsSource:c.streams?.url,bio:c.bio||null,allTime:c.allTime||null};});
  const now=new Set(rows.map(r=>r.slug));
  return {...out,rows,editorialMedian,entries:rows.filter(r=>r.previousRank==null&&previous.length).map(r=>r.slug),exits:previous.filter(s=>!now.has(s)).map(slug=>({slug}))};
 }

 // Promotion and relegation around the 50 line. Flags only: an editor confirms any change to the Current 50.
 function lineWatch(current,rows,size=EXTENSION.lineWatch){
  const ordered=[...current].sort((a,b)=>a.rank-b.rank),cut=ordered.at(-1);
  const relegation=ordered.slice(-size).map(a=>({slug:a.slug,name:a.name,rank:a.rank,score:a.score}));
  const promotion=[...rows].sort((a,b)=>b.officialFormulaScore-a.officialFormulaScore).slice(0,size).map(r=>({slug:r.slug,name:r.name,rank:r.rank,officialFormulaScore:r.officialFormulaScore,beatsLine:!!cut&&r.officialFormulaScore>cut.score,provisional:r.provisional}));
  return {lineScore:cut?.score??null,lineArtist:cut?{slug:cut.slug,name:cut.name}:null,relegation,promotion,proposals:promotion.filter(p=>p.beatsLine&&!p.provisional).map(p=>({promote:p.slug,relegate:cut.slug})),needsReview:promotion.filter(p=>p.beatsLine&&p.provisional).map(p=>p.slug)};
 }
 function median(xs){const s=[...xs].sort((a,b)=>a-b),m=s.length>>1;return s.length?(s.length%2?s[m]:(s[m-1]+s[m])/2):50;}
 return {HEAT,EXTENSION,heat,completeness,extension,lineWatch};
});
