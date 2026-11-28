const test=require('node:test'),assert=require('node:assert/strict');
const M=require('../stats-model.js');
const roster=require('../data/african-artists.json').artists;
const current=require('../data/current.json').artists;
const index=M.buildIndex(roster);

test('matching keeps only African artists in the index and counts the rest',()=>{
 const s=M.matchSnapshot(index,{artists:[{name:'WizKid',rank:1},{name:'Taylor Swift',rank:2},{name:'Burna Boy',rank:3},{name:'Wizkid',rank:4}],tracks:[{title:'Essence',artists:['Wizkid','Tems'],rank:1},{title:'Anti-Hero',artists:['Taylor Swift'],rank:2}]});
 assert.deepEqual(s.artists.map(a=>a.slug),['wizkid','burna-boy']);
 assert.equal(s.unmatched.artists,1);assert.equal(s.unmatched.tracks,1);
 assert.deepEqual(s.tracks[0].artists.map(a=>a.slug).sort(),['tems','wizkid']);
});

test('profile reports genre, country, era and where taste sits against the Current 50',()=>{
 const s=M.matchSnapshot(index,{artists:current.slice(0,5).map((a,i)=>({name:a.name,rank:i+1}))});
 const p=M.profile(s,{current,now:new Date('2026-11-28')});
 assert.equal(p.chart.inCurrent50,5);assert.equal(p.chart.label,'Right on the chart');
 for(const k of ['genres','countries','eras'])assert.ok(Math.abs(p[k].reduce((n,x)=>n+x.percent,0)-100)<=2,k);
 assert.equal(M.era(2001,new Date('2026-01-01')),'Old school');assert.equal(M.era(2022,new Date('2026-01-01')),'New wave');
});

test('taste similarity is 1 for identical tastes and lists shared artists',()=>{
 const s=M.matchSnapshot(index,{artists:current.slice(0,8).map(a=>({name:a.name}))});
 const v=M.tasteVector(s.artists);assert.equal(M.similarity(v,v).score,1);
 const other=M.tasteVector(M.matchSnapshot(index,{artists:current.slice(4,12).map(a=>({name:a.name}))}).artists);
 const sim=M.similarity(v,other);assert.ok(sim.score>0&&sim.score<1);assert.equal(sim.shared.length,4);
});

test('lifetime import aggregates African plays only, skips short plays and stores no raw rows',()=>{
 const rows=[
  {ts:'2025-12-31T22:10:00Z',master_metadata_track_name:'Essence',master_metadata_album_artist_name:'Wizkid',ms_played:200000,ip_addr:'1.2.3.4'},
  {ts:'2026-01-02T08:00:00Z',master_metadata_track_name:'Essence',master_metadata_album_artist_name:'Wizkid',ms_played:180000},
  {ts:'2026-01-02T09:00:00Z',master_metadata_track_name:'Anti-Hero',master_metadata_album_artist_name:'Taylor Swift',ms_played:200000},
  {ts:'2026-01-03T09:00:00Z',master_metadata_track_name:'Essence',master_metadata_album_artist_name:'Wizkid',ms_played:5000},
  {endTime:'2026-02-01 10:00',trackName:'Last Last',artistName:'Burna Boy',msPlayed:170000}];
 const L=M.lifetime(rows,index);
 assert.equal(L.events,3);assert.equal(L.unmatchedPlays,1);assert.equal(L.skipped,1);
 assert.deepEqual(L.years.map(y=>y.year),[2025,2026]);assert.equal(L.artists[0].slug,'wizkid');
 assert.ok(!JSON.stringify(L).includes('1.2.3.4'),'no raw fields survive');
 assert.equal(M.wrapped(L,2026).topArtist,'wizkid');
});

test('stats service validates Last.fm input and stays off without a key',async()=>{
 const svc=require('../lib/product-stats.cjs');
 const res=()=>{const r={code:200,body:null,headers:{},status(c){r.code=c;return r;},json(b){r.body=b;return r;},setHeader(k,v){r.headers[k]=v;},end(){return r;}};return r;};
 delete process.env.LASTFM_API_KEY;delete process.env.APPLE_MUSIC_ENABLED;
 let r=res();await svc({query:{action:'config'}},r);assert.equal(r.body.lastfm,false);assert.equal(r.body.appleMusic,false);
 r=res();await svc({query:{action:'lastfm',user:'x',kind:'artists'}},r);assert.equal(r.code,503);
 process.env.LASTFM_API_KEY='test';r=res();await svc({query:{action:'lastfm',user:'bad user!',kind:'artists'}},r);assert.equal(r.code,400);delete process.env.LASTFM_API_KEY;
 r=res();await svc({method:'POST',headers:{},query:{action:'waitlist'},body:{feature:'apple-music',email:'a@b.co',consent:false}},r);assert.equal(r.code,400);
});
