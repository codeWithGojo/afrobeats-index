const data=require('../data/current.json');
const config=require('../community-config.json');
const origin='https://afrobeats-index.vercel.app';
const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
async function db(path){const r=await fetch(`${config.url}/rest/v1/${path}`,{headers:{apikey:config.key},signal:AbortSignal.timeout(8000)});if(!r.ok)throw new Error('Database unavailable');return r.json();}
module.exports={data,config,origin,escape,db};
