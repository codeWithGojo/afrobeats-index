/* One read-only SVG component, shared by the PNG endpoint, profile preview and Wrapped. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('./trust-model.js'));else root.AfriPlayerCard=factory(root.AfriTrust);})(typeof window==='undefined'?globalThis:window,function(trust){
 const e=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const codes={'Nigeria':'NGA','Ghana':'GHA','South Africa':'ZAF','Eswatini':'SWZ','Tanzania':'TZA','UK':'GBR'};
 const compact=n=>{for(const [size,suffix]of [[1e9,'B'],[1e6,'M'],[1e3,'K']])if(n>=size)return (n/size).toFixed(2).replace(/\.?0+$/,'')+suffix;return String(n);};
 const known=n=>Number.isFinite(n)&&n>=0?n:null;
 function model(slug,data){
  const a=data.artists.find(a=>a.slug===slug);if(!a)throw Error('Artist not found');
  const delta=Number.isFinite(a.previousRank)?a.previousRank-a.rank:null;
  const tier=delta!==null&&Math.abs(delta)>=3?'mover':a.rank<=10?'gold':a.rank<=30?'silver':'bronze';
  const stream=known(a.scoreBreakdown?.streamsIndex),editorial=known(a.scoreBreakdown?.editorialContribution);
  // Published observations and score contributions, never inferred IMP/REA/AWD/LIV/CUL ratings.
  const stats=[
   {key:'TOT',name:'Spotify streams',value:known(a.totalSpotifyStreams),unit:'tracked lifetime total'},
   {key:'DAY',name:'Daily Spotify',value:known(a.dailySpotifyStreams),unit:'latest daily observation'},
   {key:'TRK',name:'Tracked songs',value:known(a.trackedSongCount),unit:'recordings in the ledger'},
   {key:'PRJ',name:'Tracked projects',value:known(a.trackedAlbumCount),unit:'projects in the ledger'},
   {key:'STR',name:'Stream index',value:stream===null||stream>100?null:Math.round(stream*.99),unit:'normalized to 0–99'},
   {key:'EDT',name:'Editorial points',value:editorial===null||editorial>83?null:Math.round(editorial*10)/10,unit:'contribution out of 83'}
  ].map(s=>({...s,display:s.value===null?'—':s.key==='STR'?String(s.value).padStart(2,'0'):s.key==='EDT'?s.value.toFixed(1):compact(s.value)}));
  return {artist:a,delta,tier,stats};
 }
 function cardBody(m,{photo}={}){
  const a=m.artist,colors={gold:['#c5a864','#ead9a8'],silver:['#9ba3ad','#e1e5e9'],bronze:['#a77754','#d5b394'],mover:['#b5cc39','#d4f24a']}[m.tier],ink='#1d1d1c';
  const countries=(a.countries||String(a.country||'').split(/\s*\/\s*/)).map(c=>codes[c]||c.slice(0,3).toUpperCase()).join(' / ');
  const monogram=a.name.split(/\s+/).slice(0,2).map(x=>x[0]).join('').toUpperCase();
  // Embedded raster bytes only: SVG rendering never fetches arbitrary remote URLs.
  const hasPhoto=/^data:image\/(?:png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(photo?.dataUrl||'');
  const nameSize=Math.min(56,500/Math.max(1,a.name.length*.62));
  return `<defs><clipPath id="portrait-clip"><circle cx="462" cy="174" r="103"/></clipPath></defs><path d="M38 0H550l50 50v695l-38 55H38L0 745V50Z" fill="${colors[0]}" stroke="${colors[1]}" stroke-width="3"/><path d="M48 16H542l42 42v681l-30 44H46l-30-44V58Z" fill="none" stroke="${ink}" stroke-opacity=".45"/>
  <g fill="${ink}"><text x="52" y="102" font-size="82" font-weight="700">${Math.round(a.score)}</text><text x="56" y="132" font-size="17" letter-spacing="3">OVR</text><text x="54" y="178" font-size="27" font-weight="700">RANK ${a.rank}</text><text x="54" y="211" font-size="18">${e(countries)}</text><text x="54" y="244" font-size="17">${e(a.primaryGenre||(a.genres||[])[0]||'AFROBEATS')}</text></g>
  ${hasPhoto?`<image x="359" y="71" width="206" height="206" preserveAspectRatio="xMidYMid slice" clip-path="url(#portrait-clip)" href="${e(photo.dataUrl)}"/><circle cx="462" cy="174" r="103" fill="none" stroke="${colors[1]}" stroke-width="3"/>`:`<circle cx="462" cy="174" r="103" fill="${ink}"/><text x="462" y="194" text-anchor="middle" fill="${colors[1]}" font-size="58" font-weight="700">${e(monogram)}</text>`}
  <text x="300" y="340" fill="${ink}" font-size="${nameSize}" text-anchor="middle" font-weight="700">${e(a.name)}</text><path d="M50 375H550" stroke="${ink}" stroke-opacity=".6"/>
  <g fill="${ink}">${m.stats.map((s,i)=>{const x=i%2?330:62,y=412+Math.floor(i/2)*94;return `<text x="${x}" y="${y}" font-size="18" font-weight="700" letter-spacing=".6">${e(s.name.toUpperCase())}</text><text x="${x}" y="${y+40}" font-size="42" font-weight="700">${e(s.display)}</text><text x="${x}" y="${y+61}" font-size="13">${e(s.unit)}</text>`;}).join('')}</g>
  <path d="M50 690H550" stroke="${ink}" stroke-opacity=".6"/><text x="300" y="727" fill="${ink}" text-anchor="middle" font-size="16" letter-spacing="2">${m.tier.toUpperCase()} EDITION</text><text x="300" y="760" fill="${ink}" text-anchor="middle" font-size="12">SPOTIFY · TRACKED CATALOGUE · PUBLISHED SCORE</text>`;
 }
 function svg(slug,data,{format='og',photo,context=''}={}){
  const m=model(slug,data),a=m.artist,story=format==='story',w=story?1080:1200,h=story?1920:630;
  const scale=story?1.38:.53,cardW=600*scale,cardH=800*scale,x=(w-cardW)/2,y=story?280:76;
  const pillY=y+cardH+(story?45:12),pillW=story?660:400,pillH=story?66:34;
  const movement=m.delta===null?'NEW ENTRY':m.delta>0?`UP ${m.delta} ${m.delta===1?'PLACE':'PLACES'}`:m.delta<0?`DOWN ${-m.delta} ${m.delta===-1?'PLACE':'PLACES'}`:'NO MOVEMENT';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${e(a.name)} Current 50 player card"><rect width="${w}" height="${h}" fill="#1d1d1c"/><g font-family="DejaVu Sans,Arial,sans-serif"><text x="${story?78:48}" y="${story?110:42}" fill="#d4f24a" font-size="${story?44:25}" font-weight="700">AFR / INDEX</text><text x="${w-(story?78:48)}" y="${story?110:42}" text-anchor="end" fill="#d4f24a" font-size="${story?26:18}" letter-spacing="3">CURRENT 50</text>${context?`<text x="${w/2}" y="${story?200:66}" text-anchor="middle" fill="#e5e5de" font-size="${story?26:14}" letter-spacing="2">${e(context)}</text>`:''}<g transform="translate(${x},${y}) scale(${scale})">${cardBody(m,{photo})}</g><rect x="${(w-pillW)/2}" y="${pillY}" width="${pillW}" height="${pillH}" rx="${pillH/2}" fill="#d4f24a"/><text x="${w/2}" y="${pillY+pillH*.68}" text-anchor="middle" fill="#1d1d1c" font-size="${story?25:17}" font-weight="700">${movement}</text><text x="${w/2}" y="${story?1635:578}" text-anchor="middle" fill="#c0c0b7" font-size="${story?23:16}">Snapshot ${e(trust.formatDate(data.asOf))} · Editorial ranking</text><text x="${w/2}" y="${story?1690:610}" text-anchor="middle" fill="#d4f24a" font-size="${story?24:17}">afrobeats-index.vercel.app/current/${e(a.slug)}</text>${story?'<text x="540" y="1770" text-anchor="middle" fill="#9c9c93" font-size="20">REAL FIGURES. EVERY ARTIST.</text><text x="540" y="1810" text-anchor="middle" fill="#9c9c93" font-size="19">Stream index /99 · Editorial points /83</text>':''}</g></svg>`;
 }
 return{model,svg,cardBody};
});
