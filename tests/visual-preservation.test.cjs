const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const data=require('../data/current.json');
const view=require('../current-view.js');
const presentation=require('../artist-presentation.js');
const {shellHeader,bottomNav,sitemap}=require('../lib/ui-shell.cjs');
test('visual renderers leave every source record and published score intact',()=>{
  const before=JSON.stringify(data);
  for(const artist of data.artists){
    const html=presentation.header(artist,data);
    assert.ok(html.includes(`/api/card?artist=${artist.slug}`));
    assert.ok(html.includes(`/quiz/${artist.slug}`));
    assert.ok(html.includes('id="share-card"'));
  }
  view.hero(data.artists);view.chart(data.artists);presentation.comparison(data.artists.slice(0,3));
  assert.equal(JSON.stringify(data),before);
});
test('the compact shell retains every homepage screen and the receipt comparison route',()=>{
  const page=fs.readFileSync('index.html','utf8'),shell=shellHeader({home:true})+sitemap();
  for(const id of [...page.matchAll(/<section[^>]*id="([^"]+)"[^>]*class="[^"]*tab-content/g)].map(m=>m[1]))
    assert.ok(shell.includes(`data-tab="${id}"`),`Missing screen ${id}`);
  for(const route of ['/studio/compare','/studio/group','/account','/calendar/live','/studio/streams'])assert.ok(shell.includes(`href="${route}"`));
  for(const label of ['Rankings','Compare','Receipt','Watch','Method','Pro'])assert.ok(bottomNav().includes(label));
});
test('movement display distinguishes new entries without assigning a fabricated previous rank',()=>{
  assert.ok(view.movement({rank:1,previousRank:null}).includes('New entry'));
  assert.ok(view.movement({rank:1,previousRank:5}).includes('Up 4 from #5'));
  assert.ok(view.movement({rank:2,previousRank:1}).includes('Down 1 from #1'));
});
