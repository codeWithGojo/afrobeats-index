const norm = value => String(value || '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
function featureCredits(artists) {
  const records = new Map();
  for (const owner of artists) for (const song of owner.songs || []) {
    const credit = song.title.match(/\b(?:feat\.?|ft\.?)\s+([^)]*)/i);
    if (!credit || !song.streams) continue;
    const text = ' ' + norm(credit[1]) + ' ';
    const guests = artists.filter(a => text.includes(' ' + norm(a.name) + ' ')).map(a => a.slug);
    if (!guests.length) continue;
    const key = norm(song.title);
    const previous = records.get(key);
    if (!previous || song.streams > previous.streams) records.set(key, {title: song.title, spotifyId: song.spotifyId || null, streams: song.streams, dailyStreams: song.dailyStreams || null, guests, owner: owner.slug, source: owner.sources?.catalogue || song.sourceUrl, asOf: song.lastVerifiedAt || owner.songsLastUpdatedAt, basis:'Explicit feat./ft. credit in the tracked title'});
  }
  return [...records.values()];
}
function guestBoard(artists, credits) {
  return artists.map(a => {const songs=credits.filter(c=>c.guests.includes(a.slug));return {...a, officialRank:a.rank, guestStreams:songs.reduce((n,c)=>n+c.streams,0), guestTracks:songs.length, credits:songs};}).filter(a=>a.guestTracks).sort((a,b)=>b.guestStreams-a.guestStreams||a.rank-b.rank).map((a,i)=>({...a,rank:i+1}));
}
function scenario(artists, weights) {
  if (weights.length!==11 || weights.some(x=>!Number.isFinite(x)||x<0)) throw Error('Invalid weights');
  const active=weights.map((w,i)=>w>0?i:-1).filter(i=>i>=0),sum=weights.reduce((a,b)=>a+b,0);
  if(!sum)return [];
  return artists.filter(a=>active.every(i=>Number.isFinite(a.components?.[i]))).map(a=>({...a,officialRank:a.rank,score:active.reduce((n,i)=>n+a.components[i]*weights[i],0)/sum})).sort((a,b)=>b.score-a.score||a.officialRank-b.officialRank).map((a,i)=>({...a,rank:i+1}));
}
module.exports={norm,featureCredits,guestBoard,scenario};
