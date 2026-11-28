// Builds Heat 25 and the Current 100 extension into data/boards.json. The Current 50 is read-only here.
const fs=require('node:fs');
const Boards=require('../boards-model.js');
const read=file=>JSON.parse(fs.readFileSync(file,'utf8'));
const current=read('data/current.json'),ext=fs.existsSync('data/current-extension.json')?read('data/current-extension.json'):{candidates:[]};
const asOf=current.meta.lastRefreshAttemptAt||current.asOf,edition=String(asOf).slice(0,10);

// Candidate readings join the shared stream history so momentum can build week on week.
const historyFile=read('data/stream-history.json');
if(ext.checkedAt&&ext.candidates.length){
 const reading={capturedAt:ext.checkedAt,artists:Object.fromEntries(ext.candidates.filter(c=>Number.isFinite(c.streams?.daily)&&c.streams.source_date).map(c=>[c.slug,{dailySpotifyStreams:c.streams.daily,totalSpotifyStreams:c.streams.total??null,sourceDate:c.streams.source_date}]))};
 historyFile.snapshots=[...historyFile.snapshots.filter(s=>s.capturedAt!==reading.capturedAt),reading].sort((a,b)=>Date.parse(a.capturedAt)-Date.parse(b.capturedAt)).slice(-90);
 fs.writeFileSync('data/stream-history.json',JSON.stringify(historyFile));
}

const boardHistory=fs.existsSync('data/board-history.json')?read('data/board-history.json'):{editions:{}};
const priorKey=Object.keys(boardHistory.editions).filter(k=>k<edition).sort().at(-1),prior=priorKey?boardHistory.editions[priorKey]:{heat:[],extension:[]};
const releases=read('data/releases-2026.json');
const ctx={releases:[...releases.songs,...releases.albums],identities:read('data/release-identities.json').artists,chart:read('data/nigeria-top100.json'),events:fs.existsSync('data/editorial-events.json')?read('data/editorial-events.json'):[],concerts:fs.existsSync('data/touring.json')?read('data/touring.json').concerts:[]};

// Candidates are scored as of their own collection date (the weekly refresh collects both on the same day).
const extAsOf=ext.checkedAt&&Date.parse(ext.checkedAt)>Date.parse(asOf)?ext.checkedAt:asOf;
const extension=Boards.extension({candidates:ext.candidates,excluded:ext.excluded||[],current:current.artists,history:historyFile.snapshots,ctx,asOf:extAsOf,previous:prior.extension||[],hasFile:p=>fs.existsSync(String(p).replace(/^\//,''))});
const heat=Boards.heat(current.artists,{previous:prior.heat||[]});
const line=Boards.lineWatch(current.artists,extension.rows);
const heatExits=(prior.heat||[]).filter(s=>!heat.some(h=>h.slug===s));
const out={edition,asOf,generatedFrom:'data/current.json + data/current-extension.json',previousEdition:priorKey||null,
 heat:{rules:Boards.HEAT,rows:heat,exits:heatExits},
 extension:{rules:Boards.EXTENSION,asOf:extAsOf,candidatesCheckedAt:ext.checkedAt||null,rows:extension.rows,entries:extension.entries,exits:extension.exits,held:extension.held.map(({slug,name,reason})=>({slug,name,reason})),pendingIdentity:(ext.unmatched||[]).slice(0,40).map(({name,reason})=>({name,reason})),openPlaces:Math.max(0,Boards.EXTENSION.size-extension.rows.length),editorialMedian:extension.editorialMedian},
 line};
fs.writeFileSync('data/boards.json',JSON.stringify(out));
boardHistory.editions[edition]={heat:heat.map(h=>h.slug),extension:extension.rows.map(r=>r.slug)};
fs.writeFileSync('data/board-history.json',JSON.stringify(boardHistory,null,1));
const provisional=extension.rows.filter(r=>r.provisional).length;
console.log(`Boards · Heat ${heat.length} · Current 100 extension ${extension.rows.length} (${provisional} provisional, ${out.extension.openPlaces} open, ${extension.held.length} held) · promotion proposals ${line.proposals.length}`);
