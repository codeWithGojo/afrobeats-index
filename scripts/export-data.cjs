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
fs.mkdirSync('data',{recursive:true});fs.writeFileSync('data/current.json',JSON.stringify(data));
