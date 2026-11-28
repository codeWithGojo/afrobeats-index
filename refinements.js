/* Shared controls: palette, account navigation and efficient entrance motion. */
(() => {
  const init = () => {
    function failedPortrait(img){
      if(!img.matches('img')||img.dataset.monogram||!img.closest('.orbit-card,.hero-artist,.current-avatar,.artist-desk-results a,.publication-chart-list a'))return;
      const name=img.alt||img.closest('.orbit-card')?.querySelector('b')?.textContent||img.closest('a')?.dataset.artist||'A/';
      const initials=name.trim().split(/\s+/).slice(0,2).map(word=>word[0]).join('').toUpperCase().replace(/[<>&"']/g,'');
      img.dataset.monogram='true';
      img.src='data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80"><rect width="80" height="80" fill="#343630"/><text x="40" y="51" text-anchor="middle" font-family="sans-serif" font-size="32" fill="#fff">'+initials+'</text></svg>');
    }
    document.addEventListener('error',event=>{if(event.target instanceof HTMLImageElement)failedPortrait(event.target)},true);
    document.querySelectorAll('img').forEach(img=>{if(img.complete&&!img.naturalWidth)failedPortrait(img)});
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
    // The homepage has its own chart motion and no sortable React list.
    if(document.querySelector('.orbit')||document.documentElement.classList.contains('lite'))return; // Lite mode skips the 100 KB motion layer.
    const script=document.createElement('script');script.src='/assets/glass-motion.js';script.defer=true;document.head.append(script);
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
