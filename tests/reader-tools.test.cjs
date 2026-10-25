const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const M=require('../reader-model.js');
test('saved history accepts public pages and rejects credentials, private routes and external URLs',()=>{
 assert.equal(M.publicPath('/current/omah-lay'),'/current/omah-lay');
 assert.equal(M.publicPath('/?tab=alltime'),'/?tab=alltime');
 for(const path of ['/account','/receipt/abc','/u/person','/api/rankings','/?access_token=secret','/?code=secret','/current/a?token_hash=secret','javascript:alert(1)','https://evil.example/current/a'])assert.equal(M.publicPath(path),null,path);
 assert.equal(M.publicPath('/calendar/awards#section'),'/calendar/awards');
});
test('saved and recent lists deduplicate and cap history without changing the original list',()=>{
 const list=[{path:'/current/a',title:'A'},{path:'/current/b',title:'B'}],before=JSON.stringify(list);
 const result=M.upsert(list,{path:'/current/a',title:'Updated'},2);
 assert.equal(result.length,2);assert.equal(result[0].title,'Updated');assert.equal(JSON.stringify(list),before);
});
test('smart search finds countries, genres and exact artist names with normalized spelling',()=>{
 const items=[{title:'Ayra Starr',keywords:'Nigeria Afropop'},{title:'Awards calendar',keywords:'grammy headies dates'},{title:'Amaarae',keywords:'Ghana alternative'}];
 assert.equal(M.rankSearch(items,'Ayra Starr')[0].title,'Ayra Starr');assert.equal(M.rankSearch(items,'ghana')[0].title,'Amaarae');assert.equal(M.rankSearch(items,'grammy dates')[0].title,'Awards calendar');assert.deepEqual(M.rankSearch(items,''),[]);
});
test('table sorting compares compact stream totals and official rank labels numerically',()=>{
 assert.ok(M.compare('950M','1.2B')<0);assert.ok(M.compare('#9','#10')<0);assert.ok(M.compare('2,000','500')>0);assert.ok(M.compare('Ayra','Wizkid')<0);
});
test('draft recovery excludes account and secret inputs while allowing public corrections',()=>{
 for(const field of [{id:'email',type:'text'},{id:'email-code',type:'text',autocomplete:'one-time-code'},{id:'password',type:'password'},{id:'access-token',type:'text'},{id:'card-number',type:'text'},{id:'artist-search',type:'text'},{id:'username',type:'text'}])assert.equal(M.draftAllowed(field),false,field.id);
 assert.equal(M.draftAllowed({id:'correction',type:'textarea'}),true);assert.equal(M.draftAllowed({id:'source-url',type:'url'}),true);
});
test('reading estimates have a one-minute minimum and scale with article length',()=>{
 assert.equal(M.readingMinutes(''),1);assert.equal(M.readingMinutes(Array(441).fill('word').join(' ')),3);
});
function worker(){const events={};const cached={offline:true};const context={URL,Response,self:{addEventListener:(type,fn)=>events[type]=fn,skipWaiting:()=>Promise.resolve(),registration:{}},location:{origin:'https://afrobeats-index.vercel.app'},clients:{claim:()=>Promise.resolve()},caches:{match:async()=>cached},fetch:async()=>{throw Error('offline')}};vm.runInNewContext(fs.readFileSync('sw.js','utf8'),context);return {events,cached};}
test('offline navigation falls back to the saved public edition when the network fails',async()=>{
 const {events,cached}=worker();let response;events.fetch({request:{url:'https://afrobeats-index.vercel.app/calendar/awards',method:'GET',mode:'navigate'},respondWith:p=>response=p});assert.equal(await response,cached);
});
test('offline worker never intercepts private routes, auth callbacks, APIs or writes',()=>{
 const {events}=worker();for(const [path,method] of [['/account','GET'],['/receipt/private','GET'],['/u/person','GET'],['/?code=secret','GET'],['/api/product','GET'],['/current/wizkid','POST']]){let intercepted=false;events.fetch({request:{url:'https://afrobeats-index.vercel.app'+path,method,mode:'navigate'},respondWith:()=>intercepted=true});assert.equal(intercepted,false,path);}
});
