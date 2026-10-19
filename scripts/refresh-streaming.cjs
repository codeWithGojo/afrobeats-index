// One supported refresh pipeline for artist totals, albums, releases and TurnTable.
const {execFileSync}=require('node:child_process');
const root=require('node:path').resolve(__dirname,'..');
for(const script of ['scripts/research/audit-2026-releases.py','scripts/research/compile-2026-releases.py','scripts/research/refresh-turntable.py'])execFileSync('python3',[script],{cwd:root,stdio:'inherit'});
execFileSync(process.execPath,['scripts/build.cjs'],{cwd:root,stdio:'inherit'});
