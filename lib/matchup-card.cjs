const {escape:e}=require('./shared.cjs');
const {photoFor}=require('./player-card-photos.cjs');
module.exports=function matchupCard(pair,date){
 const portraits=pair.map((a,i)=>{
  const x=i*600,photo=photoFor(a);
  return `<g transform="translate(${x} 0)">${photo?`<image x="16" y="80" width="568" height="380" preserveAspectRatio="xMidYMid slice" href="${photo.dataUrl}"/>`:''}<text x="24" y="522" fill="#fff" font-size="46">${e(a.name)}</text><text x="24" y="582" fill="#d9f24a" font-size="36">#${a.rank} · ${a.score.toFixed(1)} PTS</text></g>`;
 }).join('');
 return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630"><rect width="1200" height="630" fill="#0b0b0c"/><g font-family="DejaVu Sans" font-weight="bold"><text x="24" y="50" fill="#fff" font-size="28">AFR/INDEX · CURRENT 50 MATCHUP · ${e(date)}</text>${portraits}</g></svg>`;
};
