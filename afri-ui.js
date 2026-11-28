/* Site-wide UI layer (Phase 6). Small, vanilla, progressive: every feature degrades to the plain page.
   Header shrink and tab indicator, row reordering (FLIP), one-time movement pulse, hover previews with
   real rank sparklines, artist accent colours, blur-up images, rank weights, toasts and share confetti. */
(function(){
 'use strict';
 const doc=document,root=doc.documentElement,reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const lite=()=>root.classList.contains('lite')||reduced.matches;
 const e=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const once=fn=>{let p;return ()=>p||(p=fn());};
 const history=once(()=>fetch('/data/rank-history.json').then(r=>r.ok?r.json():null).catch(()=>null));
 const accents=once(()=>fetch('/data/artist-accents.json').then(r=>r.ok?r.json():null).catch(()=>null));
 const placeholders=once(()=>fetch('/data/artist-placeholders.json').then(r=>r.ok?r.json():null).catch(()=>null));

 // Toasts and confetti
 let toastBox;
 function toast(message,kind='ok'){
  toastBox??=Object.assign(doc.body.appendChild(doc.createElement('div')),{className:'afri-toasts'});toastBox.setAttribute('role','status');toastBox.setAttribute('aria-live','polite');
  const t=doc.createElement('p');t.className='afri-toast afri-toast-'+kind;t.textContent=message;toastBox.append(t);
  setTimeout(()=>{t.classList.add('is-leaving');setTimeout(()=>t.remove(),220);},2600);
 }
 function confetti(x=innerWidth/2,y=innerHeight/2){
  if(lite())return;const colours=['#d9f24a','#f5f6ef','#8fd1ff','#f6a6c1','#ffd166'];
  for(let i=0;i<18;i++){const p=doc.createElement('i');p.className='afri-confetti';const a=Math.random()*Math.PI*2,d=60+Math.random()*90;
   p.style.cssText=`left:${x}px;top:${y}px;background:${colours[i%colours.length]};--dx:${Math.cos(a)*d}px;--dy:${Math.sin(a)*d-40}px;--r:${Math.random()*540-270}deg`;
   doc.body.append(p);setTimeout(()=>p.remove(),900);}
 }
 // Every share or copy on the site gets feedback without touching each feature.
 let lastPoint=null;doc.addEventListener('pointerdown',ev=>{lastPoint=[ev.clientX,ev.clientY];},true);
 if(navigator.share){const share=navigator.share.bind(navigator);navigator.share=async(...args)=>{const r=await share(...args);toast('Shared. Thanks for spreading the word.');confetti(...(lastPoint||[]));return r;};}
 if(navigator.clipboard?.writeText){const write=navigator.clipboard.writeText.bind(navigator.clipboard);navigator.clipboard.writeText=async text=>{const r=await write(text);toast(/^https?:\/\//.test(text)?'Link copied.':'Copied.');return r;};}
 window.AfriUI={toast,confetti};
 // Usage events: Vercel Web Analytics plus first-party daily totals (no personal data; allowlisted names).
 window.AfriTrack=(name,data={})=>{
  try{window.va?.('event',{name,data});}catch{}
  const detail=String(data.platform||data.kind||data.step||data.option||data.provider||data.path||'').toLowerCase().replace(/[^a-z0-9_-]/g,'').slice(0,40);
  const body=JSON.stringify({name,detail});
  try{if(!(navigator.sendBeacon&&navigator.sendBeacon('/api/product?service=events&action=event',new Blob([body],{type:'application/json'}))))fetch('/api/product?service=events&action=event',{method:'POST',headers:{'Content-Type':'application/json'},body,keepalive:true}).catch(()=>{});}catch{}
 };
 { // Feature views worth knowing about (pages themselves are counted by Vercel Analytics).
  const p=location.pathname.replace(/\.html$/,''),path=p.startsWith('/vs/')?'compare':p.startsWith('/current/')?'artist':({'/heat':'heat','/current-100':'current-100','/my-index':'my-index','/stats':'stats','/current':'current-50','/sponsor':'sponsor','/studio/sandbox':'sandbox','/music-receipt':'receipt'})[p];
  if(path)window.AfriTrack('view',{path});
  addEventListener('afri:receipt-printed',()=>window.AfriTrack('receipt_generate'));
 }

 // Lite mode controls: footer toggle on every page, Page tools setting, and a one-time suggestion.
 function lite_controls(){
  const L=window.AfriLite;if(!L)return;
  const label=()=>`Lite mode: ${L.on?'on':'off'}${L.auto?' (auto)':''}`;
  doc.addEventListener('click',ev=>{const b=ev.target.closest?.('[data-lite-set]');if(!b)return;ev.preventDefault();const v=b.dataset.liteSet;if(v!=='auto')window.AfriTrack?.(v==='on'?'lite_on':'lite_off');L.set(v==='auto'?null:v);});
  const foot=doc.querySelector('footer');
  if(foot&&!foot.querySelector('.lite-toggle'))foot.insertAdjacentHTML('afterbegin',`<p class="lite-toggle"><button type="button" data-lite-set="${L.on?'off':'on'}" aria-pressed="${L.on}">${e(label())}</button> <small>Less data, no heavy motion, system fonts.</small></p>`);
  let seen=false;try{seen=localStorage.getItem('afri-lite-suggested')==='1';}catch{}
  if(L.suggest&&!seen){try{localStorage.setItem('afri-lite-suggested','1');}catch{}
   const bar=doc.createElement('div');bar.className='lite-suggest';bar.setAttribute('role','region');bar.setAttribute('aria-label','Lite mode suggestion');
   bar.innerHTML='<p>Slow connection or an older phone? Lite mode uses less data and skips heavy motion.</p><button type="button" data-lite-set="on">Turn on Lite mode</button><button type="button" class="lite-dismiss">No thanks</button>';
   doc.body.append(bar);bar.querySelector('.lite-dismiss').onclick=()=>{try{localStorage.setItem('afri-lite','off');}catch{}bar.remove();};}
  if(L.auto)setTimeout(()=>toast('Lite mode is on because your connection is slow or Data Saver is on. Turn it off in the footer.'),800);
 }

 // Sticky header that shrinks, with a lime underline that slides between tabs
 function header(){
  const set=()=>root.classList.toggle('is-scrolled',scrollY>24);set();addEventListener('scroll',set,{passive:true});
  const nav=doc.querySelector('.app-primary');if(!nav||nav.querySelector('.nav-indicator'))return;
  const bar=doc.createElement('span');bar.className='nav-indicator';bar.setAttribute('aria-hidden','true');nav.append(bar);
  const links=[...nav.querySelectorAll(':scope>a')],current=()=>links.find(a=>a.getAttribute('aria-current')==='page');
  const move=a=>{if(!a){bar.style.opacity='0';return;}const n=nav.getBoundingClientRect(),r=a.getBoundingClientRect();bar.style.opacity='1';bar.style.transform=`translateX(${r.left-n.left}px)`;bar.style.width=r.width+'px';};
  links.forEach(a=>{a.addEventListener('mouseenter',()=>move(a));a.addEventListener('focus',()=>move(a));});
  nav.addEventListener('mouseleave',()=>move(current()));addEventListener('resize',()=>move(current()));
  requestAnimationFrame(()=>move(current()));setTimeout(()=>move(current()),600);
 }

 // Row reordering for opt-in lists ([data-flip] with [data-flip-control]). The Current 50 already animates in rankings-ui.js.
 function flip(){
  let before=null;
  const rows=()=>[...doc.querySelectorAll('[data-flip]>*')];
  // Keyed by artist, because sorting can rebuild the row elements.
  const key=r=>r.dataset.artistSlug||r.dataset.key||r;
  // One animation per user action: controls that re-dispatch events inside 300ms are ignored.
  let lastSnap=0;
  const snap=ev=>{if(before||performance.now()-lastSnap<300)return;if(lite()||!ev.target.closest?.('[data-flip-control]'))return;lastSnap=performance.now();before=new Map(rows().map(r=>[key(r),r.getBoundingClientRect().top]));requestAnimationFrame(()=>requestAnimationFrame(play));};
  function play(){if(!before)return;const map=before;before=null;for(const r of rows()){r.setAttribute('data-motion-owned','');const old=map.get(key(r));if(old==null||r.hidden)continue;const dy=old-r.getBoundingClientRect().top;if(Math.abs(dy)<1||Math.abs(dy)>2400)continue;r.animate([{transform:`translateY(${dy}px)`},{transform:'none'}],{duration:280,easing:'cubic-bezier(.2,.8,.2,1)'});}}
  ['click','change','input'].forEach(t=>doc.addEventListener(t,snap,true));
 }

 // One-time pulse on movement arrows as they come into view (green rise, red fall).
 function pulses(){
  if(!('IntersectionObserver' in window))return;
  const io=new IntersectionObserver(es=>es.forEach(x=>{if(x.isIntersecting){io.unobserve(x.target);if(!lite())x.target.classList.add('pulse-once');}}),{threshold:.6});
  const scan=()=>doc.querySelectorAll('.movement-up,.movement-down,.rank-movement-up,.rank-movement-down').forEach(el=>{if(!el.dataset.pulseSeen){el.dataset.pulseSeen='1';io.observe(el);}});
  scan();return scan;
 }

 // Sparklines from published ranks only. If an artist has fewer than 4 editions, no sparkline is drawn.
 function sparkline(values,{label='Published rank, last editions',invert=true}={}){
  const pts=values.map((v,i)=>[i,v]).filter(([,v])=>Number.isFinite(v));if(pts.length<4)return '';
  const xs=pts.map(p=>p[0]),ys=pts.map(p=>p[1]),minY=Math.min(...ys),maxY=Math.max(...ys),w=72,h=22,span=Math.max(1,maxY-minY),last=xs.at(-1)||1;
  const pt=([x,y])=>[(x/last)*(w-4)+2,invert?((y-minY)/span)*(h-6)+3:h-3-((y-minY)/span)*(h-6)];
  const d=pts.map((p,i)=>(i?'L':'M')+pt(p).map(n=>n.toFixed(1)).join(' ')).join(' '),[ex,ey]=pt(pts.at(-1));
  return `<svg class="afri-spark" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${e(label)}: ${ys.map(v=>'#'+v).join(', ')}"><path d="${d}" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round"/><circle cx="${ex.toFixed(1)}" cy="${ey.toFixed(1)}" r="2.2" fill="currentColor"/></svg>`;
 }
 async function rows(){
  const list=doc.querySelectorAll('.current-row[data-artist-slug]');if(!list.length)return;
  const h=await history();
  list.forEach(row=>{
   const slug=row.dataset.artistSlug,rank=Number(row.dataset.rank);
   if(Number.isFinite(rank))row.style.setProperty('--rank-weight',String(Math.max(500,700-Math.round((rank-1)*5))));
   if(row.dataset.uiDone)return;row.dataset.uiDone='1';
   const ranks=h?.artists?.[slug]?.rank||[],svg=sparkline(ranks);
   const stats=row.parentElement?.querySelector(`.chart-row-stats[data-stats-for="${CSS.escape(slug)}"] p`);
   if(svg&&stats&&!stats.querySelector('.afri-spark'))stats.insertAdjacentHTML('beforeend',`<span class="afri-spark-line">${svg}<small>Rank, last ${ranks.filter(Number.isFinite).length} editions</small></span>`);
   if(svg)row.dataset.spark=svg;
  });
 }
 // Desktop hover preview: lift plus flag, top stat and sparkline. Touch users get the same in "Stream details".
 function previews(){
  if(lite()||!matchMedia('(hover:hover) and (pointer:fine)').matches)return;
  let card=null,hide=0;
  doc.addEventListener('pointerover',ev=>{const row=ev.target.closest?.('.current-row[data-artist-slug]');if(!row||row.contains(ev.relatedTarget))return;clearTimeout(hide);
   card??=Object.assign(doc.body.appendChild(doc.createElement('div')),{className:'afri-preview'});card.setAttribute('aria-hidden','true');
   const flag=row.querySelector('.current-kicker')?.innerHTML||'',daily=row.querySelector('.current-streams strong')?.textContent||'';
   card.innerHTML=`<strong>${e(row.dataset.name)}</strong><span class="afri-preview-flag">${flag}</span><span>Daily Spotify <b>${e(daily)}</b></span>${row.dataset.spark?`<span class="afri-preview-spark">${row.dataset.spark}<small>Rank trend</small></span>`:'<small>Rank trend builds as editions publish</small>'}`;
   const r=row.getBoundingClientRect();card.style.top=Math.max(8,r.top+scrollY-8)+'px';card.style.left=Math.min(innerWidth-260,r.right-250)+'px';card.classList.add('is-on');});
  doc.addEventListener('pointerout',ev=>{const row=ev.target.closest?.('.current-row[data-artist-slug]');if(row&&!row.contains(ev.relatedTarget))hide=setTimeout(()=>card?.classList.remove('is-on'),80);});
 }

 // Per-artist accent colour (extracted from the photo at build time, AA-checked for each theme).
 async function accent(){
  const slug=location.pathname.match(/^\/current\/([a-z0-9-]+)/)?.[1]||doc.getElementById('current-artist-dialog')?.dataset.artistSlug;if(!slug)return;
  const a=(await accents())?.artists?.[slug];if(!a)return;
  const target=doc.getElementById('current-artist-dialog')?.open?doc.getElementById('current-artist-dialog'):doc.getElementById('studio')||doc.querySelector('main');
  target?.style.setProperty('--artist-accent-dark',a.dark);target?.style.setProperty('--artist-accent-light',a.light);target?.classList.add('has-artist-accent');
  if(location.pathname.startsWith('/current/')){const h=await history(),ranks=h?.artists?.[slug]?.rank||[],svg=sparkline(ranks);const head=doc.querySelector('#studio h1,main h1');if(svg&&head&&!doc.querySelector('.artist-spark')){head.insertAdjacentHTML('afterend',`<p class="artist-spark">${svg}<small>Published rank, last ${ranks.filter(Number.isFinite).length} editions</small></p>`);}}
 }

 // Blur-up: a 16px placeholder shows behind artist photos until they load.
 async function blurUp(){
  if(root.classList.contains('lite'))return; // Lite mode: no placeholder download.
  const imgs=[...doc.querySelectorAll('img[src*="/artists/"]:not([data-blur])')].filter(i=>!i.complete);if(!imgs.length)return;
  const p=await placeholders();if(!p)return;
  for(const img of imgs){img.dataset.blur='1';const slug=(img.getAttribute('src')||'').match(/artists\/([a-z0-9-]+)\./)?.[1];if(!slug||!p[slug]||img.complete)continue;
   img.style.backgroundImage=`url("${p[slug]}")`;img.style.backgroundSize='cover';img.classList.add('is-blurring');img.addEventListener('load',()=>img.classList.remove('is-blurring'),{once:true});}
 }

 function init(){
  lite_controls();header();flip();previews();const rescan=pulses();
  const pass=()=>{rows();blurUp();accent();rescan?.();};pass();
  let frame=0;const main=doc.querySelector('main')||doc.body;
  new MutationObserver(()=>{if(!frame)frame=requestAnimationFrame(()=>{frame=0;pass();});}).observe(main,{childList:true,subtree:true});
  doc.addEventListener('toggle',ev=>{if(ev.target.id==='current-artist-dialog')accent();},true);
  doc.addEventListener('click',ev=>{if(ev.target.closest?.('[data-artist-slug]'))setTimeout(accent,60);});
 }
 if(doc.readyState==='loading')doc.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
