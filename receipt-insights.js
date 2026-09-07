(function receiptInsights(){
  "use strict";
  const themes={
    classic:{paper:"#F5F0E1",ink:"#2C2A22",muted:"#655F4D",rule:"#B5B09A",accent:"#2C2A22",barcode:"#000000",solid:false},
    amapiano:{paper:"#1C1C1A",ink:"#E8E6D8",muted:"#BCBBAD",rule:"#4A4940",accent:"#D7F04A",barcode:"#D7F04A",solid:false},
    owambe:{paper:"#3B2A0F",ink:"#F0DCAE",muted:"#DAC397",rule:"#8A6A2F",accent:"#EFCB7A",barcode:"#EFCB7A",border:"#C9962F",solid:false},
    mono:{paper:"#FAFAF8",ink:"#333333",muted:"#626262",rule:"#DDDDDD",accent:"#000000",barcode:"#000000",solid:true}
  };
  const countries={Nigeria:"NG",Ghana:"GH","South Africa":"ZA",Kenya:"KE",Tanzania:"TZ",Uganda:"UG",Cameroon:"CM",Senegal:"SN",Mali:"ML",Benin:"BJ",Zambia:"ZM",Zimbabwe:"ZW",Angola:"AO",Rwanda:"RW","Ivory Coast":"CI","Côte d’Ivoire":"CI",DRC:"CD","DR Congo":"CD","Democratic Republic of the Congo":"CD","Cape Verde":"CV",Ethiopia:"ET",Morocco:"MA",Algeria:"DZ",Egypt:"EG",Tunisia:"TN",Mozambique:"MZ",Guinea:"GN",Gabon:"GA",Botswana:"BW",Eswatini:"SZ",Lesotho:"LS",Liberia:"LR",SierraLeone:"SL"};
  const flag=country=>{const code=countries[country];return code?Array.from(code,c=>String.fromCodePoint(127397+c.charCodeAt(0))).join(""):"";};
  const rising=artist=>Boolean(artist && (artist.trending===true || (Number.isFinite(artist.previousRank)&&Number.isFinite(artist.rank)&&artist.previousRank-artist.rank>=5)));
  const genres=artist=>Array.isArray(artist?.genres)?artist.genres.filter(g=>typeof g==="string"&&g.trim()):[];
  function distribution(tracks,artists,lookup){
    const counts=new Map();
    const entries=tracks.length?tracks.map(t=>(t.artists?.length?t.artists:[t.artist]).map(lookup).find(Boolean)):artists.map(a=>lookup(a.name));
    entries.forEach(a=>{const genre=genres(a)[0]||"Unclassified";counts.set(genre,(counts.get(genre)||0)+1);});
    const result=[...counts].sort((a,b)=>b[1]-a[1]).map(([genre,count])=>({genre,count,percent:Math.floor(count*100/entries.length),remainder:(count*100)%entries.length}));
    let remaining=100-result.reduce((n,x)=>n+x.percent,0);
    [...result].sort((a,b)=>b.remainder-a.remainder).forEach(x=>{if(remaining>0){x.percent++;remaining--;}});
    return result;
  }
  function suggestions(database,tracks,artists,lookup){
    const listened=new Set(),liked=new Set();
    [...artists.map(a=>a.name),...tracks.flatMap(t=>t.artists?.length?t.artists:[t.artist])].forEach(name=>{const a=lookup(name);if(a){listened.add(a.slug);genres(a).forEach(g=>liked.add(g));}});
    return database.filter(a=>!listened.has(a.slug)).map(a=>({artist:a,shared:genres(a).filter(g=>liked.has(g)),rising:rising(a)})).filter(x=>x.rising||x.shared.length).sort((a,b)=>(b.shared.length*2+Number(b.rising))-(a.shared.length*2+Number(a.rising))).slice(0,5);
  }
  window.AFRI_RECEIPT_INSIGHTS={themes,flag,rising,genres,distribution,suggestions};
})();
