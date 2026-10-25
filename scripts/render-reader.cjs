// Search metadata only; official artist data and ranking positions remain untouched.
const fs=require('node:fs');
let html=fs.readFileSync('index.html','utf8');
const start=html.indexOf('<!-- ALL-TIME -->'),end=html.indexOf('<!--',start+15);
let section=html.slice(start,end);const chunks=section.split('\n    <div class="flex items-center');
const records=[];
for(let i=1;i<chunks.length;i++){
 const name=chunks[i].match(/<h3[^>]*>(.*?)<\/h3>/)?.[1];if(!name)continue;
 const slug=name.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,''),id='legend-'+slug;
 if(!/^\s[^>]*\bid=/.test(chunks[i]))chunks[i]=chunks[i].replace(/^([^>]*)(>)/,`$1 id="${id}"$2`);
 const keywords=chunks[i].slice(chunks[i].indexOf('>')+1).replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').slice(0,700);
 for(const title of name.split(' · '))records.push({title,path:'/?tab=alltime#'+id,keywords,kind:'All-Time artist'});
}
section=chunks.join('\n    <div class="flex items-center');
html=html.slice(0,start)+section+html.slice(end);fs.writeFileSync('index.html',html);
fs.writeFileSync('data/alltime-search.json',JSON.stringify(records));
