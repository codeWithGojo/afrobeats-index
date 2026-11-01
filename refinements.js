/* Shared controls: palette, account navigation and efficient entrance motion. */
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
    // Runtime-rendered links follow the same convention as the static pages.
    const normalizeArrows = root => {
      const links = root.nodeType===1 ? [...(root.matches('a[href]')?[root]:[]),...root.querySelectorAll('a[href]')] : [];
      for(const link of links){
        if(new URL(link.href,location.href).origin!==location.origin)continue;
        const walker=document.createTreeWalker(link,NodeFilter.SHOW_TEXT);
        let node;while((node=walker.nextNode()))if(node.nodeValue.includes('↗'))node.nodeValue=node.nodeValue.replaceAll('↗','→');
      }
    };
    normalizeArrows(document.body);
    new MutationObserver(records=>{for(const record of records)for(const node of record.addedNodes)normalizeArrows(node);}).observe(document.body,{childList:true,subtree:true});
    const path=location.pathname.replace(/\/$/,'')||'/';
    document.querySelectorAll('.app-primary a,.app-bottom-nav a').forEach(link=>{
      const target=new URL(link.href).pathname;
      if(path===target||path.startsWith(target+'/'))link.setAttribute('aria-current','page');
    });
    import('/account-nav.js').catch(()=>{});
    const script=document.createElement('script');script.src='/assets/glass-motion.js';script.defer=true;document.head.append(script);
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
