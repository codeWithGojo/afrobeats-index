/* Sponsor slots: fills [data-sponsor-slot] placeholders from /api/product?service=sponsors.
   Three fixed slots only (newsletter header, one Artists to Watch card, "Presented by" on one board).
   Every placement says "Sponsored" with a disclosure. One impression per slot per page view; clicks via beacon. */
(function(){
 'use strict';
 const holders=[...document.querySelectorAll('[data-sponsor-slot]')];if(!holders.length)return;
 const e=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const send=(slot,kind)=>{const body=JSON.stringify({slot,kind});try{if(navigator.sendBeacon&&navigator.sendBeacon('/api/product?service=sponsors&action=event',new Blob([body],{type:'application/json'})))return;}catch{}fetch('/api/product?service=sponsors&action=event',{method:'POST',headers:{'Content-Type':'application/json'},body,keepalive:true}).catch(()=>{});try{window.va?.('event',{name:'sponsor_'+kind,data:{slot}});}catch{}};
 const disclosure='A paid placement. Sponsors never affect rankings, scores or movement.';
 const markup={
  'watch-inline':s=>`<article class="sponsor-card"><p class="sponsor-label">Sponsored · ${e(s.sponsorName)}</p>${s.logoUrl?`<img src="${e(s.logoUrl)}" alt="" width="48" height="48" loading="lazy">`:''}<h2>${e(s.headline||s.sponsorName)}</h2>${s.copy?`<p>${e(s.copy)}</p>`:''}<a class="sponsor-cta" href="${e(s.url)}" target="_blank" rel="sponsored noopener">${e(s.ctaLabel)}</a><p class="sponsor-disclosure">${disclosure} <a href="/sponsor#policy">How sponsors work</a></p></article>`,
  'board-presented-by':s=>`<span class="sponsor-label">Sponsored</span> Presented by <a href="${e(s.url)}" target="_blank" rel="sponsored noopener">${e(s.sponsorName)}</a> <a class="sponsor-disclosure-link" href="/sponsor#policy" title="${e(disclosure)}">About this</a>`,
  'newsletter-header':s=>`<p class="sponsor-label">Sponsored · ${e(s.sponsorName)}</p>${s.headline?`<strong>${e(s.headline)}</strong>`:''}${s.copy?`<p>${e(s.copy)}</p>`:''}<a class="sponsor-cta" href="${e(s.url)}" target="_blank" rel="sponsored noopener">${e(s.ctaLabel)}</a><p class="sponsor-disclosure">${disclosure}</p>`};
 fetch('/api/product?service=sponsors&action=active').then(r=>r.ok?r.json():{slots:[]}).then(({slots=[]})=>{
  const io='IntersectionObserver' in window?new IntersectionObserver(es=>es.forEach(x=>{if(x.isIntersecting&&x.intersectionRatio>=.5){io.unobserve(x.target);if(x.target.dataset.sponsorId)send(x.target.dataset.sponsorId,'impression');}}),{threshold:.5}):null;
  for(const h of holders){
   const s=slots.find(x=>x.slot===h.dataset.sponsorSlot&&(x.slot!=='board-presented-by'||x.board===h.dataset.board));
   if(!s||!markup[s.slot])continue;
   h.innerHTML=markup[s.slot](s);h.hidden=false;h.classList.add('sponsor-slot','sponsor-slot-'+s.slot);
   if(s.id){h.dataset.sponsorId=s.id;io?.observe(h);h.querySelectorAll('a[rel~="sponsored"]').forEach(a=>a.addEventListener('click',()=>send(s.id,'click')));}
  }
 }).catch(()=>{});
})();
