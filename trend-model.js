/* Current 50 v2 scoring: recent streams, momentum, editorial with decay, activity.
   Shared by the build (Node) and the browser. Pure functions; no network, no invented values.
   Every input carries a date. Missing evidence gives a neutral or zero signal and is labelled. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.AfriTrend=api;})(typeof window==='object'?window:globalThis,function(){
 'use strict';
 const DAY=864e5;
 const DEFAULTS=Object.freeze({
  version:2,
  weights:{recentStreams:35,momentum:25,editorial:25,activity:15},
  recentWindowDays:28,          // streams are scored on readings inside this rolling window
  momentumWeekDays:7,           // "this week"
  momentumBaselineDays:28,      // the artist's own 4-week baseline, taken before this week
  momentumMaxBaselineAgeDays:56,// older baselines are not used; momentum falls back to neutral
  momentumCapRatio:2,           // 2x baseline = 100, 0.5x = 0, equal = 50
  logFloorDaily:10000,          // daily streams at or below this score 0 on the log scale
  editorialFullDays:56,         // full weight for 8 weeks after review
  editorialDecayEndDays:84,     // linear fade until 12 weeks
  editorialFloor:.4,            // stale editorial keeps 40% of its spread around the median
  smoothingDays:28,             // average this edition with editions inside the last 28 days
  smoothingMaxEditions:4,
  maxMovePlaces:8               // a ranked artist moves at most this many places per edition
 });
 const time=v=>{const t=Date.parse(v);return Number.isFinite(t)?t:null;};
 const day=v=>{const t=time(v);return t===null?null:new Date(t).toISOString().slice(0,10);};
 const clamp=(v,lo=0,hi=100)=>Math.max(lo,Math.min(hi,v));
 const mean=xs=>xs.length?xs.reduce((a,b)=>a+b,0)/xs.length:null;
 const median=xs=>{const s=[...xs].sort((a,b)=>a-b),m=s.length>>1;return s.length?(s.length%2?s[m]:(s[m-1]+s[m])/2):null;};
 const norm=v=>String(v||'').normalize('NFKD').replace(/[̀-ͯ]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();

 // Per-artist dated readings of Kworb's daily Spotify figure. One reading per publisher date.
 function series(history,slug){
  const out=new Map();
  for(const snap of history||[])for(const [s,v] of Object.entries(snap.artists||{})){
   if(s!==slug||!Number.isFinite(v?.dailySpotifyStreams))continue;
   const date=day(String(v.sourceDate||snap.capturedAt).replace(/\//g,'-'));if(!date)continue;
   out.set(date,{date,daily:v.dailySpotifyStreams,total:Number.isFinite(v.totalSpotifyStreams)?v.totalSpotifyStreams:null});
  }
  // A repeated (daily,total) pair is a retained last-good value, not a new reading.
  const sorted=[...out.values()].sort((a,b)=>a.date.localeCompare(b.date));
  return sorted.filter((r,i)=>!i||r.daily!==sorted[i-1].daily||r.total!==sorted[i-1].total);
 }
 // Each artist is measured from their own latest publisher reading; staleDays says how old it is.
 function anchor(rows,asOf){const last=rows.at(-1);if(!last)return {date:asOf,staleDays:null};const t=Math.min(time(asOf),time(last.date));return {date:new Date(t).toISOString().slice(0,10),staleDays:Math.max(0,Math.round((time(asOf)-time(last.date))/DAY))};}
 const within=(rows,asOf,from,to)=>rows.filter(r=>{const age=(time(asOf)-time(r.date))/DAY;return age>=from&&age<to;});

 // Recent streams: mean daily reading inside the rolling window.
 function recentPace(rows,asOf,cfg=DEFAULTS){
  const inWindow=within(rows,asOf,-1,cfg.recentWindowDays);
  if(!inWindow.length)return {value:null,readings:0,from:null,to:null};
  return {value:mean(inWindow.map(r=>r.daily)),readings:inWindow.length,from:inWindow[0].date,to:inWindow.at(-1).date};
 }
 // Log scale against a fixed floor so a huge catalogue cannot crush mid-size artists.
 function logIndex(value,maximum,floor=DEFAULTS.logFloorDaily){
  if(!Number.isFinite(value)||!Number.isFinite(maximum)||maximum<=floor)return null;
  return clamp(100*Math.log(Math.max(value,floor)/floor)/Math.log(maximum/floor));
 }
 // Momentum: this week vs the artist's own 4-week baseline. Neutral 50 when no usable baseline.
 function momentum(rows,asOf,cfg=DEFAULTS){
  const week=within(rows,asOf,-1,cfg.momentumWeekDays);
  let base=within(rows,asOf,cfg.momentumWeekDays,cfg.momentumWeekDays+cfg.momentumBaselineDays),basis='prior-4-weeks';
  if(!base.length){
   // History gap: use the latest four readings before this week if the newest is recent enough.
   const older=rows.filter(r=>(time(asOf)-time(r.date))/DAY>=cfg.momentumWeekDays).slice(-4);
   if(older.length&&(time(asOf)-time(older.at(-1).date))/DAY<=cfg.momentumMaxBaselineAgeDays){base=older;basis='latest-4-readings';}
  }
  const now=mean(week.map(r=>r.daily)),then=mean(base.map(r=>r.daily));
  if(!Number.isFinite(now)||!Number.isFinite(then)||then<=0)return {score:50,ratio:null,available:false,basis:'unavailable',baselineFrom:null,baselineTo:null,thisWeek:now};
  const ratio=now/then,score=clamp(50+50*Math.log(ratio)/Math.log(cfg.momentumCapRatio));
  return {score,ratio,available:true,basis,baselineFrom:base[0].date,baselineTo:base.at(-1).date,thisWeek:now,baseline:then,readings:week.length+base.length};
 }
 // Editorial decay: full weight for 8 weeks, then fades to a floor by week 12 until re-scored.
 function editorialFactor(reviewedAt,asOf,cfg=DEFAULTS){
  const age=(time(asOf)-time(reviewedAt))/DAY;
  if(!Number.isFinite(age))return {factor:cfg.editorialFloor,ageDays:null};
  if(age<=cfg.editorialFullDays)return {factor:1,ageDays:age};
  if(age>=cfg.editorialDecayEndDays)return {factor:cfg.editorialFloor,ageDays:age};
  return {factor:1-(1-cfg.editorialFloor)*(age-cfg.editorialFullDays)/(cfg.editorialDecayEndDays-cfg.editorialFullDays),ageDays:age};
 }

 // Activity signals from dated, sourced records. TikTok and Shazam count only when reviewed observations exist.
 const splitArtists=text=>String(text||'').split(/\s*(?:,|&|\bx\b|\bfeat\.?|\bft\.?|\bwith\b|\band\b)\s*/i).map(norm).filter(Boolean);
 function activity(artist,ctx,asOf){
  const t=time(asOf),signals=[];
  const age=d=>(t-time(d))/DAY;
  // 1. New release (released on or before the edition date).
  const releases=[];
  for(const r of ctx.releases||[])if(r.artist_slug===artist.slug&&r.release_date)releases.push({date:day(r.release_date),title:r.song_title||r.album_title,url:r.spotify_url});
  // Apple identities: lead or co-lead credits only; DJ-mix, remix, edit and sped-up reissues are not new releases.
  const reissue=/\b(mixed|remix|edit|sped up|slowed|instrumental|acapella|a cappella)\b/i;
  for(const r of ctx.identities?.[artist.slug]?.tracks||[])if(r.releaseDate&&!reissue.test(r.trackName)&&splitArtists(r.artistName).includes(norm(artist.name)))releases.push({date:day(r.releaseDate),title:r.trackName,url:r.trackViewUrl});
  const latest=releases.filter(r=>r.date&&age(r.date)>=0).sort((a,b)=>b.date.localeCompare(a.date))[0];
  if(latest){const a=age(latest.date),points=a<=28?40:a<=56?25:a<=90?10:0;if(points)signals.push({kind:'release',label:'New release: '+latest.title,points,date:latest.date,sourceUrl:latest.url||null});}
  // 2. Chart entries on the official TurnTable Nigeria Top 100, if the chart week is recent.
  const chart=ctx.chart;
  if(chart&&age(chart.weekEnd)<=28){
   const me=norm(artist.name),entries=(chart.rows||[]).filter(r=>splitArtists(r[2]).includes(me));
   if(entries.length){const best=Math.min(...entries.map(r=>r[0])),points=Math.min(35,(best<=10?30:best<=50?20:10)+(entries.length>=3?5:0));signals.push({kind:'chart',label:`${entries.length} TurnTable Top 100 ${entries.length===1?'entry':'entries'}, best #${best}`,points,date:day(chart.weekEnd),sourceUrl:chart.sourceUrl||null});}
  }
  // 3. Awards and nominations in the last 120 days.
  const awards=(ctx.events||[]).filter(e=>e.artist_slug===artist.slug&&e.event_date&&age(e.event_date)>=0&&age(e.event_date)<=120&&['award','nomination'].includes(e.kind));
  if(awards.length){const won=awards.some(e=>e.kind==='award'||e.details?.result==='winner');const e=awards.sort((a,b)=>b.event_date.localeCompare(a.event_date))[0];signals.push({kind:'awards',label:(won?'Award win: ':'Nomination: ')+e.title,points:won?15:8,date:e.event_date,sourceUrl:e.source_url||null});}
  // 4. Touring: a verified show inside 30 days either side of the edition.
  const show=(ctx.concerts||[]).filter(c=>(c.artistIds||[]).includes(artist.slug)&&c.date&&Math.abs(age(c.date))<=30).sort((a,b)=>Math.abs(age(a.date))-Math.abs(age(b.date)))[0];
  if(show)signals.push({kind:'touring',label:'Live: '+show.title,points:10,date:show.date,sourceUrl:null});
  // 5. Reviewed TikTok or Shazam spikes (none in the repository yet).
  const spike=(ctx.signals||[]).filter(s=>s.artist_slug===artist.slug&&s.reviewed&&age(s.period_end)<=28)[0];
  if(spike)signals.push({kind:spike.platform,label:`${spike.platform==='tiktok'?'TikTok':'Shazam'} spike`,points:10,date:day(spike.period_end),sourceUrl:spike.source_url});
  return {score:clamp(signals.reduce((n,s)=>n+s.points,0)),signals};
 }

 // Movement cap: keep the best-scoring order while no ranked artist moves more than `cap` places.
 function capMovement(items,cap){
  const n=items.length,lo=x=>Number.isInteger(x.previousRank)&&x.previousRank>0?Math.max(1,x.previousRank-cap):1,hi=x=>Number.isInteger(x.previousRank)&&x.previousRank>0?Math.min(n,x.previousRank+cap):n;
  const feasible=(rest,start)=>{const pool=[...rest];for(let p=start;p<=n;p++){const ready=pool.filter(x=>lo(x)<=p);if(!ready.length)return false;ready.sort((a,b)=>hi(a)-hi(b));if(hi(ready[0])<p)return false;pool.splice(pool.indexOf(ready[0]),1);}return true;};
  const left=[...items],out=[];
  for(let p=1;p<=n;p++){
   const ready=left.filter(x=>lo(x)<=p);
   let pick=ready.find(x=>{const rest=left.filter(y=>y!==x);return hi(x)>=p&&feasible(rest,p+1);});
   if(!pick)pick=ready.sort((a,b)=>hi(a)-hi(b))[0]||left[0];
   left.splice(left.indexOf(pick),1);out.push(pick);
  }
  return out;
 }

 /* Score every artist. `inputs`:
    history: stream snapshots [{capturedAt, artists:{slug:{dailySpotifyStreams,totalSpotifyStreams,sourceDate}}}]
    editorial: {slug:{score 0-100, reviewedAt}}
    activity: {slug:{score,signals}} (precomputed at build time)
    scoreHistory: {editionDate:{slug:rawScore}} earlier v2 editions
    config: overrides of DEFAULTS */
 function score(artists,inputs,asOf){
  const cfg={...DEFAULTS,...(inputs.config||{}),weights:{...DEFAULTS.weights,...(inputs.config?.weights||{})}};
  const w=cfg.weights,total=w.recentStreams+w.momentum+w.editorial+w.activity;
  const rows=artists.map(a=>{const s=series(inputs.history,a.slug),at=anchor(s,asOf);return {a,s,at,pace:recentPace(s,at.date,cfg),mom:momentum(s,at.date,cfg)};});
  const maxPace=Math.max(0,...rows.map(r=>r.pace.value).filter(Number.isFinite));
  const editorialScores=artists.map(a=>inputs.editorial?.[a.slug]?.score).filter(Number.isFinite),edMedian=median(editorialScores);
  for(const r of rows){
   const ed=inputs.editorial?.[r.a.slug];if(!ed||!Number.isFinite(ed.score))throw Error('Missing editorial score: '+r.a.slug);
   const decay=editorialFactor(ed.reviewedAt,asOf,cfg),editorialEffective=edMedian+decay.factor*(ed.score-edMedian);
   const recent=logIndex(r.pace.value,maxPace,cfg.logFloorDaily)??0,act=inputs.activity?.[r.a.slug]||{score:0,signals:[]};
   const parts={recentStreams:recent,momentum:r.mom.score,editorial:editorialEffective,activity:act.score};
   const raw=(parts.recentStreams*w.recentStreams+parts.momentum*w.momentum+parts.editorial*w.editorial+parts.activity*w.activity)/total;
   r.parts=parts;r.raw=raw;r.decay=decay;r.ed=ed;r.act=act;
  }
  // Smoothing: mean of this raw score and earlier v2 editions inside the smoothing window.
  const prior=Object.entries(inputs.scoreHistory||{}).filter(([d])=>{const age=(time(asOf)-time(d))/DAY;return age>0&&age<cfg.smoothingDays;}).sort(([a],[b])=>b.localeCompare(a)).slice(0,cfg.smoothingMaxEditions-1);
  for(const r of rows){const xs=[r.raw,...prior.map(([,v])=>v[r.a.slug]).filter(Number.isFinite)];r.smoothed=mean(xs);r.smoothedEditions=xs.length;}
  const target=[...rows].sort((x,y)=>y.smoothed-x.smoothed||(x.a.previousRank??99)-(y.a.previousRank??99)||x.a.slug.localeCompare(y.a.slug));
  target.forEach((r,i)=>r.targetRank=i+1);
  const final=capMovement(target.map(r=>({r,previousRank:r.a.previousRank})),cfg.maxMovePlaces).map(x=>x.r);
  final.forEach((r,i)=>{r.rank=i+1;r.capped=r.rank!==r.targetRank;});
  return {config:cfg,maxPace,editorialMedian:edMedian,smoothingEditions:prior.map(([d])=>d),rows:final};
 }
 return {DEFAULTS,series,anchor,recentPace,logIndex,momentum,editorialFactor,activity,capMovement,score,splitArtists,norm};
});
