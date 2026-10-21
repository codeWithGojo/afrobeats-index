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
test('legacy editorial modules retain bundled portraits and cannot replace the edition date with a historical chart date',()=>{
 const vm=require('node:vm');
 const image={alt:'Wizkid',src:'artists/wizkid.jpg',dataset:{},getAttribute(name){return this[name];}};
 const stamp={textContent:'Edition checked · 19 Oct 2026'},load=[];
 const document={querySelector:selector=>selector==='main'?{appendChild(){}}:null,getElementById:id=>id==='live-update-label'?stamp:null,querySelectorAll:selector=>selector==='img[alt]'?[image]:[],createElement:()=>({})};
 const window={AFRI_CURRENT_ARTISTS:[{name:'Wizkid',slug:'wizkid',image:'artists/wizkid.jpg',imageFallback:'https://example.com/remote.jpg'}],AFRI_YEARLY_STREAMS:{updated_at:'2026-09-07'},addEventListener:(event,fn)=>{if(event==='load')load.push(fn);}};
 vm.runInNewContext(fs.readFileSync('assets/inline-10.js','utf8'),{document,window,Date,Intl});
 load.forEach(fn=>fn());
 assert.equal(image.src,'artists/wizkid.jpg');
 assert.equal(stamp.textContent,'Edition checked · 19 Oct 2026');
});
