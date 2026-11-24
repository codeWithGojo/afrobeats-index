// Applies database/automation.sql to an embedded Postgres and checks its guarantees.
// Run: PGLITE_MODULE=<path to @electric-sql/pglite> node scripts/test-automation-db.cjs
const assert=require('node:assert/strict'),fs=require('node:fs');
async function run(){
  const {PGlite}=require(process.env.PGLITE_MODULE||'@electric-sql/pglite'),db=new PGlite();
  await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;grant usage on schema public to anon,authenticated,service_role;`);
  const sql=fs.readFileSync('database/automation.sql','utf8');
  await db.exec(sql);
  await db.exec(sql); // re-runnable without errors or duplicate seed rows
  assert.equal((await db.query("select count(*)::int n from public.data_sources")).rows[0].n,8);

  // A job period is claimed once; a second claim returns nothing until the run fails.
  const claim=async()=> (await db.query("select * from public.claim_ingestion_job('collect','2026-11-24','schedule')")).rows[0];
  const first=await claim();assert.ok(first.id);assert.equal(first.status,'running');
  assert.equal((await claim()).id,null);
  await db.query("update public.ingestion_jobs set status='failed' where id=$1",[first.id]);
  const retry=await claim();assert.equal(retry.id,first.id);assert.equal(retry.attempt,2);

  // Snapshots: one row per entity, provider, metric and source date; history cannot be rewritten.
  await db.exec(`insert into public.tracks(id,title,spotify_id) values('00000000-0000-0000-0000-0000000000aa','One Dance','1zi7xx7UVEFkmKfv06H8x0');`);
  const snap=`insert into public.track_stream_snapshots(track_id,provider,metric,metric_class,confidence,value,source_date,observed_at,source_url)
    values('00000000-0000-0000-0000-0000000000aa','kworb-spotify','lifetime_streams','verified_count','third_party_ledger',4577652747,'2026-11-21',now(),'https://kworb.net/') on conflict do nothing`;
  await db.exec(snap);await db.exec(snap);
  assert.equal((await db.query("select count(*)::int n from public.track_stream_snapshots")).rows[0].n,1);
  await assert.rejects(db.exec("update public.track_stream_snapshots set value=1"),/append-only/);
  await assert.rejects(db.exec("delete from public.track_stream_snapshots"),/append-only/);
  await assert.rejects(db.exec(`insert into public.track_stream_snapshots(track_id,provider,metric,metric_class,confidence,value,source_date,observed_at)
    values('00000000-0000-0000-0000-0000000000aa','kworb-spotify','lifetime_streams','verified_count','third_party_ledger',-5,'2026-11-22',now())`),/check/);

  // Public readers see evidence but not job internals, and cannot write.
  await db.exec('set role anon');
  assert.equal((await db.query("select count(*)::int n from public.track_stream_snapshots")).rows[0].n,1);
  await assert.rejects(db.query('select * from public.ingestion_jobs'),/permission denied/);
  await assert.rejects(db.exec("insert into public.data_sources(id,name,kind,access) values('x','x','chart','manual')"),/permission denied/);
  await assert.rejects(db.query("select public.claim_ingestion_job('collect','x')"),/permission denied/);
  await db.exec('reset role');
  console.log('automation.sql: re-runnable, single-claim jobs, append-only snapshots and public read-only access verified.');
}
run().catch(error=>{console.error(error);process.exit(1);});
