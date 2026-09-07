(function(root){
 function summarize(items,year,lookup){
  const tracks=new Map(),artists=new Map(),genres=new Map();let milliseconds=0,events=0,first=null,last=null;
  for(const item of items){const timestamp=item.ts||item.endTime||item.timestamp;let date=new Date(timestamp);if(!Number.isFinite(date.getTime())||date.getUTCFullYear()!==year)continue;
   const title=item.master_metadata_track_name||item.trackName||item.title,artistName=item.master_metadata_album_artist_name||item.artistName||item.artist,ms=Number(item.ms_played??item.msPlayed);
   if(!title||!artistName||!Number.isFinite(ms)||ms<=0)continue;const artist=lookup(artistName);if(!artist)continue;
   const time=date.toISOString();first=!first||time<first?time:first;last=!last||time>last?time:last;milliseconds+=ms;events++;
   const key=artist.slug+'|'+title,t=tracks.get(key)||{title,artist:artist.name,artists:[artist.name],plays:0,milliseconds:0,source:'import'};t.plays++;t.milliseconds+=ms;tracks.set(key,t);
   const a=artists.get(artist.slug)||{name:artist.name,slug:artist.slug,plays:0,milliseconds:0,firstObserved:time,source:'import'};a.plays++;a.milliseconds+=ms;if(time<a.firstObserved)a.firstObserved=time;artists.set(artist.slug,a);
   const genre=artist.genres?.[0]||'Unclassified';genres.set(genre,(genres.get(genre)||0)+ms);
  }
  return {year,events,minutes:Math.floor(milliseconds/60000),first,last,tracks:[...tracks.values()].sort((a,b)=>b.plays-a.plays||b.milliseconds-a.milliseconds).map((t,i)=>({...t,rank:i+1})),artists:[...artists.values()].sort((a,b)=>b.milliseconds-a.milliseconds).map((a,i)=>({...a,rank:i+1})),topGenre:[...genres].sort((a,b)=>b[1]-a[1])[0]?.[0]};
 }
 if(typeof module==='object')module.exports={summarize};else root.AfriHistory={summarize};
})(typeof window==='object'?window:this);
