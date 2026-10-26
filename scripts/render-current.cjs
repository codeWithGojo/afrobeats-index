const fs=require('node:fs');
const view=require('../current-view.js');
const data=JSON.parse(fs.readFileSync('data/current.json','utf8'));
let html=fs.readFileSync('index.html','utf8');
function replaceSection(start,body){const from=html.indexOf(start);if(from<0)throw Error('Missing section '+start);const end=html.indexOf('</section>',from);if(end<0)throw Error('Unclosed section '+start);const openEnd=html.indexOf('>',from)+1;html=html.slice(0,openEnd)+'\n'+body+'\n    '+html.slice(end);}
replaceSection('<section class="index-hero"',view.hero(data.artists));
replaceSection('<section id="current"',view.chart(data.artists));
const schema={"@context":"https://schema.org","@type":"ItemList",name:'Afri Index Current 50',dateModified:data.asOf,itemListElement:view.ordered(data.artists).map(a=>({'@type':'ListItem',position:a.rank,name:a.name,url:`https://afrobeats-index.vercel.app/current/${a.slug}`}))};
html=html.replace(/\s*<script id="current-chart-schema"[\s\S]*?<\/script>/,'');
const checkedDate=require('../trust-model.js').formatDate(data.meta.lastRefreshAttemptAt||data.asOf);
html=html.replace(/(<[^>]+id="(?:live-update-label|premium-edition-label)"[^>]*>)[^<]*/,`$1Edition checked · ${checkedDate}`);
html=html.replace('</head>',`<script id="current-chart-schema" type="application/ld+json">${JSON.stringify(schema).replace(/</g,'\\u003c')}</script>\n</head>`);
fs.writeFileSync('index.html',html);
