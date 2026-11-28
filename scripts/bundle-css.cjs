// Phase 10: one render-blocking stylesheet per page instead of ~20. Runs last in the build.
// Each page's local <head> stylesheets (in order) are concatenated into assets/css/<hash>.css, with
// local @import rules inlined. The bundle link keeps its source list in data-bundle, so every rebuild
// expands it back and rebuilds from current CSS: bundles never go stale.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const OUT='assets/css';fs.mkdirSync(OUT,{recursive:true});
const pages=[...fs.readdirSync('.').filter(f=>f.endsWith('.html')),...(fs.existsSync('touring')?fs.readdirSync('touring').filter(f=>f.endsWith('.html')).map(f=>path.join('touring',f)):[])];
// Root-relative links, plus plain relative ones on root-level pages (where they resolve to the same path).
const local=(href,rootPage)=>(/^\/[a-z0-9/_.-]+\.css$/i.test(href)||(rootPage&&/^[a-z0-9][a-z0-9/_.-]*\.css$/i.test(href)))&&!/^\/?assets\/css\//.test(href);
const abs=href=>href.startsWith('/')?href:'/'+href;
function inline(file,seen=new Set()){
 if(seen.has(file))return '';seen.add(file);
 const css=fs.readFileSync(file.replace(/^\//,''),'utf8');
 return css.replace(/@import\s+url\((["']?)(\/[^"')]+\.css)\1\)\s*;?/g,(m,q,href)=>fs.existsSync(href.slice(1))?inline(href,seen):m);
}
const used=new Set();let pagesDone=0;
for(const file of pages){
 let html=fs.readFileSync(file,'utf8');const before=html;
 // Expand a previous bundle back into its source links.
 html=html.replace(/<link rel="stylesheet" href="\/assets\/css\/[a-f0-9]+\.css" data-bundle="([^"]+)">/g,(m,list)=>list.split(',').map(h=>`<link rel="stylesheet" href="${h}">`).join(''));
 const headEnd=html.indexOf('</head>');if(headEnd<0)continue;
 const head=html.slice(0,headEnd);
 const rootPage=!file.includes(path.sep)&&!file.includes('/');
 const links=[...head.matchAll(/<link rel="stylesheet" href="([^"]+)">/g)].filter(m=>local(m[1],rootPage)&&fs.existsSync(abs(m[1]).slice(1)));
 // Keep the cascade: only links with no inline <style> or other stylesheet between them are merged.
 const styleAt=[...head.matchAll(/<style\b|<link rel="stylesheet"/g)].map(m=>m.index);
 const runs=[];let run=[];
 for(const m of links){const prev=run.at(-1);const between=prev?styleAt.filter(i=>i>prev.index&&i<m.index&&!links.some(l=>l.index===i)):[];if(prev&&between.length){runs.push(run);run=[];}run.push(m);}
 if(run.length)runs.push(run);
 let newHead=head;
 for(const group of runs){
  if(group.length<2)continue;
  const hrefs=group.map(m=>abs(m[1])),css=hrefs.map(h=>`/* ${h} */\n`+inline(h)).join('\n');
  const name=crypto.createHash('sha1').update(css).digest('hex').slice(0,12)+'.css';
  if(!fs.existsSync(path.join(OUT,name)))fs.writeFileSync(path.join(OUT,name),css);used.add(name);
  let first=true;for(const m of group){newHead=newHead.replace(m[0],first?`<link rel="stylesheet" href="/assets/css/${name}" data-bundle="${hrefs.join(',')}">`:'');first=false;}
 }
 html=newHead+html.slice(headEnd);
 if(html!==before){fs.writeFileSync(file,html);pagesDone++;}
}
// Remove bundles no page uses any more.
for(const f of fs.readdirSync(OUT))if(f.endsWith('.css')&&!used.has(f))fs.unlinkSync(path.join(OUT,f));
console.log(`CSS bundles · ${used.size} bundles across ${pagesDone} pages`);
