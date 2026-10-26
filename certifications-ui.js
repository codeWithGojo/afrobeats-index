/* Observe dynamically loaded artist/calendar plaques; each shines once per page visit. */
(()=>{const reduce=matchMedia('(prefers-reduced-motion: reduce)'),seen=new WeakSet();
 const observer='IntersectionObserver'in window?new IntersectionObserver(entries=>{for(const {target,isIntersecting}of entries){if(!isIntersecting)continue;observer.unobserve(target);if(seen.has(target))continue;seen.add(target);target.dataset.certSeen='true';if(!reduce.matches)target.classList.add('cert-shine');}},{threshold:.25}):null;
 function scan(){document.querySelectorAll('[data-certification]:not([data-cert-observed])').forEach(card=>{card.dataset.certObserved='true';if(observer)observer.observe(card);});}
 function init(){scan();const root=document.getElementById('studio')||document.getElementById('main-content');if(root){let queued=false;new MutationObserver(()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;scan();});}).observe(root,{childList:true,subtree:true});}}
 reduce.addEventListener('change',()=>{if(reduce.matches)document.querySelectorAll('.cert-shine').forEach(c=>c.classList.remove('cert-shine'));});
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
