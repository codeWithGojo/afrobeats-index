const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
test('the browser-embedded stream history covers every reading the scoring can use (official scores stay identical)',()=>{
 const snap=fs.readFileSync('streaming-snapshot.js','utf8'),hist=require('../data/stream-history.json'),cur=require('../data/current.json');
 const asOf=Date.parse(cur.meta.lastRefreshAttemptAt),needed=hist.snapshots.filter(s=>Date.parse(s.capturedAt)>=asOf-120*864e5&&Date.parse(s.capturedAt)<=asOf+864e5);
 for(const s of needed)assert.ok(snap.includes(JSON.stringify(s.capturedAt)),s.capturedAt);
});
test('usage events accept only allowlisted names and details, and the summary needs the admin token',async()=>{
 const svc=require('../lib/product-events.cjs');const res=()=>{const r={code:200,body:null,setHeader(){},status(c){r.code=c;return r;},json(b){r.body=b;return r;},end(){return r;}};return r;};
 let r=res();await svc({method:'POST',headers:{},query:{action:'event'},body:{name:'email_address',detail:'x'}},r);assert.equal(r.code,400);
 r=res();await svc({method:'POST',headers:{},query:{action:'event'},body:{name:'share_click',detail:'<script>'}},r);assert.equal(r.code,400);
 process.env.ADMIN_TOKEN='a'.repeat(32);r=res();await svc({method:'GET',headers:{'x-admin-token':'wrong'},query:{action:'summary'}},r);assert.equal(r.code,401);delete process.env.ADMIN_TOKEN;
 r=res();await svc({method:'GET',headers:{'x-admin-token':''},query:{action:'summary'}},r);assert.equal(r.code,401,'no token configured means no access');
});
test('data health flags stale and missing data with dates',()=>{
 const h=require('../data/data-health.json');
 assert.ok(h.datasets.length>=6&&h.datasets.every(d=>['ok','warn','critical','missing'].includes(d.status)));
 assert.ok(h.artists.length>=50&&h.artists.every(a=>'reading' in a&&'ageDays' in a));
 assert.ok(fs.readFileSync('data-health.html','utf8').includes('name="robots" content="noindex"'));
 assert.match(fs.readFileSync('robots.txt','utf8'),/Disallow: \/data-health/);
});
test('PWA: maskable icon, offline chart from the compact file, nightly readings tested before publishing',()=>{
 const m=JSON.parse(fs.readFileSync('manifest.webmanifest','utf8'));
 assert.ok(m.icons.some(i=>i.purpose==='maskable')&&fs.existsSync('assets/icon-maskable-512.png'));
 assert.ok(fs.readFileSync('offline.js','utf8').includes('/data/current-lite.json'));
 assert.ok(fs.readFileSync('sw.js','utf8').includes("'/data/current-lite.json'"));
 const yml=fs.readFileSync('.github/workflows/data-engine.yml','utf8');
 assert.ok(yml.indexOf('collect-daily-readings.py')<yml.indexOf('Test before publishing nightly readings')&&yml.indexOf('Test before publishing nightly readings')<yml.indexOf('Publish nightly readings'));
});
test('/method keeps the update history and has a sourced corrections form',()=>{
 const html=fs.readFileSync('method.html','utf8');
 assert.ok(html.includes('id="data-updates"')&&html.includes('id="correction-form"')&&html.includes('pattern="https://.+"'));
 assert.equal(html.split('id="correction-form"').length-1,1);
});
