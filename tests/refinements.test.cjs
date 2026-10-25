const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const {scenario,mixCandidates}=require('../lib/board-engine.cjs');
const data=require('../data/current.json');
test('the default mix reproduces published scores and either slider extreme has an independent meaning',()=>{
 const before=JSON.stringify(data.artists),candidates=mixCandidates(data.artists);
 const standard=scenario(candidates,[83,17]);
 for(const a of standard)assert.ok(Math.abs(a.score-data.artists.find(x=>x.slug===a.slug).score)<.00001);
 assert.deepEqual(standard.map(a=>a.slug),data.artists.map(a=>a.slug));
 const editorial=scenario(candidates,[100,0]),audio=scenario(candidates,[0,100]);
 assert.notDeepEqual(editorial.map(a=>a.slug),audio.map(a=>a.slug));
 assert.equal(JSON.stringify(data.artists),before);
 assert.equal(mixCandidates([{scoreBreakdown:{}}])[0].components[0],null);
});
test('certification plaques retain every record, escape text, and keep the authority link',()=>{
 const p=require('../artist-presentation.js');
 const records=[{title:'<script>alert(1)</script>',format:'song',tier:'Multi-Platinum',multiplier:3,market:'Nigeria',authority:'TurnTable Charts',sourceUrl:'https://example.com/register',lastVerifiedAt:'2026-10-05'}];
 const html=p.certifications({name:'Artist'},records);
 assert.ok(html.includes('3× Platinum'));assert.ok(html.includes('href="https://example.com/register"'));assert.ok(!html.includes('<script>'));assert.ok(html.includes('Songs'));
});
test('legacy email callbacks arriving at the homepage reach account without losing their fragment',()=>{
 let destination;
 const location={pathname:'/',search:'',hash:'#access_token=test&refresh_token=test',replace(value){destination=value;}};
 vm.runInNewContext(fs.readFileSync('theme-init.js','utf8'),{location,document:{documentElement:{dataset:{}}},localStorage:{getItem:()=>null},URLSearchParams});
 assert.equal(destination,'/account#access_token=test&refresh_token=test');
});
test('all-time rows use local portraits including the shared final rank',()=>{
 const page=fs.readFileSync('index.html','utf8').split('<!-- ALL-TIME -->')[1].split('<!--')[0];
 const rows=page.split('\n    <div class="flex items-center').slice(1);
 assert.equal(rows.length,47);
 for(const row of rows){const name=row.match(/<h3[^>]*>(.*?)<\/h3>/)?.[1];assert.ok(row.includes('<img'),name+' has no portrait');for(const [,path] of row.matchAll(/<img[^>]*src="([^"]+)"/g))assert.ok(fs.existsSync(path.replace(/^\//,'')),path);}
});
