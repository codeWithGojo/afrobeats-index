const {escape:e,badge,icon}=require('../chart-model.js');
const {trigger:playTrigger}=require('../music-embed.js');
const songKey=(title,artist)=>JSON.stringify([title,artist].map(value=>value.normalize('NFKC').trim().toLowerCase()));
const cataloguePlayback=new Map();
for(const song of require('../data/releases-2026.json').songs){
  const key=songKey(song.song_title,song.artist);
  // An ambiguous title and artist pair needs a curated recording ID.
  cataloguePlayback.set(key,cataloguePlayback.has(key)?null:{provider:'spotify',id:song.spotify_id});
}
for(const [title,artist,provider,id] of require('../data/music-playback.json').songs){
  cataloguePlayback.set(songKey(title,artist),{provider,id});
}
const destinations=[
  ['Artists',[['/current','Current 50'],['/all-time','All-Time 50'],['/regions','Regional rankings'],['/net-worth','Net Worth']]],
  ['Streams',[['/streams','Stream counter & tables'],['/streams?year=2026','Biggest streams · 2026 releases'],['/albums','All-time streamed albums'],['/releases','Releases by year']]],
  ['TurnTable',[['/turntable','All TurnTable categories'],['/top100','Nigeria Top 100 songs'],['/top100-albums','Nigeria Top 100 albums'],...require('../data/turntable-categories.json').map(c=>['/turntable-'+c.slug,c.title+(c.group==='Archive'?' · archive':'')])]]
];
function rankingNav(active=''){
  const group=destinations.find(([,items])=>items.some(([url])=>url===active))?.[0]||'';
  return `<nav class="ranking-nav" aria-label="Choose a ranking"><div class="ranking-nav-top"><a href="/rankings" class="ranking-home"${active==='/rankings'?' aria-current="page"':''}>Rankings <span aria-hidden="true">/</span></a><div class="ranking-families">${[['Artists','/current'],['Streams','/streams'],['TurnTable','/turntable']].map(([label,url])=>`<a href="${url}"${group===label?' class="is-active"':''}>${label}</a>`).join('')}</div></div><div class="ranking-picker"><label for="ranking-destination">Switch chart</label><select id="ranking-destination"><option value="/rankings"${active==='/rankings'?' selected':''}>All rankings</option>${destinations.map(([label,items])=>`<optgroup label="${label}">${items.map(([url,title])=>`<option value="${url}"${url===active?' selected':''}>${e(title)}</option>`).join('')}</optgroup>`).join('')}</select><span aria-hidden="true">⌄</span></div><noscript><p>${destinations.flatMap(([,items])=>items.map(([url,title])=>`<a href="${url}">${e(title)}</a>`)).join(' · ')}</p></noscript></nav>`;
}
function legend(){return `<div class="movement-legend" aria-label="Chart movement key">${[['up','Up'],['down','Down'],['flat','No change'],['new','New'],['re','Re-entry']].map(([type,title])=>`<span class="rank-movement-${type}">${icon(type)} ${title}</span>`).join('')}</div>`;}
function chartTable(chart,kind,playback=false){
  return `<p class="table-scroll-note">Swipe the table for last week, peak and weeks on chart <span aria-hidden="true">↔</span></p><div class="ranking-table-scroll" role="region" aria-label="TurnTable ${kind} Top 100 table, scroll horizontally for all columns" tabindex="0"><table class="ranking-table"><caption class="sr-only">${e(chart.title||`TurnTable ${kind} Top 100`)} · ${e(chart.weekStart)} to ${e(chart.weekEnd)}</caption><thead><tr><th scope="col">#</th><th scope="col">${e(chart.entryLabel||(kind==='albums'?'Album / artist':'Song / artist'))}</th><th scope="col">Move</th><th scope="col">Last wk</th><th scope="col">Peak</th><th scope="col">Weeks</th></tr></thead><tbody>${chart.rows.map(([rank,title,artist,last,weeks,peak,status])=>`<tr data-chart-search="${e((title+' '+artist).toLocaleLowerCase())}" data-chart-movement="${require('../chart-model.js').movement(rank,last,status).type}"><td class="table-rank">${rank}</td><th scope="row" class="table-entry"><strong>${e(title)}</strong><small>${e(artist)}</small>${playback?playTrigger(cataloguePlayback.get(songKey(title,artist)),title+' by '+artist):''}</th><td>${badge(rank,last,status)}</td><td>${last>0?last:'—'}</td><td>${peak}</td><td>${weeks}</td></tr>`).join('')}</tbody></table></div>`;
}
function streamRows(rows){return rows.map((r,index)=>`<tr><td class="table-rank">${index+1}</td><th scope="row" class="table-entry"><button type="button" class="stream-pick" data-stream-id="${e(r.id)}">${e(r.title)}</button><small>${e(r.artist)}</small></th><td class="stream-total">${r.total.toLocaleString('en')}</td><td><span class="stream-daily">${r.daily===null?'—':`${icon('up')} +${r.daily.toLocaleString('en')}`}</span></td><td><a href="${e(r.source)}" target="_blank" rel="noopener noreferrer">${e(r.sourceDate||'Source')} ↗</a></td></tr>`).join('');}
module.exports={destinations,rankingNav,legend,chartTable,streamRows};
