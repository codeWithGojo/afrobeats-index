// Kworb Spotify ledgers: per-track and per-album public Spotify play counts, collected by
// scripts/research/audit-2026-releases.py into data/releases-2026-sources.json.
// Counts are labelled as a third-party ledger; nothing is estimated or filled in.
const id='kworb-spotify';
const collector=['scripts/research/audit-2026-releases.py'];
const spotifyKey=(url,prefix)=>{const match=String(url||'').match(/open\.spotify\.com\/(?:track|album)\/([A-Za-z0-9]{22})/);return match?prefix+match[1]:null;};

function normalize({'releases-2026-sources':sources,current}){
  const artists=current.artists.map(a=>({slug:a.slug,name:a.name,spotify_id:a.spotifyId||null}));
  const known=new Set(artists.map(a=>a.slug));
  const tracks=new Map(),albums=new Map();
  const out={artists,tracks:[],albums:[],track_stream_snapshots:[],album_stream_snapshots:[],artist_statistics:[]};
  const base=(ledger,metric,value,extra)=>({provider:id,metric,metric_class:'verified_count',confidence:'third_party_ledger',value,source_date:ledger.source_date,observed_at:ledger.verified_at||sources.checked_at,source_url:ledger.url||null,...extra});
  for(const packet of sources.artists){
    const slug=packet.artist_slug;if(!known.has(slug))continue;
    for(const kind of ['songs','albums']){
      const ledger=packet[kind];
      if(!ledger?.source_date||!Array.isArray(ledger.rows))continue;
      if(kind==='songs'){
        if(Number.isFinite(ledger.total))out.artist_statistics.push(base(ledger,'tracked_spotify_streams',ledger.total,{artist_slug:slug,period:'lifetime'}));
        if(Number.isFinite(ledger.daily))out.artist_statistics.push(base(ledger,'tracked_spotify_streams',ledger.daily,{artist_slug:slug,period:'daily'}));
      }
      for(const row of ledger.rows){
        const key=spotifyKey(row.spotify_url,kind==='songs'?'spotify:':'spotify-album:');if(!key)continue;
        if(kind==='songs'){
          const track=tracks.get(key)||{key,title:row.title,artist_slugs:[]};
          if(!track.artist_slugs.includes(slug))track.artist_slugs.push(slug);
          tracks.set(key,track);
          if(Number.isFinite(row.total))out.track_stream_snapshots.push(base(ledger,'lifetime_streams',row.total,{track_key:key}));
          if(Number.isFinite(row.daily))out.track_stream_snapshots.push(base(ledger,'daily_streams',row.daily,{track_key:key}));
        }else{
          if(!albums.has(key))albums.set(key,{key,title:row.title,primary_artist_slug:slug});
          if(Number.isFinite(row.total))out.album_stream_snapshots.push(base(ledger,'lifetime_streams',row.total,{album_key:key}));
          if(Number.isFinite(row.daily))out.album_stream_snapshots.push(base(ledger,'daily_streams',row.daily,{album_key:key}));
        }
      }
    }
  }
  out.tracks=[...tracks.values()];out.albums=[...albums.values()];
  return out;
}

module.exports={id,collector,inputs:['releases-2026-sources','current'],normalize};
