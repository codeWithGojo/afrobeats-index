// African artist roster for personal stats matching: data/african-artists.json.
// Only artists already in the index (Current 50, Current 100 candidates, All-Time, Artists to Watch).
const fs=require('node:fs');
const read=f=>JSON.parse(fs.readFileSync(f,'utf8'));
const current=read('data/current.json').artists,alltime=read('data/all-time.json').artists;
const ext=fs.existsSync('data/current-extension.json')?read('data/current-extension.json'):{candidates:[],excluded:[]};
const watch=read('data/watch-artists.json').artists;
const excluded=new Set((ext.excluded||[]).map(x=>x.spotifyId));
// Spelling variants seen on streaming services. Keys are index slugs.
const ALIASES={'2baba':['2Face Idibia','2face','Tuface'],wizkid:['WizKid'],'p-square':['PSquare','P Square'],'d-banj':["D'banj",'Dbanj'],'odumodublvck':['ODUMODUBLVCK','Odumodu Blvck'],'kizz-daniel':['Kizz Daniel','Kiss Daniel'],'fireboy-dml':['Fireboy DML','Fireboy'],bnxn:['BNXN fka Buju','Buju'],'seyi-vibez':['Seyi Vibez'],'king-sunny-ade':['King Sunny Adé','King Sunny Ade'],'fela-kuti':['Fela Kuti','Fela Anikulapo Kuti']};
const out=new Map();
const add=a=>{if(!out.has(a.slug))out.set(a.slug,{...a,aliases:[...new Set([...(a.aliases||[]),...(ALIASES[a.slug]||[])])]});};
for(const a of current)add({slug:a.slug,name:a.name,country:a.country,genres:a.genres||[],careerStarted:Number.isInteger(a.careerStarted)?a.careerStarted:null,currentRank:a.rank,image:a.image,board:'current'});
for(const c of ext.candidates||[])if(!excluded.has(c.spotifyId))add({slug:c.slug,name:c.name,country:c.country,genres:[],careerStarted:null,board:'extension'});
for(const a of alltime)if(!a.name.includes('·'))add({slug:a.slug,name:a.name,country:null,genres:[],careerStarted:null,board:'all-time'});
for(const a of watch)add({slug:'watch-'+a.slug,name:a.name,country:null,genres:a.genre?[a.genre]:[],careerStarted:null,board:'watch'});
const roster=[...out.values()];
fs.writeFileSync('data/african-artists.json',JSON.stringify({note:'Artists the personal stats dashboard counts as African matches. Anything else is reported as unmatched.',count:roster.length,artists:roster}));
console.log(`Roster · ${roster.length} African artists for personal stats matching`);
