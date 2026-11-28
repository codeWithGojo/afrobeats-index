const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {contrast}=require('../lib/colour.cjs');
const DARK=['#0b1014','#151d23'],LIGHT=['#f4f6f5','#ffffff'];
const aa=(fg,bgs,min=4.5)=>bgs.forEach(bg=>assert.ok(contrast(fg,bg)>=min,`${fg} on ${bg} = ${contrast(fg,bg).toFixed(2)}`));
test('every per-artist accent passes WCAG AA on its theme backgrounds',()=>{
 const {artists}=require('../data/artist-accents.json');assert.ok(Object.keys(artists).length>=50);
 for(const [slug,a] of Object.entries(artists)){aa(a.dark,DARK);aa(a.light,LIGHT);void slug;}
});
test('gradient type endpoints, toasts, winners and movement colours pass AA in both themes',()=>{
 aa('#d9f24a',DARK);aa('#f4ffb8',DARK);aa('#536600',LIGHT);aa('#3b4a00',LIGHT);
 assert.ok(contrast('#0b1014','#f5f6ef')>=4.5);assert.ok(contrast('#f4f6f5','#15252d')>=4.5); // toast text on toast background
 aa('#f68a94',DARK);aa('#b62441',LIGHT);
});
test('no page still loads a JPEG portrait when a WebP exists, and no WebP is empty',()=>{
 for(const f of fs.readdirSync('.').filter(f=>f.endsWith('.html'))){const m=fs.readFileSync(f,'utf8').match(/src="\/?(?:artists\/)?[a-z0-9-]+\.jpg"/g)||[];assert.deepEqual(m,[],f);}
 for(const f of fs.readdirSync('artists').filter(f=>f.endsWith('.webp')))assert.ok(fs.statSync('artists/'+f).size>0,f);
});
test('the UI layer respects reduced motion and Lite mode and never fakes sparkline data',()=>{
 const css=fs.readFileSync('afri-ui.css','utf8'),js=fs.readFileSync('afri-ui.js','utf8');
 assert.ok(css.includes('prefers-reduced-motion:reduce')&&css.includes('html.lite'));
 assert.ok(/pts\.length<4\)return ''/.test(js),'sparklines need 4+ real editions');
 const h=require('../data/rank-history.json');assert.ok(h.dates.length<=8);
});
