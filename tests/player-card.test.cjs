const {test}=require('node:test'),assert=require('node:assert/strict');
const card=require('../player-card.js'),data=require('../data/current.json'),{photoFor,portraitPath}=require('../lib/player-card-photos.cjs');
const {Resvg}=require('@resvg/resvg-js'),path=require('node:path');
const render=svg=>new Resvg(svg,{font:{fontFiles:[path.resolve('assets/DejaVuSans.ttf')],loadSystemFonts:false}}).render().asPng();
test('tiers use official rank bands and 3-place movements without changing records',()=>{
 const before=JSON.stringify(data);
 for(const [rank,tier]of [[1,'gold'],[10,'gold'],[11,'silver'],[30,'silver'],[31,'bronze'],[50,'bronze']]){
  const d={artists:[{...data.artists[0],rank,previousRank:rank}]};assert.equal(card.model(d.artists[0].slug,d).tier,tier);
 }
 assert.equal(card.model('wizkid',{artists:[{...data.artists.find(a=>a.slug==='wizkid'),rank:1,previousRank:4}]}).tier,'mover');
 assert.equal(JSON.stringify(data),before);
});
test('all 50 cards use six complete sourced metrics and preserve their distinct units',()=>{
 assert.equal(data.artists.length,50);
 for(const artist of data.artists){
  const stats=card.model(artist.slug,data).stats;
  assert.deepEqual(stats.map(s=>s.key),['TOT','DAY','TRK','PRJ','STR','EDT']);
  assert.deepEqual(stats.map(s=>s.value),[artist.totalSpotifyStreams,artist.dailySpotifyStreams,artist.trackedSongCount,artist.trackedAlbumCount,Math.round(artist.scoreBreakdown.streamsIndex*.99),Math.round(artist.scoreBreakdown.editorialContribution*10)/10]);
  assert.ok(stats.every(s=>s.value!==null&&Number.isFinite(s.value)&&s.display!=='—'),artist.slug);
  assert.ok(stats.find(s=>s.key==='STR').value<=99);assert.ok(stats.find(s=>s.key==='EDT').value<=83);
 }
 const fixture={artists:[{...data.artists.find(a=>a.slug==='fola'),totalSpotifyStreams:1100000000,dailySpotifyStreams:3250000,trackedSongCount:56,trackedAlbumCount:8}]};
 const fola=card.model('fola',fixture).stats;assert.equal(fola[0].display,'1.1B');assert.equal(fola[1].display,'3.25M');
 assert.equal(fola[2].display,'56');assert.equal(fola[3].display,'8');
});
test('missing or invalid observations stay unknown rather than becoming invented zeroes',()=>{
 const fixture={artists:[{...data.artists[0],totalSpotifyStreams:null,dailySpotifyStreams:-1,trackedSongCount:undefined,trackedAlbumCount:undefined,scoreBreakdown:{streamsIndex:101,editorialContribution:84}}]};
 assert.ok(card.model(fixture.artists[0].slug,fixture).stats.every(s=>s.value===null&&s.display==='—'));
 assert.throws(()=>card.svg('missing',data),/not found/);
});
test('every artist has an embedded local raster portrait and unsafe paths or remote SVG images are rejected',()=>{
 for(const artist of data.artists){
  const photo=photoFor(artist);assert.ok(photo?.dataUrl.startsWith('data:image/'),artist.slug);
  assert.ok(card.svg(artist.slug,data,{photo}).includes('<image'),artist.slug);
 }
 assert.equal(portraitPath(data.artists.find(a=>a.slug==='davido')),'davido.jpg');
 assert.equal(portraitPath(data.artists.find(a=>a.slug==='zlatan')),'artists/zlatan.jpg');
 assert.equal(photoFor({slug:'unknown',image:'../../private.txt'}),null);
 assert.equal(photoFor({slug:'unknown',image:'https://example.com/photo.jpg'}),null);
 assert.ok(!card.svg('fola',data,{photo:{dataUrl:'https://example.com/photo.jpg'}}).includes('<image'));
});
test('the photo changes rendered PNG pixels rather than just adding an unused SVG image tag',()=>{
 const artist=data.artists.find(a=>a.slug==='fola');
 const withPhoto=render(card.svg(artist.slug,data,{photo:photoFor(artist)})),withoutPhoto=render(card.svg(artist.slug,data));
 assert.ok(!withPhoto.equals(withoutPhoto));assert.ok(withPhoto.length>withoutPhoto.length);
 const rendered=new Resvg(card.svg(artist.slug,data,{photo:photoFor(artist)}),{font:{fontFiles:[path.resolve('assets/DejaVuSans.ttf')],loadSystemFonts:false}}).render();
 const colors=new Set(),pixels=rendered.pixels;
 // This box is inside the portrait circle, away from its outline and other card text.
 for(let y=145;y<192;y+=4)for(let x=662;x<710;x+=4){const i=(y*1200+x)*4;colors.add(pixels.subarray(i,i+3).toString('hex'));}
 assert.ok(colors.size>8,'The portrait region must contain image detail, not an empty background');
});
test('Story and OG PNGs retain exact dimensions and the complete source labels',()=>{
 const artist=data.artists.find(a=>a.slug==='fola');
 for(const [format,w,h]of [['story',1080,1920],['og',1200,630]]){
  const svg=card.svg(artist.slug,data,{format,photo:photoFor(artist)}),png=render(svg);
  assert.equal(png.readUInt32BE(16),w);assert.equal(png.readUInt32BE(20),h);
  assert.ok(svg.includes('Editorial ranking'));assert.ok(svg.includes('/current/fola'));
  for(const text of ['SPOTIFY STREAMS','DAILY SPOTIFY','TRACKED SONGS','TRACKED PROJECTS','STREAM INDEX','EDITORIAL POINTS'])assert.ok(svg.includes(text),text);
  assert.ok(!svg.includes('Component not published'));
 }
});
