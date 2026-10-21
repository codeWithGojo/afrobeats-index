const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const data=require('../data/current.json'),view=require('../current-view.js');
test('published chart, enhanced chart and search metadata agree on every official position',()=>{
 const page=fs.readFileSync('index.html','utf8');
 const section=page.slice(page.indexOf('<section id="current"'),page.indexOf('</section>',page.indexOf('<section id="current"')));
 const expected=[...data.artists].sort((a,b)=>a.rank-b.rank);
 const slugs=html=>[...html.matchAll(/data-artist-slug="([^"]+)"/g)].map(match=>match[1]);
 assert.equal(slugs(section).length,50);
 assert.deepEqual(slugs(section),expected.map(a=>a.slug));
 assert.deepEqual(slugs(view.rows(data.artists)),slugs(section));
 const schema=JSON.parse(page.match(/id="current-chart-schema" type="application\/ld\+json">([^<]+)<\/script>/)[1]);
 assert.deepEqual(schema.itemListElement.map(item=>item.name),expected.map(a=>a.name));
 for(const artist of expected){assert.ok(section.includes(`href="/current/${artist.slug}"`));assert.ok(section.includes(Number(artist.score).toFixed(1)));}
});
