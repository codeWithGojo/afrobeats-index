const fs=require('fs'),vm=require('vm');
const text=fs.readFileSync('assets/inline-07.js','utf8');
const state=JSON.parse(text.match(/window\.AFRI_EMBEDDED_STATE=(\{.*?\});/s)[1]);
const c={window:{AFRI_EMBEDDED_STATE:state},URL,document:{querySelectorAll:()=>[],querySelector:()=>null},console};vm.createContext(c);
vm.runInContext(fs.readFileSync('assets/inline-03.js','utf8'),c);
for(const file of ['assets/inline-04.js','assets/inline-11.js','assets/inline-12.js'])vm.runInContext(fs.readFileSync(file,'utf8'),c);
const date=state.artists.map(a=>a.statsLastUpdatedAt).filter(Boolean).sort().at(-1);
// Derived artifact only: source remains the existing artist database.
const data={asOf:date,meta:state.meta,artists:state.artists,weights:[15,13,11,11,8,8,6,6,5,10,7],factorNames:['Impact & legacy','Global reach','Discography','Commercial power','Awards','Cultural influence','Longevity','Live performance','Feature impact','Total Spotify streams','Monthly listeners']};
data.recognition=c.window.AFRI_RECOGNITION||{};
data.site={...state};delete data.site.artists;
data.certifications=state.certifications||{};
data.awards=state.awards||{};
data.performances=state.performances||{};
const evidence=fs.existsSync('data/artist-evidence.json')?JSON.parse(fs.readFileSync('data/artist-evidence.json','utf8')):[];
const bios=new Map(evidence.filter(x=>!x.error).map(x=>[x.artist_slug,x]));
const maxima=[Math.max(...data.artists.map(a=>a.totalSpotifyStreams||0)),Math.max(...data.artists.map(a=>a.monthlyListeners||0))];
for(const a of data.artists){const b=bios.get(a.slug);if(b){a.gender=b.gender;a.careerStarted=b.career_started;a.evidence=b.evidence;}a.components=Array(9).fill(null).concat([a.totalSpotifyStreams?100*a.totalSpotifyStreams/maxima[0]:null,a.monthlyListeners?100*a.monthlyListeners/maxima[1]:null]);}
data.componentMethod={published:false,description:'The repository contains final editorial scores, not the nine editorial component marks. The last two inputs are derived streaming indices: 100 × artist value / maximum in this locked snapshot. They are not recovered published component scores.',asOf:data.asOf};
data.featureCredits=require('../lib/board-engine.cjs').featureCredits(data.artists);
data.events=fs.existsSync('data/editorial-events.json')?JSON.parse(fs.readFileSync('data/editorial-events.json','utf8')):[];
const eventKeys=new Set(data.events.map(x=>[x.artist_slug,x.title,x.details?.year,x.details?.work,x.details?.result].join('|').toLowerCase()));
for(const [slug,records] of Object.entries(data.awards))for(const r of records){const x={artist_slug:slug,kind:r.result==='nominee'?'nomination':'award',title:r.name+' · '+r.category,event_date:null,details:{body:r.name,year:r.year,work:r.work,result:r.result,metric:'Awards'},source_url:r.sourceUrl,verified_at:r.lastVerifiedAt};const key=[slug,x.title,r.year,r.work,r.result].join('|').toLowerCase();if(!eventKeys.has(key)){data.events.push(x);eventKeys.add(key);}}
data.productionCredits=fs.existsSync('data/production-credits.json')?JSON.parse(fs.readFileSync('data/production-credits.json','utf8')):[];
fs.mkdirSync('data',{recursive:true});fs.writeFileSync('data/current.json',JSON.stringify(data));
