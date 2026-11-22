(function(){const paths={current:'/current',alltime:'/all-time',albums:'/albums',networth:'/net-worth',method:'/method',underground:'/watch',vs:'/compare',receipt:'/music-receipt',regions:'/regions',yearly:'/releases',artists:'/artists',discuss:'/discussion',news:'/news',top100:'/top100'};
 if(location.pathname==='/'&&new URLSearchParams(location.hash.slice(1)).has('access_token'))location.replace('/account'+location.hash);
 const old=new URLSearchParams(location.search).get('tab');if(location.pathname==='/'&&paths[old])location.replace(paths[old]+location.hash);
 document.addEventListener('DOMContentLoaded',()=>{const id=document.body.dataset.routeTab;if(id){document.querySelectorAll('.tab-content').forEach(s=>s.classList.toggle('active',s.id===id));}document.querySelectorAll('a[href^="/?tab="]').forEach(a=>{const u=new URL(a.href);a.href=(paths[u.searchParams.get('tab')]||a.getAttribute('href'))+u.hash;});});
})();

// Return to the actual chart entry so its scroll position and filters survive.
document.addEventListener('click', event => {
  const link = event.target.closest?.('[data-artist-back]');
  if (!link || event.button || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  const previous = window.navigation?.entries().find(entry => entry.index === window.navigation.currentEntry.index - 1);
  if (!previous?.url) return;
  const url = new URL(previous.url);
  if (url.origin !== location.origin || !['/', '/current', '/artists', '/rankings'].includes(url.pathname)) return;
  event.preventDefault();
  history.back();
});
