/* Small, progressive motion layer. Every page and native disclosure works without it. */
(() => {
 const reduced=matchMedia('(prefers-reduced-motion:reduce)');
 const seen=new WeakSet(),bound=new WeakSet(),pending=new Set();
 const selectors='[data-visual-reveal],.release-heading,.brief-section,.brief-edition,.watch-card,.publication-watch-grid>a,.index-route-grid>a,.pro-plans>article,.ranking-directory>a';
 const observer='IntersectionObserver' in window?new IntersectionObserver(entries=>entries.forEach(entry=>{
  if(entry.isIntersecting){entry.target.classList.add('is-shown');observer.unobserve(entry.target);pending.delete(entry.target);}
 }),{threshold:.08,rootMargin:'0px 0px -12px 0px'}):null;
 function reveals(root){
  for(const old of pending)if(!old.isConnected){observer?.unobserve(old);pending.delete(old);}
  const groups=[...(root.matches?.(selectors)?[root]:[]),...root.querySelectorAll(selectors)];
  groups.forEach(group=>{
   if(seen.has(group))return;seen.add(group);
   if(reduced.matches||!observer)return;
   group.classList.add('t-stagger');
   [...group.children].filter(child=>!child.hidden).forEach((child,index)=>{
    child.classList.add('t-stagger-line');child.style.transitionDelay=`calc(var(--stagger-stagger) * ${Math.min(index,3)})`;
   });
   pending.add(group);observer.observe(group);
  });
 }
 const milliseconds=(node,name)=>{const value=getComputedStyle(node).getPropertyValue(name).trim();return value.endsWith('ms')?parseFloat(value):parseFloat(value)*1000;};
 function disclosures(root){
  root.querySelectorAll('.release-reminder,.release-announcement,.visual-disclosure').forEach(details=>{
   if(bound.has(details))return;bound.add(details);
   const head=details.querySelector(':scope>summary');if(!head)return;
   const panel=document.createElement('div'),inner=document.createElement('div');
   panel.className='t-acc-panel';inner.className='t-acc-panel-inner';
   while(head.nextSibling)inner.append(head.nextSibling);
   panel.append(inner);details.append(panel);details.classList.add('t-acc');
   details.dataset.open=String(details.open);head.setAttribute('aria-expanded',String(details.open));
   panel.inert=!details.open;panel.setAttribute('aria-hidden',String(!details.open));
   const svg=head.querySelector('svg');if(svg)svg.classList.add('t-acc-chevron');
   let timer;
   const setOpen=open=>{
    clearTimeout(timer);
    if(open){details.open=true;void panel.offsetHeight;}
    details.dataset.open=String(open);head.setAttribute('aria-expanded',String(open));
    panel.inert=!open;panel.setAttribute('aria-hidden',String(!open));
    if(!open){const duration=reduced.matches?0:milliseconds(details,'--acc-collapse');timer=setTimeout(()=>{if(details.dataset.open==='false')details.open=false;},duration);}
   };
   details.addEventListener('afri:expand',()=>setOpen(true));
   head.addEventListener('click',event=>{event.preventDefault();setOpen(details.dataset.open!=='true');});
  });
 }
 function target(){
  if(!location.hash)return;
  let element;try{element=document.getElementById(decodeURIComponent(location.hash.slice(1)));}catch{return;}
  if(!element)return;
  let details=element.closest('details');
  while(details){details.dispatchEvent(new Event('afri:expand'));if(!details.classList.contains('t-acc'))details.open=true;details=details.parentElement?.closest('details');}
 }
 function init(root=document){reveals(root);disclosures(root);}
 init();target();
 document.addEventListener('afri:visual-content',event=>init(event.detail?.root||document));
 addEventListener('hashchange',target);
 reduced.addEventListener('change',()=>{if(reduced.matches){pending.forEach(node=>node.classList.add('is-shown'));observer?.disconnect();pending.clear();}});
})();
