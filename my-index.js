/* /my-index controller. Guests grade locally; signed-in grades sync and count toward the Community Index.
   Nothing here writes to the official Current 50. */
(async function(){
 'use strict';
 const root=document.getElementById('my-index-app');if(!root)return;
 const M=window.AfriMyIndex,$=s=>root.querySelector(s),e=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const KEY='afri_my_index_v1',load=()=>{try{return JSON.parse(localStorage.getItem(KEY)||'{}');}catch{return {};}},save=()=>{try{localStorage.setItem(KEY,JSON.stringify({set:state.set,grades:state.grades,cursor:state.cursor}));}catch{}};
 const [current,seeds]=await Promise.all([fetch('/data/current-lite.json').then(r=>r.json()),fetch('/data/my-index-templates.json').then(r=>r.json())]);
 const artists=[...current.artists].sort((a,b)=>a.rank-b.rank),label=k=>M.METRICS.find(m=>m.key===k)?.label||state.custom[k]||k.replace(/^custom-/,'').replace(/-/g,' ');
 const saved=load(),seed=seeds.templates.find(t=>t.id===seeds.default);
 const state={set:saved.set||{name:'My Index',pool:seed.pool,metrics:seed.metrics.map(m=>({...m}))},grades:saved.grades||{},cursor:saved.cursor||0,custom:{},user:null,db:null,pro:false,setId:null,tab:'grade',community:null,templates:[]};
 for(const m of state.set.metrics)if(m.key.startsWith('custom-'))state.custom[m.key]=m.label||m.key;
 const status=(msg,kind='')=>{const s=$('#mi-status');if(s){s.textContent=msg;s.dataset.kind=kind;}};

 // Account: optional for personal charts, required to count in the community.
 try{await import('/assets/account.js');const session=await window.AfriAccount.session();if(session){state.user=session.user;state.db=window.AfriAccount.client;}}catch{}
 if(state.db){
  const [{data:pro},{data:sets},{data:grades}]=await Promise.all([state.db.from('pro_subscriptions').select('expires_at'),state.db.from('index_sets').select('*').eq('user_id',state.user.id).order('updated_at',{ascending:false}),state.db.from('index_grades').select('artist_slug,metric,grade')]);
  state.pro=(pro||[]).some(r=>Date.parse(r.expires_at)>Date.now());
  if(sets?.[0]){state.setId=sets[0].id;state.set={name:sets[0].name,pool:sets[0].pool,metrics:sets[0].metrics};state.set.metrics.forEach(m=>{if(m.key.startsWith('custom-'))state.custom[m.key]=m.label||m.key;});}
  for(const g of grades||[])(state.grades[g.artist_slug]||={})[g.metric]=g.grade;
 }
 const {data:published}=state.db?await state.db.from('index_sets').select('id,name,metrics,pool,copies').eq('is_template',true).order('copies',{ascending:false}).limit(12):{data:[]};
 state.templates=published||[];

 const chart=()=>M.personalChart(artists,state.set,state.grades);
 // Grading order: onboarding favourites first, then the official order.
 const favourites=(window.AfriPrefs?.get?.().artists)||[];
 const gradePool=()=>{const base=state.set.pool==='outside-top-20'?artists.filter(a=>a.rank>20):artists;return [...favourites.map(s=>base.find(a=>a.slug===s)).filter(Boolean),...base.filter(a=>!favourites.includes(a.slug))];};
 const limit=()=>state.pro?M.LIMITS.pro.metrics:M.LIMITS.free.metrics;

 function render(){
  root.innerHTML=`<nav class="mi-tabs" role="tablist" aria-label="My Index">${[['setup','1 · Recipe'],['grade','2 · Grade'],['chart','3 · Your chart'],['community','Community'],['templates','Templates']].map(([k,v])=>`<button type="button" role="tab" data-tab="${k}" aria-selected="${state.tab===k}">${v}</button>`).join('')}</nav>
   <p id="mi-status" role="status" aria-live="polite"></p><div id="mi-panel"></div>
   <p class="mi-note">Your grades never change the official Current 50. ${state.user?'Signed in: your grades count toward the Community Index.':'<a href="/account">Sign in</a> to save your index and add your grades to the Community Index.'}</p>`;
  root.querySelectorAll('[data-tab]').forEach(b=>b.addEventListener('click',()=>{state.tab=b.dataset.tab;render();}));
  ({setup:renderSetup,grade:renderGrade,chart:renderChart,community:renderCommunity,templates:renderTemplates})[state.tab]();
 }

 // 1 · Recipe: metrics and weights
 function renderSetup(){
  const chosen=new Set(state.set.metrics.map(m=>m.key));
  $('#mi-panel').innerHTML=`<section class="mi-card"><h2>Pick ${state.pro?'3 to 8':'3'} metrics</h2><p class="mi-muted">${state.pro?'Pro: up to 8 metrics, custom ones included.':'Free: 3 metrics and 1 saved index. <a href="/pro">Pro</a> unlocks up to 8, templates and history.'}</p>
   <div class="mi-chips">${M.METRICS.map(m=>`<button type="button" class="mi-chip" data-metric="${m.key}" aria-pressed="${chosen.has(m.key)}" title="${e(m.hint)}">${e(m.label)}</button>`).join('')}${Object.entries(state.custom).filter(([k])=>chosen.has(k)).map(([k,v])=>`<button type="button" class="mi-chip" data-metric="${k}" aria-pressed="true">${e(v)}</button>`).join('')}</div>
   <form id="mi-custom" class="mi-inline"><label>Add your own metric<input name="label" maxlength="30" minlength="2" required placeholder="e.g. Dance moves"></label><button type="submit">Add</button></form></section>
   <section class="mi-card"><h2>Weights</h2>${state.set.metrics.map(m=>`<label class="mi-weight">${e(label(m.key))}<input type="range" min="0" max="100" step="5" value="${m.weight}" data-weight="${m.key}"><output>${m.weight}</output></label>`).join('')}
   <div class="mi-actions"><button type="button" id="mi-go">Start grading →</button>${state.user?`<button type="button" id="mi-save">Save my index</button>`:''}</div></section>`;
  root.querySelectorAll('[data-metric]').forEach(b=>b.addEventListener('click',()=>{const k=b.dataset.metric,i=state.set.metrics.findIndex(m=>m.key===k);
   if(i>=0){if(state.set.metrics.length<=3)return status('Keep at least 3 metrics.','error');state.set.metrics.splice(i,1);}
   else{if(state.set.metrics.length>=limit())return status(state.pro?'8 metrics is the maximum.':'Free My Index uses 3 metrics. Remove one first, or go Pro for up to 8.','error');state.set.metrics.push({key:k,weight:20});}
   save();renderSetup();}));
  $('#mi-custom').addEventListener('submit',ev=>{ev.preventDefault();const text=String(new FormData(ev.target).get('label')).trim(),k=M.customKey(text);if(k.length<9)return status('Use letters or numbers.','error');if(state.set.metrics.length>=limit())return status('Remove a metric first to add your own.','error');state.custom[k]=text;state.set.metrics.push({key:k,label:text,weight:20});save();renderSetup();});
  root.querySelectorAll('[data-weight]').forEach(r=>r.addEventListener('input',()=>{state.set.metrics.find(m=>m.key===r.dataset.weight).weight=Number(r.value);r.nextElementSibling.value=r.value;save();}));
  $('#mi-go').addEventListener('click',()=>{const errs=M.validateSet(state.set,{pro:state.pro});if(errs.length)return status(errs[0],'error');state.tab='grade';render();});
  $('#mi-save')?.addEventListener('click',saveSet);
 }
 async function saveSet(){
  const errs=M.validateSet(state.set,{pro:state.pro});if(errs.length)return status(errs[0],'error');
  const row={user_id:state.user.id,name:state.set.name||'My Index',pool:state.set.pool||'current',metrics:state.set.metrics.map(m=>({key:m.key,weight:m.weight,...(m.label?{label:m.label}:{})}))};
  const q=state.setId?state.db.from('index_sets').update(row).eq('id',state.setId).select().single():state.db.from('index_sets').insert(row).select().single();
  const {data,error}=await q;if(error)return status(error.message||'Could not save.','error');state.setId=data.id;status('Saved.','ok');
 }

 // 2 · Grade: one artist at a time, 1 to 10 per metric, keyboard friendly.
 function renderGrade(){
  const pool=gradePool();
  state.cursor=Math.min(Math.max(0,state.cursor),pool.length-1);
  const a=pool[state.cursor],g=state.grades[a.slug]||{},done=pool.filter(x=>state.set.metrics.every(m=>Number.isFinite(state.grades[x.slug]?.[m.key]))).length;
  $('#mi-panel').innerHTML=`<section class="mi-card mi-grade"><div class="mi-progress"><span>${done} of ${pool.length} fully graded</span><i style="--p:${Math.round(100*done/pool.length)}%"></i></div>
   <header class="mi-artist"><img src="/artists/${e(a.slug)}.webp" alt="" width="72" height="72" loading="eager"><div><h2>${e(a.name)}</h2><p class="mi-muted">Official #${a.rank} · ${e(a.country)}</p></div></header>
   ${state.set.metrics.map((m,mi)=>`<fieldset class="mi-scale" data-row="${mi}"><legend>${e(label(m.key))}${Number.isFinite(g[m.key])?` <b>${g[m.key]}</b>`:' <span class="mi-muted">not graded</span>'}</legend><div>${Array.from({length:10},(_,i)=>`<button type="button" data-grade="${i+1}" data-key="${m.key}" aria-pressed="${g[m.key]===i+1}" aria-label="${e(label(m.key))} ${i+1} out of 10">${i+1}</button>`).join('')}</div></fieldset>`).join('')}
   <div class="mi-actions"><button type="button" id="mi-prev">← Back</button><button type="button" id="mi-skip">Skip</button><button type="button" id="mi-next">Next →</button></div>
   <p class="mi-muted mi-keys">Keyboard: 1 to 9 and 0 (for 10) grade the next empty metric. Arrow keys move between artists.</p></section>`;
  root.querySelectorAll('[data-grade]').forEach(b=>b.addEventListener('click',()=>grade(a,b.dataset.key,Number(b.dataset.grade))));
  $('#mi-prev').addEventListener('click',()=>{state.cursor--;save();renderGrade();});
  $('#mi-skip').addEventListener('click',()=>{state.cursor=(state.cursor+1)%pool.length;save();renderGrade();});
  $('#mi-next').addEventListener('click',()=>{state.cursor=(state.cursor+1)%pool.length;save();renderGrade();});
 }
 const pending=new Map();let timer=null;
 let graded=false;
 function grade(a,key,value){
  if(!graded){graded=true;window.AfriTrack?.('myindex_grade');}
  (state.grades[a.slug]||={})[key]=value;save();
  if(state.db){pending.set(a.slug+'|'+key,{user_id:state.user.id,artist_slug:a.slug,metric:key,grade:value});clearTimeout(timer);timer=setTimeout(flush,800);}
  const complete=state.set.metrics.every(m=>Number.isFinite(state.grades[a.slug][m.key]));
  if(complete){state.cursor++;}renderGrade();
 }
 async function flush(){if(!pending.size)return;const rows=[...pending.values()];pending.clear();const {error}=await state.db.from('index_grades').upsert(rows,{onConflict:'user_id,artist_slug,metric'});if(error)status(error.message||'Grades could not sync. They are kept in this browser.','error');}
 document.addEventListener('keydown',ev=>{
  if(state.tab!=='grade'||ev.target.closest('input,textarea,select'))return;
  const pool=gradePool(),a=pool[state.cursor];
  if(ev.key==='ArrowRight'){state.cursor=(state.cursor+1)%pool.length;save();renderGrade();}
  else if(ev.key==='ArrowLeft'){state.cursor=Math.max(0,state.cursor-1);save();renderGrade();}
  else if(/^[0-9]$/.test(ev.key)){const m=state.set.metrics.find(m=>!Number.isFinite(state.grades[a.slug]?.[m.key]));if(m)grade(a,m.key,ev.key==='0'?10:Number(ev.key));}
 });

 // 3 · Your chart: builds live as you grade.
 function renderChart(){
  const rows=chart(),cmp=M.compare(rows);
  $('#mi-panel').innerHTML=rows.length?`<div class="mi-grid"><section class="mi-card"><h2>Your top 10 vs the official Current 50</h2><p class="mi-muted">${cmp.agreement} of your top 10 are also in the official top 10.</p><ol class="mi-list">${cmp.top10.map(r=>`<li><a href="/current/${e(r.slug)}">${e(r.name)}</a> <b>${r.score.toFixed(1)}</b><small>Official #${r.officialRank}${r.notGraded?' · not graded yet, placed by official data':r.delta?` · you rate them ${r.delta>0?'higher':'lower'} by ${Math.abs(r.delta)}`:' · same place'}</small></li>`).join('')}</ol><button type="button" class="share-open-button" id="mi-share">Share my top 10</button>${state.pro&&state.setId?'<button type="button" id="mi-snapshot">Save this top 10 to my history</button>':''}</section>
   <section class="mi-card"><h2>Biggest disagreements</h2>${cmp.gaps.length?`<ul class="mi-list">${cmp.gaps.map(r=>`<li>${e(r.name)}<small>You #${r.rank} · official #${r.officialRank} (${r.delta>0?'+':''}${r.delta})</small></li>`).join('')}</ul>`:'<p class="mi-muted">Grade a few artists to see where you and the chart disagree.</p>'}</section>
   <section class="mi-card mi-wide"><h2>Your full chart</h2><ol class="mi-list mi-columns">${rows.map(r=>`<li>${e(r.name)} <b>${r.score.toFixed(1)}</b><small>${r.notGraded?'Not graded · from official data':r.filled.length?`Graded ${r.graded.length} · ${r.filled.map(label).join(', ')} from official data`:'Fully graded'}</small></li>`).join('')}</ol><p class="mi-muted">Ungraded metrics use official data where it exists (streams, influence from editorial, longevity from career start). Artists with no grade and no official data for any of your metrics are left out until you grade them.</p></section></div>`
   :'<section class="mi-card"><h2>Blank charts do not move crowds.</h2><p>Grade a few artists and your chart builds here. Metrics like vocals and vibes have no official data, so they need your grades.</p><button type="button" data-goto="grade">Start grading</button></section>';
  $('[data-goto]')?.addEventListener('click',()=>{state.tab='grade';render();});
  $('#mi-share')?.addEventListener('click',()=>window.AfriShare?.open({kind:'my-index',url:'/my-index',title:'My Index · AFR/INDEX',text:`My own African music chart: ${state.set.metrics.map(m=>label(m.key)).join(', ')}. Build yours.`,imageName:'my-index.png',image:()=>window.AfriShare.card({title:'My Index top 10',kicker:state.set.metrics.map(m=>`${label(m.key)} ${m.weight}`).join(' · '),items:cmp.top10.map(r=>({label:r.name,sub:r.notGraded?'Official data':'Official #'+r.officialRank,value:r.score.toFixed(1)})),footer:'afrobeats-index.vercel.app/my-index · build yours'})}));
  $('#mi-snapshot')?.addEventListener('click',async()=>{const {error}=await state.db.from('index_history').insert({user_id:state.user.id,set_id:state.setId,top:cmp.top10.map(r=>({slug:r.slug,rank:r.rank,score:Number(r.score.toFixed(2))}))});status(error?error.message:'Saved to your history.',error?'error':'ok');});
 }

 // Community Index and Hot takes
 async function renderCommunity(){
  $('#mi-panel').innerHTML='<section class="mi-card"><p class="mi-muted">Loading the Community Index…</p></section>';
  if(!state.community){const client=state.db||window.AfriAccount?.client;const {data,error}=client?await client.rpc('community_index'):{data:null,error:true};state.community=error?null:M.community(artists,data||[]);}
  const c=state.community;
  if(!c){$('#mi-panel').innerHTML='<section class="mi-card"><h2>Community Index</h2><p>The Community Index could not load right now.</p></section>';return;}
  $('#mi-panel').innerHTML=`<div class="mi-grid"><section class="mi-card"><h2>Community Index</h2><p class="mi-muted">The average of everyone’s grades on the shared metrics. Every score shows its sample size; artists need ${c.minSample}+ graders to appear. New accounts count less, and flagged patterns are left out.</p>${c.ranked.length?`<ol class="mi-list">${c.ranked.map(r=>`<li>${e(r.name)} <b>${r.score.toFixed(1)}</b><small>n = ${r.n} · official #${r.officialRank}</small></li>`).join('')}</ol>`:`<p>Not enough grades yet. ${c.graded} artists have some grades; each needs ${c.minSample} graders. Be one of them.</p>`}</section>
   <section class="mi-card"><h2>Hot takes</h2><p class="mi-muted">Where fans and the official chart disagree most.</p>${c.hotTakes.length?`<ol class="mi-list">${c.hotTakes.map(r=>`<li>${e(r.name)}<small>Fans #${r.rank} · official #${r.officialRank} · ${r.gap>0?'fans rate higher':'fans rate lower'} by ${Math.abs(r.gap)} · n = ${r.n}</small></li>`).join('')}</ol>`:'<p>No hot takes yet. They appear once the community has graded enough artists.</p>'}</section></div>`;
 }

 // Templates: seeded and community, copy and remix
 function renderTemplates(){
  const card=(t,source)=>`<article class="mi-card mi-template"><h3>${e(t.name)}${t.pro?' <span class="mi-badge">Pro</span>':''}</h3><p class="mi-muted">${e(t.description||(t.copies?`${t.copies} copies`:''))}</p><p>${t.metrics.map(m=>`${e(label(m.key))} ${m.weight}%`).join(' · ')}${t.pool==='outside-top-20'?' · outside the top 20':''}</p><button type="button" data-use="${e(source+':'+t.id)}">Use this</button></article>`;
  $('#mi-panel').innerHTML=`<section><h2>Start from a template</h2><div class="mi-templates">${seeds.templates.map(t=>card(t,'seed')).join('')}</div></section>
   ${state.templates.length?`<section><h2>Community templates</h2><div class="mi-templates">${state.templates.map(t=>card(t,'db')).join('')}</div></section>`:''}
   <section class="mi-card"><h2>Publish your recipe</h2>${state.pro&&state.setId?`<form id="mi-publish" class="mi-inline"><label>Template name<input name="name" minlength="2" maxlength="60" required value="${e(state.set.name)}"></label><button type="submit">Publish</button></form>`:`<p class="mi-muted">${state.pro?'Save your index first, then publish it as a template.':'Publishing templates is part of <a href="/pro">Pro</a>.'}</p>`}</section>`;
  root.querySelectorAll('[data-use]').forEach(b=>b.addEventListener('click',async()=>{const [src,id]=b.dataset.use.split(':');const t=(src==='seed'?seeds.templates:state.templates).find(x=>x.id===id);
   if(t.metrics.length>limit())return status('This template needs Pro (more than 3 metrics).','error');
   if(src==='db'&&state.db){const {error}=await state.db.rpc('copy_index_template',{p_id:id});if(error)return status(error.message,'error');}
   state.set={name:t.name,pool:t.pool||'current',metrics:t.metrics.map(m=>({...m}))};save();status(`Using “${t.name}”. Grade away.`,'ok');state.tab='grade';render();}));
  $('#mi-publish')?.addEventListener('submit',async ev=>{ev.preventDefault();const name=String(new FormData(ev.target).get('name'));const {error}=await state.db.from('index_sets').update({name,is_template:true}).eq('id',state.setId);status(error?error.message:'Published. Others can now copy and remix it.',error?'error':'ok');});
 }
 render();
})();
