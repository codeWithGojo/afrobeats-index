// Runs last in the build: every rendered page loads the shared polish stylesheet after its own styles.
const fs=require('node:fs'),path=require('node:path');
const link='<link rel="stylesheet" href="/site-polish.css">';
const pages=[...fs.readdirSync('.').filter(name=>name.endsWith('.html')),...(fs.existsSync('touring')?fs.readdirSync('touring').filter(name=>name.endsWith('.html')).map(name=>path.join('touring',name)):[])];
let count=0;
// Site-wide UI layer (Phase 6): motion, toasts, sparklines, accents. Loaded after page scripts.
const ui='<link rel="stylesheet" href="/afri-ui.css"><script src="/afri-ui.js" defer></script><link rel="stylesheet" href="/share-sheet.css"><script src="/share-sheet.js" defer></script>';
const exists=p=>fs.existsSync(p)&&fs.statSync(p).size>0;
const webp=html=>html.replace(/<img\b[^>]*>/g,tag=>tag.replace(/src="(\/?(?:artists\/)?[a-z0-9-]+)\.jpg"/,(m,base)=>exists(base.replace(/^\//,'')+'.webp')?`src="${base}.webp"`:m));
// Phase 10: responsive artist images. srcset lets phones fetch the 160 or 320 px variant.
const srcsetFor=slug=>exists(`artists/${slug}-160.webp`)&&exists(`artists/${slug}-320.webp`)?`/artists/${slug}-160.webp 160w, /artists/${slug}-320.webp 320w, /artists/${slug}.webp 640w`:null;
function responsive(html){
 html=html.replace(/<img\b[^>]*>/g,tag=>{
  if(/\ssrcset=/.test(tag))return tag;
  const m=tag.match(/src="\/?artists\/([a-z0-9-]+)\.webp"/);if(!m)return tag;const set=srcsetFor(m[1]);if(!set)return tag;
  const w=Number((tag.match(/\swidth="(\d+)"/)||[])[1])||320;
  // Small fixed-size avatars: point straight at the smallest file.
  if(w<=80)return tag.replace(m[0],`src="/artists/${m[1]}-160.webp"`);
  return tag.replace(/<img\b/,`<img srcset="${set}" sizes="(max-width: 767px) ${Math.min(w,360)}px, ${w}px"`);
 });
 // Preloads: WebP instead of JPEG, and responsive candidates for artist portraits.
 html=html.replace(/<link rel="preload" as="image" href="(\/?(?:artists\/)?[a-z0-9-]+)\.jpg">/g,(m,base)=>exists(base.replace(/^\//,'')+'.webp')?`<link rel="preload" as="image" href="${base}.webp">`:m);
 html=html.replace(/<link rel="preload" as="image" href="\/artists\/([a-z0-9-]+)\.webp">/g,(m,slug)=>{const set=srcsetFor(slug);return set?`<link rel="preload" as="image" href="/artists/${slug}.webp" imagesrcset="${set}" imagesizes="(max-width: 767px) 180px, 320px">`:m;});
 // Remove duplicate preloads (the homepage listed /davido.jpg twice).
 const seen=new Set();html=html.replace(/<link rel="preload" as="image"[^>]*>/g,tag=>{if(seen.has(tag))return '';seen.add(tag);return tag;});
 // The GSAP orbit (42 KB) is skipped in Lite mode.
 html=html.replace('<script src="/assets/chart-orbit.js" defer></script>','<script>if(!document.documentElement.classList.contains("lite")){var s=document.createElement("script");s.src="/assets/chart-orbit.js";s.defer=true;document.head.append(s);}</script>');
 return html;
}
for(const file of pages){
  let html=fs.readFileSync(file,'utf8');const before=html;
  if(!html.includes('</head>'))continue;
  html=responsive(webp(html));
  if(!html.includes(link))html=html.replace('</head>',link+'</head>');
  if(!html.includes('src="/share-sheet.js"'))html=html.replace(/<link rel="stylesheet" href="\/afri-ui.css"><script src="\/afri-ui.js" defer><\/script>/,'').replace('</head>',ui+'</head>');
  if(html!==before){fs.writeFileSync(file,html);count++;}
}
console.log(`Linked site polish on ${count} pages.`);
