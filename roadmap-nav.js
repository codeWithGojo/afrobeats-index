(function(){
 const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function start(){
 const original=window.showTab;if(original)window.showTab=function(id){original(id);const url=new URL(location.href);url.searchParams.set('tab',id);history.replaceState({},'',url);};
 if('serviceWorker'in navigator)navigator.serviceWorker.register('/sw.js').catch(()=>{});
 const destinations=[['/boards','BOARDS'],['/calendar/awards','AWARDS'],['/calendar/live','LIVE'],['/account','MY BOARD'],['/studio/sandbox','SANDBOX']];
 const nav=document.querySelector('.nav-scroll');if(nav)for(const [href,title] of destinations){const a=document.createElement('a');a.href=href;a.textContent=title+' ↗';a.className='nav-btn';nav.append(a);}
 const params=new URLSearchParams(location.search);if(params.get('tab')&&document.getElementById(params.get('tab')))window.showTab?.(params.get('tab'));
 const dialog=document.createElement('dialog');dialog.className='afri-command';dialog.innerHTML='<form method="dialog"><button aria-label="Close search">Close</button></form><label>Jump to an artist or view<input type="search" autofocus></label><div></div>';document.body.append(dialog);
 const input=dialog.querySelector('input'),results=dialog.querySelector('div');let all=[];
 const render=()=>{const q=input.value.toLowerCase();results.innerHTML=destinations.filter(([,name])=>name.toLowerCase().includes(q)).map(([href,name])=>`<a href="${href}">${name}</a>`).join('')+all.filter(a=>a.name.toLowerCase().includes(q)).slice(0,10).map(a=>`<a href="/current/${a.slug}">${escape(a.name)}</a>`).join('');};input.oninput=render;
 document.addEventListener('keydown',async event=>{if(event.key==='/'&&!/INPUT|TEXTAREA|SELECT/.test(event.target.tagName)&&!event.target.isContentEditable){event.preventDefault();dialog.showModal();input.focus();if(!all.length)try{all=(await fetch('/api/rankings').then(r=>r.json())).artists;}catch{}render();}});
 const current=document.getElementById('current');if(current){const a=document.createElement('a');a.href='/discover';a.textContent='Movers, ranking cards & discovery ↗';current.prepend(a);}
 // Supabase may send an existing allowlisted callback to the site root. Keep those
 // account credentials on this origin and hand them to the shared account page.
 if(new URLSearchParams(location.hash.slice(1)).has('access_token')&&!params.has('code'))location.replace('/account'+location.hash);
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();
