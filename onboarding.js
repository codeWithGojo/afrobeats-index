/* 30-second onboarding (first visit only) and the "Your artists this week" homepage module.
   The panel is not modal: the page stays usable behind it, every step can be skipped, Escape closes it. */
(function(){
 'use strict';
 const P=window.AfriPrefs;if(!P)return;
 const e=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const GENRES=['Afrobeats','Amapiano','Afropop','Alte','Street-pop','Hip-hop','Afro R&B','Highlife'];
 const REGIONS=[['','Anywhere'],['naija','Naija'],['ghana','Ghana'],['south-africa','South Africa'],['east-africa','East Africa']];
 const genreMatch=(a,g)=>(a.genres||[]).some(x=>String(x).toLowerCase().replace(/[^a-z&]/g,'').includes(g.toLowerCase().replace(/[^a-z&]/g,'').replace('afror&b','r&b')));
 let data=null;const load=async()=>data||(data=await Promise.all([fetch('/data/current-lite.json').then(r=>r.json()),fetch('/data/upcoming-releases.json').then(r=>r.ok?r.json():{releases:[]}).catch(()=>({releases:[]}))]).then(([c,u])=>({artists:[...c.artists].sort((a,b)=>a.rank-b.rank),releases:u.releases||[]})));

 // Homepage: Your artists this week
 async function renderYours(prefs=P.get()){
  const box=document.getElementById('your-artists');if(!box)return;
  if(!prefs.artists.length&&!prefs.genres.length){box.hidden=true;return;}
  const {artists,releases}=await load(),mine=prefs.artists.map(s=>artists.find(a=>a.slug===s)).filter(Boolean);
  const today=new Date().toISOString().slice(0,10);
  const nextRelease=a=>releases.filter(r=>r.date>=today&&String(r.artist).toLowerCase().split(/\s*(?:,|&|x|feat\.?)\s*/).includes(a.name.toLowerCase())).sort((x,y)=>x.date.localeCompare(y.date))[0];
  const move=a=>{if(!Number.isFinite(a.previousRank))return 'New';const d=a.previousRank-a.rank;return d>0?`Up ${d}`:d<0?`Down ${-d}`:'No change';};
  const more=prefs.genres.length?artists.filter(a=>!prefs.artists.includes(a.slug)&&prefs.genres.some(g=>genreMatch(a,g))).slice(0,4):[];
  const region=REGIONS.find(([id])=>id&&id===prefs.region);
  box.hidden=false;
  box.innerHTML=`<div class="yours-head"><h2 id="your-artists-title">Your artists this week</h2><button type="button" class="yours-edit" data-onboarding-open>Edit picks</button></div>
   ${mine.length?`<div class="yours-grid">${mine.map(a=>{const r=nextRelease(a),d=Number.isFinite(a.previousRank)?a.previousRank-a.rank:null;return `<a class="yours-card" href="/current/${e(a.slug)}"><img src="/artists/${e(a.slug)}-160.webp" alt="" width="56" height="56" loading="lazy" decoding="async"><span><strong>${e(a.name)}</strong><small>#${a.rank} · <b class="${d>0?'is-up':d<0?'is-down':''}">${move(a)}</b> · ${a.score.toFixed(1)} pts</small><small>${r?`Next: ${e(r.title)} (${e(r.type)}), ${e(r.date)}`:'No announced release'}</small></span></a>`;}).join('')}</div>`:'<p class="yours-muted">Pick a few artists to follow their ranks here.</p>'}
   ${more.length?`<p class="yours-more">More in ${prefs.genres.map(e).join(', ')}: ${more.map(a=>`<a href="/current/${e(a.slug)}">${e(a.name)}</a>`).join(', ')}.</p>`:''}
   <p class="yours-links">${region?`<a href="/boards/${e(region[0])}">${e(region[1])} board →</a> · `:''}<a href="/music-receipt">Receipt with your picks →</a> · <a href="/my-index">Grade them in My Index →</a></p>`;
  box.querySelector('[data-onboarding-open]').addEventListener('click',()=>open(true));
 }

 // Onboarding panel
 let panel=null,started=0,step=0;const picks={artists:[],genres:[],region:null};
 function close(reason){if(!panel)return;if(reason)P.track('onboarding_skip',{step:step+1});panel.remove();panel=null;document.removeEventListener('keydown',onKey);}
 const onKey=ev=>{if(ev.key==='Escape'){const p=P.get();if(!p.onboarding)P.set({onboarding:'skipped'});close('escape');}};
 async function open(editing=false){
  if(panel)return;const prefs=P.get();Object.assign(picks,{artists:[...prefs.artists],genres:[...prefs.genres],region:prefs.region});
  step=0;started=Date.now();panel=document.createElement('section');panel.className='onboard';panel.setAttribute('role','region');panel.setAttribute('aria-labelledby','onboard-title');
  // Data first, then render, then attach: the sheet appears at its final size (no layout shift).
  await load();if(!panel)return;render();
  document.body.append(panel);document.addEventListener('keydown',onKey);
  if(!editing)P.track('onboarding_shown');
  panel.querySelector('[data-search]')?.focus({preventScroll:true});
 }
 function next(){P.track('onboarding_step',{step:step+1});step++;if(step>2)return finish();render();}
 function finish(){P.set({...picks,onboarding:'done'});P.track('onboarding_complete',{seconds:Math.round((Date.now()-started)/1000),artists:picks.artists.length,genres:picks.genres.length});close();renderYours();}
 function render(){
  const dots=`<span class="onboard-dots" role="img" aria-label="Step ${step+1} of 3">${[0,1,2].map(i=>`<i class="${i===step?'is-on':''}"></i>`).join('')}</span>`;
  const head=(title,sub)=>`<header class="onboard-head">${dots}<button type="button" class="onboard-close" data-close aria-label="Close">×</button></header><h2 id="onboard-title">${title}</h2><p class="onboard-sub">${sub}</p>`;
  const foot=(label,disabled)=>`<footer class="onboard-foot"><button type="button" class="onboard-skip" data-skip>Skip</button><button type="button" class="onboard-next" data-next ${disabled?'disabled':''}>${label}</button></footer>`;
  if(step===0){
   const {artists}=data;
   panel.innerHTML=`${head('Pick 3 favourites','We will keep them at the top of your homepage.')}<label class="onboard-search"><span class="sr-only">Search artists</span><input type="search" placeholder="Search the Current 50" autocomplete="off" data-search></label><div class="onboard-artists" data-list>${artists.map(a=>`<button type="button" class="onboard-artist" data-artist="${e(a.slug)}" data-name="${e(a.name.toLowerCase())}" aria-pressed="${picks.artists.includes(a.slug)}">${document.documentElement.classList.contains('lite')?'':`<img src="/artists/${e(a.slug)}-160.webp" alt="" width="64" height="64" loading="lazy" decoding="async">`}<span>${e(a.name)}</span></button>`).join('')}</div>${foot(`Next (${picks.artists.length}/3)`,!picks.artists.length)}`;
   panel.querySelector('[data-search]').addEventListener('input',ev=>{const q=ev.target.value.trim().toLowerCase();panel.querySelectorAll('[data-artist]').forEach(b=>b.hidden=!!q&&!b.dataset.name.includes(q));});
   panel.querySelectorAll('[data-artist]').forEach(b=>b.addEventListener('click',()=>{const s=b.dataset.artist,i=picks.artists.indexOf(s);if(i>=0)picks.artists.splice(i,1);else if(picks.artists.length<3)picks.artists.push(s);else return;b.setAttribute('aria-pressed',String(i<0));const n=panel.querySelector('[data-next]');n.textContent=`Next (${picks.artists.length}/3)`;n.disabled=!picks.artists.length;if(picks.artists.length===3)n.focus();}));
  }else if(step===1){
   panel.innerHTML=`${head('Pick 1 to 3 sounds','And where you like your music from, if you want.')}<div class="onboard-chips">${GENRES.map(g=>`<button type="button" data-genre="${e(g)}" aria-pressed="${picks.genres.includes(g)}">${e(g)}</button>`).join('')}</div><label class="onboard-region">Region (optional)<select data-region>${REGIONS.map(([id,n])=>`<option value="${id}" ${picks.region===id?'selected':''}>${n}</option>`).join('')}</select></label>${foot('Next',false)}`;
   panel.querySelectorAll('[data-genre]').forEach(b=>b.addEventListener('click',()=>{const g=b.dataset.genre,i=picks.genres.indexOf(g);if(i>=0)picks.genres.splice(i,1);else if(picks.genres.length<3)picks.genres.push(g);else return;b.setAttribute('aria-pressed',String(i<0));}));
   panel.querySelector('[data-region]').addEventListener('change',ev=>{picks.region=ev.target.value||null;});
  }else{
   panel.innerHTML=`${head('Want more?','Both optional. You can do either later.')}<div class="onboard-options"><a class="onboard-option" href="/stats" data-option="stats"><strong>Connect your listening</strong><span>See your top African artists from Spotify, Last.fm or your history file.</span></a><a class="onboard-option" href="/newsletter" data-option="brief"><strong>Get the Sunday brief</strong><span>Top 10, movers and one artist to hear, every Sunday.</span></a></div>${foot('Done',false)}`;
   panel.querySelectorAll('[data-option]').forEach(a=>a.addEventListener('click',()=>{P.set({...picks,onboarding:'done'});P.track('onboarding_complete',{seconds:Math.round((Date.now()-started)/1000),option:a.dataset.option});}));
  }
  panel.querySelector('[data-close]').addEventListener('click',()=>{if(!P.get().onboarding)P.set({onboarding:'skipped'});close('close');});
  panel.querySelector('[data-skip]').addEventListener('click',()=>{P.track('onboarding_skip',{step:step+1});if(step===2)return finish();step++;render();});
  panel.querySelector('[data-next]').addEventListener('click',next);
  if(step===0)panel.querySelector('[data-search]').focus({preventScroll:true});
 }
 // Expose for "Edit picks" and the footer link; start on a first visit only.
 window.AfriOnboarding={open:()=>open(true)};
 document.addEventListener('click',ev=>{if(ev.target.closest('[data-onboarding-open]')){ev.preventDefault();open(true);}});
 (async()=>{const prefs=await P.pull();renderYours(prefs);if(!prefs.onboarding&&!/[?&]no-onboarding/.test(location.search))setTimeout(()=>open(false),1200);})();
 window.addEventListener('afri:prefs',ev=>renderYours(ev.detail));
})();
