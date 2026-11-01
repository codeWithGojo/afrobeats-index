const fs=require('node:fs'),card=require('../player-card.js'),{photoFor,portraitPath}=require('../lib/player-card-photos.cjs');
const data=JSON.parse(fs.readFileSync('data/current.json','utf8'));
const artists=data.artists.map(artist=>({slug:artist.slug,photo:portraitPath(artist),photoAvailable:!!photoFor(artist),missing:card.model(artist.slug,data).stats.filter(s=>s.value===null).map(s=>s.key)}));
fs.writeFileSync('data/player-card-coverage.json',JSON.stringify({version:2,snapshot:data.asOf,photoPolicy:'Existing site portraits embedded in artist share PNGs; Davido uses the existing face portrait rather than the catalogue logo.',statsPolicy:'Total and daily Spotify streams, tracked songs and projects, stream index /99 and editorial contribution /83. Unpublished individual editorial factors are not inferred.',artists},null,2)+'\n');
const incomplete=artists.filter(a=>!a.photoAvailable||a.missing.length);
if(incomplete.length)throw Error('Incomplete share cards: '+incomplete.map(a=>a.slug).join(', '));
console.log(`Artist cards: ${artists.length} embedded portraits and six sourced stats per artist.`);
