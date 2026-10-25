/* Shared, read-only helpers for local reading tools. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.AfriReaderModel=factory();})(typeof globalThis==='undefined'?this:globalThis,function(){
  const normalize=value=>String(value||'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
  const tabs=new Set(['current','alltime','vs','receipt','regions','artists','albums','yearly','networth','method','underground','top100','news','discuss']);
  function publicPath(value,origin='https://afrobeats-index.vercel.app'){
    try{const u=new URL(value,origin);if(u.username||u.password||u.origin!==origin||!/^https?:$/.test(u.protocol)||/\/(?:account|api|receipt|u)(?:\/|$)/.test(u.pathname))return null;
      if(!/^\/(?:$|help(?:\.html)?$|offline(?:\.html)?$|newsletter(?:\.html)?$|underground(?:\.html)?$|current\/[a-z0-9-]+$|calendar\/(awards|live|certifications)$|boards(?:\/[a-z0-9-]+)?$|studio(?:\/[a-z0-9-]+)?$|vs\/[a-z0-9/-]+$|collaborations$|quiz(?:\/[a-z0-9-]+)?$|week\/[0-9W-]+$)/.test(u.pathname))return null;
      if([...u.searchParams.keys()].some(k=>k!=='tab'))return null;
      return u.pathname+(u.pathname==='/'&&tabs.has(u.searchParams.get('tab'))?'?tab='+u.searchParams.get('tab'):'');
    }catch{return null;}
  }
  function upsert(list,item,limit=20){return [item,...(Array.isArray(list)?list:[]).filter(x=>x.path!==item.path)].slice(0,limit);}
  function rankSearch(items,query){const words=normalize(query).split(' ').filter(Boolean);if(!words.length)return [];return items.map(item=>{const title=normalize(item.title),hay=normalize(item.title+' '+(item.keywords||''));if(!words.every(w=>hay.includes(w)))return null;return {...item,match:title===normalize(query)?100:title.startsWith(normalize(query))?80:words.every(w=>title.includes(w))?60:20};}).filter(Boolean).sort((a,b)=>b.match-a.match||a.title.localeCompare(b.title)).slice(0,12);}
  function value(text){const cleaned=String(text||'').trim().replace(/,/g,'');const match=cleaned.match(/^#?(-?\d+(?:\.\d+)?)\s*([kmbt])?(?:%|\s|$)/i);if(match)return Number(match[1])*({k:1e3,m:1e6,b:1e9,t:1e12}[match[2]?.toLowerCase()]||1);return normalize(cleaned);}
  function compare(a,b){const x=value(a),y=value(b);return typeof x==='number'&&typeof y==='number'?x-y:String(x).localeCompare(String(y),undefined,{numeric:true});}
  function draftAllowed(field){const text=[field.id,field.name,field.autocomplete,field.type].join(' ').toLowerCase();return !!(field.id||field.name)&&['textarea','text','url'].includes(field.type||field.tag)&&!/(pass|token|secret|email|auth|otp|code|card|payment|search|username)/.test(text);}
  const readingMinutes=text=>Math.max(1,Math.ceil(String(text||'').trim().split(/\s+/).filter(Boolean).length/220));
  return {normalize,publicPath,upsert,rankSearch,compare,draftAllowed,readingMinutes};
});
