// Share cards for boards (Current 50, Heat 25, Current 100): story 1080x1920 and OG 1200x630 SVG.
const fs=require('node:fs'),path=require('node:path');
const e=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const pct=r=>`${r>=1?'+':'-'}${Math.abs((r-1)*100).toFixed(0)}%`;
function rowsFor(board,data,boards){
 if(board==='heat')return {title:'HEAT 25',kicker:'FASTEST RISING THIS WEEK',rows:(boards?.heat?.rows||[]).slice(0,10).map(h=>({rank:h.heatRank,name:h.name,value:pct(h.ratio),sub:'Current #'+h.officialRank}))};
 if(board==='current-100')return {title:'CURRENT 100',kicker:'RANKS 51 TO 60 · NEXT UP',rows:(boards?.extension?.rows||[]).slice(0,10).map(r=>({rank:r.rank,name:r.name,value:r.score.toFixed(1),sub:r.provisional?'Not yet reviewed':r.country}))};
 return {title:'CURRENT 50',kicker:'THE TOP 10 THIS WEEK',rows:[...data.artists].sort((a,b)=>a.rank-b.rank).slice(0,10).map(a=>({rank:a.rank,name:a.name,value:Number(a.score).toFixed(1),sub:a.country}))};
}
function svg(board,data,{format='og'}={}){
 const boards=JSON.parse(fs.readFileSync(path.join(__dirname,'..','data','boards.json'),'utf8'));
 const {title,kicker,rows}=rowsFor(board,data,boards),story=format==='story',w=story?1080:1200,h=story?1920:630;
 const date=String(data.meta?.lastRefreshAttemptAt||data.asOf).slice(0,10),pad=story?84:48;
 const list=story?rows:rows.slice(0,5),top=story?520:190,rowH=story?118:78,name=story?44:30,small=story?26:18;
 const body=list.map((r,i)=>{const y=top+i*rowH;return `<g><text x="${pad}" y="${y}" font-size="${story?54:34}" font-weight="700" fill="${i<3?'#d9f24a':'#f5f6ef'}">${String(r.rank).padStart(2,'0')}</text><text x="${pad+(story?140:96)}" y="${y-(story?8:6)}" font-size="${name}" font-weight="700" fill="#f5f6ef">${e(r.name)}</text><text x="${pad+(story?140:96)}" y="${y+(story?30:20)}" font-size="${small}" fill="#a9b4ad">${e(r.sub||'')}</text><text x="${w-pad}" y="${y}" text-anchor="end" font-size="${story?46:30}" font-weight="700" fill="#d9f24a">${e(r.value)}</text><line x1="${pad}" x2="${w-pad}" y1="${y+(story?52:34)}" y2="${y+(story?52:34)}" stroke="#2a343b" stroke-width="2"/></g>`;}).join('');
 return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${e(title)} share card"><rect width="${w}" height="${h}" fill="#0b1014"/><circle cx="${w*.85}" cy="${story?260:60}" r="${story?420:260}" fill="#d9f24a" opacity=".07"/><g font-family="DejaVu Sans,Arial,sans-serif">
 <text x="${pad}" y="${story?120:56}" font-size="${story?40:24}" font-weight="700" fill="#d9f24a">AFR / INDEX</text><text x="${w-pad}" y="${story?120:56}" text-anchor="end" font-size="${story?26:18}" fill="#a9b4ad">${e(date)}</text>
 <text x="${pad}" y="${story?300:118}" font-size="${story?110:58}" font-weight="700" fill="#f5f6ef">${e(title)}</text><text x="${pad}" y="${story?370:156}" font-size="${story?30:18}" letter-spacing="3" fill="#a9b4ad">${e(kicker)}</text>
 ${body||`<text x="${pad}" y="${top}" font-size="${name}" fill="#a9b4ad">No entries yet</text>`}
 <text x="${pad}" y="${h-(story?90:24)}" font-size="${story?26:18}" fill="#a9b4ad">afrobeats-index.vercel.app/${board==='current'?'current':board} · a source behind every number</text></g></svg>`;
}
module.exports={svg,boards:['current','heat','current-100']};
