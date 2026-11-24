// Published Current 50 editions: the archive in data/current-editions.json plus the live edition.
// These are calculated scores, stored exactly as published; nothing is recalculated here.
const id='afri-index';
const collector=[];
const BOARD='current-50';
const LIVE_METHOD='current-83-editorial-17-audio';
const ARCHIVE_METHOD='published-edition-archive';
const lagosDate=value=>new Intl.DateTimeFormat('en-CA',{timeZone:'Africa/Lagos',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(value));

function normalize({'current-editions':archive,current,'all-time':allTime}){
  const names=new Map([...(allTime?.artists||[]),...current.artists].map(a=>[a.slug,a.name]));
  const out=[],unknown=new Set(),editions=Object.keys(archive).sort();
  editions.forEach((date,index)=>{
    const before=index?archive[editions[index-1]]:null;
    for(const [slug,[rank,score]] of Object.entries(archive[date])){
      if(!names.has(slug)){unknown.add(slug);continue;}
      out.push({board:BOARD,edition_date:date,rank,artist_slug:slug,score:Number.isFinite(score)?score:null,previous_rank:before?.[slug]?.[0]??null,breakdown:null,method_version:ARCHIVE_METHOD});
    }
  });
  const live=lagosDate(current.asOf);
  if(!archive[live]){
    for(const a of current.artists){
      out.push({board:BOARD,edition_date:live,rank:a.rank,artist_slug:a.slug,score:a.score,previous_rank:Number.isFinite(a.previousRank)?a.previousRank:null,breakdown:a.scoreBreakdown||null,method_version:LIVE_METHOD});
    }
  }
  const slugs=new Set(out.map(row=>row.artist_slug));
  const spotify=new Map(current.artists.map(a=>[a.slug,a.spotifyId||null]));
  return {artists:[...slugs].map(slug=>({slug,name:names.get(slug),spotify_id:spotify.get(slug)??null})),ranking_snapshots:out,skipped:[...unknown].map(slug=>`No published name for archived artist ${slug}; rows skipped.`)};
}

module.exports={id,collector,inputs:['current-editions','current','all-time'],normalize,BOARD};
