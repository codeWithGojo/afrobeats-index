const fs=require('fs');

const base=fs.readFileSync('assets/inline-07.js','utf8');
const state=JSON.parse(base.match(/window\.AFRI_EMBEDDED_STATE=(\{.*?\});/s)[1]);
const checkedAt='2026-09-21T07:06:07.000Z';
const verifiedAt='2026-09-21T00:00:00.000Z';

const clean=s=>String(s||'').replace(/<[^>]+>/g,'').replace(/&amp;/g,'&').replace(/&#39;|&apos;/g,"'").replace(/&quot;/g,'"').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/\s+/g,' ').trim();
const num=s=>{const n=Number(String(s||'').replace(/[^0-9.-]/g,''));return Number.isFinite(n)&&n>=0?n:null};
const norm=s=>clean(s).toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim();
async function get(url){const c=new AbortController();const t=setTimeout(()=>c.abort(),30000);try{const r=await fetch(url,{signal:c.signal,headers:{'user-agent':'Mozilla/5.0 AFR-INDEX verification desk'}});if(!r.ok)throw Error(String(r.status));return await r.text()}finally{clearTimeout(t)}}
function parseKworb(html,type){
  const updated=(html.match(/Last updated:\s*([0-9/]+)/i)||[])[1]||null;
  const total=num((html.match(/<tr><td class="text">Streams<\/td><td>([^<]*)/i)||[])[1]);
  const daily=num((html.match(/<tr><td class="text">Daily<\/td><td>([^<]*)/i)||[])[1]);
  const count=num((html.match(/<tr><td class="text">Tracks<\/td><td>([^<]*)/i)||[])[1]);
  const rows=[];const re=new RegExp(`<tr><td class="text"><div>(?:\\*\\s*)?<a href="https://open\\.spotify\\.com/${type}/([^"]+)"[^>]*>([\\s\\S]*?)<\\/a><\\/div><\\/td><td>([^<]*)<\\/td><td>([^<]*)<\\/td><\\/tr>`,'gi');
  for(const m of html.matchAll(re)){const streams=num(m[3]);if(streams===null)continue;rows.push([clean(m[2]),streams,num(m[4]),m[1]])}
  return {updated,total,daily,count,rows};
}
function parseMonthly(html){
  const matches=[...html.matchAll(/\\u0022date\\u0022:\\u0022([^\\]+)\\u0022,\\u0022listeners\\u0022:(\d+)/g)];
  if(matches.length){const m=matches.at(-1);return {value:Number(m[2]),date:m[1]}}
  const label=(html.match(/Monthly Listeners<\/p>[\s\S]{0,250}?font-bold[^>]*>([^<]+)</i)||[])[1];
  if(!label)return null;const x=clean(label).toLowerCase();let value=parseFloat(x.replace(/,/g,''));if(x.includes('million'))value*=1e6;else if(x.includes('thousand'))value*=1e3;return Number.isFinite(value)?{value:Math.round(value),date:null}:null;
}
async function one(a){
  const id=a.spotifyId;const out={slug:a.slug};
  try{out.songs=parseKworb(await get(`https://kworb.net/spotify/artist/${id}_songs.html`),'track')}catch(e){out.songError=String(e)}
  try{out.albums=parseKworb(await get(`https://kworb.net/spotify/artist/${id}_albums.html`),'album')}catch(e){out.albumError=String(e)}
  try{out.monthly=parseMonthly(await get(a.sources.monthly))}catch(e){out.monthlyError=String(e)}
  return out;
}
async function main(){
  const results=[];for(let i=0;i<state.artists.length;i+=8)results.push(...await Promise.all(state.artists.slice(i,i+8).map(one)));
  const payload=Object.fromEntries(results.map(r=>[r.slug,r]));
  const js=`// Verified last-good refresh: 21 Sep 2026. Failed providers retain prior verified values.\n(function(){\nconst checkedAt=${JSON.stringify(checkedAt)},verifiedAt=${JSON.stringify(verifiedAt)},fresh=${JSON.stringify(payload)};\nconst norm=v=>String(v||'').toLowerCase().normalize('NFKD').replace(/[\\u0300-\\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim();\nconst s=window.AFRI_EMBEDDED_STATE;if(!s)return;const ok=[],retained=[];\nfor(const a of s.artists||[]){const f=fresh[a.slug]||{};if(f.songs&&f.songs.total>0){a.totalSpotifyStreams=f.songs.total;a.dailySpotifyStreams=f.songs.daily;a.trackedSongCount=f.songs.count||f.songs.rows.length;a.songs=f.songs.rows.map(([title,streams,dailyStreams,spotifyId])=>({title,streams,dailyStreams,spotifyId,sourceUrl:'https://open.spotify.com/track/'+spotifyId,lastVerifiedAt:verifiedAt}));a.songsLastUpdatedAt=verifiedAt;a.statsLastUpdatedAt=verifiedAt;ok.push(a.slug)}else retained.push(a.slug);if(f.albums&&f.albums.rows.length){a.catalogueAlbums=f.albums.rows.map(([title,streams,dailyStreams,spotifyId])=>({title,streams,dailyStreams,spotifyId,sourceUrl:'https://open.spotify.com/album/'+spotifyId,lastVerifiedAt:verifiedAt}));a.trackedAlbumCount=f.albums.count||f.albums.rows.length;a.albumsLastUpdatedAt=verifiedAt}if(f.monthly&&f.monthly.value>0){a.monthlyListeners=f.monthly.value;a.monthlyListenersLastUpdatedAt=verifiedAt}a.providerAudit={kworb:f.songs?'verified':'retained_last_good',kworbAlbums:f.albums?'verified':'retained_last_good',monthlyListeners:f.monthly?'verified':'retained_last_good',sourceUpdated:f.songs?.updated||null};}\nfor(const x of s.albums||[]){const a=(s.artists||[]).find(y=>y.slug===x.artistSlug),r=(a?.catalogueAlbums||[]).find(y=>y.spotifyId&&y.spotifyId===x.spotifyId)||(a?.catalogueAlbums||[]).find(y=>norm(y.title)===norm(x.title));if(r){x.streams=r.streams;x.dailyStreams=r.dailyStreams;x.lastVerifiedAt=verifiedAt}}s.albums=(s.albums||[]).sort((a,b)=>b.streams-a.streams);\ns.meta.streamsUpdatedAt=checkedAt;s.meta.lastRefreshAttemptAt=checkedAt;s.meta.providerStatus={kworb:{status:retained.length?'partial':'verified',artists_checked:(s.artists||[]).length,artists_updated:ok.length,retained_last_good:retained,last_checked_at:checkedAt},musicMetricsVault:{status:'partial',note:'Latest publisher value used where returned; failed pages retained last-good.',last_checked_at:checkedAt},kworbAlbums:{status:'verified_or_retained',last_checked_at:checkedAt},youtube:{status:'retained_last_good',reason:'No comparable public artist ledger returned.'},audiomack:{status:'retained_last_good',reason:'No comparable public artist ledger returned.'},boomplay:{status:'retained_last_good',reason:'No comparable public artist ledger returned.'}};\nconst snap={capturedAt:checkedAt,artists:{}};(s.artists||[]).forEach(a=>snap.artists[a.slug]={totalSpotifyStreams:a.totalSpotifyStreams,dailySpotifyStreams:a.dailySpotifyStreams,monthlyListeners:a.monthlyListeners,trackedSongCount:a.trackedSongCount,trackedAlbumCount:a.trackedAlbumCount});s.streamSnapshots=[...(s.streamSnapshots||[]),snap].slice(-12);\nconst y=window.AFRI_YEARLY_STREAMS;if(y){y.active_year=2026;y.updated_at=checkedAt;for(const x of y.songs||[]){if(x.year!==2026)continue;const a=(s.artists||[]).find(z=>z.slug===x.artist_slug),r=(a?.songs||[]).find(z=>norm(z.title)===norm(x.song_title));if(r){x.streams_this_year=r.streams;x.daily_streams=r.dailyStreams;x.last_updated='2026-09-21'}}for(const x of y.albums||[]){if(x.year!==2026)continue;const a=(s.artists||[]).find(z=>z.slug===x.artist_slug),r=(a?.catalogueAlbums||[]).find(z=>norm(z.title)===norm(x.album_title));if(r){x.streams_this_year=r.streams;x.daily_streams=r.dailyStreams;x.last_updated='2026-09-21'}}y.songs.sort((a,b)=>a.year===b.year?b.streams_this_year-a.streams_this_year:b.year-a.year);y.albums.sort((a,b)=>a.year===b.year?b.streams_this_year-a.streams_this_year:b.year-a.year);y.source_audit={...(y.source_audit||{}),spotify:'Kworb artist song and album ledgers',last_checked_at:checkedAt,youtube:'retained_last_good',audiomack:'retained_last_good',boomplay:'retained_last_good'}}\n})();\n`;
  fs.writeFileSync('refresh-2026-09-21.js',js);fs.writeFileSync('/tmp/afri-refresh-report.json',JSON.stringify(results,null,2));
  console.log(JSON.stringify({artists:results.length,songs_ok:results.filter(x=>x.songs).length,albums_ok:results.filter(x=>x.albums).length,monthly_ok:results.filter(x=>x.monthly).length,failures:results.filter(x=>x.songError||x.albumError||x.monthlyError).map(x=>({slug:x.slug,song:x.songError,album:x.albumError,monthly:x.monthlyError}))},null,2));
}
main().catch(e=>{console.error(e);process.exit(1)});
