const test=require('node:test'),assert=require('node:assert/strict');
const MI=require('../my-index-model.js');
const data=require('../data/current.json'),seeds=require('../data/my-index-templates.json');
const artists=[...data.artists].sort((a,b)=>a.rank-b.rank);

test('free accounts use exactly 3 metrics; Pro allows up to 8 and custom metrics',()=>{
 const m=keys=>({metrics:keys.map(key=>({key,weight:10}))});
 assert.deepEqual(MI.validateSet(m(['streams','vocals','vibes'])),[]);
 assert.ok(MI.validateSet(m(['streams','vocals','vibes','live'])).length);
 assert.deepEqual(MI.validateSet(m(['streams','vocals','vibes','live',MI.customKey('Dance moves')]),{pro:true}),[]);
 assert.ok(MI.validateSet(m(['streams','vocals']),{pro:true}).length);
 assert.equal(MI.customKey('Dance Moves!'),'custom-dance-moves');
});

test('every seeded template is valid and the default exists',()=>{
 assert.ok(seeds.templates.some(t=>t.id===seeds.default));
 for(const t of seeds.templates)assert.deepEqual(MI.validateSet(t,{pro:true}),[],t.id);
 assert.ok(seeds.templates.filter(t=>!t.pro).every(t=>MI.validateSet(t).length===0),'free templates fit the free tier');
});

test('a first visit is never blank: official data fills ungraded metrics and is marked',()=>{
 const set={metrics:[{key:'streams',weight:40},{key:'influence',weight:30},{key:'vibes',weight:30}]};
 const rows=MI.personalChart(artists,set,{});
 assert.equal(rows.length,50);assert.ok(rows.every(r=>r.notGraded&&r.filled.includes('streams')));
});

test('grades drive the personal chart and the official chart is untouched',()=>{
 const before=JSON.stringify(data.artists.map(a=>[a.slug,a.rank,a.score]));
 const set={metrics:[{key:'vocals',weight:50},{key:'lyricism',weight:30},{key:'vibes',weight:20}]};
 const last=artists.at(-1),grades={[last.slug]:{vocals:10,lyricism:10,vibes:10},[artists[0].slug]:{vocals:2,lyricism:2,vibes:2}};
 const rows=MI.personalChart(artists,set,grades);
 assert.equal(rows[0].slug,last.slug);assert.equal(rows.length,2,'artists with no data for these metrics are not ranked on a guess');
 const cmp=MI.compare(rows);assert.equal(cmp.gaps[0].slug,last.slug);
 assert.equal(JSON.stringify(data.artists.map(a=>[a.slug,a.rank,a.score])),before);
});

test('Underrated Gems only ranks artists outside the official top 20',()=>{
 const t=seeds.templates.find(x=>x.id==='underrated-gems'),grades=Object.fromEntries(artists.map(a=>[a.slug,{innovation:7,lyricism:7,vibes:7}]));
 assert.ok(MI.personalChart(artists,t,grades).every(r=>r.officialRank>20));
});

test('Community Index needs a minimum sample and reports n; hot takes are the biggest gaps',()=>{
 const rows=[];for(const [i,a] of artists.slice(0,6).entries())for(const metric of ['vocals','vibes'])rows.push({artist_slug:a.slug,metric,score:String(2+i),n:i===5?3:8});
 rows.push({artist_slug:artists[0].slug,metric:'custom-x',score:'10',n:50});
 const c=MI.community(artists,rows);
 assert.equal(c.ranked.length,5,'the artist with n=3 is held back');
 assert.equal(c.ranked[0].slug,artists[4].slug);assert.ok(c.ranked.every(r=>r.n>=5));
 assert.equal(c.hotTakes[0].gap,4);
});

test('the sandbox engine keeps its old behaviour and supports renormalising partial inputs',()=>{
 const {scenario}=require('../lib/board-engine.cjs');
 const input=[{slug:'a',rank:1,components:[80,null]},{slug:'b',rank:2,components:[60,90]}];
 assert.deepEqual(scenario(input,[1,1]).map(x=>x.slug),['b']);
 assert.deepEqual(scenario(input,[1,1],{partial:'renormalize',minCoverage:.6}).map(x=>x.slug),['b']);
 assert.equal(scenario(input,[1,1],{partial:'renormalize'}).length,2);
});
