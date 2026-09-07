import webpush from 'npm:web-push@3.6.7';
const base=Deno.env.get('SUPABASE_URL')!,key=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
async function db(path:string,method='GET',body?:unknown,extra={}){const r=await fetch(base+'/rest/v1/'+path,{method,headers:{apikey:key,Authorization:'Bearer '+key,'Content-Type':'application/json',Prefer:'return=representation',...extra},body:body?JSON.stringify(body):undefined});if(!r.ok)throw Error('Database operation failed');const text=await r.text();return text?JSON.parse(text):[];}
Deno.serve(async req=>{try{
 const [settings]=await db('notification_settings?id=eq.1');
 if(!settings||req.headers.get('x-job-token')!==settings.job_token)return new Response('Unauthorized',{status:401});
 const [edition]=await db('chart_editions?select=week,published_at&order=published_at.desc&limit=1');
 if(!edition)return Response.json({sent:0,reason:'No published edition'});
 const subscriptions=await db('push_subscriptions?select=endpoint,subscription&order=created_at.asc&limit=1000');let sent=0,failed=0,skipped=0;
 const payload=JSON.stringify({title:'The new Afri Index is out',body:'Explore the published Current 50 · '+edition.week,url:'/week/'+edition.week});
 let cursor=0;await Promise.all(Array.from({length:5},async()=>{while(cursor<subscriptions.length){const s=subscriptions[cursor++];
 // Subscription endpoints are user data: allow only known public push services.
 const u=new URL(s.endpoint);if(u.protocol!=='https:'||!['fcm.googleapis.com','updates.push.services.mozilla.com','web.push.apple.com'].includes(u.hostname)||u.port||u.username||u.password){skipped++;continue;}
 const claim=await db('notification_deliveries?on_conflict=week,endpoint','POST',{week:edition.week,endpoint:s.endpoint},{Prefer:'resolution=ignore-duplicates,return=representation'});if(!claim.length){skipped++;continue;}
 try{await webpush.sendNotification(s.subscription,payload,{vapidDetails:{subject:'https://afrobeats-index.vercel.app',publicKey:settings.public_key,privateKey:settings.private_key},TTL:86400,timeout:8000});sent++;await db('notification_deliveries?week=eq.'+edition.week+'&endpoint=eq.'+encodeURIComponent(s.endpoint),'PATCH',{status:'sent',updated_at:new Date().toISOString()});}
 catch(error){failed++;if([404,410].includes(error.statusCode))await db('push_subscriptions?endpoint=eq.'+encodeURIComponent(s.endpoint),'DELETE');await db('notification_deliveries?week=eq.'+edition.week+'&endpoint=eq.'+encodeURIComponent(s.endpoint),'PATCH',{status:'failed',updated_at:new Date().toISOString()});}
 }}));return Response.json({week:edition.week,sent,failed,skipped});
 }catch{return Response.json({error:'Delivery job failed'},{status:500});}});
