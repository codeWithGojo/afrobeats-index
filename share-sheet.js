/* ShareSheet: one share surface for rankings, artist pages, receipts, compare, personal stats and My Index.
   AfriShare.open({kind, url, title, text, captions?, image?: () => Promise<Blob>|string, imageName?})
   Mobile with file support: Web Share API with the image. Desktop: platform URLs. Every link carries UTM tags,
   and every click is counted per platform (no personal data). AfriShare.card() draws personal cards in the browser. */
(function(){
 'use strict';
 const SITE='https://afrobeats-index.vercel.app';
 const e=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const track=(name,data)=>{try{if(window.AfriTrack)return window.AfriTrack(name,data);window.va?.('event',{name,data});}catch{}};
 const toast=(m)=>window.AfriUI?.toast?window.AfriUI.toast(m):alert(m);
 function utm(url,platform,kind){const u=new URL(url,SITE);u.searchParams.set('utm_source','share');u.searchParams.set('utm_medium',platform);u.searchParams.set('utm_campaign',kind||'page');return u.toString();}
 // Short preset captions per platform. The page caption is the base; platforms add their own tone.
 function caption(platform,o){
  const base=o.captions?.[platform]||o.text||o.title||'African music, ranked with a source behind every number.';
  const tags='#Afrobeats #AfriIndex';
  return {x:`${base} ${tags}`.slice(0,230),threads:`${base} ${tags}`,tiktok:`${base} ${tags} #AfricanMusic`,instagram:`${base} ${tags}`,snapchat:base,whatsapp:base,'whatsapp-status':base,telegram:base,facebook:base,linkedin:base,reddit:o.title||base,email:base,sms:base,copy:base,download:base,native:base}[platform]||base;
 }
 const TARGETS=[
  ['whatsapp','WhatsApp',o=>`https://wa.me/?text=${encodeURIComponent(caption('whatsapp',o)+' '+utm(o.url,'whatsapp',o.kind))}`],
  ['whatsapp-status','WhatsApp Status','image'],
  ['x','X',o=>`https://twitter.com/intent/tweet?text=${encodeURIComponent(caption('x',o))}&url=${encodeURIComponent(utm(o.url,'x',o.kind))}`],
  ['instagram','Instagram Stories','image'],
  ['facebook','Facebook',o=>`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(utm(o.url,'facebook',o.kind))}`],
  ['telegram','Telegram',o=>`https://t.me/share/url?url=${encodeURIComponent(utm(o.url,'telegram',o.kind))}&text=${encodeURIComponent(caption('telegram',o))}`],
  ['tiktok','TikTok','image'],
  ['snapchat','Snapchat',o=>`https://www.snapchat.com/scan?attachmentUrl=${encodeURIComponent(utm(o.url,'snapchat',o.kind))}`],
  ['linkedin','LinkedIn',o=>`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(utm(o.url,'linkedin',o.kind))}`],
  ['reddit','Reddit',o=>`https://www.reddit.com/submit?url=${encodeURIComponent(utm(o.url,'reddit',o.kind))}&title=${encodeURIComponent(caption('reddit',o))}`],
  ['threads','Threads',o=>`https://www.threads.net/intent/post?text=${encodeURIComponent(caption('threads',o)+' '+utm(o.url,'threads',o.kind))}`],
  ['email','Email',o=>`mailto:?subject=${encodeURIComponent(o.title||'Afri Index')}&body=${encodeURIComponent(caption('email',o)+'\n\n'+utm(o.url,'email',o.kind))}`],
  ['sms','SMS',o=>`sms:?&body=${encodeURIComponent(caption('sms',o)+' '+utm(o.url,'sms',o.kind))}`],
  ['copy','Copy link','copy'],
  ['download','Download image','download']];
 const IMAGE_HELP={instagram:'Image saved. Open Instagram, tap your Story and add it from your photos.','whatsapp-status':'Image saved. Open WhatsApp, go to Status and add it from your photos.',tiktok:'Image saved and caption copied. Open TikTok, upload the image and paste the caption.',download:'Image saved.'};

 let dialog,current,blobCache=null;
 async function imageBlob(){if(blobCache)return blobCache;const src=current.image;if(!src)return null;const b=typeof src==='function'?await src():await fetch(src).then(r=>r.ok?r.blob():null);blobCache=b;return b;}
 const file=b=>new File([b],current.imageName||'afri-index.png',{type:b.type||'image/png'});
 function download(b){const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=current.imageName||'afri-index.png';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),4000);}
 async function act(platform,how){
  track('share_click',{platform,kind:current.kind});
  const o=current,link=utm(o.url,platform,o.kind);
  try{
   if(how==='copy'){await navigator.clipboard.writeText(link);return;}
   if(how==='image'||how==='download'){
    const b=await imageBlob();if(!b){toast('No image for this page yet. The link was copied instead.');await navigator.clipboard?.writeText(link);return;}
    if(how==='image'&&navigator.canShare?.({files:[file(b)]})){await navigator.share({files:[file(b)],text:caption(platform,o)+' '+link,title:o.title});return;}
    download(b);if(platform==='tiktok')await navigator.clipboard?.writeText(caption('tiktok',o)+' '+link);toast(IMAGE_HELP[platform]||IMAGE_HELP.download);return;
   }
   window.open(how(o),'_blank','noopener,noreferrer');
  }catch(err){if(err?.name!=='AbortError')toast('Sharing did not work this time. Try copying the link.');}
 }
 async function native(){
  track('share_click',{platform:'native',kind:current.kind});const o=current,link=utm(o.url,'native',o.kind);
  try{const b=await imageBlob().catch(()=>null);const payload={title:o.title,text:caption('native',o),url:link};if(b&&navigator.canShare?.({files:[file(b)]}))payload.files=[file(b)];await navigator.share(payload);}catch(err){if(err?.name!=='AbortError')toast('Sharing did not work this time.');}
 }
 function open(options){
  current={kind:'page',url:location.href,title:document.title,...options};blobCache=null;
  if(!dialog){dialog=document.createElement('dialog');dialog.className='share-sheet';dialog.setAttribute('aria-labelledby','share-sheet-title');document.body.append(dialog);dialog.addEventListener('click',ev=>{if(ev.target===dialog)dialog.close();});}
  const canNative=!!navigator.share&&matchMedia('(pointer:coarse)').matches;
  dialog.innerHTML=`<div class="share-sheet-inner"><header><h2 id="share-sheet-title">Share</h2><button type="button" class="share-close" aria-label="Close">×</button></header>
   ${current.image?`<div class="share-preview" aria-hidden="true"><img alt="" src="${typeof current.image==='string'?e(current.image):''}" ${typeof current.image==='string'?'':'hidden'}></div>`:''}
   <p class="share-caption">${e(caption('copy',current))}</p>
   ${canNative?'<button type="button" class="share-native">Share with your phone…</button>':''}
   <div class="share-grid">${TARGETS.filter(([id,,how])=>current.image||!['image','download'].includes(how)).map(([id,label])=>`<button type="button" data-share="${id}"><span class="share-icon share-icon-${id}" aria-hidden="true"></span>${e(label)}</button>`).join('')}</div></div>`;
  dialog.querySelector('.share-close').onclick=()=>dialog.close();
  dialog.querySelector('.share-native')?.addEventListener('click',native);
  dialog.querySelectorAll('[data-share]').forEach(b=>b.addEventListener('click',()=>{const t=TARGETS.find(x=>x[0]===b.dataset.share);act(t[0],t[2]);}));
  if(typeof current.image==='function'){imageBlob().then(b=>{const img=dialog.querySelector('.share-preview img');if(b&&img){img.src=URL.createObjectURL(b);img.hidden=false;}}).catch(()=>{});}
  track('share_open',{kind:current.kind});
  dialog.showModal();
 }

 /* Personal share cards drawn in the browser (stats, My Index): story 1080x1920 or OG 1200x630. */
 async function card({title,kicker,items=[],footer='afrobeats-index.vercel.app',format='story'}){
  const story=format==='story',w=story?1080:1200,h=story?1920:630,c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d');
  await document.fonts?.ready;const font=(s,wt=700)=>`${wt} ${s}px "Space Grotesk",Inter,Arial,sans-serif`,pad=story?84:48;
  g.fillStyle='#0b1014';g.fillRect(0,0,w,h);g.fillStyle='rgba(217,242,74,.07)';g.beginPath();g.arc(w*.85,story?260:60,story?420:260,0,Math.PI*2);g.fill();
  g.fillStyle='#d9f24a';g.font=font(story?40:24);g.fillText('AFR / INDEX',pad,story?120:56);
  g.fillStyle='#f5f6ef';g.font=font(story?96:52);wrap(g,title,pad,story?290:120,w-pad*2,story?104:56,2);
  g.fillStyle='#a9b4ad';g.font=font(story?30:18,500);g.fillText(String(kicker||'').toUpperCase(),pad,story?470:170);
  const list=story?items.slice(0,10):items.slice(0,5),top=story?580:220,rowH=story?116:76;
  list.forEach((it,i)=>{const y=top+i*rowH;g.fillStyle=i<3?'#d9f24a':'#f5f6ef';g.font=font(story?54:34);g.fillText(String(i+1).padStart(2,'0'),pad,y);g.fillStyle='#f5f6ef';g.font=font(story?44:30);g.fillText(clip(g,it.label,w-pad*2-(story?380:300)),pad+(story?140:96),y-(story?6:4));g.fillStyle='#a9b4ad';g.font=font(story?26:18,500);if(it.sub)g.fillText(clip(g,it.sub,w-pad*2-(story?160:110)),pad+(story?140:96),y+(story?32:22));if(it.value){g.fillStyle='#d9f24a';g.font=font(story?44:30);g.textAlign='right';g.fillText(it.value,w-pad,y);g.textAlign='left';}});
  g.fillStyle='#a9b4ad';g.font=font(story?26:18,500);g.fillText(footer,pad,h-(story?90:26));
  return new Promise(r=>c.toBlob(r,'image/png'));
 }
 function clip(g,t,max){t=String(t||'');while(t.length>1&&g.measureText(t).width>max)t=t.slice(0,-2)+'…';return t;}
 function wrap(g,text,x,y,max,lh,lines){const words=String(text).split(' ');let line='',n=0;for(const w of words){const test=line?line+' '+w:w;if(g.measureText(test).width>max&&line){g.fillText(line,x,y+n*lh);n++;line=w;if(n>=lines-1){line=clip(g,words.slice(words.indexOf(w)).join(' '),max);break;}}else line=test;}g.fillText(line,x,y+n*lh);}

 window.AfriShare={open,card,utm,caption,TARGETS:TARGETS.map(t=>t[0])};
 // Any element with data-share-open opens the sheet with its data attributes.
 document.addEventListener('click',ev=>{const b=ev.target.closest?.('[data-share-open]');if(!b)return;ev.preventDefault();open({kind:b.dataset.shareKind||'page',url:b.dataset.shareUrl||location.href,title:b.dataset.shareTitle||document.title,text:b.dataset.shareText,image:b.dataset.shareImage||null,imageName:b.dataset.shareImageName});});
})();
