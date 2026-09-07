// Invoked by a JWT-authenticated daily cron. Never accepts source URLs from callers.
Deno.serve(async()=>{
 const url=Deno.env.get('SUPABASE_URL')!,key=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
 const headers={apikey:key,Authorization:`Bearer ${key}`,'Content-Type':'application/json'};
 async function db(path:string,init:RequestInit={}){const r=await fetch(url+'/rest/v1/'+path,{...init,headers:{...headers,...init.headers},signal:AbortSignal.timeout(8000)});if(!r.ok)throw Error('Database request failed');return r.status===204?null:await r.json();}
 const day=new Date().toISOString().slice(0,10);
 try{
  const lease=await db('refresh_runs?on_conflict=day',{method:'POST',headers:{Prefer:'resolution=ignore-duplicates,return=representation'},body:JSON.stringify({day,status:'running'})});
  if(!lease.length)return Response.json({status:'already_attempted',day});
  const rows=await db('artist_metrics?select=artist_slug,source_url');let updated=0;const failed:string[]=[];
  for(let i=0;i<rows.length;i+=5)await Promise.all(rows.slice(i,i+5).map(async(a:{artist_slug:string,source_url:string})=>{
   try{const source=new URL(a.source_url);if(source.hostname!=='www.musicmetricsvault.com'||!source.pathname.startsWith('/artists/'))throw Error('Unsupported source');
    const r=await fetch(source,{signal:AbortSignal.timeout(8000)});if(!r.ok)throw Error('Source unavailable');const html=await r.text();
    const m=html.match(/Monthly Listeners<\/p>\s*<p[^>]*>\s*([\d,.]+)\s*(million|thousand|billion)?\s*<\/p>/i);if(!m)throw Error('No comparable count');
    const scales:{[k:string]:number}={million:1e6,thousand:1e3,billion:1e9};const count=Math.round(Number(m[1].replaceAll(',',''))*(scales[m[2]?.toLowerCase()]||1));if(!Number.isFinite(count)||count<1||count>1e9)throw Error('Invalid count');
    await db('artist_metrics?artist_slug=eq.'+a.artist_slug,{method:'PATCH',headers:{Prefer:'return=representation'},body:JSON.stringify({monthly_listeners:count,observed_at:new Date().toISOString(),approximate:Boolean(m[2])})});updated++;
   }catch{failed.push(a.artist_slug);}
  }));
  await db('refresh_runs?day=eq.'+day,{method:'PATCH',headers:{Prefer:'return=representation'},body:JSON.stringify({status:failed.length?'partial':'complete',updated,failed,finished_at:new Date().toISOString()})});
  return Response.json({day,updated,failed});
 }catch{return Response.json({error:'Refresh unavailable; previous values retained'},{status:503});}
});
