// Phase 10: runs first in the build. Expands CSS bundles back into their source links so every
// renderer sees the page as authored; scripts/bundle-css.cjs bundles again at the end.
const fs=require('node:fs'),path=require('node:path');
const pages=[...fs.readdirSync('.').filter(f=>f.endsWith('.html')),...(fs.existsSync('touring')?fs.readdirSync('touring').filter(f=>f.endsWith('.html')).map(f=>path.join('touring',f)):[])];
for(const file of pages){const html=fs.readFileSync(file,'utf8');const out=html.replace(/<link rel="stylesheet" href="\/assets\/css\/[a-f0-9]+\.css" data-bundle="([^"]+)">/g,(m,list)=>list.split(',').map(h=>`<link rel="stylesheet" href="${h}">`).join(''));if(out!==html)fs.writeFileSync(file,out);}
