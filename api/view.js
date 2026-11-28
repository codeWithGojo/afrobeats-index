const {shellHeader,bottomNav,headLinks,sitemap} = require('../lib/ui-shell.cjs');
const regionalBoards=require('../regional-boards.js'),genreBoards=require('../genre-boards.js'),seo=require('../lib/seo.cjs');
const {data,origin,escape:e,db}=require('../lib/shared.cjs');
module.exports=async(req,res)=>{
 const route=String(req.query.path||'studio').replace(/^\//,'');const [type,id]=route.split('/');
 if(type==='touring'||route==='studio/touring'){
  const section=route==='studio/touring'?'admin':route.slice(8),[kind,slug,...extra]=section.split('/');let recordTitle='';
  if(slug){
   if(extra.length||!['artists','concerts','tours'].includes(kind)||!/^[-a-z0-9]{1,120}$/.test(slug))return res.status(404).send('Touring record not found');
   try{const pub=await require('../lib/product-touring.cjs').loadPublic();const record=kind==='artists'?pub.artists.find(a=>a.slug===slug):kind==='tours'?pub.dataset.tours.find(t=>t.slug===slug):pub.dataset.concerts.find(c=>c.id===slug);if(!record)return res.status(404).send('Touring record not found');recordTitle=record.name||record.title||'Concert details';}catch{return res.status(503).send('Touring could not load. Please retry.');}
  }
  const html=require('../lib/touring-view.cjs').render(section,recordTitle);if(!html)return res.status(404).send('Touring page not found');res.setHeader('Content-Type','text/html; charset=utf-8');res.setHeader('Cache-Control',section==='admin'?'no-store':'public,max-age=0,s-maxage=60');return res.send(html);
 }
 let initial='',history='',structured='';
 let title='Afri Index · Explore',description='Your board, music receipts and the stories behind the chart.',image=origin+'/api/card?artist='+data.artists[0].slug;
 try{
  if(type==='boards'){const genres=genreBoards.published(data.artists);const titles={'womens-current-25':'Women’s Current 25',veterans:'Veterans', 'featured-on':'Featured-on index',producers:'Producer credits index','local-vs-international':'Local vs international',...Object.fromEntries(regionalBoards.definitions.map(board=>[board.id,board.name])),...Object.fromEntries(genres.map(board=>[board.id,board.name]))};if(id&&!Object.hasOwn(titles,id))return res.status(404).send('Board not found');title=(titles[id]||'Public boards')+' · AFR/INDEX';description='Published Current scores, specialist views and source-linked evidence.';
   // Country, region and genre boards are server-rendered so crawlers see the ranked list without JavaScript.
   const region=regionalBoards.definitions.find(b=>b.id===id),genre=genres.find(b=>b.id===id),def=region||genre;
   if(def){const list=region?regionalBoards.rank(data.artists,id):genreBoards.rank(data.artists,id),date=data.asOf.slice(0,10);
    title=region?`${def.name} · AFR/INDEX`:`${def.name} genre board · AFR/INDEX`;description=`${list.length} ${def.name} artists in the Current 50 this week, in official order: ${list.slice(0,5).map(a=>a.name).join(', ')}.`;
    initial=`<h1>${e(def.name)} board</h1><p>${e(def.description)} Edition ${e(date)}.</p><ol class="seo-board">${list.map(a=>`<li><a href="/current/${e(a.slug)}">${e(a.name)}</a> <small>Current #${a.globalRank} · ${a.score.toFixed(1)} pts · ${e(a.country)}</small></li>`).join('')}</ol><nav class="seo-related" aria-label="Other boards"><h2>Other boards</h2><ul>${[...regionalBoards.definitions,...genres].filter(b=>b.id!==id).map(b=>`<li><a href="/boards/${e(b.id)}">${e(b.name)}</a></li>`).join('')}</ul></nav>`;
    structured=seo.ld(seo.itemList(def.name+' board',`/boards/${id}`,list.map(a=>({position:a.boardRank,name:a.name,url:'/current/'+a.slug})),data.asOf))+seo.ld(seo.breadcrumbs([['Home','/'],['Rankings','/rankings'],['Boards','/boards'],[def.name,'/boards/'+id]]));
   }else structured=seo.ld(seo.breadcrumbs([['Home','/'],['Rankings','/rankings'],['Boards','/boards'],...(id?[[titles[id],'/boards/'+id]]:[])]));
  }
  if(type==='calendar'){if(id&&!['awards','live','certifications'].includes(id))return res.status(404).send('Calendar not found');title=(id==='live'?'Live dates':id==='certifications'?'Certifications':'Awards calendar')+' · AFR/INDEX';}
  if(type==='account')title='My board · AFR/INDEX';
  if(type==='studio'){const studioTitles={compare:'Receipt comparison',group:'Group receipt',streams:'Across platforms',sandbox:'Weight sandbox',tools:'Exports & tools',predictions:'Predictions',analytics:'Analytics',playlists:'Playlists',summer:'Song of the Summer',signals:'Signals',newsletter:'Newsletter',api:'Pro & API',graph:'Collaborations'};if(Object.hasOwn(studioTitles,id))title=studioTitles[id]+' · AFR/INDEX';}
  if(type==='receipt'){
   if(!/^[a-f0-9-]{36}$/.test(id||''))return res.status(404).send('Receipt not found');
   const list=await db(`receipts?id=eq.${id}&public=eq.true&select=id,payload,created_at`);if(!list.length){title='Private or unavailable receipt';description='Sign in to view a private receipt.';}else {
   title='Afri Index · Music Receipt';description=`${list[0].payload.artists?.map(a=>a.name).slice(0,5).join(', ')||'African music on repeat'}`;image=origin+`/api/receipt-image?id=${id}`;}
  }else if(type==='current'){
   const a=data.artists.find(a=>a.slug===id);if(!a)return res.status(404).send('Artist not found');title=`${a.name} · #${a.rank} Current · AFR/INDEX`;description=a.bio||description;image=origin+'/api/card?artist='+a.slug;
   initial=require('../artist-presentation.js').header(a,data);
   history=require('../lib/artist-editions.cjs').history(a,data);
   const boards=[...regionalBoards.definitions.map(b=>({id:b.id,name:b.name,has:x=>regionalBoards.rank(data.artists,b.id).some(r=>r.slug===x.slug)})),...genreBoards.published(data.artists).map(b=>({id:b.id,name:b.name,has:x=>genreBoards.has(x,b)}))];
   initial+=seo.related(a,data,boards);
   structured=seo.ld(seo.artist(a))+seo.ld(seo.breadcrumbs([['Home','/'],['Current 50','/current'],[a.name,'/current/'+a.slug]]));
  }else if(type==='vs'){
   const slugs=route.split('/').slice(1),pair=slugs.map(slug=>data.artists.find(a=>a.slug===slug));
   if((pair.length<2||pair.length>3)||pair.some(a=>!a))return res.status(404).send('Matchup not found');
   title=pair.map(a=>a.name).join(' vs ')+' · AFR/INDEX';
   description=pair.map(a=>a.name+' #'+a.rank+' · '+a.score.toFixed(1)+' points').join(' vs ')+'. Current 50 edition '+data.asOf.slice(0,10)+'.';
   image=origin+'/api/card?artist='+pair[0].slug+'&opponent='+pair[1].slug+'&edition='+data.asOf.slice(0,10);
   initial=`<h1>${e(title)}</h1><p>${e(description)}</p>`+require('../artist-presentation.js').comparison(pair)+`<p>${pair.map(a=>`<a href="/current/${e(a.slug)}">${e(a.name)} profile</a>`).join(' · ')} · <a href="/compare">Compare other artists</a></p>`;
   structured=seo.ld(seo.breadcrumbs([['Home','/'],['Compare','/compare'],[pair.map(a=>a.name).join(' vs '),'/'+route]]));

  }else if(type==='u'){
   if(!/^[a-z0-9_]{3,30}$/.test(id||''))return res.status(404).send('Profile not found');
   const p=await db(`profiles?username=eq.${id}&select=username`);if(!p.length)return res.status(404).send('Profile unavailable');title=`@${id} · AFR/INDEX`;
  }
  res.setHeader('Cache-Control',type==='receipt'?'no-store':'public,max-age=0,s-maxage=60');
  res.setHeader('Content-Type','text/html; charset=utf-8');res.send(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${e(title)}</title><meta name="description" content="${e(description)}"><link rel="canonical" href="${origin}/${e(route)}"><meta property="og:title" content="${e(title)}"><meta property="og:description" content="${e(description)}"><meta property="og:image" content="${e(image)}"><meta property="og:url" content="${origin}/${e(route)}"><meta property="og:type" content="website"><meta name="twitter:card" content="summary_large_image"><link rel="stylesheet" href="/motion.css"><link rel="stylesheet" href="/studio.css"><link rel="stylesheet" href="/afri-ui.css"><script src="/afri-ui.js" defer></script><link rel="stylesheet" href="/share-sheet.css"><script src="/share-sheet.js" defer></script><link rel="icon" href="/afr-index-favicon.svg"><link rel="manifest" href="/manifest.webmanifest"><link rel="stylesheet" href="/install-app.css">${headLinks()}${structured}</head><body data-design="premium">${shellHeader()}<main id="studio">${initial?`<div data-published>${initial}</div>`:`<h1>${e(title)}</h1><p data-motion-loader>Loading the index…</p>`}</main>${history}<p id="studio-status" role="status"></p><dialog id="command-dialog"><form method="dialog"><button aria-label="Close search">Close</button></form><label for="command-input">Jump to an artist or view</label><input id="command-input" type="search" autocomplete="off"><div id="command-results"></div></dialog><script src="/artist-presentation.js" defer></script><script src="/studio.js" defer></script><script src="/install-app.js" defer></script><footer>${sitemap()}</footer>${bottomNav()}</body></html>`);
 }catch(err){res.status(503).send('This view is temporarily unavailable. Please retry.');}
};
