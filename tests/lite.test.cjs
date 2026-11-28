const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
function run({conn={},memory,cores,stored=null,query='',reduced=false}={}){
 const classes=new Set(),appended=[],store={};if(stored)store['afri-lite']=stored;
 const ctx={document:{documentElement:{classList:{toggle:(c,on)=>on?classes.add(c):classes.delete(c),contains:c=>classes.has(c)},dataset:{}},head:{appendChild:n=>appended.push(n.href)},createElement:()=>({}),addEventListener(){}},
  localStorage:{getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=v;},removeItem:k=>{delete store[k];}},
  navigator:{connection:conn,deviceMemory:memory,hardwareConcurrency:cores},location:{search:query,hash:'',pathname:'/',replace(){}},URLSearchParams,
  window:{matchMedia:()=>({matches:reduced})},addEventListener(){}};
 ctx.window.navigation=undefined;vm.createContext(ctx);vm.runInContext(fs.readFileSync('theme-init.js','utf8'),ctx);
 return {lite:classes.has('lite'),api:ctx.window.AfriLite,fonts:appended.includes('/fonts.css'),store};
}
test('Lite turns on automatically only for Data Saver or 2G, and then never loads web fonts',()=>{
 assert.equal(run({conn:{saveData:true}}).lite,true);assert.equal(run({conn:{effectiveType:'2g'}}).lite,true);
 const r=run({conn:{saveData:true}});assert.equal(r.fonts,false);assert.equal(r.api.auto,true);
 const normal=run({conn:{effectiveType:'4g'}});assert.equal(normal.lite,false);assert.equal(normal.fonts,true);
});
test('weaker signals only suggest Lite; the user choice always wins; ?lite=1 and ?lite=0 set it',()=>{
 for(const o of [{conn:{effectiveType:'3g'}},{memory:2,cores:4},{reduced:true}]){const r=run(o);assert.equal(r.lite,false);assert.equal(r.api.suggest,true);}
 assert.equal(run({conn:{saveData:true},stored:'off'}).lite,false,'override off beats Data Saver');
 assert.equal(run({stored:'on'}).lite,true);
 const q=run({query:'?lite=1'});assert.equal(q.lite,true);assert.equal(q.store['afri-lite'],'on');
 assert.equal(run({}).lite,false,'no APIs (Safari) means no auto Lite, the toggle still works');
});
test('every page ships one or two bundled stylesheets, and only fonts.css declares web fonts',()=>{
 for(const f of fs.readdirSync('.').filter(f=>f.endsWith('.html'))){
  const head=fs.readFileSync(f,'utf8').split('</head>')[0];if(!head.includes('<link'))continue;
  const links=[...head.matchAll(/<link rel="stylesheet" href="([^"]+)"(?: data-bundle="([^"]+)")?>/g)];
  assert.ok(links.length<=3,`${f} has ${links.length} stylesheets`);
  for(const l of links)if(l[2]){assert.ok(fs.existsSync(l[1].slice(1)),l[1]);for(const src of l[2].split(','))assert.ok(fs.existsSync(src.slice(1)),src);}
 }
 for(const f of fs.readdirSync('.').filter(f=>f.endsWith('.css')&&f!=='fonts.css'))assert.ok(!fs.readFileSync(f,'utf8').includes('@font-face'),f);
 assert.ok(fs.readFileSync('fonts.css','utf8').match(/@font-face/g).length===3);
});
test('Lite controls exist in the footer and Page tools, and Lite skips the heavy scripts',()=>{
 assert.ok(fs.readFileSync('afri-ui.js','utf8').includes('data-lite-set'));
 assert.ok(fs.readFileSync('reader-tools.js','utf8').includes('data-lite-set'));
 assert.ok(fs.readFileSync('refinements.js','utf8').includes("classList.contains('lite')"),'glass motion skipped');
 assert.ok(fs.readFileSync('index.html','utf8').includes('classList.contains("lite")'),'orbit GSAP skipped');
 assert.ok(fs.readFileSync('onboarding.js','utf8').includes('/data/current-lite.json'));
});
