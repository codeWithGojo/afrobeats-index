/* Genre sub-boards of the published Current 50 (Phase 9 programmatic pages).
   A board is published only when at least MIN artists carry one of its genre tags, so no thin pages. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.AfriGenreBoards=factory();})(typeof window==='undefined'?globalThis:window,function(){
 const MIN=5;
 const definitions=[
  {id:'genre-afropop',name:'Afropop',tags:['AFROPOP'],description:'Afropop artists in the published Current 50, in official order.'},
  {id:'genre-afrobeats',name:'Afrobeats',tags:['AFROBEATS','EMO-AFROBEATS'],description:'Artists tagged Afrobeats in the published Current 50, in official order.'},
  {id:'genre-afro-rnb',name:'Afro R&B',tags:['AFRO-R&B','R&B','SOUL'],description:'Afro R&B and soul artists in the published Current 50, in official order.'},
  {id:'genre-street-pop',name:'Street-pop',tags:['STREET-POP','FUJI','APALA'],description:'Street-pop artists in the published Current 50, in official order.'},
  {id:'genre-rap',name:'Rap and hip-hop',tags:['RAP','HIP-HOP','AFRO-TRAP'],description:'Rap and hip-hop artists in the published Current 50, in official order.'},
  {id:'genre-afro-fusion',name:'Afro-fusion',tags:['AFRO-FUSION','AFROSWING','AFRO-DANCEHALL','DANCEHALL'],description:'Afro-fusion and dancehall-leaning artists in the published Current 50, in official order.'},
  {id:'genre-alte',name:'Alté',tags:['ALT','ALTÉ'],description:'Alté and alternative artists in the published Current 50, in official order.'},
  {id:'genre-amapiano',name:'Amapiano',tags:['AMAPIANO'],description:'Amapiano artists in the published Current 50, in official order.'},
  {id:'genre-highlife',name:'Highlife',tags:['HIGHLIFE'],description:'Highlife artists in the published Current 50, in official order.'}];
 const has=(a,d)=>(a.genres||[]).some(g=>d.tags.includes(String(g).toUpperCase()));
 function rank(artists,id){const d=definitions.find(x=>x.id===id);if(!d)throw new RangeError('Unknown genre board');return artists.filter(a=>Number.isFinite(a.rank)&&has(a,d)).sort((a,b)=>a.rank-b.rank).map((a,i)=>({...a,globalRank:a.rank,boardRank:i+1}));}
 // Only boards with enough artists are published (linked, rendered and listed in the sitemap).
 const published=artists=>definitions.filter(d=>artists.filter(a=>has(a,d)).length>=MIN);
 return {MIN,definitions,rank,published,has};
});
