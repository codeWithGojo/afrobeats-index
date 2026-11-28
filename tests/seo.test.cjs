const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const current=require('../data/current.json'),genres=require('../genre-boards.js');
const pages=fs.readdirSync('.').filter(f=>f.endsWith('.html'));
const NOINDEX=['offline.html','quiz.html','underground.html','404.html','data-health.html'];
test('every indexable page has unique title and description, canonical, OG, Twitter card, one h1 and JSON-LD',()=>{
 const titles=new Map(),descs=new Map();
 for(const f of pages.filter(f=>!NOINDEX.includes(f))){
  const h=fs.readFileSync(f,'utf8'),g=re=>(h.match(re)||[])[1];
  const t=g(/<title>([^<]*)<\/title>/),d=g(/<meta name="description" content="([^"]*)"/);
  assert.ok(t&&d,f+' title/description');assert.ok(!titles.has(t),`${f} duplicates title of ${titles.get(t)}`);assert.ok(!descs.has(d),`${f} duplicates description of ${descs.get(d)}`);titles.set(t,f);descs.set(d,f);
  for(const re of [/<link rel="canonical" href="https:\/\/afrobeats-index\.vercel\.app/,/property="og:title"/,/property="og:image"/,/name="twitter:card"/,/application\/ld\+json/])assert.ok(re.test(h),f+' '+re);
  assert.equal((h.match(/<h1[\s>]/g)||[]).length,1,f+' h1 count');
 }
 for(const f of NOINDEX){const h=fs.readFileSync(f,'utf8');assert.ok(h.includes('name="robots" content="noindex"')||(h.includes('http-equiv="refresh"')&&h.includes('rel="canonical" href="https://afrobeats-index.vercel.app/watch"')),f);}
});
test('the sitemap is generated from data: all artists, published boards, compare pairs, no noindex pages',()=>{
 const xml=fs.readFileSync('sitemap.xml','utf8'),locs=[...xml.matchAll(/<loc>([^<]*)<\/loc>/g)].map(m=>m[1]);
 assert.equal(new Set(locs).size,locs.length,'no duplicates');
 for(const a of current.artists)assert.ok(locs.includes('https://afrobeats-index.vercel.app/current/'+a.slug),a.slug);
 for(const b of genres.published(current.artists))assert.ok(locs.some(l=>l.endsWith('/boards/'+b.id)),b.id);
 assert.ok(!locs.some(l=>/genre-highlife|\/offline|\/quiz$|\/underground|\/404/.test(l)),'thin and utility pages stay out');
 assert.ok(locs.filter(l=>l.includes('/vs/')).length>=19);
 assert.match(fs.readFileSync('robots.txt','utf8'),/Sitemap: https:\/\/afrobeats-index\.vercel\.app\/sitemap\.xml/);
});
test('artist, board and compare routes are server-rendered with structured data and internal links',async()=>{
 const view=require('../api/view.js');const run=p=>new Promise(r=>{const res={code:200,setHeader(){},status(c){this.code=c;return this;},send(b){r({code:this.code,b});}};view({query:{path:p}},res);});
 const a=await run('current/'+current.artists[0].slug);assert.ok(a.b.includes('"@type":"MusicGroup"')&&a.b.includes('"@type":"BreadcrumbList"')&&a.b.includes('class="seo-related"'));assert.ok(/href="\/vs\//.test(a.b));
 const g=await run('boards/genre-afropop');assert.equal(g.code,200);assert.ok(g.b.includes('"@type":"ItemList"')&&/<ol class="seo-board">(<li>.*?){5,}/s.test(g.b));
 assert.equal((await run('boards/genre-highlife')).code,404,'boards under the minimum are not published');
 const v=await run(`vs/${current.artists[0].slug}/${current.artists[1].slug}`);assert.ok(v.b.includes('"@type":"BreadcrumbList"')&&v.b.includes('<h1>'));
});
