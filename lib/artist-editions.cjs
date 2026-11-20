const archive=require('../data/current-editions.json');
const {escape:e}=require('./shared.cjs');
function history(artist,edition){
  const currentDate=edition.asOf.slice(0,10);
  const dates=[...new Set([...Object.keys(archive),currentDate])].sort();
  const rows=dates.map(date=>({date,entry:date===currentDate?[artist.rank,artist.score]:archive[date][artist.slug]}));
  const known=rows.filter(row=>row.entry);
  if(known.length<2)return '<section class="artist-history panel"><h2>Rank history</h2><p>One or fewer saved editions cover this artist.</p></section>';
  const start=Date.parse(dates[0]),span=Date.parse(dates.at(-1))-start;
  let previous;
  const plot=rows.map(({date,entry})=>{
    if(!entry){previous=null;return '';}
    const time=Date.parse(date);
    const x=36+250*(time-start)/span,y=12+68*(entry[0]-1)/49;
    const line=previous&&time-previous.time<=8*86400000?`<line x1="${previous.x}" y1="${previous.y}" x2="${x}" y2="${y}" stroke="currentColor" stroke-width="2"/>`:'';
    previous={time,x,y};
    return line+`<circle cx="${x}" cy="${y}" r="3" fill="currentColor"><title>${date} · #${entry[0]}</title></circle>`;
  }).join('');
  const graph=`<svg viewBox="0 0 300 108" role="img" aria-label="Weekly published ranks of ${e(artist.name)}. Values appear in the table below."><g fill="currentColor" font-size="9"><text x="0" y="15">#1</text><text x="0" y="82">#50</text><text x="32" y="99">${dates[0]}</text><text x="290" y="99" text-anchor="end">${dates.at(-1)}</text></g>${plot}</svg>`;
  const body=rows.map(({date,entry},i)=>{
    const prev=rows[i-1],gap=prev&&(Date.parse(date)-Date.parse(prev.date))/86400000>8;
    const delta=entry&&prev?.entry&&!gap?prev.entry[0]-entry[0]:null;
    const movement=delta===null?'—':delta>0?'Up '+delta:delta<0?'Down '+(-delta):'Held';
    return (gap?'<tr><td colspan="4">Gap in saved weekly editions</td></tr>':'')+`<tr><th scope="row"><time datetime="${date}">${date}</time></th><td>${entry?'#'+entry[0]:'Unlisted'}</td><td>${movement}</td><td>${entry?entry[1].toFixed(1):'—'}</td></tr>`;
  }).join('');
  return `<section class="artist-history panel"><h2>Weekly rank history</h2><p>Peak in saved editions: #${Math.min(...known.map(r=>r.entry[0]))}</p>${graph}<table><caption>${e(artist.name)} · published Current 50 editions</caption><thead><tr><th>Edition</th><th>Rank</th><th>Movement</th><th>Score</th></tr></thead><tbody>${body}</tbody></table></section>`;
}
module.exports={history};
