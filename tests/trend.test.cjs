const test=require('node:test'),assert=require('node:assert/strict');
const T=require('../trend-model.js');
const data=require('../data/current.json');

const snap=(date,values)=>({capturedAt:date+'T06:00:00Z',artists:Object.fromEntries(Object.entries(values).map(([slug,daily])=>[slug,{dailySpotifyStreams:daily,totalSpotifyStreams:daily*1000,sourceDate:date}]))});

test('recent streams use the rolling window, not lifetime totals, and repeated readings count once',()=>{
 const history=[snap('2026-09-01',{a:900}),snap('2026-11-01',{a:100}),snap('2026-11-08',{a:200}),snap('2026-11-15',{a:200}),snap('2026-11-22',{a:300})];
 const rows=T.series(history,'a');
 assert.deepEqual(rows.map(r=>r.date),['2026-09-01','2026-11-01','2026-11-08','2026-11-22']);
 const pace=T.recentPace(rows,'2026-11-22');
 assert.equal(pace.readings,3);assert.equal(pace.value,200);
});

test('log scale compresses big catalogues and floors small ones at zero',()=>{
 assert.equal(T.logIndex(1e6,1e6),100);
 assert.equal(T.logIndex(5000,1e6),0);
 // Linear scaling would give 100k against a 10M leader 1 point; the log scale gives a third of the range.
 const mid=T.logIndex(1e5,1e7);
 assert.ok(Math.abs(mid-100/3)<1e-9,String(mid));
});

test('momentum compares this week with the artist own baseline and is neutral without one',()=>{
 const history=[snap('2026-10-25',{a:100,b:100}),snap('2026-11-01',{a:100,b:100}),snap('2026-11-08',{a:100,b:100}),snap('2026-11-22',{a:200,b:50})];
 const up=T.momentum(T.series(history,'a'),'2026-11-22'),down=T.momentum(T.series(history,'b'),'2026-11-22');
 assert.equal(up.score,100);assert.equal(down.score,0);assert.equal(up.basis,'prior-4-weeks');
 const none=T.momentum(T.series([snap('2026-11-22',{a:100})],'a'),'2026-11-22');
 assert.equal(none.score,50);assert.equal(none.available,false);
 const stale=T.momentum(T.series([snap('2026-08-01',{a:100}),snap('2026-11-22',{a:300})],'a'),'2026-11-22');
 assert.equal(stale.available,false,'baselines older than 8 weeks are not used');
});

test('editorial keeps full weight for 8 weeks, then fades to the floor by week 12',()=>{
 assert.equal(T.editorialFactor('2026-10-05','2026-11-29').factor,1);
 const mid=T.editorialFactor('2026-10-05','2026-12-14').factor;assert.ok(mid<1&&mid>T.DEFAULTS.editorialFloor);
 assert.equal(T.editorialFactor('2026-10-05','2027-01-30').factor,T.DEFAULTS.editorialFloor);
});

test('activity counts only dated, sourced signals and ignores DJ-mix reissues',()=>{
 const artist={slug:'x',name:'Xena'};
 const ctx={releases:[],identities:{x:{tracks:[{artistName:'Xena',trackName:'Song (Mixed)',releaseDate:'2026-11-20T00:00:00Z'},{artistName:'Someone',trackName:'Other (feat. Xena)',releaseDate:'2026-11-20T00:00:00Z'}]}},chart:{weekEnd:'2026-11-12',rows:[[4,'Hit','Xena & Y']]},events:[],concerts:[]};
 const a=T.activity(artist,ctx,'2026-11-22');
 assert.deepEqual(a.signals.map(s=>s.kind),['chart']);assert.equal(a.score,30);
 ctx.identities.x.tracks.push({artistName:'Xena',trackName:'New One',releaseDate:'2026-11-10T00:00:00Z'});
 assert.equal(T.activity(artist,ctx,'2026-11-22').score,70);
 assert.equal(T.activity(artist,{...ctx,chart:{...ctx.chart,weekEnd:'2026-09-01'}},'2026-11-22').score,40,'stale charts do not count');
});

test('the weekly cap keeps every ranked artist within the limit and stays a valid permutation',()=>{
 const items=Array.from({length:20},(_,i)=>({id:i,previousRank:i+1}));
 const target=[...items].reverse();
 const out=T.capMovement(target,3);
 assert.equal(new Set(out).size,20);
 out.forEach((x,i)=>assert.ok(Math.abs(i+1-x.previousRank)<=3,`#${x.previousRank} moved to #${i+1}`));
 const fresh=T.capMovement([{id:'new',previousRank:null},...items.slice(0,4)],2);
 assert.equal(fresh[0].id,'new','new entries are not capped');
});

test('smoothing averages earlier editions inside 28 days only',()=>{
 const history=[snap('2026-11-22',{a:100,b:100})];
 const inputs={history,editorial:{a:{score:80,reviewedAt:'2026-11-01'},b:{score:60,reviewedAt:'2026-11-01'}},activity:{},scoreHistory:{'2026-11-15':{a:10,b:10},'2026-09-01':{a:0,b:0}}};
 const res=T.score([{slug:'a',previousRank:1},{slug:'b',previousRank:2}],inputs,'2026-11-22');
 const a=res.rows.find(r=>r.a.slug==='a');
 assert.equal(a.smoothedEditions,2);assert.ok(Math.abs(a.smoothed-(a.raw+10)/2)<1e-9);
});

test('published edition is v2, capped, bounded and explains every input',()=>{
 const max=data.artists[0].scoreBreakdown.maxMovePlaces;
 assert.deepEqual(data.artists.map(a=>a.rank),Array.from({length:50},(_,i)=>i+1));
 for(const a of data.artists){
  const b=a.scoreBreakdown;
  assert.equal(b.version,2);
  for(const k of ['recentStreams','momentum','editorial','activity'])assert.ok(b.components[k]>=0&&b.components[k]<=100,a.slug+' '+k);
  assert.ok(a.score>=0&&a.score<=100);
  if(Number.isInteger(a.previousRank))assert.ok(Math.abs(a.previousRank-a.rank)<=max,a.slug);
  assert.ok(b.editorial.reviewedAt&&b.recentStreams.to,a.slug);
  for(const s of b.activity.signals)assert.ok(s.date&&s.points>0,a.slug);
 }
 assert.equal(data.meta.rankingMethod.version,2);
});
