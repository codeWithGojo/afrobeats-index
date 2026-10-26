const fs=require('fs'),vm=require('vm');
const text=fs.readFileSync('assets/inline-07.js','utf8');
const state=JSON.parse(text.match(/window\.AFRI_EMBEDDED_STATE=(\{.*?\});/s)[1]);
const c={window:{AFRI_EMBEDDED_STATE:state},URL,document:{querySelectorAll:()=>[],querySelector:()=>null},console};vm.createContext(c);
vm.runInContext(fs.readFileSync('assets/inline-03.js','utf8'),c);
for(const file of ['assets/inline-04.js','assets/inline-11.js','assets/inline-12.js','refresh-2026-09-14.js','refresh-2026-09-21.js','refresh-2026-09-28.js','refresh-2026-10-05.js','ranking-refresh-2026-10-05.js','recognition-audit-2026-09-28.js','turntable-certifications.js','certification-refresh-2026-10-05.js'])vm.runInContext(fs.readFileSync(file,'utf8'),c);
c.window.AfriStreaming=require('../streaming-model.js');
vm.runInContext(fs.readFileSync('streaming-snapshot.js','utf8'),c);
const date=state.artists.map(a=>a.statsLastUpdatedAt).filter(Boolean).sort().at(-1);
// Derived artifact only: source remains the existing artist database.
const data={asOf:date,meta:state.meta,artists:state.artists,weights:[15,13,11,11,8,8,6,6,5,17],factorNames:['Impact & legacy','Global reach','Discography','Commercial power','Awards','Cultural influence','Longevity','Live performance','Feature impact','Tracked audio streams']};
data.recognition=c.window.AFRI_RECOGNITION||{};
state.financials=require("../trust-model.js").financials(state.financials);
data.site={...state};delete data.site.artists;
fs.writeFileSync('data/streaming-catalogue.json',JSON.stringify({asOf:date,recordings:state.recordings,albums:state.albumRecords}));
data.site.catalogue={recordings:state.recordings.length,albums:state.albumRecords.length,url:'/data/streaming-catalogue.json'};
delete data.site.recordings;delete data.site.albumRecords;
data.certifications=state.certifications||{};
data.site.nigeriaTop100=JSON.parse(fs.readFileSync('data/nigeria-top100.json','utf8'));
data.nigeriaTop100=data.site.nigeriaTop100;
data.awards=state.awards||{};
data.performances=state.performances||{};
const evidence=fs.existsSync('data/artist-evidence.json')?JSON.parse(fs.readFileSync('data/artist-evidence.json','utf8')):[];
const bios=new Map(evidence.filter(x=>!x.error).map(x=>[x.artist_slug,x]));
for(const a of data.artists){const b=bios.get(a.slug);if(b){a.gender=b.gender;a.careerStarted=b.career_started;a.evidence=b.evidence;}a.components=Array(9).fill(null).concat([a.scoreBreakdown.streamsIndex]);}
data.componentMethod={published:false,description:'The repository contains final editorial scores, not the nine editorial component marks. The tenth input is a derived audio-stream index using identical platform coverage across the locked snapshot. They are not recovered published component scores.',asOf:data.asOf};
data.featureCredits=require('../lib/board-engine.cjs').featureCredits(data.artists);
data.editorialNews=JSON.parse(fs.readFileSync('data/editorial-news.json','utf8'));
data.events=fs.existsSync('data/editorial-events.json')?JSON.parse(fs.readFileSync('data/editorial-events.json','utf8')):[];
const eventKeys=new Set(data.events.map(x=>[x.artist_slug,x.title,x.details?.year,x.details?.work,x.details?.result].join('|').toLowerCase()));
for(const [slug,records] of Object.entries(data.awards))for(const r of records){const x={artist_slug:slug,kind:r.result==='nominee'?'nomination':'award',title:r.name+' · '+r.category,event_date:null,details:{body:r.name,year:r.year,work:r.work,result:r.result,metric:'Awards'},source_url:r.sourceUrl,verified_at:r.lastVerifiedAt};const key=[slug,x.title,r.year,r.work,r.result].join('|').toLowerCase();if(!eventKeys.has(key)){data.events.push(x);eventKeys.add(key);}}
data.productionCredits=fs.existsSync('data/production-credits.json')?JSON.parse(fs.readFileSync('data/production-credits.json','utf8')):[];
data.artists=data.artists.map(require('../artist-taxonomy.js').normalize);
fs.mkdirSync('data',{recursive:true});fs.writeFileSync('data/current.json',JSON.stringify(data));
