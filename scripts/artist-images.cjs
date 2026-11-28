// Artist image pipeline (run with `npm run images`; outputs are committed so the site build needs no image tools).
// 1. WebP for every artist JPEG that lacks one.  2. Tiny blur-up placeholders.  3. One accent colour per artist,
// extracted from the photo and adjusted until it passes WCAG AA (4.5:1) on both theme backgrounds.
const fs=require('node:fs'),path=require('node:path'),sharp=require('sharp');
const {contrast,hex}=require('../lib/colour.cjs');
const DIR='artists',BG={dark:'#151d23',light:'#ffffff'}; // surfaces where tinted text sits (worst case of bg/surface)
const BG_ALT={dark:'#0b1014',light:'#f4f6f5'};

function rgbToHsl([r,g,b]){r/=255;g/=255;b/=255;const max=Math.max(r,g,b),min=Math.min(r,g,b),l=(max+min)/2;if(max===min)return [0,0,l];const d=max-min,s=l>.5?d/(2-max-min):d/(max+min);const h=max===r?(g-b)/d+(g<b?6:0):max===g?(b-r)/d+2:(r-g)/d+4;return [h/6,s,l];}
function hslToRgb([h,s,l]){if(!s)return [l,l,l].map(x=>Math.round(x*255));const q=l<.5?l*(1+s):l+s-l*s,p=2*l-q,f=t=>{t=(t+1)%1;return t<1/6?p+(q-p)*6*t:t<.5?q:t<2/3?p+(q-p)*(2/3-t)*6:p;};return [f(h+1/3),f(h),f(h-1/3)].map(x=>Math.round(x*255));}
// Vivid, common colours win; greys, near-black and near-white are ignored. Falls back to the site accent.
function dominant(raw){
 const buckets=new Map();
 for(let i=0;i<raw.length;i+=3){const [h,s,l]=rgbToHsl([raw[i],raw[i+1],raw[i+2]]);if(s<.28||l<.12||l>.88)continue;const k=Math.round(h*18)%18,b=buckets.get(k)||{w:0,h:0,s:0,l:0};const skin=h>.015&&h<.12&&s<.6;const w=s*(1-Math.abs(l-.5))*(skin?.3:1);b.w+=w;b.h+=h*w;b.s+=s*w;b.l+=l*w;buckets.set(k,b);}
 const best=[...buckets.values()].sort((a,b)=>b.w-a.w)[0];if(!best||best.w<2)return null;return [best.h/best.w,Math.min(.85,best.s/best.w),best.l/best.w];
}
// Move lightness until the colour reaches 4.5:1 on both backgrounds of a theme.
function fit(hsl,theme){
 const ok=c=>contrast(c,BG[theme])>=4.5&&contrast(c,BG_ALT[theme])>=4.5;
 for(let step=0;step<=60;step++){const l=theme==='dark'?Math.min(.95,hsl[2]+step*.01):Math.max(.05,hsl[2]-step*.01);const c=hex(hslToRgb([hsl[0],hsl[1],l]));if(ok(c))return c;}
 return theme==='dark'?'#d9f24a':'#536600';
}
(async()=>{
 const files=fs.readdirSync(DIR),slugs=[...new Set(files.map(f=>f.replace(/\.(jpg|webp)$/,'')))].filter(s=>!s.includes('.')&&!/-(160|320)$/.test(s));
 const accents={},placeholders={};let converted=0;
 for(const slug of slugs){
  const jpg=path.join(DIR,slug+'.jpg'),webp=path.join(DIR,slug+'.webp');
  // Missing or empty (zlatan.webp shipped as 0 bytes) WebP files are regenerated from the JPEG.
  if(fs.existsSync(jpg)&&(!fs.existsSync(webp)||fs.statSync(webp).size===0)){await sharp(jpg).resize({width:640,height:640,fit:'inside',withoutEnlargement:true}).webp({quality:78}).toFile(webp);converted++;}
  const src=fs.existsSync(webp)?webp:jpg;if(!fs.existsSync(src))continue;
  // Responsive variants for srcset (Phase 10): 160 and 320 px wide.
  for(const w of [160,320]){const out=path.join(DIR,`${slug}-${w}.webp`);if(!fs.existsSync(out)||fs.statSync(out).mtimeMs<fs.statSync(src).mtimeMs){await sharp(src).resize({width:w,height:w,fit:'cover',position:'attention'}).webp({quality:w===160?70:74}).toFile(out);converted++;}}
  const lqip=await sharp(src).resize(16,16,{fit:'cover'}).blur(1).webp({quality:40}).toBuffer();
  placeholders[slug]='data:image/webp;base64,'+lqip.toString('base64');
  const {data}=await sharp(src).resize(40,40,{fit:'cover'}).removeAlpha().raw().toBuffer({resolveWithObject:true});
  const d=dominant(data);
  accents[slug]=d?{source:hex(hslToRgb(d)),dark:fit(d,'dark'),light:fit(d,'light')}:{source:null,dark:'#d9f24a',light:'#536600'};
 }
 // Legacy root-level portraits (for example /davido.jpg on All-Time) also get a WebP twin.
 for(const f of fs.readdirSync('.').filter(f=>/\.jpg$/.test(f)&&f!=='og.jpg')){const webp=f.replace(/\.jpg$/,'.webp');if(!fs.existsSync(webp)||fs.statSync(webp).size===0){await sharp(f).resize({width:640,height:640,fit:'inside',withoutEnlargement:true}).webp({quality:78}).toFile(webp);converted++;}}
 fs.writeFileSync('data/artist-accents.json',JSON.stringify({note:'Per-artist accent colours extracted from each photo by scripts/artist-images.cjs. dark/light variants pass WCAG AA (4.5:1) on that theme\'s background and surface.',backgrounds:{dark:[BG.dark,BG_ALT.dark],light:[BG.light,BG_ALT.light]},artists:accents},null,1));
 fs.writeFileSync('data/artist-placeholders.json',JSON.stringify(placeholders));
 console.log(`Images · ${converted} converted to WebP · ${Object.keys(placeholders).length} placeholders · ${Object.keys(accents).length} accents`);
})();
