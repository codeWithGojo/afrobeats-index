// Phase 9 SEO pass over static pages (idempotent). Runs after every renderer, before inject-polish.
// Adds JSON-LD (Organization/WebSite, ItemList, BreadcrumbList), fills missing OG/canonical tags,
// gives every indexable page one <h1>, marks utility pages noindex, then writes sitemap.xml and robots.txt.
const fs=require('node:fs');
const seo=require('../lib/seo.cjs'),{SITE}=seo;
const read=f=>JSON.parse(fs.readFileSync(f,'utf8'));
const current=read('data/current.json'),alltime=read('data/all-time.json'),genres=require('../genre-boards.js'),regions=require('../regional-boards.js');
const date=String(current.meta?.lastRefreshAttemptAt||current.asOf).slice(0,10);
const e=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const NOINDEX=new Set(['offline.html','quiz.html','underground.html','404.html','data-health.html']);
const RANKING=/^(current|current-100|heat|all-time|albums|releases|regions|net-worth|top100|top100-albums|streams|turntable.*|my-index)\.html$/;
const ranked=f=>({'current.html':['Current 50',[...current.artists].sort((a,b)=>a.rank-b.rank).map(a=>({position:a.rank,name:a.name,url:'/current/'+a.slug}))],
 'all-time.html':['All-Time 50',[...alltime.artists].filter(a=>Number.isFinite(a.rank)).sort((a,b)=>a.rank-b.rank).map(a=>({position:a.rank,name:a.name}))],
 'top100.html':['TurnTable Nigeria Top 100 songs',read('data/nigeria-top100.json').rows.map(r=>({position:r[0],name:`${r[1]} by ${r[2]}`}))],
 'top100-albums.html':['TurnTable Nigeria Top 100 albums',read('data/nigeria-albums-top100.json').rows.map(r=>({position:r[0],name:`${r[1]} by ${r[2]}`}))]})[f];

const pages=fs.readdirSync('.').filter(f=>f.endsWith('.html'));
for(const file of pages){
 let html=fs.readFileSync(file,'utf8');const before=html;
 html=html.replace(/<script type="application\/ld\+json" data-seo>[\s\S]*?<\/script>/g,'').replace(/<meta name="robots" content="noindex" data-seo>/g,'').replace(/<h1 class="sr-only" data-seo>[^<]*<\/h1>/g,'');
 if(NOINDEX.has(file)){html=html.replace('</head>','<meta name="robots" content="noindex" data-seo></head>');if(html!==before)fs.writeFileSync(file,html);continue;}
 const path='/'+(file==='index.html'?'':file.replace(/\.html$/,''));
 const title=(html.match(/<title>([^<]*)<\/title>/)||[])[1]||'AFR/INDEX',name=title.split(/ · |: /)[0].trim();
 const desc=(html.match(/<meta name="description" content="([^"]*)"/)||[])[1]||'';
 // Missing canonical/OG (for example /newsletter).
 if(!/<link rel="canonical"/.test(html))html=html.replace('</head>',`<link rel="canonical" href="${SITE}${path}"></head>`);
 if(!/property="og:title"/.test(html))html=html.replace('</head>',`<meta property="og:title" content="${e(title)}"><meta property="og:description" content="${e(desc)}"></head>`);
 if(!/property="og:image"/.test(html))html=html.replace('</head>',`<meta property="og:image" content="${SITE}/og.jpg"></head>`);
 if(!/property="og:url"/.test(html))html=html.replace('</head>',`<meta property="og:url" content="${SITE}${path}"><meta property="og:type" content="website"></head>`);
 if(!/name="twitter:card"/.test(html))html=html.replace('</head>','<meta name="twitter:card" content="summary_large_image"></head>');
 // One h1 per page; app-style pages get a visually hidden one that names the page.
 if(!/<h1[\s>]/.test(html))html=html.replace(/(<main\b[^>]*>)/,`$1<h1 class="sr-only" data-seo>${e(name)}</h1>`);
 const blocks=[];
 if(file==='index.html')blocks.push(seo.organization());
 else blocks.push(seo.breadcrumbs([['Home','/'],...(RANKING.test(file)&&file!=='rankings.html'?[['Rankings','/rankings']]:[]),[name,path]]));
 const list=ranked(file);if(list&&!/"@type":"ItemList"/.test(html))blocks.push(seo.itemList(list[0],path,list[1],date));
 html=html.replace('</head>',blocks.map(b=>seo.ld(b).replace('<script type="application/ld+json">','<script type="application/ld+json" data-seo>')).join('')+'</head>');
 if(html!==before)fs.writeFileSync(file,html);
}

// Sitemap from pages and data: static indexable pages, artist pages, boards and real compare pairs.
const sorted=[...current.artists].sort((a,b)=>a.rank-b.rank),urls=new Map();
const add=(loc,lastmod,priority)=>{if(!urls.has(loc))urls.set(loc,{lastmod,priority});};
add('/',date,'1.0');
for(const f of pages){if(NOINDEX.has(f)||f==='index.html')continue;const h=fs.readFileSync(f,'utf8'),c=(h.match(/<link rel="canonical" href="([^"]*)"/)||[])[1];if(!c||!c.startsWith(SITE))continue;const loc=c.slice(SITE.length)||'/';if(loc!=='/'+f.replace(/\.html$/,''))continue;add(loc,RANKING.test(f)?date:null,RANKING.test(f)?'0.8':'0.5');}
for(const a of sorted)add('/current/'+a.slug,date,'0.7');
for(const b of [...regions.definitions,...genres.published(current.artists)])add('/boards/'+b.id,date,'0.6');
for(const id of ['womens-current-25','veterans','featured-on','producers'])add('/boards/'+id,date,'0.5');
// Compare pairs with real interest: chart neighbours in the top 20, and the biggest explicit collaborations.
for(let i=0;i<Math.min(20,sorted.length)-1;i++)add(`/vs/${sorted[i].slug}/${sorted[i+1].slug}`,date,'0.5');
const inChart=new Set(sorted.map(a=>a.slug));
for(const c of [...(current.featureCredits||[])].sort((a,b)=>b.streams-a.streams)){const g=c.guests.find(s=>s!==c.owner&&inChart.has(s));if(g&&inChart.has(c.owner)){const pair=[c.owner,g].sort();add(`/vs/${pair[0]}/${pair[1]}`,date,'0.5');}if([...urls.keys()].filter(k=>k.startsWith('/vs/')).length>=40)break;}
fs.writeFileSync('sitemap.xml',`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${[...urls].map(([loc,{lastmod,priority}])=>`<url><loc>${SITE}${loc}</loc>${lastmod?`<lastmod>${lastmod}</lastmod>`:''}<priority>${priority}</priority></url>`).join('\n')}\n</urlset>\n`);
fs.writeFileSync('robots.txt',`User-agent: *\nAllow: /\nAllow: /api/card\nDisallow: /api/\nDisallow: /account\nDisallow: /studio/api\nDisallow: /data-health\n\nSitemap: ${SITE}/sitemap.xml\n`);
console.log(`SEO · structured data on ${pages.length} pages · sitemap ${urls.size} URLs`);
