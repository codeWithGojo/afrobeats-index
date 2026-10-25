/* Presentation only: palette, feedback and efficient entrance motion. */
(() => {
  const init = () => {
    const toggle = document.getElementById('theme-toggle');
    const sync = () => {
      const light = document.documentElement.dataset.theme === 'light';
      toggle?.setAttribute('aria-pressed',String(light));
      toggle?.setAttribute('aria-label',light?'Switch to dark mode':'Switch to light mode');
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content',light?'#f6f7f0':'#0b0b0c');
    };
    toggle?.addEventListener('click',()=>{
      const theme = document.documentElement.dataset.theme === 'light'?'dark':'light';
      document.documentElement.dataset.theme=theme;
      try {localStorage.setItem('afri-theme',theme);}catch{}
      sync();
    });
    sync();
    const query = matchMedia('(prefers-reduced-motion: reduce)');
    const seen = new WeakSet();
    const reveal = el => {
      if (seen.has(el) || !el.getBoundingClientRect().height) return;
      seen.add(el);
      if (!query.matches) el.animate([{opacity:.35,transform:'translateY(12px)'},{opacity:1,transform:'translateY(0)'}],{duration:320,easing:'cubic-bezier(.2,.7,.2,1)'});
    };
    const observer = new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){reveal(entry.target);observer.unobserve(entry.target);}}),{threshold:.05});
    const scan = root => root.querySelectorAll('.panel,.certification-card,.award-season,.hero-photo,.current-row,#alltime .border-t>.flex').forEach(el=>{if(!seen.has(el))observer.observe(el);});
    scan(document);
    let frame=0;
    const main=document.getElementById('studio')||document.getElementById('main-content');
    if(main)new MutationObserver(()=>{if(!frame)frame=requestAnimationFrame(()=>{frame=0;scan(main);});}).observe(main,{childList:true,subtree:true});
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
