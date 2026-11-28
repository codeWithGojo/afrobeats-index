const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const svc=require('../lib/product-sponsors.cjs');
const res=()=>{const r={code:200,body:null,headers:{},status(c){r.code=c;return r;},json(b){r.body=b;return r;},setHeader(k,v){r.headers[k]=v;},end(){return r;}};return r;};
test('only the three fixed slots exist, and rankings never carry sponsor content',()=>{
 assert.deepEqual(svc.SLOTS,['newsletter-header','watch-inline','board-presented-by']);
 for(const f of ['current.html','current-100.html','index.html','all-time.html','my-index.html','stats.html'])assert.ok(!fs.readFileSync(f,'utf8').includes('data-sponsor-slot'),f);
 const heat=fs.readFileSync('heat.html','utf8'),table=heat.slice(heat.indexOf('<table'),heat.indexOf('</table>'));
 assert.ok(heat.includes('data-sponsor-slot="board-presented-by"')&&!table.includes('sponsor'),'Presented by sits outside the ranked table');
 for(const f of ['afri-live-data.js','assets/inline-08.js'])assert.ok(fs.readFileSync(f,'utf8').includes('Retired in v2 Phase 8'),f+' spotlight retired');
});
test('Artists to Watch has exactly one inline sponsor card after the third artist',()=>{
 const html=fs.readFileSync('watch.html','utf8'),i=html.indexOf('data-sponsor-slot="watch-inline"');
 assert.equal(html.split('data-sponsor-slot').length-1,1);assert.equal(html.slice(0,i).split('</article>').length-1,3);
});
test('every placement is labelled Sponsored with a disclosure and a sponsored link',()=>{
 const js=fs.readFileSync('sponsor-slots.js','utf8');
 for(const slot of ['watch-inline','board-presented-by','newsletter-header'])assert.ok(new RegExp(`'${slot}':s=>[^\n]*Sponsored`).test(js),slot);
 assert.ok((js.match(/rel="sponsored noopener"/g)||[]).length>=3);
 const {emailDocument,buildBrief}=require('../lib/weekly-brief.cjs');
 const html=emailDocument(buildBrief(require('../data/current.json')),[{name:'Brand',copy:'Copy',url:'https://brand.example',label:'Go'}]);
 assert.ok(html.includes('Sponsored')&&html.includes('never affect the rankings')&&html.includes('rel="sponsored"'));
});
test('events and inquiries are validated; without a database the config list is the fallback',async()=>{
 let r=res();await svc({method:'POST',headers:{},query:{action:'event'},body:{slot:'x',kind:'impression'}},r);assert.equal(r.code,400);
 r=res();await svc({method:'POST',headers:{},query:{action:'inquiry'},body:{name:'Ada',email:'a@b.co',message:'A campaign for a tour.',consent:false}},r);assert.equal(r.code,400);
 r=res();await svc({method:'POST',headers:{},query:{action:'inquiry'},body:{website:'spam'}},r);assert.equal(r.code,204);
 r=res();await svc({method:'GET',headers:{},query:{action:'active'}},r);assert.ok(Array.isArray(r.body.slots));assert.match(r.body.disclosure,/never affect rankings/);
});
test('the media kit never publishes invented audience numbers',()=>{
 const kit=require('../data/sponsor-kit.json'),html=fs.readFileSync('sponsor.html','utf8');
 for(const [k,v] of Object.entries(kit.audience))if(v==null&&k!=='period'&&k!=='topCountries')assert.ok(html.includes('Shared on request'));
 assert.ok(html.includes('id="sponsor-inquiry"')&&html.includes('id="policy"'));
});
