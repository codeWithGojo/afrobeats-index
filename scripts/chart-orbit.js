import {gsap} from 'gsap';
import {ScrollTrigger} from 'gsap/ScrollTrigger';
const section=document.querySelector('.orbit');
if(section){
  const match=gsap.matchMedia();
  match.add({desktop:'(min-width:768px)',mobile:'(max-width:767px)',reduce:'(prefers-reduced-motion:reduce)',short:'(max-height:540px)'},({conditions})=>{
    if(conditions.reduce||conditions.short)return;
    gsap.registerPlugin(ScrollTrigger);
    const slots=[...section.querySelectorAll('.orbit-slot')].slice(0,conditions.mobile?5:10);
    const cards=slots.map(slot=>slot.firstElementChild);
    const head=section.querySelector('.orbit-head'),phone=section.querySelector('.orbit-phone'),list=section.querySelector('.phone-list'),light=section.querySelector('.orbit-light');
    let trigger;
    function paint(progress){
      const enter=Math.min(1,progress/.3),exit=Math.max(0,(progress-.7)/.3);
      const spin=Math.max(0,Math.min(1,(progress-.3)/.4));
      slots.forEach((slot,i)=>{
        const angle=i*2*Math.PI/slots.length+.35+spin*2.25;
        const depth=(Math.sin(angle)+1)/2;
        slot.style.transform='translate('+Math.cos(angle)*41+'%,'+(Math.sin(angle)*19+exit*8)+'%)';
        slot.style.zIndex=Math.round(depth*90);
        slot.classList.toggle('orbit-back',depth<.25);
        cards[i].style.transform='translate(-50%,-50%) scale('+((.62+.42*depth)*(.92+.08*enter))+')';
        cards[i].style.opacity=(.45+.55*depth)*(.86+.14*enter);
      });
      if(!head.contains(document.activeElement)){
        head.style.transform='translateY('+(-exit*32)+'px) scale('+(.97+.03*enter)+')';
        head.style.opacity=(.92+.08*enter)*(1-exit*.9);
      }
      phone.style.transform='translate(-50%,calc(-50% + '+((1-enter)*22)+'px)) rotate(-5deg)';
      list.style.transform='translateY('+(-spin*(conditions.mobile?120:85))+'px)';
      light.style.opacity=.64+exit*.36;
    }
    const observer=new IntersectionObserver(([entry])=>{
      if(entry.isIntersecting&&!trigger) trigger=ScrollTrigger.create({trigger:section,start:'top top',end:'bottom bottom',animation:gsap.fromTo({p:0},{p:0},{p:1,ease:'none',onUpdate:function(){paint(this.targets()[0].p)}}),scrub:true});
      else if(!entry.isIntersecting&&trigger){trigger.kill(true,true);trigger.animation?.kill();trigger=null;}
    });
    observer.observe(section);
    return ()=>{observer.disconnect();trigger?.kill();for(const node of [...slots,...cards,head,phone,list,light]){for(const prop of ['transform','opacity','z-index'])node.style.removeProperty(prop)}};
  });
  if(!matchMedia('(prefers-reduced-motion:reduce)').matches){
    const scores=new IntersectionObserver(entries=>entries.forEach(({target,isIntersecting})=>{
      if(!isIntersecting)return;
      scores.unobserve(target);
      const node=target.firstChild,end=Number.parseFloat(node.textContent);
      if(Number.isFinite(end))gsap.fromTo({n:Math.max(0,end-5)},{n:Math.max(0,end-5)},{n:end,duration:.45,onUpdate:function(){node.textContent=this.targets()[0].n.toFixed(1)+' '}});
    }));
    document.querySelectorAll('.hero-photo-copy b,.publication-chart-list a>b').forEach(node=>scores.observe(node));
  }
}

