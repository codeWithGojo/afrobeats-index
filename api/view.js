const {data,origin,escape:e,db}=require('../lib/shared.cjs');
module.exports=async(req,res)=>{
 const route=String(req.query.path||'studio').replace(/^\//,'');const [type,id]=route.split('/');
 let title='Afri Index · Explore',description='Your board, music receipts and the stories behind the chart.',image=origin+'/api/card?artist='+data.artists[0].slug;
 try{
  if(type==='boards'){const titles={'womens-current-25':'Women’s Current 25',veterans:'Veterans', 'featured-on':'Featured-on index',producers:'Producer credits index','local-vs-international':'Local vs international'};if(id&&!titles[id])return res.status(404).send('Board not found');title=(titles[id]||'Public boards')+' · Afri Index';description='Published Current scores, specialist views and source-linked evidence.';}
  if(type==='calendar'){if(id&&!['awards','live','certifications'].includes(id))return res.status(404).send('Calendar not found');title=(id==='live'?'Live dates':id==='certifications'?'Certifications':'Awards calendar')+' · Afri Index';}
  if(type==='account')title='My board · Afri Index';
  if(type==='receipt'){
   if(!/^[a-f0-9-]{36}$/.test(id||''))return res.status(404).send('Receipt not found');
   const list=await db(`receipts?id=eq.${id}&public=eq.true&select=id,payload,created_at`);if(!list.length){title='Private or unavailable receipt';description='Sign in to view a private receipt.';}else {
   title='Afri Index · Music Receipt';description=`${list[0].payload.artists?.map(a=>a.name).slice(0,5).join(', ')||'African music on repeat'}`;image=origin+`/api/receipt-image?id=${id}`;}
  }else if(type==='current'){
   const a=data.artists.find(a=>a.slug===id);if(!a)return res.status(404).send('Artist not found');title=`${a.name} · #${a.rank} Current · Afri Index`;description=a.bio||description;image=origin+'/api/card?artist='+a.slug;
  }else if(type==='u'){
   if(!/^[a-z0-9_]{3,30}$/.test(id||''))return res.status(404).send('Profile not found');
   const p=await db(`profiles?username=eq.${id}&select=username`);if(!p.length)return res.status(404).send('Profile unavailable');title=`@${id} · Afri Index`;
  }
  res.setHeader('Cache-Control',type==='receipt'?'no-store':'public,max-age=0,s-maxage=60');
  res.setHeader('Content-Type','text/html; charset=utf-8');res.send(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${e(title)}</title><meta name="description" content="${e(description)}"><meta property="og:title" content="${e(title)}"><meta property="og:description" content="${e(description)}"><meta property="og:image" content="${e(image)}"><meta property="og:url" content="${origin}/${e(route)}"><meta property="og:type" content="website"><meta name="twitter:card" content="summary_large_image"><link rel="stylesheet" href="/studio.css"><link rel="icon" href="/afr-index-favicon.svg"><link rel="manifest" href="/manifest.webmanifest"></head><body><header class="masthead"><a href="/">AFR / INDEX</a><span>AFRICAN MUSIC · THE INDEX</span><button id="command-open">Search /</button></header><nav aria-label="Explore"><a href="/discover">Discover</a><a href="/?tab=receipt">Music Receipt</a><a href="/studio/compare">Compare receipts</a><a href="/studio/group">Group receipt</a><a href="/account">My board</a><a href="/studio/sandbox">Weight sandbox</a><a href="/boards">Specialist boards</a><a href="/calendar/awards">Calendar</a><a href="/studio/tools">Tools</a></nav><main id="studio"><h1>${e(title)}</h1><p>Loading the index…</p></main><p id="studio-status" role="status"></p><dialog id="command-dialog"><form method="dialog"><button aria-label="Close search">Close</button></form><label for="command-input">Jump to an artist or view</label><input id="command-input" type="search" autocomplete="off"><div id="command-results"></div></dialog><script src="/studio.js" defer></script></body></html>`);
 }catch(err){res.status(503).send('This view is temporarily unavailable. Please retry.');}
};
