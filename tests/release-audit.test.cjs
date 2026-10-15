const test=require('node:test'),assert=require('node:assert/strict');
const data=require('../data/releases-2026.json'),sources=require('../data/releases-2026-sources.json');
const chart=require('../data/nigeria-top100.json');
test('published 2026 cohort uses matching ledger values, dates and explicit global totals',()=>{
 assert.equal(sources.artists.length,50);
 for(const kind of ['albums','songs']){
  const rows=data[kind];assert.ok(rows.length>=(kind==='albums'?10:15));
  assert.equal(new Set(rows.map(r=>r.spotify_id)).size,rows.length);
  rows.forEach((r,i)=>{
   assert.equal(r.year,2026);assert.match(r.release_date,/^2026-/);assert.ok(r.release_date<=data.checked_at.slice(0,10));
   assert.ok(r.total_streams>0);assert.ok(!('streams_this_year' in r));
   if(i)assert.ok(rows[i-1].total_streams>=r.total_streams);
   const a=sources.artists.find(a=>a.artist_slug===r.artist_slug);
   const entry=a[kind].rows.find(x=>x.spotify_url===r.spotify_url);
   assert.equal(entry.total,r.total_streams);assert.equal(r.source_date,a[kind].source_date);assert.equal(r.source_url,a[kind].url);
   assert.match(r.release_source,/^https:\/\/music.apple.com\//);
   if(kind==='albums'){
    const p=require('../data/quiz/catalogues/'+r.artist_slug+'.json');
    const meta=a.apple_albums.find(x=>x.collectionId===r.apple_collection_id);
    assert.equal(meta.artistId,p.appleArtistId,'Feature-only appearances cannot stand for full albums');
    assert.equal(meta.collectionViewUrl,r.release_source);assert.equal(meta.releaseDate.slice(0,10),r.release_date);assert.ok(meta.trackCount>=4);
   }
  });
 }
 assert.ok(data.excluded_albums.some(r=>r.artist_slug==='fola'&&r.title==='HYBRID'));
 assert.equal(data.albums.find(r=>r.album_title==='HYBRID').artist_slug,'shoday');
});
test('official Top 100 preserves complete ranks and a dated weekly snapshot',()=>{
 assert.equal(chart.rows.length,100);assert.deepEqual(chart.rows.map(r=>r[0]),Array.from({length:100},(_,i)=>i+1));
 assert.ok(chart.weekStart<chart.weekEnd&&chart.weekEnd<=chart.checkedAt.slice(0,10));
 assert.equal(chart.rows[0][1],'Ilome');assert.equal(chart.rows[4][1],'Ikebe 3000');
});
