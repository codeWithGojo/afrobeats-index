(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.AfriTaxonomy=factory();})(typeof window==='undefined'?globalThis:window,function(){
 const clean=g=>({'AFRO-LIFE':'AFROBEATS','AFRORAVE':'AFROBEATS'}[g]||g);
 function normalize(a){const raw=a.genres||[];return {...a,countries:a.countries||String(a.country||'').split(/\s*\/\s*/).filter(Boolean),primaryGenre:clean(raw[0]||'AFROBEATS'),tags:[...new Set(raw.filter((g,i)=>i>0||g!==clean(g)))],genres:[...new Set(raw.map(clean))],image:'/artists/'+a.slug+'.jpg'};}
 return{normalize};
});
