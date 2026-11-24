// Storage for the collector. Providers emit rows with natural keys (artist slug, Spotify IDs);
// the store resolves identities and inserts history idempotently. Existing history is never updated.
const crypto=require('node:crypto');
const {fetchWithRetry}=require('./http.cjs');
const {redact}=require('./redact.cjs');

const SNAPSHOT_KEYS={
  track_stream_snapshots:['track_id','provider','metric','source_date'],
  album_stream_snapshots:['album_id','provider','metric','source_date'],
  artist_statistics:['artist_slug','provider','metric','period','source_date'],
  chart_positions:['chart','week_end','rank'],
  ranking_snapshots:['board','edition_date','artist_slug']
};
const TABLES=Object.keys(SNAPSHOT_KEYS);
const STALE_MS=2*60*60*1000;
const spotifyId=key=>String(key).split(':').pop();

// Replaces natural keys with database ids and drops helper fields.
function resolveRows(batch,trackIds,albumIds){
  const out={};
  for(const table of TABLES){
    out[table]=(batch[table]||[]).map(row=>{
      const {track_key,album_key,...rest}=row;
      if(track_key)rest.track_id=trackIds.get(track_key);
      if(album_key)rest.album_id=albumIds.get(album_key);
      return rest;
    }).filter(row=>(!('track_id' in row)||row.track_id)&&(!('album_id' in row)||row.album_id));
  }
  return out;
}

class MemoryStore{
  constructor(){this.jobs=new Map();this.logs=[];this.artists=new Map();this.tracks=new Map();this.albums=new Map();this.trackArtists=new Set();this.rows=Object.fromEntries(TABLES.map(t=>[t,new Map()]));}
  get label(){return 'dry run (in memory, nothing saved)';}
  async claimJob(job,period,trigger='schedule',now=Date.now()){
    const key=job+'|'+period,existing=this.jobs.get(key);
    if(!existing){const row={id:crypto.randomUUID(),job,period_key:period,status:'running',trigger,attempt:1,heartbeat_at:now};this.jobs.set(key,row);return {...row};}
    if(existing.status==='failed'||(existing.status==='running'&&now-existing.heartbeat_at>STALE_MS)){Object.assign(existing,{status:'running',trigger,attempt:existing.attempt+1,heartbeat_at:now});return {...existing};}
    return null;
  }
  async heartbeat(id){for(const job of this.jobs.values())if(job.id===id)job.heartbeat_at=Date.now();}
  async finishJob(id,status,stats,error){for(const job of this.jobs.values())if(job.id===id)Object.assign(job,{status,stats,error:error?redact(error):null});}
  async log(entry){this.logs.push({...entry,message:redact(entry.message)});}
  async write(batch,jobId){
    for(const a of batch.artists||[])this.artists.set(a.slug,{...this.artists.get(a.slug),...a});
    const trackIds=new Map(),albumIds=new Map();
    for(const t of batch.tracks||[]){if(!this.tracks.has(t.key))this.tracks.set(t.key,{id:crypto.randomUUID(),...t});trackIds.set(t.key,this.tracks.get(t.key).id);for(const slug of t.artist_slugs||[])this.trackArtists.add(this.tracks.get(t.key).id+'|'+slug);}
    for(const a of batch.albums||[]){if(!this.albums.has(a.key))this.albums.set(a.key,{id:crypto.randomUUID(),...a});albumIds.set(a.key,this.albums.get(a.key).id);}
    const rows=resolveRows(batch,trackIds,albumIds),counts={};
    for(const table of TABLES){
      let inserted=0;
      for(const row of rows[table]){const key=SNAPSHOT_KEYS[table].map(k=>row[k]).join('|');if(this.rows[table].has(key))continue;this.rows[table].set(key,{...row,job_id:jobId});inserted++;}
      counts[table]={inserted,duplicates:rows[table].length-inserted};
    }
    return counts;
  }
}

class SupabaseStore{
  constructor({url,key,fetchImpl}={}){
    if(!url||!key)throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for a live run.');
    this.base=url.replace(/\/$/,'')+'/rest/v1/';this.key=key;this.fetchImpl=fetchImpl;
  }
  get label(){return 'Supabase';}
  async request(path,{method='GET',body,prefer}={}){
    // New sb_secret_ keys go in the apikey header only; legacy service_role JWTs also go in Authorization.
    const headers={apikey:this.key,'Content-Type':'application/json'};
    if(this.key.startsWith('eyJ'))headers.Authorization='Bearer '+this.key;
    if(prefer)headers.Prefer=prefer;
    const response=await fetchWithRetry(this.base+path,{fetchImpl:this.fetchImpl,timeoutMs:30000,init:{method,headers,body:body===undefined?undefined:JSON.stringify(body)}});
    const text=await response.text();
    if(!response.ok)throw new Error(redact(`Supabase ${method} ${path.split('?')[0]} failed: HTTP ${response.status} ${text.slice(0,300)}`));
    // return=minimal answers 201/204 with an empty body.
    return text.trim()?JSON.parse(text):null;
  }
  async claimJob(job,period,trigger='schedule'){
    const row=await this.request('rpc/claim_ingestion_job',{method:'POST',body:{p_job:job,p_period:period,p_trigger:trigger}});
    return row&&row.id?row:null;
  }
  async heartbeat(id){await this.request('ingestion_jobs?id=eq.'+id,{method:'PATCH',body:{heartbeat_at:new Date().toISOString()},prefer:'return=minimal'});}
  async finishJob(id,status,stats,error){await this.request('ingestion_jobs?id=eq.'+id,{method:'PATCH',body:{status,stats,error:error?redact(error):null,finished_at:new Date().toISOString(),heartbeat_at:new Date().toISOString()},prefer:'return=minimal'});}
  async log(entry){await this.request('ingestion_logs',{method:'POST',body:{...entry,message:redact(entry.message)},prefer:'return=minimal'});}
  async chunked(rows,size,fn){const out=[];for(let i=0;i<rows.length;i+=size)out.push(...(await fn(rows.slice(i,i+size))||[]));return out;}
  async write(batch,jobId){
    const artists=(batch.artists||[]).map(({slug,name,spotify_id})=>({slug,name,spotify_id:spotify_id||null,updated_at:new Date().toISOString()}));
    await this.chunked(artists,500,rows=>this.request('artists?on_conflict=slug',{method:'POST',body:rows,prefer:'resolution=merge-duplicates,return=minimal'}));
    const trackIds=new Map(),albumIds=new Map();
    const tracks=(batch.tracks||[]).map(t=>({title:t.title,spotify_id:spotifyId(t.key)}));
    for(const row of await this.chunked(tracks,500,rows=>this.request('tracks?on_conflict=spotify_id&select=id,spotify_id',{method:'POST',body:rows,prefer:'resolution=merge-duplicates,return=representation'})))trackIds.set('spotify:'+row.spotify_id,row.id);
    const links=(batch.tracks||[]).flatMap(t=>(t.artist_slugs||[]).map(slug=>({track_id:trackIds.get(t.key),artist_slug:slug}))).filter(l=>l.track_id);
    await this.chunked(links,500,rows=>this.request('track_artists?on_conflict=track_id,artist_slug',{method:'POST',body:rows,prefer:'resolution=ignore-duplicates,return=minimal'}));
    const albums=(batch.albums||[]).map(a=>({title:a.title,spotify_id:spotifyId(a.key),primary_artist_slug:a.primary_artist_slug||null}));
    for(const row of await this.chunked(albums,500,rows=>this.request('albums?on_conflict=spotify_id&select=id,spotify_id',{method:'POST',body:rows,prefer:'resolution=merge-duplicates,return=representation'})))albumIds.set('spotify-album:'+row.spotify_id,row.id);
    const rows=resolveRows(batch,trackIds,albumIds),counts={};
    for(const table of TABLES){
      const withJob=rows[table].map(row=>({...row,job_id:jobId}));
      const inserted=await this.chunked(withJob,500,chunk=>this.request(`${table}?on_conflict=${SNAPSHOT_KEYS[table].join(',')}&select=id`,{method:'POST',body:chunk,prefer:'resolution=ignore-duplicates,return=representation'}));
      counts[table]={inserted:inserted.length,duplicates:withJob.length-inserted.length};
    }
    return counts;
  }
}

module.exports={MemoryStore,SupabaseStore,SNAPSHOT_KEYS,TABLES};
