#!/usr/bin/env node
// Scheduled data engine entry point.
//   node ingest/run.cjs --job collect|daily|weekly|backfill [--dry-run] [--skip-fetch]
//                       [--providers kworb,turntable,rankings] [--trigger manual] [--period KEY]
// Live runs need SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY; without them the run is a dry run.
const fs=require('node:fs'),path=require('node:path'),{execFileSync}=require('node:child_process');
const {MemoryStore,SupabaseStore,TABLES}=require('./store.cjs');
const {partition}=require('./validate.cjs');
const {redact}=require('./redact.cjs');
const PROVIDERS={kworb:require('./providers/kworb.cjs'),turntable:require('./providers/turntable.cjs'),rankings:require('./providers/rankings.cjs')};
const JOBS={
  collect:{providers:['kworb','turntable','rankings'],fetch:true},
  daily:{providers:['kworb','turntable','rankings'],fetch:true},
  // Weekly runs after `npm run refresh:data` has collected and published the edition.
  weekly:{providers:['kworb','turntable','rankings'],fetch:false},
  backfill:{providers:['rankings','turntable','kworb'],fetch:false}
};
const ROOT=path.resolve(__dirname,'..');

function parseArgs(argv){
  const args={dryRun:false,skipFetch:false,trigger:'schedule'};
  for(let i=0;i<argv.length;i++){
    const flag=argv[i],next=()=>argv[++i];
    if(flag==='--job')args.job=next();
    else if(flag==='--period')args.period=next();
    else if(flag==='--providers')args.providers=next().split(',').filter(Boolean);
    else if(flag==='--trigger')args.trigger=next();
    else if(flag==='--dry-run')args.dryRun=true;
    else if(flag==='--skip-fetch')args.skipFetch=true;
    else throw new Error('Unknown argument '+flag);
  }
  if(!JOBS[args.job])throw new Error('--job must be one of '+Object.keys(JOBS).join(', '));
  if(!['schedule','manual','retry'].includes(args.trigger))throw new Error('--trigger must be schedule, manual or retry');
  for(const name of args.providers||[])if(!PROVIDERS[name])throw new Error('Unknown provider '+name);
  return args;
}

// One key per run window, so a retried schedule cannot create a second run.
function periodKey(job,now=new Date()){
  const day=now.toISOString().slice(0,10);
  if(job==='collect')return day+'T'+String(Math.floor(now.getUTCHours()/6)*6).padStart(2,'0');
  if(job==='weekly'){const monday=new Date(Date.UTC(now.getUTCFullYear(),now.getUTCMonth(),now.getUTCDate()-((now.getUTCDay()+6)%7)));return monday.toISOString().slice(0,10);}
  if(job==='backfill')return 'backfill-'+day;
  return day;
}

const readInputs=names=>Object.fromEntries(names.map(name=>{const file=path.join(ROOT,'data',name+'.json');return [name,fs.existsSync(file)?JSON.parse(fs.readFileSync(file,'utf8')):null];}));

function runCollector(script){
  const python=process.env.PYTHON||(process.platform==='win32'?'python':'python3');
  execFileSync(python,[script],{cwd:ROOT,stdio:['ignore','inherit','pipe'],env:{...process.env,PYTHONUTF8:'1'},timeout:45*60*1000});
}

async function runJob(args,{store,collect=runCollector,inputs=readInputs,now=new Date()}={}){
  const job=JOBS[args.job],providers=args.providers||job.providers,period=args.period||periodKey(args.job,now);
  const claimed=await store.claimJob(args.job,period,args.trigger);
  if(!claimed)return {status:'skipped',job:args.job,period,reason:'This period already ran or is running.'};
  const stats={providers:{}};let failures=0;
  // Logging must never take a run down with it; a failed log write goes to the console instead.
  const log=async(provider,level,message,entity)=>{
    try{await store.log({job_id:claimed.id,provider:provider?PROVIDERS[provider].id:null,level,entity:entity||null,message});}
    catch(error){console.error(`Log write failed (${level}: ${redact(message)}): ${redact(error)}`);}
  };
  for(const name of providers){
    const provider=PROVIDERS[name],result={status:'succeeded',fetched:false,rejected:0,tables:{}};stats.providers[name]=result;
    try{
      if(job.fetch&&!args.skipFetch&&provider.collector.length){
        try{for(const script of provider.collector)collect(script);result.fetched=true;}
        catch(error){result.status='partial';await log(name,'warn','Fetch failed; last good data kept: '+redact(error.stderr?.toString()||error));}
      }
      const batch=provider.normalize(inputs(provider.inputs));
      for(const note of batch.skipped||[])await log(name,'warn',note);
      for(const table of TABLES){
        if(!batch[table])continue;
        const {valid,rejected}=partition(table,batch[table]);batch[table]=valid;result.rejected+=rejected.length;
        for(const {row,errors} of rejected.slice(0,20))await log(name,'warn',`Rejected ${table} row: ${errors.join(', ')}`,row.track_key||row.album_key||row.artist_slug||row.title||null);
      }
      if(result.rejected)result.status='partial';
      result.tables=await store.write(batch,claimed.id);
      await log(name,'info',`Stored ${Object.entries(result.tables).filter(([,c])=>c.inserted+c.duplicates).map(([t,c])=>`${t}: ${c.inserted} new, ${c.duplicates} already stored`).join('; ')||'no rows'}.`);
    }catch(error){
      failures++;result.status='failed';result.error=redact(error);
      await log(name,'error',redact(error));
    }
    try{await store.heartbeat(claimed.id);}catch(error){console.error('Heartbeat failed: '+redact(error));}
  }
  const statuses=Object.values(stats.providers).map(p=>p.status);
  const status=failures===providers.length?'failed':statuses.every(s=>s==='succeeded')?'succeeded':'partial';
  // Always close the job so a retry is not blocked behind a run that looks like it is still going.
  try{await store.finishJob(claimed.id,status,stats,failures?`${failures} of ${providers.length} providers failed`:null);}
  catch(error){console.error('Could not record job result: '+redact(error));return {status:'failed',job:args.job,period,attempt:claimed.attempt,stats};}
  return {status,job:args.job,period,attempt:claimed.attempt,stats};
}

function summary(result,storeLabel){
  const lines=[`### Data engine: ${result.job} ${result.period}`,'',`Status: **${result.status}** · storage: ${storeLabel}`];
  if(result.reason)lines.push('',result.reason);
  for(const [name,p] of Object.entries(result.stats?.providers||{})){
    lines.push('',`**${name}**: ${p.status}${p.fetched?' (fetched)':''}${p.rejected?`, ${p.rejected} rows rejected`:''}${p.error?` — ${p.error}`:''}`);
    for(const [table,c] of Object.entries(p.tables||{}))if(c.inserted+c.duplicates)lines.push(`- ${table}: ${c.inserted} new, ${c.duplicates} already stored`);
  }
  return lines.join('\n')+'\n';
}

async function main(){
  const args=parseArgs(process.argv.slice(2));
  const live=!args.dryRun&&process.env.SUPABASE_URL&&process.env.SUPABASE_SERVICE_ROLE_KEY;
  const store=live?new SupabaseStore({url:process.env.SUPABASE_URL,key:process.env.SUPABASE_SERVICE_ROLE_KEY}):new MemoryStore();
  const result=await runJob(args,{store});
  const text=summary(result,store.label);
  process.stdout.write(text);
  if(process.env.GITHUB_STEP_SUMMARY)fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,text);
  if(result.status==='failed')process.exitCode=1;
}

if(require.main===module)main().catch(error=>{console.error(redact(error));process.exitCode=1;});
module.exports={runJob,periodKey,parseArgs,summary,JOBS,PROVIDERS};
