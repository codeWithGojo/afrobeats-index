/* Personal stats (Phase 3). Pure functions shared by the browser and tests.
   Input is whatever a provider returns; output keeps only African artists from the index roster. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.AfriStatsModel=api;})(typeof window==='object'?window:globalThis,function(){
 'use strict';
 const norm=v=>String(v||'').normalize('NFKD').replace(/[̀-ͯ]/g,'').toLowerCase().replace(/&/g,' and ').replace(/[’']/g,'').replace(/[^a-z0-9]+/g,' ').trim();
 const splitCredits=v=>String(v||'').split(/\s*(?:,|&|\bx\b|\bfeat\.?|\bft\.?|\bwith\b)\s*/i).map(s=>s.trim()).filter(Boolean);
 // Genre buckets for the mix. Order matters: the first bucket that matches wins.
 const BUCKETS=[['Amapiano',/amapiano|piano/],['Alte',/alte/],['Gqom',/gqom/],['Street-pop',/street|fuji|hip life|asakaa|drill/],['Hip-hop',/hip ?hop|rap|trap/],['Afro R&B',/r ?and ?b|r&b|soul/],['Highlife',/highlife/],['Afro-fusion',/fusion|afro ?pop|afropop|dancehall|reggae/],['Afrobeats',/afrobeat|afro ?beats|naija/],['Bongo flava',/bongo/],['Gospel',/gospel/]];
 function bucket(genres){const text=norm((genres||[]).join(' '));for(const [name,re] of BUCKETS)if(re.test(text))return name;return text?'Other African':'Unclassified';}
 function era(careerStarted,now=new Date()){if(!Number.isInteger(careerStarted))return 'Unknown';const years=now.getUTCFullYear()-careerStarted;return years>=15?'Old school':years>=7?'Established':'New wave';}

 // Roster: [{slug,name,aliases?,country,genres,careerStarted,currentRank?,board}]
 function buildIndex(roster){
  const byName=new Map();
  for(const a of roster)for(const n of [a.name,...(a.aliases||[])]){const k=norm(n);if(k&&!byName.has(k))byName.set(k,a);}
  return {roster,find(name){return byName.get(norm(name))||null;},findCredits(text){const seen=new Map();for(const part of [text,...splitCredits(text)]){const a=byName.get(norm(part));if(a)seen.set(a.slug,a);}return [...seen.values()];}};
 }

 /* Normalise a provider snapshot.
    artists: [{name,rank}]  tracks: [{title,artists:[names],rank,plays?}]  -> African-only lists and an unmatched count. */
 function matchSnapshot(index,{artists=[],tracks=[]}){
  const outArtists=[],seen=new Set();let unmatchedArtists=0,unmatchedTracks=0;
  for(const a of artists){const hit=index.find(a.name);if(!hit){unmatchedArtists++;continue;}if(seen.has(hit.slug))continue;seen.add(hit.slug);outArtists.push({...hit,yourRank:outArtists.length+1,sourceRank:a.rank??null,plays:a.plays??null});}
  const outTracks=[];
  for(const t of tracks){const hits=(t.artists?.length?t.artists:splitCredits(t.artist)).flatMap(n=>index.findCredits(n));const uniq=[...new Map(hits.map(h=>[h.slug,h])).values()];if(!uniq.length){unmatchedTracks++;continue;}outTracks.push({title:t.title,album:t.album||null,artists:uniq,yourRank:outTracks.length+1,sourceRank:t.rank??null,plays:t.plays??null});}
  return {artists:outArtists,tracks:outTracks,unmatched:{artists:unmatchedArtists,tracks:unmatchedTracks}};
 }
 // Albums are only known when a provider returns them; tracks carry an album name if so.
 function topAlbums(tracks){const m=new Map();for(const t of tracks){if(!t.album)continue;const k=norm(t.album)+'|'+t.artists[0].slug;const r=m.get(k)||{title:t.album,artist:t.artists[0],tracks:0,score:0};r.tracks++;r.score+=1/(t.yourRank||1);m.set(k,r);}return [...m.values()].sort((a,b)=>b.score-a.score).slice(0,10);}
 // Weighted shares: higher personal ranks count more (1/rank), so the mix reflects listening order.
 function share(items,key){const m=new Map();let total=0;items.forEach((x,i)=>{const w=1/(i+1),k=key(x);m.set(k,(m.get(k)||0)+w);total+=w;});return [...m].map(([label,w])=>({label,percent:total?Math.round(100*w/total):0})).sort((a,b)=>b.percent-a.percent);}
 function profile(snapshot,{current=[],now=new Date()}={}){
  const a=snapshot.artists;
  const currentSlugs=new Map(current.map(x=>[x.slug,x.rank]));
  const inCurrent=a.filter(x=>currentSlugs.has(x.slug));
  const top10=new Set(current.filter(x=>x.rank<=10).map(x=>x.slug));
  return {
   genres:share(a,x=>bucket(x.genres)),
   countries:share(a,x=>String(x.country||'Unknown').split(/\s*\/\s*/)[0]),
   eras:share(a,x=>era(x.careerStarted,now)),
   chart:{matched:a.length,inCurrent50:inCurrent.length,inTop10:a.filter(x=>top10.has(x.slug)).length,
    averageRank:inCurrent.length?Math.round(inCurrent.reduce((n,x)=>n+currentSlugs.get(x.slug),0)/inCurrent.length):null,
    beyond50:a.filter(x=>!currentSlugs.has(x.slug)).map(x=>x.name).slice(0,5),
    label:!a.length?'No African artists matched yet':inCurrent.length/a.length>=.8?'Right on the chart':inCurrent.length/a.length>=.5?'Chart-adjacent':'Ahead of the chart'},
  };
 }
 // Taste vector for sharing and soulmates: top 20 African artists, weights 1/rank, normalised.
 function tasteVector(artists){const top=artists.slice(0,20),w=top.map((_,i)=>1/(i+1)),n=Math.sqrt(w.reduce((s,x)=>s+x*x,0))||1;return top.map((a,i)=>({slug:a.slug,weight:Number((w[i]/n).toFixed(4))}));}
 function similarity(a,b){const mb=new Map(b.map(x=>[x.slug,x.weight]));let dot=0;const shared=[];for(const x of a){if(mb.has(x.slug)){dot+=x.weight*mb.get(x.slug);shared.push(x.slug);}}const na=Math.hypot(...a.map(x=>x.weight)),nb=Math.hypot(...b.map(x=>x.weight));return {score:na&&nb?Number((dot/(na*nb)).toFixed(4)):0,shared};}

 // Logged plays: [{played_at,artist_slug,track_title}] -> clock, top artists and tracks, tracking window.
 function plays(rows,index){
  const clock=Array(24).fill(0),artists=new Map(),tracks=new Map();let first=null,last=null;
  for(const r of rows){const t=new Date(r.played_at);if(!Number.isFinite(t.getTime()))continue;clock[t.getHours()]++;const a=index.roster.find(x=>x.slug===r.artist_slug);if(!a)continue;artists.set(a.slug,{...a,plays:(artists.get(a.slug)?.plays||0)+1});const k=a.slug+'|'+norm(r.track_title);tracks.set(k,{title:r.track_title,artists:[a],plays:(tracks.get(k)?.plays||0)+1});const iso=t.toISOString();first=!first||iso<first?iso:first;last=!last||iso>last?iso:last;}
  const rank=m=>[...m.values()].sort((a,b)=>b.plays-a.plays).map((x,i)=>({...x,yourRank:i+1}));
  return {total:rows.length,clock,artists:rank(artists),tracks:rank(tracks),first,last};
 }

 /* Spotify Extended Streaming History (Streaming_History_Audio_*.json) or basic account data (StreamingHistory*.json).
    Aggregates African plays only. Plays under 30 seconds are skipped, as Spotify does for royalty counting. */
 function lifetime(items,index,{minMs=30000}={}){
  const artists=new Map(),tracks=new Map(),years=new Map(),clock=Array(24).fill(0),weekday=Array(7).fill(0);
  let ms=0,events=0,unmatched=0,skipped=0,first=null,last=null;
  for(const item of items){
   const ts=item.ts||item.endTime,title=item.master_metadata_track_name||item.trackName,artistName=item.master_metadata_album_artist_name||item.artistName,played=Number(item.ms_played??item.msPlayed);
   if(!ts||!title||!artistName||!Number.isFinite(played)){skipped++;continue;}
   if(played<minMs){skipped++;continue;}
   const hit=index.findCredits(artistName)[0];if(!hit){unmatched++;continue;}
   const d=new Date(String(ts).replace(' ','T')+(/Z|[+-]\d\d:?\d\d$/.test(ts)?'':'Z'));if(!Number.isFinite(d.getTime())){skipped++;continue;}
   const iso=d.toISOString(),y=d.getUTCFullYear();events++;ms+=played;clock[d.getUTCHours()]++;weekday[d.getUTCDay()]++;first=!first||iso<first?iso:first;last=!last||iso>last?iso:last;
   const a=artists.get(hit.slug)||{slug:hit.slug,name:hit.name,plays:0,minutes:0,firstPlayed:iso};a.plays++;a.minutes+=played/6e4;if(iso<a.firstPlayed)a.firstPlayed=iso;artists.set(hit.slug,a);
   const k=hit.slug+'|'+norm(title),t=tracks.get(k)||{title,artist:hit.slug,plays:0,minutes:0};t.plays++;t.minutes+=played/6e4;tracks.set(k,t);
   const yr=years.get(y)||{year:y,plays:0,minutes:0,artists:new Map()};yr.plays++;yr.minutes+=played/6e4;yr.artists.set(hit.slug,(yr.artists.get(hit.slug)||0)+played);years.set(y,yr);
  }
  const round=x=>Math.round(x);
  return {events,minutes:round(ms/6e4),unmatchedPlays:unmatched,skipped,first,last,clockUtc:clock,weekdayUtc:weekday,
   artists:[...artists.values()].sort((a,b)=>b.minutes-a.minutes).slice(0,100).map((a,i)=>({...a,minutes:round(a.minutes),rank:i+1})),
   tracks:[...tracks.values()].sort((a,b)=>b.plays-a.plays).slice(0,100).map((t,i)=>({...t,minutes:round(t.minutes),rank:i+1})),
   years:[...years.values()].sort((a,b)=>a.year-b.year).map(y=>({year:y.year,plays:y.plays,minutes:round(y.minutes),topArtist:[...y.artists].sort((a,b)=>b[1]-a[1])[0]?.[0]||null}))};
 }
 // Afri Wrapped for one year, from a lifetime summary.
 function wrapped(summary,year){const y=summary.years.find(x=>x.year===year);if(!y)return null;return {year,minutes:y.minutes,plays:y.plays,topArtist:y.topArtist,share:summary.minutes?Math.round(100*y.minutes/summary.minutes):0};}
 return {norm,splitCredits,bucket,era,buildIndex,matchSnapshot,topAlbums,profile,tasteVector,similarity,plays,lifetime,wrapped};
});
