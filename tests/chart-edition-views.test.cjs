const test=require('node:test');
const assert=require('node:assert/strict');
const data=require('../data/current.json');
const editions=require('../data/current-editions.json');
const view=require('../api/view.js');
const {history}=require('../lib/artist-editions.cjs');
async function html(path){
 let body,status=200;
 await view({query:{path}},{setHeader(){},send(value){body=value},status(code){status=code;return this}});
 assert.equal(status,200);
 return body;
}
test('Omah Lay profile includes the published position and score before JavaScript runs',async()=>{
 assert.equal(editions['2026-11-15']['omah-lay'][0],9);
 const artist=data.artists.find(a=>a.slug==='omah-lay'),page=await html('current/omah-lay');
 assert.ok(page.includes('#'+artist.rank+' Current'));
 assert.ok(page.includes(artist.score.toFixed(1)));
 assert.ok(!page.includes('Loading the index…'));
 assert.match(page,/Weekly rank history/);
 assert.match(page,/Gap in saved weekly editions/);
});
test('matchup metadata identifies the requested pair in the canonical URL and social image',async()=>{
 const page=await html('vs/omah-lay/rema');
 assert.match(page,/<title>OMAH LAY vs Rema/i);
 assert.match(page,/rel="canonical" href="[^"]+\/vs\/omah-lay\/rema"/);
 assert.match(page,/property="og:image" content="[^"]+artist=omah-lay&amp;opponent=rema&amp;edition=/);
});
test('a new artist has an explicit history empty state',()=>{
 const result=history({slug:'new-artist',name:'New artist',rank:50,score:50},data);
 assert.match(result,/One or fewer saved editions/);
 assert.ok(!result.includes('<svg'));
});
