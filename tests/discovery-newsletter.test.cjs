const {test} = require('node:test');
const assert = require('node:assert/strict');
const data = require('../data/current.json');
const {discoveryBoard} = require('../lib/discovery.cjs');
const {buildBrief, sundayDate, emailDocument} = require('../lib/weekly-brief.cjs');
const handler = require('../lib/product-newsletter.cjs');
function response() {
  return {code:200,headers:{},setHeader(k,v){this.headers[k]=v;},status(code){this.code=code;return this;},json(body){this.body=body;return this;},send(body){this.body=body;return this;},end(){return this;}};
}
function request(action, body, overrides = {}) {
  return {method:body ? 'POST':'GET',query:{action},headers:{host:'afrobeats-index.vercel.app',origin:'https://afrobeats-index.vercel.app','x-vercel-forwarded-for':'192.0.2.12'},body,...overrides};
}
test('watch discovery has every legacy name with no ranks or grading',()=>{
 const before=JSON.stringify(data),board=discoveryBoard(data);
 assert.equal(board.artists.length,18);assert.equal(new Set(board.artists.map(a=>a.slug)).size,18);
 for(const a of board.artists){assert.ok(!('rank' in a));assert.ok(!('score' in a));}
 assert.ok(board.artists.some(a=>a.name==='Zaylevelten'));assert.equal(JSON.stringify(data),before);
});
test('Sunday issue uses Lagos boundaries and preserves chart source date, Top 10 and missing movement',()=>{
  assert.equal(sundayDate(new Date('2026-10-24T23:15:00Z')),'2026-10-25');
  assert.equal(sundayDate(new Date('2026-10-24T22:59:59Z')),'2026-10-18');
  assert.equal(sundayDate(new Date('2027-01-01T12:00:00Z')),'2026-12-27');
  const brief = buildBrief(data,new Date('2026-10-25T09:00:00Z'));
  assert.equal(brief.chartAsOf,data.asOf);assert.equal(brief.top10.length,10);
  assert.deepEqual(brief.top10.map(a=>a.rank),[1,2,3,4,5,6,7,8,9,10]);
  assert.ok(brief.movers.every(a=>a.movement===a.previousRank-a.rank && a.movement>0));
  assert.equal(brief.headToHead.gap,Math.abs(brief.top10[0].score-brief.top10[1].score));
  const missing=buildBrief({asOf:'2026-10-01',artists:[{slug:'a',name:'A',rank:1,score:90}]});
  assert.deepEqual(missing.movers,[]);assert.equal(missing.headToHead,null);
  const html=emailDocument(brief,[{name:'<script>',copy:'A&B',url:'javascript:alert(1)',label:'bad'}]);
  for(const label of ['The Top 10','Movers of the Week','One head-to-head','An artist to watch'])assert.ok(html.includes(label));
  assert.ok(!html.includes('javascript:'));assert.ok(html.includes(data.asOf.slice(0,10)));
});
test('public signup validates, uses double opt-in, protects origins and never exposes provider details',async()=>{
  const oldFetch=global.fetch, oldKey=process.env.BUTTONDOWN_API_KEY;
  try {
    delete process.env.BUTTONDOWN_API_KEY;
    let res=response();await handler(request('status'),res);assert.equal(res.body.signupConfigured,false);
    res=response();await handler(request('subscribe',{email:'listener@example.com',consent:true}),res);assert.equal(res.code,503);
    process.env.BUTTONDOWN_API_KEY='test-provider-key';
    const calls=[];global.fetch=async(url,options)=>{calls.push({url,options});return {ok:true,json:async()=>({id:'private-provider-id'})};};
    res=response();await handler(request('subscribe',{email:'listener@example.com',consent:false}),res);assert.equal(res.code,400);assert.equal(calls.length,0);
    res=response();await handler(request('subscribe',{email:'listener@example.com',consent:true},{headers:{origin:'https://evil.example',host:'afrobeats-index.vercel.app'}}),res);assert.equal(res.code,403);assert.equal(calls.length,0);
    res=response();await handler(request('subscribe',{email:'listener@example.com',consent:true,source:'homepage'}),res);assert.equal(res.code,200);
    const body=JSON.parse(calls[0].options.body);assert.equal(body.type,'unactivated');assert.equal(body.email_address,'listener@example.com');assert.equal(body.utm_source,'homepage');
    assert.ok(!JSON.stringify(res.body).includes('private-provider-id'));
    global.fetch=async()=>{throw Error('secret provider detail');};
    res=response();await handler(request('subscribe',{email:'listener@example.com',consent:true}),res);assert.equal(res.code,503);assert.ok(!res.body.error.includes('secret'));
    global.fetch=async()=>({ok:false,status:400,json:async()=>({code:'subscriber_suppressed'})});
    res=response();await handler(request('subscribe',{email:'listener@example.com',consent:true}),res);assert.equal(res.code,200);assert.match(res.body.message,/existing subscriptions stay unchanged/);
  } finally {global.fetch=oldFetch;if(oldKey===undefined)delete process.env.BUTTONDOWN_API_KEY;else process.env.BUTTONDOWN_API_KEY=oldKey;}
});
test('Sunday job requires its secret, reconciles existing issues and only creates unsent drafts',async()=>{
  const oldFetch=global.fetch, oldKey=process.env.BUTTONDOWN_API_KEY,oldSecret=process.env.CRON_SECRET;
  try {
    process.env.BUTTONDOWN_API_KEY='test-provider-key';process.env.CRON_SECRET='test-job-secret';
    let res=response();await handler(request('draft'),res);assert.equal(res.code,401);
    const headers={authorization:'Bearer test-job-secret'};let calls=[];
    global.fetch=async(url,options)=>{calls.push({url,options});return {ok:true,json:async()=>url.includes('?')?{results:[]}:{id:'draft-id'}};};
    res=response();await handler(request('draft',null,{headers}),res);assert.equal(res.body.status,'draft');assert.equal(calls.length,2);
    const draft=JSON.parse(calls[1].options.body);assert.equal(draft.status,'draft');assert.ok(!draft.publish_date);assert.ok(draft.metadata.afri_issue);
    calls=[];global.fetch=async(url,options)=>{calls.push({url,options});return {ok:true,json:async()=>({results:[{subject:`Afri Index · Sunday brief · ${sundayDate()}`,status:'sent'}]})};};
    res=response();await handler(request('draft',null,{headers}),res);assert.equal(res.body.created,false);assert.equal(calls.length,1);
  } finally {global.fetch=oldFetch;for(const [k,v]of Object.entries({BUTTONDOWN_API_KEY:oldKey,CRON_SECRET:oldSecret})){if(v===undefined)delete process.env[k];else process.env[k]=v;}}
});
