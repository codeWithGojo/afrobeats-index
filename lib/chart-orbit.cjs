const {escape:e}=require('./shared.cjs');
const {ordered,movement}=require('../current-view.js');
function photo(artist) {
  return artist.slug==='davido'?'/davido.jpg':'/artists/'+artist.slug+'.webp';
}
function pose(index,count) {
  const angle=index*2*Math.PI/count+.35;
  const depth=(1+Math.sin(angle))/2;
  return `--x:${(Math.cos(angle)*41).toFixed(2)}%;--y:${(Math.sin(angle)*19).toFixed(2)}%;--s:${(.62+.42*depth).toFixed(3)};--z:${Math.round(depth*90)};--a:${(.45+.55*depth).toFixed(2)}`;
}
function scene(edition) {
  const artists=ordered(edition.artists).slice(0,10);
  const stamp=new Intl.DateTimeFormat('en-GB',{day:'2-digit',month:'short',year:'numeric',timeZone:'Africa/Lagos'}).format(new Date(edition.asOf));
  return `<section class="orbit" aria-labelledby="orbit-title"><div class="orbit-stage">
    <div class="orbit-head"><p>AFR/INDEX · THE LIVING AFROBEATS INDEX</p><h1 id="orbit-title">The sound moves.<br>We keep track.</h1>
    <div class="orbit-actions"><a href="/current">Explore the Current 50 <span aria-hidden="true">↗</span></a><a href="/music-receipt">Make your receipt</a></div></div>
    <div class="orbit-art" aria-hidden="true"><div class="orbit-light"></div><div class="orbit-track"></div>
    <div class="orbit-phone"><i></i><small>AFR/INDEX</small><strong>Current 50</strong><div class="phone-window"><div class="phone-list">${artists.map(a=>`<div><b>${String(a.rank).padStart(2,'0')}</b><img src="${e(photo(a))}" width="24" height="28" alt="" loading="lazy"><span>${e(a.name)}</span><em>${a.score.toFixed(1)}</em>${movement(a)}</div>`).join('')}</div></div></div>
    ${artists.map((a,i)=>`<div class="orbit-slot" style="${pose(i,artists.length)};${i<5?pose(i,5).replaceAll('--','--m-'):''}"><div class="orbit-card"><span class="orbit-initial">${e(a.name[0])}</span><img src="${e(photo(a))}" alt="" width="180" height="208" loading="${i<5?'eager':'lazy'}" decoding="async"><small>#${String(a.rank).padStart(2,'0')}</small><b>${e(a.name)}</b></div></div>`).join('')}</div>
    <div class="orbit-foot"><span>Current 50</span><time datetime="${e(edition.asOf)}">${stamp}</time></div></div></section>`;
}
module.exports={scene,photo};
