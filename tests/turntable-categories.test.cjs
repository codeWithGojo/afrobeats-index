const test=require('node:test');
const assert=require('node:assert/strict');
const charts=require('../data/turntable-categories.json');
const {destinations,rankingNav,chartTable}=require('../lib/ranking-ui.cjs');
test('every requested TurnTable category retains a dated publisher snapshot and original positions',()=>{
 assert.deepEqual(charts.map(c=>c.categoryId).sort((a,b)=>a-b),[3,4,5,13,14,16,18,20,21,22,31]);
 for(const c of charts){
  assert.equal(c.sourceUrl,`https://www.turntablecharts.com/charts/${c.categoryId}`);
  assert.equal(Date.parse(c.weekEnd)-Date.parse(c.weekStart),6*86400000);
  assert.ok(Date.parse(c.checkedAt)>Date.parse(c.weekEnd));
  assert.deepEqual(c.rows.map(r=>r[0]),Array.from({length:c.rows.length},(_,i)=>i+1));
  assert.ok(c.rows.every(r=>r[1]&&Number.isInteger(r[4])&&r[4]>=0));
  assert.ok(destinations.flatMap(([,items])=>items).some(([p])=>p==='/turntable-'+c.slug));
 }
 assert.equal(charts.find(c=>c.slug==='recurrents').rows.length,11,'do not fabricate missing recurrent positions');
});
test('archives stay distinct from weekly charts and publisher points stay labelled',()=>{
 for(const slug of ['tv','year-songs','year-producers','year-artists'])assert.equal(charts.find(c=>c.slug===slug).group,'Archive');
 const artist=charts.find(c=>c.slug==='artists');
 const html=chartTable(artist,'entries');assert.match(html,/Artist \/ publisher points/);assert.match(html,/648.70 pts/);
 assert.match(rankingNav('/turntable-tv'),/Official TV Songs · archive/);
 assert.match(rankingNav('/turntable-tv'),/value="\/turntable-tv" selected/);
});
