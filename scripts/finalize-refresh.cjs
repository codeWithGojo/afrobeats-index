// Run only after source collection, never merely because the site is rebuilt.
const fs=require('node:fs');
const read=name=>JSON.parse(fs.readFileSync(`data/${name}.json`,'utf8'));
const sources=read('releases-2026-sources'),songs=read('nigeria-top100'),albums=read('nigeria-albums-top100'),upcoming=read('upcoming-releases'),news=read('editorial-news');
const dateKey=value=>new Intl.DateTimeFormat('en-CA',{timeZone:'Africa/Lagos',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(value));
const today=dateKey(new Date());
if(dateKey(sources.checked_at)!==today||sources.artists.length!==50)throw Error('A complete source check from today is required before dating a new edition.');
const ledgers=sources.artists.flatMap(a=>['songs','albums'].map(kind=>a[kind]));
const fresh=ledgers.filter(x=>x.status!=='retained_last_good'&&x.rows.length&&x.source_date);
if(!fresh.length)throw Error('No source ledgers refreshed; keep the published edition.');
for(const chart of [songs,albums])if(dateKey(chart.checkedAt)!==today||chart.rows.length!==100)throw Error('Recheck both official charts before publishing a new edition.');
const sourceDates=[...new Set(ledgers.map(x=>x.source_date).filter(Boolean))].sort();
const awards=read('awards-seasons'),bios=read('artist-evidence'),identities=read('release-identities'),categories=read('turntable-categories');
const edition={
  updatedAt:new Date().toISOString(),
  timezone:'Africa/Lagos',
  scope:'Edition update. Source observation dates and official chart periods remain separate.',
  datasets:{
    streaming:{checkedAt:sources.checked_at,status:fresh.length===100?'refreshed':'partial',artists:50,ledgersRefreshed:fresh.length,ledgersRetained:100-fresh.length,sourceStart:sourceDates[0],sourceEnd:sourceDates.at(-1)},
    turntableSongs:{checkedAt:songs.checkedAt,status:'checked',weekStart:songs.weekStart,weekEnd:songs.weekEnd,sourceUrl:songs.sourceUrl},
    turntableAlbums:{checkedAt:albums.checkedAt,status:'checked',weekStart:albums.weekStart,weekEnd:albums.weekEnd,sourceUrl:albums.sourceUrl},
    upcoming:{checkedAt:upcoming.checkedAt,status:'checked',count:upcoming.releases.length},
    news:{checkedAt:news.checkedAt,status:'checked',latestArticle:news.items.map(x=>x.date).sort().at(-1)},
    turntableCategories:{checkedAt:categories.map(c=>c.checkedAt).sort().at(-1),status:'checked',categories:categories.length,note:'Each category preserves its own publisher period; year-end and TV charts remain archives.'},
    releaseIdentities:{checkedAt:identities.checkedAt,status:Object.values(identities.artists).every(a=>a.status==='refreshed')?'refreshed':'partial',artists:Object.values(identities.artists).filter(a=>a.status==='refreshed').length},
    awardsCalendar:{checkedAt:awards.checkedAt,status:'checked',seasons:awards.seasons.length},
    biographies:{checkedAt:today,status:'partial',rechecked:bios.filter(a=>a.evidence?.biography?.checked_at===today).length,note:'Unavailable or ambiguous biographies retain their previous evidence dates.'},
    certifications:{checkedAt:'2026-11-09',status:'partial',note:'512 TurnTable matches revalidated; Ayra Starr’s Rush added from RIAA (Platinum, 5 Nov). RIAA and Music Canada recent registers checked; BPI returned 404 and SNEP 403. Other certificate dates remain unchanged.'},
    discovery:{checkedAt:read('watch-artists').updatedAt,status:'reviewed',note:'The FADER source rechecked; discovery order is retained and unresolved profiles stay marked.'},
    editorial:{status:'retained',note:'All-Time placements, locked editorial contributions, historical award results and financial estimates retain their original evidence dates. New certification checks are described separately.'}
  }
};
fs.writeFileSync('data/edition.json',JSON.stringify(edition,null,2)+'\n');
console.log('Edition prepared:',today,`${fresh.length}/100 ledgers refreshed; official chart periods preserved.`);
