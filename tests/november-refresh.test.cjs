const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {apply,catalogue}=require('../streaming-model.js');
const view=require('../current-view.js');
test('movement compares with the last published edition while the editorial baseline stays fixed',()=>{
 const baseline={a:{rank:2,score:85,editorialContribution:80},b:{rank:1,score:90,editorialContribution:90}};
 const previous={asOf:'2026-10-19',artists:[{slug:'a',rank:1,score:100,scoreBreakdown:{streamsIndex:100,editorialContribution:83}},{slug:'b',rank:2,score:90,scoreBreakdown:{streamsIndex:70,editorialContribution:80}}]};
 const state={meta:{lastRefreshAttemptAt:'2026-11-01'},artists:['a','b'].map((slug,i)=>({slug,totalSpotifyStreams:i?200:100,statsLastUpdatedAt:'2026-11-01',sources:{catalogue:'https://kworb.net/'+slug}}))};
 apply(state,baseline,{},previous);
 assert.equal(state.artists.find(a=>a.slug==='a').previousRank,1);
 assert.equal(state.artists.find(a=>a.slug==='b').previousRank,2);
 assert.equal(state.artists[0].scoreBreakdown.baselineDate,'2026-10-05');
 assert.equal(state.artists[0].movementBasis.date,'2026-10-19');
 const fixture=state.artists.map(a=>({...a,name:a.slug,country:'Nigeria',genres:[]}));
 const hero=view.hero(fixture);assert.match(hero,/Riser/);assert.match(hero,/Faller/);assert.match(hero,/Streaming contribution/);
});
test('album counts retain their own ledger URL and observation date',()=>{
 const rows=catalogue([{slug:'a',statsLastUpdatedAt:'2026-11-01',sources:{catalogue:'https://kworb.net/songs'},spotifySourceUpdatedAt:'2026-10-31',catalogueAlbums:[{title:'Album',spotifyId:'album-id',streams:100,sourceUrl:'https://kworb.net/albums',sourceDate:'2026-10-30',lastVerifiedAt:'2026-11-01'}]}],{},'catalogueAlbums');
 assert.equal(rows[0].observations.spotify.sourceUrl,'https://kworb.net/albums');assert.equal(rows[0].observations.spotify.sourceDate,'2026-10-30');
});
test('a timed-out signup availability check leaves a usable form with separate sponsor consent',async()=>{
 const events={},status={textContent:'',dataset:{}},button={disabled:false};
 const form={elements:{email:{value:'listener@example.com',disabled:false,removeAttribute(){}},consent:{checked:true,disabled:false},sponsorConsent:{checked:false},website:{value:''}},querySelector:()=>button,addEventListener:(name,fn)=>events[name]=fn,reportValidity:()=>true,setAttribute(){},reset(){}};
 const section={dataset:{source:'homepage'},querySelector:selector=>selector==='form'?form:status};
 const controller=new AbortController(),calls=[];
 const fetch=async(url,options)=>{
  calls.push({url,options});
  if(url.endsWith('status'))return new Promise((resolve,reject)=>options.signal.addEventListener('abort',()=>reject(Object.assign(Error('timeout'),{name:'TimeoutError'})),{once:true}));
  return {ok:true,json:async()=>({message:'Check your inbox.'})};
 };
 const timeouts=[];
 vm.runInNewContext(fs.readFileSync('discovery.js','utf8'),{document:{querySelectorAll:()=>[section],addEventListener(){}},fetch,AbortSignal:{timeout:ms=>{timeouts.push(ms);return ms===5000?controller.signal:new AbortController().signal;}}});
 assert.equal(typeof events.submit,'function');assert.equal(button.disabled,false);
 controller.abort();await new Promise(setImmediate);
 assert.match(status.textContent,/still submit/);assert.deepEqual(timeouts,[5000]);
 await events.submit({preventDefault(){}});
 const payload=JSON.parse(calls[1].options.body);assert.equal(payload.consent,true);assert.equal(payload.sponsorConsent,false);assert.equal(section.dataset.signupState,'success');assert.equal(button.disabled,false);
});
test('all ranking pages use the edition date and Method retains the actual publisher periods',()=>{
 const edition=require('../data/edition.json'),date=require('../trust-model.js').formatDate(edition.updatedAt);
 for(const page of ['current','all-time','rankings','streams','top100','top100-albums','albums','releases','regions']){
  const html=fs.readFileSync(page+'.html','utf8');assert.ok(html.includes(`<time datetime="${edition.updatedAt}">${date}</time>`),page);
  const meta=[...html.matchAll(/<meta (?:name="(?:description|twitter:description)"|property="og:description") content="([^"]*)">/g)].map(x=>x[1]);
  assert.equal(meta.length,3,page);assert.equal(new Set(meta).size,1,page);
 }
 const method=fs.readFileSync('method.html','utf8');assert.match(method,/16 Oct 2026/);assert.match(method,/22 Oct 2026/);assert.match(method,/Retained evidence/);
 const home=fs.readFileSync('index.html','utf8');assert.ok(!home.includes('Checking signup availability'));assert.ok(!home.includes('section-updated'));assert.match(home,/footer-more/);
 const calendar=require('../data/upcoming-releases.json');
 for(const release of calendar.releases){assert.ok(fs.readFileSync('upcoming.html','utf8').includes(`id="release-${release.id}"`));}
});
test('sponsor offers default off and are recorded separately without changing subscription suppression',async()=>{
 const handler=require('../lib/newsletter-public.cjs').handlePublicNewsletter,old=global.fetch,key=process.env.BUTTONDOWN_API_KEY,calls=[];
 const res=()=>({code:200,setHeader(){},status(n){this.code=n;return this;},json(x){this.body=x;},end(){}});
 try{
  process.env.BUTTONDOWN_API_KEY='test-only';global.fetch=async(url,options)=>{calls.push(JSON.parse(options.body));return {ok:true,json:async()=>({id:'private'})};};
  for(const sponsorConsent of [undefined,true]){
   const response=res();await handler({method:'POST',headers:{host:'afrobeats-index.vercel.app',origin:'https://afrobeats-index.vercel.app','x-vercel-forwarded-for':'198.51.100.22'},body:{email:'listener@example.com',consent:true,sponsorConsent}},response,'subscribe');assert.equal(response.code,200);
  }
  assert.equal(calls[0].type,'unactivated');assert.equal(calls[0].metadata.afri_sponsor_opt_in,'false');assert.equal(calls[1].metadata.afri_sponsor_opt_in,'true');
 }finally{global.fetch=old;if(key===undefined)delete process.env.BUTTONDOWN_API_KEY;else process.env.BUTTONDOWN_API_KEY=key;}
});
