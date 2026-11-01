const fs=require('node:fs'),path=require('node:path');
// Existing site portraits are embedded in the requested share cards.
// Use Davido's face portrait rather than the catalogue logo.
const overrides={davido:'davido.jpg'};
const cache=new Map();
function photoFor(artist){
 const primary=String(artist.image||'').replace(/^\//,'');
 // The PNG renderer supports the original JPEGs; WebP is retained for website thumbnails.
 const candidates=[overrides[artist.slug],primary.replace(/\.webp$/,'.jpg'),primary].filter(Boolean);
 for(const relative of new Set(candidates)){
  if(!/^(?:artists\/[a-z0-9-]+\.(?:webp|jpg|png)|[a-z0-9-]+\.jpg)$/.test(relative))continue;
  if(cache.has(relative))return cache.get(relative);
  try{
   const bytes=fs.readFileSync(path.join(__dirname,'..',relative));
   const jpeg=bytes[0]===255&&bytes[1]===216,png=bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
   if(!jpeg&&!png)continue;
   const mime=png?'image/png':'image/jpeg';
   const photo={dataUrl:`data:${mime};base64,${bytes.toString('base64')}`,path:relative};
   cache.set(relative,photo);return photo;
  }catch{}
 }
 return null;
}
function portraitPath(artist){return photoFor(artist)?.path||null;}
module.exports={portraitPath,photoFor};
