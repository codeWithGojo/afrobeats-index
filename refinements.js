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
    const script=document.createElement('script');script.src='/assets/glass-motion.js';script.defer=true;document.head.append(script);
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
