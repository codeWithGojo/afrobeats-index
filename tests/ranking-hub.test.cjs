const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const model=require('../chart-model.js'),{rows}=require('../data/stream-counter.json');
test('chart movement separates new, re-entry, stable and unknown positions',()=>{
  assert.deepEqual(model.movement(4,8),{type:'up',text:'4',label:'Up 4 places from #8'});
  assert.equal(model.movement(5,3).type,'down');
  assert.equal(model.movement(3,0).type,'new');
  assert.equal(model.movement(66,-1).type,'re');
  assert.equal(model.movement(4,4).type,'flat');
  assert.equal(model.movement(4,null).type,'unknown');
  assert.match(model.badge(4,8),/aria-label="Up 4 places from #8"/);
});
test('Spotify URLs and URIs find the same recording, deduplicated across artists',()=>{
  const song=rows.find(r=>r.type==='songs'&&r.spotifyId);
  for(const search of [song.spotifyId,`https://open.spotify.com/track/${song.spotifyId}?si=test`,`spotify:track:${song.spotifyId}`]){
    const hits=model.filter(rows,{search});assert.equal(hits.length,1);assert.equal(hits[0].id,song.id);
  }
  assert.equal(new Set(rows.map(r=>r.id)).size,rows.length);
});
test('2026 stream charts use verified release identities and preserve source totals',()=>{
  const audit=require('../data/releases-2026.json');
  for(const [type,cohort]of [['songs',audit.songs],['albums',audit.albums]]){
    const list=model.filter(rows,{type,year:2026});assert.equal(list.length,cohort.length);
    for(const item of list){const source=cohort.find(r=>r.spotify_id===item.spotifyId);assert.ok(source);assert.equal(item.total,source.total_streams);assert.equal(item.sourceDate,source.source_date);}
    assert.ok(list.every((r,i)=>!i||list[i-1].total>=r.total));
  }
  assert.equal(model.filter(rows,{search:'a song that is absent from this catalogue'}).length,0);
  const daily=model.filter(rows,{sort:'daily'});assert.ok(daily.every((r,i)=>!i||(daily[i-1].daily??-1)>=(r.daily??-1)));
});
test('both TurnTable charts contain all 100 original positions and explicit entry states',()=>{
  for(const file of ['nigeria-top100','nigeria-albums-top100']){
    const chart=require('../data/'+file+'.json');assert.deepEqual(chart.rows.map(r=>r[0]),Array.from({length:100},(_,i)=>i+1));
    assert.ok(chart.weekEnd<=chart.checkedAt.slice(0,10));
    for(const row of chart.rows){if(row[3]<0)assert.equal(row[6],'RE-ENTRY');if(row[3]===0)assert.equal(row[6],'NEW');}
  }
});
test('every ranking view exposes the switcher and new charts retain semantic tables',()=>{
  for(const page of ['current','all-time','albums','releases','regions','net-worth','streams','top100','top100-albums']){
    const html=fs.readFileSync(page+'.html','utf8');assert.match(html,/id="ranking-destination"/);assert.match(html,/href="\/rankings"/);assert.match(html,/value="\/all-time"/);
  }
  for(const page of ['top100','top100-albums']){const html=fs.readFileSync(page+'.html','utf8');assert.equal((html.match(/<tr data-chart-search=/g)||[]).length,100);assert.match(html,/role="region"/);assert.match(html,/scope="col"/);}
  assert.match(fs.readFileSync('streams.html','utf8'),/2026 releases, ranked by lifetime Spotify totals/);
});

test('Spotify artist links and URIs match the artist catalogue',()=>{
  const artist=rows.find(r=>r.type==='artists'&&r.spotifyId);
  for(const search of [artist.spotifyId,`https://open.spotify.com/artist/${artist.spotifyId}?si=test`,`https://open.spotify.com/intl-fr/artist/${artist.spotifyId}`,`spotify:artist:${artist.spotifyId}`]){
    const hits=model.filter(rows,{type:'artists',search});
    assert.equal(hits.length,1);assert.equal(hits[0].id,artist.id);
  }
});
