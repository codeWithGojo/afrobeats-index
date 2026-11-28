const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const ctx={window:{},document:{addEventListener(){}},location:{href:'https://afrobeats-index.vercel.app/'},URL,navigator:{},matchMedia:()=>({matches:false})};
vm.createContext(ctx);vm.runInContext(fs.readFileSync('share-sheet.js','utf8'),ctx);const S=ctx.window.AfriShare;
test('the ShareSheet covers every requested platform',()=>{
 for(const p of ['whatsapp','whatsapp-status','x','instagram','facebook','telegram','tiktok','snapchat','linkedin','reddit','threads','email','sms','copy','download'])assert.ok(S.TARGETS.includes(p),p);
});
test('every share link carries UTM source, medium per platform and campaign per kind',()=>{
 const u=new URL(S.utm('/heat','whatsapp','heat-25'));
 assert.equal(u.searchParams.get('utm_source'),'share');assert.equal(u.searchParams.get('utm_medium'),'whatsapp');assert.equal(u.searchParams.get('utm_campaign'),'heat-25');assert.equal(u.origin,'https://afrobeats-index.vercel.app');
});
test('captions are preset per platform and X stays short',()=>{
 const o={title:'T',text:'x'.repeat(400)};
 assert.ok(S.caption('x',o).length<=230);assert.ok(S.caption('tiktok',{text:'Hi'}).includes('#AfricanMusic'));
 assert.ok(!/—/.test(fs.readFileSync('share-sheet.js','utf8').match(/IMAGE_HELP=\{[^}]*\}/)[0]),'no em dashes in user copy');
});
test('board and artist share cards render at story and OG sizes; unknown boards 404',async()=>{
 const h=require('../api/card.js');
 const run=q=>new Promise(r=>{const res={code:200,setHeader(){},status(c){this.code=c;return this;},end(b){r({code:this.code,b});}};h({method:'GET',query:q},res);});
 for(const board of ['current','heat','current-100'])for(const [format,w,hh] of [['story',1080,1920],['og',1200,630]]){const {code,b}=await run({board,format});assert.equal(code,200);assert.equal(b.readUInt32BE(16),w);assert.equal(b.readUInt32BE(20),hh);}
 assert.equal((await run({board:'nope'})).code,404);
 assert.ok(h.certStrip('burna-boy',1080).includes('PLATINUM'));
});
test('every page type wires the ShareSheet',()=>{
 assert.ok(fs.readFileSync('current-view.js','utf8').includes('data-share-kind="current-50"'));
 for(const [f,k] of [['studio.js',"kind:'artist'"],['studio.js','data-share-kind="compare"'],['music-receipt.js',"kind:'receipt'"],['personal-stats.js',"kind:'personal-stats'"],['my-index.js',"kind:'my-index'"],['scripts/render-boards.cjs','data-share-kind="heat-25"']])assert.ok(fs.readFileSync(f,'utf8').includes(k),f+' '+k);
});
