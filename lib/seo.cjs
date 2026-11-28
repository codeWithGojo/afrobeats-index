// Structured data and crawlable internal links (Phase 9). Shared by the static build and api/view.
const SITE='https://afrobeats-index.vercel.app';
const e=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const ld=obj=>`<script type="application/ld+json">${JSON.stringify(obj).replace(/</g,'\\u003c')}</script>`;
const abs=u=>/^https?:/.test(u)?u:SITE+(u.startsWith('/')?u:'/'+u);

const organization=()=>({'@context':'https://schema.org','@graph':[
 {'@type':'Organization','@id':SITE+'/#org',name:'AFR/INDEX',alternateName:'Afri Index',url:SITE+'/',logo:SITE+'/assets/icon-512.png',description:'A weekly ranking of the artists shaping African music, with a source behind every number.'},
 {'@type':'WebSite','@id':SITE+'/#site',name:'AFR/INDEX',url:SITE+'/',publisher:{'@id':SITE+'/#org'},inLanguage:'en'}]});
const breadcrumbs=items=>({'@context':'https://schema.org','@type':'BreadcrumbList',itemListElement:items.map(([name,url],i)=>({'@type':'ListItem',position:i+1,name,item:abs(url)}))});
const itemList=(name,url,rows,date)=>({'@context':'https://schema.org','@type':'ItemList',name,url:abs(url),...(date?{dateModified:date}:{}),numberOfItems:rows.length,itemListOrder:'https://schema.org/ItemListOrderAscending',itemListElement:rows.map((r,i)=>({'@type':'ListItem',position:r.position??i+1,name:r.name,...(r.url?{url:abs(r.url)}:{})}))});
// MusicGroup is the schema.org type for a performing music act (solo or group).
function artist(a){
 const sameAs=[a.spotifyUrl,a.evidence?.biography?.url].filter(u=>/^https:\/\//.test(u||''));
 return {'@context':'https://schema.org','@type':'MusicGroup','@id':`${SITE}/current/${a.slug}#artist`,name:a.name,url:`${SITE}/current/${a.slug}`,
  ...(a.image?{image:abs(a.image)}:{}),...(a.bio?{description:a.bio}:{}),genre:(a.genres||[]).map(g=>g.toLowerCase()),
  ...(a.country?{foundingLocation:{'@type':'Country',name:String(a.country).split(/\s*\/\s*/)[0]}}:{}),
  ...(Number.isInteger(a.careerStarted)?{foundingDate:String(a.careerStarted)}:{}),...(sameAs.length?{sameAs}:{})};
}

/* Related links for an artist page, crawlable without JavaScript: collaborators from explicit feature
   credits, chart neighbours (with compare links) and the boards the artist appears on. */
function related(a,data,boards=[]){
 const bySlug=new Map(data.artists.map(x=>[x.slug,x])),seen=new Map();
 for(const c of data.featureCredits||[]){
  const others=c.owner===a.slug?c.guests:c.guests.includes(a.slug)?[c.owner,...c.guests.filter(g=>g!==a.slug)]:[];
  for(const s of others)if(s!==a.slug&&bySlug.has(s)){const r=seen.get(s)||{artist:bySlug.get(s),songs:[]};if(r.songs.length<2)r.songs.push(c.title);seen.set(s,r);}
 }
 const collaborators=[...seen.values()].sort((x,y)=>x.artist.rank-y.artist.rank).slice(0,8);
 const sorted=[...data.artists].sort((x,y)=>x.rank-y.rank),i=sorted.findIndex(x=>x.slug===a.slug),neighbours=[sorted[i-1],sorted[i+1]].filter(Boolean);
 const myBoards=boards.filter(b=>b.has(a));
 return `<nav class="seo-related" aria-labelledby="related-${e(a.slug)}"><h2 id="related-${e(a.slug)}">Related on AFR/INDEX</h2>
 ${collaborators.length?`<h3>Collaborators</h3><ul>${collaborators.map(({artist:x,songs})=>`<li><a href="/current/${e(x.slug)}">${e(x.name)}</a> <small>${songs.map(e).join(', ')}</small> · <a href="/vs/${e(a.slug)}/${e(x.slug)}">Compare</a></li>`).join('')}</ul>`:''}
 <h3>Next to them on the Current 50</h3><ul>${neighbours.map(x=>`<li><a href="/current/${e(x.slug)}">#${x.rank} ${e(x.name)}</a> · <a href="/vs/${e(a.slug)}/${e(x.slug)}">${e(a.name)} vs ${e(x.name)}</a></li>`).join('')}</ul>
 ${myBoards.length?`<h3>Boards</h3><ul>${myBoards.map(b=>`<li><a href="/boards/${e(b.id)}">${e(b.name)}</a></li>`).join('')}</ul>`:''}
 <p><a href="/current">Current 50</a> · <a href="/heat">Heat 25</a> · <a href="/current-100">Current 100</a> · <a href="/method">How the score works</a></p></nav>`;
}
module.exports={SITE,ld,organization,breadcrumbs,itemList,artist,related,abs};
