const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {fetchWithRetry,retryDelay}=require('../ingest/http.cjs');
const {redact}=require('../ingest/redact.cjs');
const {validate,partition}=require('../ingest/validate.cjs');
const {MemoryStore,SupabaseStore}=require('../ingest/store.cjs');
const {runJob,periodKey,parseArgs}=require('../ingest/run.cjs');
const kworb=require('../ingest/providers/kworb.cjs'),turntable=require('../ingest/providers/turntable.cjs'),rankings=require('../ingest/providers/rankings.cjs');
const read=name=>JSON.parse(fs.readFileSync(`data/${name}.json`,'utf8'));
const response=(status,body='{}',headers={})=>({status,ok:status<300,headers:{get:name=>headers[name.toLowerCase()]??null},json:async()=>JSON.parse(body),text:async()=>body});
const noSleep=()=>Promise.resolve();

test('requests retry 429 and 5xx with backoff, honour Retry-After and never retry other client errors',async()=>{
  let calls=0;
  const flaky=async()=>(++calls<3?response(503):response(200));
  assert.equal((await fetchWithRetry('https://x.test',{fetchImpl:flaky,sleep:noSleep})).status,200);assert.equal(calls,3);
  calls=0;await assert.rejects(fetchWithRetry('https://x.test',{fetchImpl:async()=>{calls++;return response(500);},retries:2,sleep:noSleep}),/HTTP 500/);assert.equal(calls,3);
  calls=0;assert.equal((await fetchWithRetry('https://x.test',{fetchImpl:async()=>{calls++;return response(404);},sleep:noSleep})).status,404);assert.equal(calls,1);
  calls=0;await fetchWithRetry('https://x.test',{fetchImpl:async()=>(++calls<2?(()=>{throw new TypeError('network');})():response(200)),sleep:noSleep});assert.equal(calls,2);
  assert.equal(retryDelay(0,{baseDelayMs:500,maxDelayMs:30000,retryAfter:'7',random:()=>1}),7000);
  assert.ok(retryDelay(4,{baseDelayMs:500,maxDelayMs:30000,random:()=>1})<=8000);
});

test('logged messages never contain credentials',()=>{
  const env={SUPABASE_SERVICE_ROLE_KEY:'service-role-secret-123',PATH:'/usr/bin'};
  const text=redact('failed with service-role-secret-123 Bearer abc.def.ghi at https://api.test/v?key=AIzaSecret&part=x',env);
  assert.ok(!text.includes('service-role-secret-123'));assert.ok(!text.includes('abc.def.ghi'));assert.ok(!text.includes('AIzaSecret'));
  assert.ok(text.includes('/usr/bin')===false&&text.includes('part=x'));
});

test('validation rejects invented, negative, future-dated and inconsistent observations',()=>{
  const ok={track_key:'spotify:x',provider:'kworb-spotify',metric:'lifetime_streams',metric_class:'verified_count',confidence:'third_party_ledger',value:10,source_date:'2026-11-21',observed_at:'2026-11-22T00:00:00Z',source_url:'https://kworb.net/'};
  assert.deepEqual(validate('track_stream_snapshots',ok),[]);
  assert.ok(validate('track_stream_snapshots',{...ok,value:-1}).includes('value'));
  assert.ok(validate('track_stream_snapshots',{...ok,value:NaN}).includes('value'));
  assert.ok(validate('track_stream_snapshots',{...ok,metric_class:'streams'}).includes('metric_class'));
  assert.ok(validate('track_stream_snapshots',{...ok,source_date:'2026-12-25'}).includes('source_date_in_future'));
  assert.ok(validate('track_stream_snapshots',{...ok,source_url:'javascript:alert(1)'}).includes('source_url'));
  const chart={chart:'c',week_start:'2026-11-14',week_end:'2026-11-20',rank:5,title:'t',artist_credit:'a',peak:9,observed_at:'2026-11-22T00:00:00Z'};
  assert.ok(validate('chart_positions',chart).includes('peak'));
  assert.deepEqual(validate('chart_positions',{...chart,peak:2}),[]);
  assert.equal(partition('chart_positions',[chart,{...chart,peak:1}]).valid.length,1);
});

test('real repository data normalises without rejections and keeps every source label',()=>{
  const current=read('current');
  const streams=kworb.normalize({'releases-2026-sources':read('releases-2026-sources'),current});
  for(const table of ['track_stream_snapshots','album_stream_snapshots','artist_statistics']){
    assert.ok(streams[table].length>0,table);
    assert.equal(partition(table,streams[table]).rejected.length,0,table);
    assert.ok(streams[table].every(r=>r.provider==='kworb-spotify'&&r.confidence==='third_party_ledger'&&r.source_url&&r.source_date));
  }
  assert.equal(new Set(streams.tracks.map(t=>t.key)).size,streams.tracks.length,'tracks are deduplicated by Spotify ID');
  const charts=turntable.normalize({'nigeria-top100':read('nigeria-top100'),'nigeria-albums-top100':read('nigeria-albums-top100')});
  assert.equal(charts.chart_positions.length,200);assert.equal(partition('chart_positions',charts.chart_positions).rejected.length,0);
  const editions=rankings.normalize({'current-editions':read('current-editions'),current,'all-time':read('all-time')});
  const byEdition=Object.groupBy(editions.ranking_snapshots,r=>r.edition_date);
  for(const [date,rows] of Object.entries(byEdition))assert.equal(rows.length,50,date);
  assert.equal(partition('ranking_snapshots',editions.ranking_snapshots).rejected.length,0);
});

test('archived artists without a published name are skipped and reported, not invented',()=>{
  const current={asOf:'2026-11-22T00:00:00Z',artists:[{slug:'wizkid',name:'Wizkid',rank:1,score:90}]};
  const out=rankings.normalize({'current-editions':{'2026-11-15':{wizkid:[1,90],ghost:[2,80]}},current,'all-time':{artists:[]}});
  assert.ok(out.ranking_snapshots.every(r=>r.artist_slug!=='ghost'));
  assert.match(out.skipped[0],/ghost/);
});

const sample={
  current:{asOf:'2026-11-22T00:00:00Z',artists:[{slug:'tems',name:'Tems',rank:1,score:91.5,spotifyId:'x'}]},
  'current-editions':{},'all-time':{artists:[]},
  'releases-2026-sources':{checked_at:'2026-11-22T00:00:00Z',artists:[{artist_slug:'tems',songs:{url:'https://kworb.net/a',source_date:'2026-11-21',total:100,daily:5,rows:[{title:'Free Mind',total:100,daily:5,spotify_url:'https://open.spotify.com/track/0123456789abcdefghijkl'}]},albums:{url:'https://kworb.net/b',source_date:'2026-11-21',rows:[]}}]},
  'nigeria-top100':{checkedAt:'2026-11-22T00:00:00Z',weekStart:'2026-11-14',weekEnd:'2026-11-20',sourceUrl:'https://www.turntablecharts.com/charts/1',rows:[[1,'Song','Artist',0,1,1,'NEW']]},
  'nigeria-albums-top100':null
};
const inputs=names=>Object.fromEntries(names.map(n=>[n,structuredClone(sample[n])]));

test('a job period runs once; retries after failure store nothing twice',async()=>{
  const store=new MemoryStore(),args=parseArgs(['--job','daily','--period','2026-11-24']);
  const first=await runJob(args,{store,inputs,collect:()=>{}});
  assert.equal(first.status,'succeeded');
  assert.equal(first.stats.providers.kworb.tables.track_stream_snapshots.inserted,2);
  assert.equal((await runJob(args,{store,inputs,collect:()=>{}})).status,'skipped');
  for(const job of store.jobs.values())job.status='failed';
  const retry=await runJob({...args,trigger:'retry'},{store,inputs,collect:()=>{}});
  assert.equal(retry.attempt,2);
  assert.equal(retry.stats.providers.kworb.tables.track_stream_snapshots.inserted,0);
  assert.equal(retry.stats.providers.kworb.tables.track_stream_snapshots.duplicates,2);
});

test('a failed fetch keeps last good data and marks the run partial; a broken provider does not stop the others',async()=>{
  const store=new MemoryStore();
  const failingFetch=script=>{if(script.includes('turntable'))throw Object.assign(new Error('boom'),{stderr:Buffer.from('timeout')});};
  const result=await runJob(parseArgs(['--job','daily','--period','p1']),{store,inputs,collect:failingFetch});
  assert.equal(result.status,'partial');
  assert.equal(result.stats.providers.turntable.status,'partial');
  assert.equal(result.stats.providers.turntable.tables.chart_positions.inserted,1);
  assert.ok(store.logs.some(l=>l.level==='warn'&&/last good data kept/.test(l.message)));
  const broken=await runJob(parseArgs(['--job','daily','--period','p2']),{store,inputs:names=>names.includes('releases-2026-sources')?{}:inputs(names),collect:()=>{}});
  assert.equal(broken.stats.providers.kworb.status,'failed');
  assert.equal(broken.stats.providers.turntable.status,'succeeded');
  assert.equal(broken.status,'partial');
});

test('period keys follow the run windows',()=>{
  const at=new Date('2026-11-26T13:20:00Z');
  assert.equal(periodKey('collect',at),'2026-11-26T12');
  assert.equal(periodKey('daily',at),'2026-11-26');
  assert.equal(periodKey('weekly',at),'2026-11-23');
  assert.throws(()=>parseArgs(['--job','hourly']),/--job/);
  assert.throws(()=>parseArgs(['--job','daily','--providers','spotify-scraper']),/Unknown provider/);
});

test('the Supabase store claims through the database function and only ever inserts history',async()=>{
  const calls=[];
  const fake=async(url,init)=>{
    calls.push({url,method:init.method,prefer:init.headers.Prefer,body:init.body&&JSON.parse(init.body)});
    if(url.includes('rpc/claim_ingestion_job'))return response(200,JSON.stringify({id:null}));
    if(url.includes('tracks?'))return response(200,JSON.stringify([{id:'t1',spotify_id:'0123456789abcdefghijkl'}]));
    if(url.includes('albums?'))return response(200,'[]');
    if(url.includes('select=id'))return response(200,'[{"id":1}]');
    return response(204,'');
  };
  const store=new SupabaseStore({url:'https://project.supabase.co',key:'k'.repeat(20),fetchImpl:fake});
  assert.equal(await store.claimJob('daily','2026-11-24'),null);
  const batch=kworb.normalize(inputs(['releases-2026-sources','current']));
  const counts=await store.write(batch,'job-1');
  assert.equal(counts.track_stream_snapshots.inserted,1);assert.equal(counts.track_stream_snapshots.duplicates,1);
  const history=calls.filter(c=>/(stream_snapshots|artist_statistics|chart_positions|ranking_snapshots)\?/.test(c.url));
  assert.ok(history.length>0);
  assert.ok(history.every(c=>c.method==='POST'&&c.prefer.startsWith('resolution=ignore-duplicates')));
  assert.ok(calls.find(c=>c.url.includes('track_stream_snapshots')).body.every(r=>r.track_id==='t1'&&r.job_id==='job-1'&&!('track_key' in r)));
  assert.throws(()=>new SupabaseStore({url:'',key:''}),/required/);
});

test('new sb_secret keys stay out of the Authorization header; legacy JWT keys keep it',async()=>{
  const seen=[];const fake=async(url,init)=>{seen.push(init.headers);return response(200,JSON.stringify({id:null}));};
  await new SupabaseStore({url:'https://p.supabase.co',key:'sb_secret_abcdefghijklmnop',fetchImpl:fake}).claimJob('daily','x');
  await new SupabaseStore({url:'https://p.supabase.co',key:'eyJhbGciOiJIUzI1NiJ9.payload.sig',fetchImpl:fake}).claimJob('daily','x');
  assert.equal(seen[0].apikey,'sb_secret_abcdefghijklmnop');assert.equal(seen[0].Authorization,undefined);
  assert.equal(seen[1].Authorization,'Bearer eyJhbGciOiJIUzI1NiJ9.payload.sig');
});

test('the scheduled workflow is serialised, dry by default when secrets are missing, and publishes only after tests',()=>{
  const yml=fs.readFileSync('.github/workflows/data-engine.yml','utf8');
  assert.match(yml,/concurrency:\s*\n\s*group: data-engine\s*\n\s*cancel-in-progress: false/);
  assert.match(yml,/if \[ -z "\$SUPABASE_URL" \] \|\| \[ -z "\$SUPABASE_SERVICE_ROLE_KEY" \]; then DRY=true; fi/);
  assert.ok(yml.indexOf('run: npm test')<yml.indexOf('name: Publish'));
  assert.ok(!/SUPABASE_SERVICE_ROLE_KEY:[ \t]*[^$\s]/.test(yml.replace(/\$\{\{ secrets\.SUPABASE_SERVICE_ROLE_KEY \}\}/g,'')),'no inline secrets');
});
