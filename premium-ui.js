/* Small presentation controller. It never writes artist records or ranking scores. */
(() => {
  'use strict';
  const $ = selector => document.querySelector(selector);
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  function syncNavigation() {
    const view = $('.tab-content.active')?.id || (location.pathname === '/account' ? 'profile' : location.pathname.startsWith('/vs/') ? 'vs' : location.pathname.startsWith('/receipt/') ? 'receipt' : '');
    document.body.dataset.view = view;
    document.querySelectorAll('.app-bottom-nav [data-nav-view]').forEach(link => {
      if (link.dataset.navView === view) link.setAttribute('aria-current','page'); else link.removeAttribute('aria-current');
    });
    document.querySelectorAll('.app-primary [data-tab]').forEach(button => button.classList.toggle('nav-active',button.dataset.tab === view));
    $('#more-menu')?.removeAttribute('open');
  }
  function labelTables(root = document) {
    root.querySelectorAll('table').forEach(table => {
      const labels = Array.from(table.querySelectorAll('thead th')).map(th => th.textContent.trim());
      table.querySelectorAll('tbody tr').forEach(row => Array.from(row.cells || []).forEach((cell,i) => {
        if (labels[i] && !cell.dataset.label) cell.dataset.label = labels[i];
      }));
    });
    root.querySelectorAll('img:not([width])').forEach(img => {
      if (img.matches('.profile-art,.compare-portrait,.yearly-art')) {img.width=120;img.height=120;img.loading='lazy';img.decoding='async';}
    });
  }
  function organizeEvidence() {
    const target = $('.chart-secondary-modules');
    if (!target) return;
    for (const [selector,label] of [['.freshness-module','Data freshness & coverage'],['.trending-module','Streaming momentum']]) {
      const module = $(selector);
      if (!module || module.closest('.premium-evidence')) continue;
      const details = document.createElement('details'); details.className = 'premium-evidence';
      const summary = document.createElement('summary'); summary.textContent=label;
      details.append(summary);target.append(details);details.append(module);
    }
  }
  function init() {
    const country=$('#chart-country'),genre=$('#chart-genre');
    const mobileFilters=$('.mobile-filter-details');
    if(mobileFilters){const query=matchMedia('(max-width:767px)');const resize=()=>{mobileFilters.open=!query.matches;};resize();query.addEventListener('change',resize);}
    const syncChips=()=>{
      document.querySelectorAll('[data-country-filter]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.countryFilter===country?.value)));
      document.querySelectorAll('[data-genre-filter]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.genreFilter===genre?.value)));
    };
    document.querySelectorAll('[data-country-filter]').forEach(button=>button.addEventListener('click',()=>{country.value=button.dataset.countryFilter;country.dispatchEvent(new Event('change',{bubbles:true}));syncChips();}));
    document.querySelectorAll('[data-genre-filter]').forEach(button=>button.addEventListener('click',()=>{genre.value=genre.value===button.dataset.genreFilter?'':button.dataset.genreFilter;genre.dispatchEvent(new Event('change',{bubbles:true}));syncChips();}));
    country?.addEventListener('change',syncChips);genre?.addEventListener('change',syncChips);
    const ranking=$('.current-ranking');
    if(ranking){
      let filtering=false;
      new MutationObserver(()=>{
        if(filtering)return;filtering=true;
        requestAnimationFrame(()=>{filtering=false;$('#chart-search')?.dispatchEvent(new Event('input'));syncChips();});
      }).observe(ranking,{childList:true});
    }
    $('#chart-reset')?.addEventListener('click',syncChips);
    document.querySelectorAll('[data-clear-filters]').forEach(button=>button.addEventListener('click',()=>$('#chart-reset')?.click()));
    document.querySelectorAll('[data-mobile-tab]').forEach(link=>link.addEventListener('click',event=>{
      if (typeof window.showTab !== 'function') return;
      event.preventDefault(); window.showTab(link.dataset.mobileTab); syncNavigation();
      window.scrollTo({top:0,behavior:reduced?'instant':'smooth'});
    }));
    if (typeof window.showTab === 'function') {
      const previous=window.showTab;
      window.showTab=function(id){previous(id);syncNavigation();};
    }
    document.querySelectorAll('.hero-method').forEach(link=>link.addEventListener('click',event=>{
      if(typeof window.showTab==='function'){event.preventDefault();window.showTab('method');}
    }));
    document.addEventListener('click',event=>{const menu=$('#more-menu');if(menu?.open&&!menu.contains(event.target))menu.open=false;});
    document.addEventListener('keydown',event=>{if(event.key==='Escape')$('#more-menu')?.removeAttribute('open');});
    const standalone = !$('#studio') && !$('#main-content');
    if (standalone) $('#command-open')?.addEventListener('click',()=>{location.href='/?search=1';});
    if (new URLSearchParams(location.search).has('search')) $('#artist-global-search')?.focus();
    document.addEventListener('error',event=>{
      const img=event.target;
      if(!(img instanceof HTMLImageElement)||!img.dataset.fallbackSrc||img.dataset.premiumFallback)return;
      img.dataset.premiumFallback='true';img.closest('picture')?.querySelectorAll('source').forEach(source=>source.remove());img.src=img.dataset.fallbackSrc;
    },true);
    labelTables();organizeEvidence();syncNavigation();syncChips();
    const root=$('#studio') || $('#main-content');
    if(root){
      let scheduled=false;
      const observer=new MutationObserver(()=>{
        if(scheduled)return;scheduled=true;
        requestAnimationFrame(()=>{scheduled=false;labelTables(root);organizeEvidence();});
      });
      observer.observe(root,{childList:true,subtree:true});
    }
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
