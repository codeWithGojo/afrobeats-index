// One supported refresh pipeline for artist totals, albums, releases and TurnTable.
const {execFileSync}=require('node:child_process');
const fs=require('node:fs');
const root=require('node:path').resolve(__dirname,'..');
const published=JSON.parse(fs.readFileSync(root+'/data/current.json','utf8'));
for(const script of ['scripts/research/audit-2026-releases.py','scripts/research/compile-2026-releases.py','scripts/research/refresh-turntable.py'])execFileSync('python3',[script],{cwd:root,stdio:'inherit'});
const checked=JSON.parse(fs.readFileSync(root+'/data/releases-2026-sources.json','utf8')).checked_at;
const dateKey=value=>new Intl.DateTimeFormat('en-CA',{timeZone:'Africa/Lagos',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(value));
if(dateKey(published.asOf)!==dateKey(checked))fs.writeFileSync(root+'/data/previous-ranking.json',JSON.stringify({asOf:published.asOf,artists:published.artists.map(({slug,name,rank,score,scoreBreakdown})=>({slug,name,rank,score,scoreBreakdown}))},null,2)+'\n');
execFileSync(process.execPath,['scripts/finalize-refresh.cjs'],{cwd:root,stdio:'inherit'});
execFileSync(process.execPath,['scripts/build.cjs'],{cwd:root,stdio:'inherit'});
