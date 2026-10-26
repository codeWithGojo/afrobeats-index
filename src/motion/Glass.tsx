import React from 'react';
import {createRoot, type Root} from 'react-dom/client';
import {animate, stagger, MotionConfig} from 'motion/react';
import {HtmlRanking, type HtmlRow} from './Ranking';
import {spring} from '../../shared/motion/config';

declare global {interface Window {AfriGlassMotion:{list:(element:HTMLElement,html:string)=>void}}}
const roots=new Map<HTMLElement,Root>();
window.AfriGlassMotion={list(element,html){
  const template=document.createElement('template');template.innerHTML=html;
  const rows:HtmlRow[]=Array.from(template.content.children).map((el,i)=>({key:el.getAttribute('data-key')||String(i),tag:el.tagName.toLowerCase(),html:el.innerHTML,attrs:Object.fromEntries(Array.from(el.attributes).map(a=>[a.name==='class'?'className':a.name,a.value]))}));
  let root=roots.get(element);if(!root){element.replaceChildren();root=createRoot(element);roots.set(element,root);}
  root.render(<MotionConfig reducedMotion="user"><HtmlRanking rows={rows}/></MotionConfig>);
}};
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const seen=new WeakSet<Element>();
const selector='.hero-artist,.panel,.certification-card,.current-row,.movers-items a,#alltime .border-t>.flex,.index-heading,.chart-section-head,.receipt-page-head';
const observer=new IntersectionObserver(entries=>{
  const visible=entries.filter(entry=>entry.isIntersecting&&!seen.has(entry.target));
  visible.forEach(({target})=>{seen.add(target);observer.unobserve(target);});
  if(reduced.matches)return;
  visible.forEach(({target},i)=>{
    if(target.hasAttribute('data-motion-owned')||target.hasAttribute('data-certification')||target.closest('[data-sort-managed]'))return;
    const card=target.matches('.hero-artist,.panel');
    animate(target,{opacity:[.15,1],x:card?[0,0]:[-16,0],y:card?[24,0]:[0,0],scale:card?[.975,1]:[1,1]},{duration:.4,delay:Math.min(i*.04,.24),ease:'easeOut'});
    target.querySelectorAll<HTMLElement>('.current-score>strong,.artist-stat-grid strong,.compare-score').forEach(el=>{
      if(el.dataset.glassCounted)return;
      const raw=el.textContent?.trim()||'';if(!/^\d+(\.\d+)?$/.test(raw))return;
      el.dataset.glassCounted='true';const value=Number(raw),digits=(raw.split('.')[1]||'').length;
      animate(0,value,{duration:.8,ease:'easeOut',onUpdate:n=>{el.textContent=n.toFixed(digits);},onComplete:()=>{el.textContent=raw;}});
    });
    target.querySelectorAll<HTMLElement>('.current-score>i,.score-track>span,.compare-bar>span').forEach(el=>{
      el.style.transformOrigin='left';animate(el,{scaleX:[0,1]},{duration:.7,delay:.1,ease:'easeOut'});
    });
  });
},{threshold:.06});
function scan(root:ParentNode){root.querySelectorAll(selector).forEach(el=>{if(!seen.has(el))observer.observe(el);});}
function init(){
  scan(document);
  const main=document.querySelector('#studio')||document.querySelector('#main-content');
  let frame=0;
  if(main)new MutationObserver(()=>{if(!frame)frame=requestAnimationFrame(()=>{frame=0;scan(main);});}).observe(main,{childList:true,subtree:true});
  const controls=new Map<Element,ReturnType<typeof animate>>();
  const play=(el:HTMLElement,scale:number,y=0)=>{controls.get(el)?.stop();controls.set(el,animate(el,{scale,y},spring));};
  const closest=(event:PointerEvent)=>event.target instanceof Element?event.target.closest<HTMLElement>('button:not(:disabled),.hero-artist,.certification-card,.current-row,.app-brand,.app-bottom-nav a'):null;
  document.addEventListener('pointerover',event=>{const el=closest(event);if(!el||reduced.matches||event.pointerType!=='mouse'||el.contains(event.relatedTarget as Node))return;play(el,el.matches('.current-row')?1.008:1.035,el.matches('.hero-artist,.certification-card')?-5:0);});
  document.addEventListener('pointerout',event=>{const el=closest(event);if(el&&!reduced.matches&&!el.contains(event.relatedTarget as Node))play(el,1);});
  let pressed:HTMLElement|null=null;
  document.addEventListener('pointerdown',event=>{pressed=closest(event);if(pressed&&!reduced.matches)play(pressed,.96);});
  document.addEventListener('pointerup',()=>{if(pressed&&!reduced.matches)play(pressed,1);pressed=null;});
  document.addEventListener('pointercancel',()=>{if(pressed)play(pressed,1);pressed=null;});
  document.querySelectorAll<HTMLElement>('.hero-artist').forEach(card=>{
    let frame=0,px=50,py=50;
    card.addEventListener('pointermove',event=>{if(reduced.matches||event.pointerType!=='mouse')return;const r=card.getBoundingClientRect();px=(event.clientX-r.left)/r.width*100;py=(event.clientY-r.top)/r.height*100;if(!frame)frame=requestAnimationFrame(()=>{frame=0;card.style.setProperty('--shine-x',px+'%');card.style.setProperty('--shine-y',py+'%');});});
  });
  document.querySelectorAll('details').forEach(details=>details.addEventListener('toggle',()=>{if(details.open&&!reduced.matches){const children=Array.from(details.children).filter(el=>el.tagName!=='SUMMARY');animate(children,{opacity:[0,1],y:[8,0]},{duration:.35,delay:stagger(.03),ease:'easeOut'});}}));
  document.querySelectorAll<HTMLElement>('.nav-btn[data-tab],.app-bottom-nav [data-mobile-tab]').forEach(button=>button.addEventListener('click',()=>{
    if(reduced.matches)return;const section=document.querySelector('.tab-content.active');if(section)animate(section,{opacity:[.35,1],y:[16,0]},{duration:.4,ease:'easeOut'});
  }));
  document.addEventListener('visibilitychange',()=>{document.documentElement.classList.toggle('glass-paused',document.hidden);});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
