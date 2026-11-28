// Apply the saved palette before paint. Older email templates can return to /.
(() => {
  try { document.documentElement.dataset.theme = localStorage.getItem('afri-theme') === 'light' ? 'light' : 'dark'; } catch { document.documentElement.dataset.theme = 'dark'; }
  try { const language=JSON.parse(localStorage.getItem('afri-reader-language')||'"en"'); if(['en','fr','pt'].includes(language))document.documentElement.lang=language; const size=JSON.parse(localStorage.getItem('afri-reader-size')||'"normal"'); if(['normal','large','larger'].includes(size))document.documentElement.dataset.readerSize=size; } catch {}
  const hash = new URLSearchParams(location.hash.slice(1));
  const query = new URLSearchParams(location.search);
  // Only old email templates return to the homepage. Spotify owns callbacks on
  // /music-receipt and /studio/playlists; never move their codes to Supabase.
  const legacyEmailReturn = location.pathname === '/' && !query.has('state') &&
    (hash.has('access_token') || hash.has('error_description') || query.has('token_hash') || query.has('code'));
  if (legacyEmailReturn) {
    location.replace('/account' + location.search + location.hash);
  }
})();

// Match the selected chart portrait to its artist file across native navigations.
(() => {
  if (typeof window === 'undefined' || !window.navigation || !('onpageswap' in window)) return;
  const artistPath = /^\/current\/([a-z0-9-]+)\/?$/;
  let selectedLink;
  document.addEventListener('click', event => {
    if (event.target instanceof Element) selectedLink = event.target.closest('a[href]');
  }, true);

  function prepare(event, from, to) {
    if (!event.viewTransition) return;
    const entering = artistPath.exec(to);
    const leaving = artistPath.exec(from);
    if ((!entering && !leaving) || matchMedia('(prefers-reduced-motion: reduce)').matches) {
      event.viewTransition.skipTransition();
      return;
    }
    const slug = (entering || leaving)[1];
    const onFile = artistPath.test(location.pathname);
    const links = [...document.querySelectorAll('a[href="/current/' + slug + '"]')];
    const link = links.includes(selectedLink) ? selectedLink : links.find(el => {
      const box = el.getBoundingClientRect();
      return box.height && box.bottom > 0 && box.top < innerHeight && el.querySelector('img');
    });
    const portrait = onFile ? document.querySelector('.artist-hero-art') : link?.querySelector('img');
    document.documentElement.dataset.artistTravel = entering ? 'in' : 'out';
    if (portrait) portrait.style.viewTransitionName = 'artist-portrait';
    event.viewTransition.finished.finally(() => {
      if (portrait) portrait.style.removeProperty('view-transition-name');
      delete document.documentElement.dataset.artistTravel;
    });
  }
  addEventListener('pageswap', event => {
    if (event.activation) prepare(event, location.pathname, new URL(event.activation.entry.url).pathname);
  });
  addEventListener('pagereveal', event => {
    const previous = window.navigation?.activation?.from?.url;
    if (previous) prepare(event, new URL(previous).pathname, location.pathname);
  });
})();

// Lite mode (Phase 10). Decided before paint so heavy work is never started.
// Preference: 'on' | 'off' | unset (auto). ?lite=1 or ?lite=0 sets it. Auto turns Lite on only for an
// explicit data-saver or a 2G connection; weaker signals (3G, low memory, few cores, reduced motion) only
// suggest it. Safari lacks most of these APIs, so every check is guarded and the toggle always works.
(() => {
  const root=document.documentElement,nav=typeof navigator==='undefined'?{}:navigator;
  let pref=null;try{pref=localStorage.getItem('afri-lite');}catch{}
  const q=typeof location!=='undefined'?new URLSearchParams(location.search).get('lite'):null;
  if(q==='1'||q==='0'){pref=q==='1'?'on':'off';try{localStorage.setItem('afri-lite',pref);}catch{}}
  const c=nav.connection||nav.mozConnection||nav.webkitConnection||null;
  const type=String(c&&c.effectiveType||'');
  const signals={saveData:!!(c&&c.saveData),slow:/^(slow-2g|2g)$/.test(type),threeG:type==='3g',lowMemory:typeof nav.deviceMemory==='number'&&nav.deviceMemory<=2,fewCores:typeof nav.hardwareConcurrency==='number'&&nav.hardwareConcurrency<=4,reducedMotion:!!(typeof window!=='undefined'&&window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches)};
  const strong=signals.saveData||signals.slow,weak=signals.threeG||signals.lowMemory||(signals.fewCores&&signals.lowMemory)||signals.reducedMotion;
  const on=pref==='on'||(pref!=='off'&&strong);
  if(root&&root.classList)root.classList.toggle('lite',on);
  if(typeof window!=='undefined')window.AfriLite={on,pref,signals,auto:!pref&&strong,suggest:!pref&&!strong&&weak,
   set(v){try{v==null?localStorage.removeItem('afri-lite'):localStorage.setItem('afri-lite',v);}catch{}location.reload();}};
  // Web fonts only outside Lite mode (Lite uses system fonts and never downloads font files).
  if(!on&&typeof document!=='undefined'&&document.head&&document.createElement){const l=document.createElement('link');l.rel='stylesheet';l.href='/fonts.css';document.head.appendChild(l);}
  // No cross-page view transitions in Lite mode.
  if(on&&typeof addEventListener==='function')addEventListener('pagereveal',e=>{try{e.viewTransition&&e.viewTransition.skipTransition();}catch{}});
})();
