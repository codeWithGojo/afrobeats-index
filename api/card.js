const {Resvg}=require('@resvg/resvg-js'),path=require('node:path');
const {data}=require('../lib/shared.cjs'),card=require('../player-card.js');
const {photoFor}=require('../lib/player-card-photos.cjs');
const boardCard=require('../lib/board-card.cjs'),cert=require('../certifications.js');
const e=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
// Tier-styled certification strip under the story card: counts per tier, in tier colours.
const TIERS=[['diamond','DIAMOND','#b9f2ff'],['multi','MULTI-PLATINUM','#e5e4e2'],['platinum','PLATINUM','#d7d7d7'],['gold','GOLD','#e6c35c']];
function certStrip(slug,w){
 const records=(data.certifications||{})[slug]||[];if(!records.length)return '';
 const counts=TIERS.map(([t,label,colour])=>({label,colour,n:records.filter(c=>cert.tier(c)===t).length})).filter(x=>x.n);if(!counts.length)return '';
 // Sits between the movement pill (ends near y=1496) and the snapshot line (y=1625).
 const bw=200,gap=16,total=counts.length*bw+(counts.length-1)*gap,x0=(w-total)/2,y=1518;
 return `<g font-family="DejaVu Sans,Arial,sans-serif">${counts.map((c,i)=>{const x=x0+i*(bw+gap);return `<rect x="${x}" y="${y}" width="${bw}" height="72" rx="14" fill="none" stroke="${c.colour}" stroke-width="2.5"/><text x="${x+bw/2}" y="${y+38}" text-anchor="middle" font-size="32" font-weight="700" fill="${c.colour}">${c.n}</text><text x="${x+bw/2}" y="${y+60}" text-anchor="middle" font-size="14" letter-spacing="2" fill="${c.colour}">${e(c.label)}</text>`;}).join('')}</g>`;
}
const render=svg=>new Resvg(svg,{font:{fontFiles:[path.join(process.cwd(),'assets/DejaVuSans.ttf')],loadSystemFonts:false}}).render().asPng();
module.exports=(req,res)=>{
 if(req.method&&req.method!=='GET')return res.status(405).end();
 const format=req.query.format==='story'?'story':'og';
 // Board cards: /api/card?board=current|heat|current-100&format=story|og
 if(req.query.board){
  if(!boardCard.boards.includes(req.query.board))return res.status(404).end();
  try{const png=render(boardCard.svg(req.query.board,data,{format}));res.setHeader('Content-Type','image/png');res.setHeader('Cache-Control','public,max-age=0,s-maxage=3600');return res.end(png);}catch{console.error('Board card render failed:',req.query.board);return res.status(500).end();}
 }
 const slug=req.query.artist,artist=data.artists.find(a=>a.slug===slug);if(!artist)return res.status(404).end();const rival=req.query.opponent?data.artists.find(a=>a.slug===req.query.opponent):null;
 if(req.query.opponent&&!rival)return res.status(404).end();
 try{
  let svg=rival?require("../lib/matchup-card.cjs")([artist,rival],data.asOf.slice(0,10)):card.svg(slug,data,{format,photo:photoFor(artist),context:req.query.context==='wrapped'?'YOUR TOP ARTIST':''});
  if(!rival&&format==='story')svg=svg.replace(/<\/svg>\s*$/,certStrip(slug,1080)+'</svg>');
  const png=render(svg);res.setHeader('Content-Type','image/png');res.setHeader('Cache-Control','public,max-age=0,s-maxage=3600');res.end(png);
 }catch{console.error('Artist card render failed:',artist.slug);res.status(500).end();}
};
module.exports.certStrip=certStrip;
