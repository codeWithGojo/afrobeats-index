/* Reader preferences from onboarding: favourite artists, genres and region.
   Guests: this browser only. Signed in: synced to user_prefs. Also a tiny event helper for analytics. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.AfriPrefs=api;})(typeof window==='object'?window:globalThis,function(){
 'use strict';
 const KEY='afri_prefs_v1',blank={artists:[],genres:[],region:null,onboarding:null,updatedAt:null};
 const clean=p=>({artists:[...new Set((p?.artists||[]).filter(s=>/^[a-z0-9-]{1,80}$/.test(s)))].slice(0,3),genres:[...new Set((p?.genres||[]).filter(g=>typeof g==='string'&&g.length<=30))].slice(0,3),region:typeof p?.region==='string'&&/^[a-z0-9-]{1,30}$/.test(p.region)?p.region:null,onboarding:['done','skipped'].includes(p?.onboarding)?p.onboarding:null,updatedAt:p?.updatedAt||null});
 function get(){try{return clean(JSON.parse(localStorage.getItem(KEY)||'null')||blank);}catch{return {...blank};}}
 function set(patch){const next=clean({...get(),...patch,updatedAt:new Date().toISOString()});try{localStorage.setItem(KEY,JSON.stringify(next));}catch{}if(typeof window==='object')window.dispatchEvent(new CustomEvent('afri:prefs',{detail:next}));sync(next);return next;}
 // Sync only when a session already exists, so guests never load the account bundle.
 function hasSession(){try{return !!localStorage.getItem('afri-auth');}catch{return false;}}
 async function client(){if(typeof window!=='object'||!hasSession())return null;try{await import('/assets/account.js');const s=await window.AfriAccount.session();return s?{db:window.AfriAccount.client,user:s.user}:null;}catch{return null;}}
 async function sync(p){const c=await client();if(!c)return;await c.db.from('user_prefs').upsert({user_id:c.user.id,artists:p.artists,genres:p.genres,region:p.region,updated_at:p.updatedAt}).then(()=>{},()=>{});}
 // On sign-in: the newer copy wins.
 async function pull(){const c=await client();if(!c)return get();const {data}=await c.db.from('user_prefs').select('artists,genres,region,updated_at').maybeSingle();const local=get();
  if(data&&(!local.updatedAt||Date.parse(data.updated_at)>Date.parse(local.updatedAt))){const merged=clean({...local,artists:data.artists,genres:data.genres,region:data.region,onboarding:local.onboarding||'done',updatedAt:data.updated_at});try{localStorage.setItem(KEY,JSON.stringify(merged));}catch{}return merged;}
  if(local.updatedAt&&local.artists.length)sync(local);return local;}
 // Analytics events: Vercel Web Analytics when present. No personal data in event payloads.
 function track(name,data={}){try{if(typeof window!=='object')return;if(typeof window.AfriTrack==='function')return window.AfriTrack(name,data);if(typeof window.va==='function')window.va('event',{name,data});}catch{}}
 return {KEY,get,set,pull,track,clean};
});
