/* /stats controller. Free: top African artists, tracks, taste profile, chart comparison.
   Pro: lifetime import stats, listening clock, full history and Afri Wrapped. */
(async function(){
 'use strict';
 const root=document.getElementById('stats-app');if(!root)return;
 const M=window.AfriStatsModel,P=window.AfriStatsProviders;
 const $=s=>root.querySelector(s),e=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const RANGES={short_term:'Last 4 weeks',medium_term:'Last 6 months',long_term:'All time'};
 const state={provider:null,range:'short_term',snapshot:null,user:null,profile:null,pro:false,flags:{},lifetime:null};
 const status=(msg,kind='')=>{const s=$('#stats-status');s.textContent=msg;s.dataset.kind=kind;};
 const consented=()=>$('#stats-consent').checked;
 const [roster,current,flags]=await Promise.all([fetch('/data/african-artists.json').then(r=>r.json()),fetch('/data/current-lite.json').then(r=>r.json()),fetch('/api/product?service=stats&action=config').then(r=>r.ok?r.json():{}).catch(()=>({}))]);
 const index=M.buildIndex(roster.artists);state.flags=flags;

 // Account (optional). Signed-in users can log plays and save a taste profile.
 let db=null;
 try{await import('/assets/account.js');const session=await window.AfriAccount.session();if(session){db=window.AfriAccount.client;state.user=session.user;}}catch{}
 if(db){
  const [{data:profile},{data:pro}]=await Promise.all([db.from('personal_profiles').select('*').maybeSingle(),db.from('pro_subscriptions').select('expires_at')]);
  state.profile=profile||null;state.pro=(pro||[]).some(r=>Date.parse(r.expires_at)>Date.now());
 }
 renderShell();

 // Provider cards
 function providerCard(p){
  const a=p.available(flags);
  if(p.id==='apple')return `<article class="stats-provider"><h3>Apple Music</h3><p>${a.soon?'Coming soon. Join the waitlist and we will email you once.':e(a.reason)}</p>${a.soon?`<form id="apple-waitlist" class="stats-waitlist"><label>Email<input type="email" name="email" autocomplete="email" required></label><label class="stats-check"><input type="checkbox" name="consent" required><span>Email me once when Apple Music is ready. Nothing else.</span></label><button type="submit">Join the waitlist</button></form>`:''}</article>`;
  if(p.id==='lastfm')return `<article class="stats-provider"><h3>Last.fm</h3><p>Works with any public Last.fm profile, including Spotify scrobbles. No password needed.</p>${a.ok?`<form id="lastfm-form"><label>Last.fm username<input name="user" autocomplete="username" required pattern="[A-Za-z][A-Za-z0-9_-]{1,14}"></label><button type="submit">Use Last.fm</button></form>`:`<p class="stats-muted">${e(a.reason)}</p>`}</article>`;
  return `<article class="stats-provider"><h3>Spotify <span class="stats-badge">Beta</span></h3><p>Spotify lets new apps serve only 5 approved accounts, so this works for invited testers. Everyone else: use Last.fm or upload your history below.</p>${a.ok?`<label class="stats-check"><input type="checkbox" id="spotify-keep"><span>Keep tracking my plays on this device</span></label><button type="button" id="spotify-connect">Connect Spotify</button>`:`<p class="stats-muted">${e(a.reason)}</p>`}</article>`;
 }
 function renderShell(){
  root.innerHTML=`<section class="stats-connect" aria-labelledby="stats-connect-title"><h2 id="stats-connect-title">Connect a source</h2>
   <label class="stats-check stats-consent"><input type="checkbox" id="stats-consent" ${state.profile?'checked':''}><span>I agree that Afri Index reads my top artists, tracks and recent plays to build these stats. Only plays by African artists in the index are kept, and only if I am signed in. I can delete them at any time. <a href="/privacy#stats">Privacy</a></span></label>
   <div class="stats-providers">${P.list.map(providerCard).join('')}</div></section>
   <p id="stats-status" role="status" aria-live="polite"></p>
   <nav class="stats-ranges" aria-label="Time range" hidden>${Object.entries(RANGES).map(([k,v])=>`<button type="button" data-range="${k}" aria-pressed="${k===state.range}">${v}</button>`).join('')}</nav>
   <div id="stats-dashboard"></div>
   <section class="stats-panel" id="stats-tracking" aria-labelledby="tracking-title"><h2 id="tracking-title">Your play log</h2><div id="tracking-body"></div></section>
   <section class="stats-panel" id="stats-lifetime" aria-labelledby="lifetime-title"><h2 id="lifetime-title">Lifetime import <span class="stats-badge">Pro</span></h2>
    <p>Spotify can send you your full listening history (the “Extended streaming history” request). It can take days or weeks to arrive. <a href="https://www.spotify.com/account/privacy/" target="_blank" rel="noopener noreferrer">Request it from Spotify ↗</a></p>
    <p class="stats-warning"><strong>This file contains sensitive data</strong>, such as IP addresses and devices. It is read only in this browser and never uploaded. If you save, only totals for African artists are stored.</p>
    <label class="stats-file">Choose my_spotify_data.zip or the JSON files<input type="file" id="history-file" accept=".zip,.json,application/zip,application/json" multiple></label><div id="lifetime-body"></div></section>
   <section class="stats-panel" id="stats-social" aria-labelledby="social-title"><h2 id="social-title">Friends and soulmates</h2><div id="social-body"></div></section>
   <section class="stats-panel" aria-labelledby="privacy-title"><h2 id="privacy-title">Your data</h2><p>${state.user?'Stored for this account: your source, the date tracking started, plays by African artists, an unmatched-plays count and, if you share it, your top 20 African artists.':'You are not signed in, so nothing is stored on our servers. Sources you connect are remembered only in this browser.'}</p><button type="button" id="stats-delete" class="stats-danger">Delete my stats data</button></section>`;
  bind();renderTracking();renderSocial();if(state.lifetime)renderLifetime();
 }

 function bind(){
  $('#spotify-connect')?.addEventListener('click',()=>{if(!consented())return status('Tick the consent box first.','error');P.spotify.connect({keep:$('#spotify-keep').checked&&!!state.user});});
  $('#lastfm-form')?.addEventListener('submit',async ev=>{ev.preventDefault();if(!consented())return status('Tick the consent box first.','error');try{await P.lastfm.connect({user:new FormData(ev.target).get('user')});await use(P.lastfm);}catch(err){status(err.message,'error');}});
  $('#apple-waitlist')?.addEventListener('submit',async ev=>{ev.preventDefault();const f=new FormData(ev.target);const r=await fetch('/api/product?service=stats&action=waitlist',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({feature:'apple-music',email:f.get('email'),consent:f.get('consent')==='on'})});const d=await r.json().catch(()=>({}));status(d.message||d.error||'Could not join the waitlist.',r.ok?'ok':'error');if(r.ok)ev.target.reset();});
  root.querySelectorAll('[data-range]').forEach(b=>b.addEventListener('click',()=>{state.range=b.dataset.range;root.querySelectorAll('[data-range]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));load();}));
  $('#history-file').addEventListener('change',importHistory);
  $('#stats-delete').addEventListener('click',deleteData);
 }

 async function use(provider){window.AfriTrack?.('stats_connect',{provider:provider.id});state.provider=provider;$('.stats-ranges').hidden=false;await load();if(state.user)await ensureProfile();await sync();}
 async function load(){
  const p=state.provider;if(!p)return;status(`Loading your ${RANGES[state.range].toLowerCase()} from ${p.label}…`);
  try{
   const [artists,tracks]=await Promise.all([p.topArtists(state.range),p.topTracks(state.range)]);
   state.snapshot=M.matchSnapshot(index,{artists,tracks});
   const s=state.snapshot;status(`${s.artists.length} African artists and ${s.tracks.length} African tracks matched. ${s.unmatched.artists+s.unmatched.tracks} unmatched entries left out.`,'ok');
   renderDashboard();
   $('#stats-share')?.addEventListener('click',()=>{const s=state.snapshot;window.AfriShare?.open({kind:'personal-stats',url:'/stats',title:'My top African artists · AFR/INDEX',text:`My top African artist right now is ${s.artists[0]?.name}. What is yours?`,imageName:'my-african-music-stats.png',image:()=>window.AfriShare.card({title:'My top African artists',kicker:RANGES[state.range],items:s.artists.slice(0,10).map(a=>({label:a.name,sub:[a.country,a.currentRank?'Current #'+a.currentRank:null].filter(Boolean).join(' · ')})),footer:'afrobeats-index.vercel.app/stats · find yours'})});});
   if(state.user&&state.profile)await db.from('personal_profiles').update({taste:M.tasteVector(s.artists),updated_at:new Date().toISOString()}).eq('user_id',state.user.id);
  }catch(err){status(err.message,'error');}
 }

 const bars=(rows,label='label')=>`<ul class="stats-bars">${rows.map(r=>`<li><span>${e(r[label])}</span><i style="--w:${r.percent}%"></i><b>${r.percent}%</b></li>`).join('')}</ul>`;
 const empty='<p class="stats-muted">Quiet in here. Queue some African music and check back, or try another range.</p>';
 function renderDashboard(){
  const s=state.snapshot,prof=M.profile(s,{current:current.artists}),albums=M.topAlbums(s.tracks);
  $('#stats-dashboard').innerHTML=`<div class="stats-grid">
   <section class="stats-panel"><h2>Top African artists</h2>${s.artists.length?`<ol class="stats-list">${s.artists.slice(0,15).map(a=>`<li><a href="${a.board==='current'?'/current/'+e(a.slug):'/current-100'}">${e(a.name)}</a><small>${e(a.country||'')}${a.currentRank?` · Current #${a.currentRank}`:''}</small></li>`).join('')}</ol>`:empty}</section>
   <section class="stats-panel"><h2>Top African tracks</h2>${s.tracks.length?`<ol class="stats-list">${s.tracks.slice(0,15).map(t=>`<li>${e(t.title)}<small>${t.artists.map(a=>e(a.name)).join(', ')}</small></li>`).join('')}</ol>`:empty}</section>
   ${albums.length?`<section class="stats-panel"><h2>Top African albums</h2><ol class="stats-list">${albums.map(a=>`<li>${e(a.title)}<small>${e(a.artist.name)} · ${a.tracks} of your top tracks</small></li>`).join('')}</ol></section>`:''}
   <section class="stats-panel"><h2>Genre mix</h2>${s.artists.length?bars(prof.genres):empty}</section>
   <section class="stats-panel"><h2>Country split</h2>${s.artists.length?bars(prof.countries):empty}</section>
   <section class="stats-panel"><h2>Old school vs new wave</h2>${s.artists.length?bars(prof.eras):empty}<p class="stats-muted">Old school: 15+ years since career start. New wave: under 7. Unknown where we have no sourced start year.</p></section>
   <section class="stats-panel stats-wide"><h2>Where your taste sits vs the Current 50</h2><p class="stats-big">${e(prof.chart.label)}</p><p>${prof.chart.inCurrent50} of your ${prof.chart.matched} African artists are in the Current 50${prof.chart.averageRank?`, at an average rank of #${prof.chart.averageRank}`:''}. ${prof.chart.inTop10} are in the top 10.${prof.chart.beyond50.length?` Beyond the 50: ${prof.chart.beyond50.map(e).join(', ')}.`:''}</p><p><a href="/music-receipt">Print these as a Music Receipt →</a></p>${s.artists.length?'<button type="button" class="share-open-button" id="stats-share">Share my stats</button>':''}</section>
   <p class="stats-muted stats-wide">Unmatched: ${s.unmatched.artists} artists and ${s.unmatched.tracks} tracks were not African artists in the index, so they are not shown or stored. <a href="/method">How matching works</a>.</p></div>`;
 }

 // Play log: from the day you start tracking. Only African matches are written.
 async function ensureProfile(){
  if(state.profile||!consented())return;
  const row={user_id:state.user.id,provider:state.provider.id,lastfm_user:state.provider.id==='lastfm'?state.provider.user:null,consent_at:new Date().toISOString(),taste:state.snapshot?M.tasteVector(state.snapshot.artists):[]};
  const {data,error}=await db.from('personal_profiles').insert(row).select().single();if(error)return status('Your stats could not be saved. They still show here.','error');state.profile=data;renderTracking();renderSocial();
 }
 async function sync(){
  if(!state.user||!state.profile||!state.provider)return;
  try{
   const since=Math.max(Date.parse(state.profile.last_synced_at||state.profile.tracking_since),Date.parse(state.profile.tracking_since));
   const items=await state.provider.recent(since);let unmatched=0;const rows=[];
   for(const x of items){const t=Date.parse(x.playedAt);if(!(t>since))continue;const hit=index.findCredits(x.artist)[0];if(!hit){unmatched++;continue;}rows.push({user_id:state.user.id,provider:state.provider.id,played_at:new Date(t).toISOString(),artist_slug:hit.slug,track_title:String(x.title).slice(0,300)});}
   for(let i=0;i<rows.length;i+=200)await db.from('personal_plays').upsert(rows.slice(i,i+200),{onConflict:'user_id,provider,played_at,artist_slug',ignoreDuplicates:true});
   const latest=items.reduce((m,x)=>Math.max(m,Date.parse(x.playedAt)||0),since);
   const {data}=await db.from('personal_profiles').update({last_synced_at:new Date(latest).toISOString(),unmatched_plays:(state.profile.unmatched_plays||0)+unmatched}).eq('user_id',state.user.id).select().single();
   state.profile=data||state.profile;renderTracking();
   if(state.provider.id==='spotify'&&items.length>=50)status('Spotify only shares your last 50 plays. Open this page at least daily to keep the log complete.','');
  }catch(err){status(err.message,'error');}
 }
 async function renderTracking(){
  const body=$('#tracking-body');
  if(!state.user){body.innerHTML='<p><a href="/account">Sign in</a> to log your plays from today and see a “tracking since” date.</p>';return;}
  if(!state.profile){body.innerHTML='<p>Connect a source with the consent box ticked to start your log. It counts from that moment.</p>';return;}
  const {data:rows}=await db.from('personal_plays').select('played_at,artist_slug,track_title').order('played_at',{ascending:false}).limit(5000);
  const log=M.plays(rows||[],index),since=new Date(state.profile.tracking_since).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'});
  body.innerHTML=`<p class="stats-big">Tracking since ${e(since)}</p><p>${log.total} African plays logged · ${state.profile.unmatched_plays} other plays not stored.${state.profile.last_synced_at?` Last sync ${e(new Date(state.profile.last_synced_at).toLocaleString('en-GB'))}.`:''}</p>
   ${log.artists.length?`<ol class="stats-list">${log.artists.slice(0,10).map(a=>`<li>${e(a.name)}<small>${a.plays} plays</small></li>`).join('')}</ol>`:''}
   ${state.pro?clock(log.clock,'Your listening clock (local time)'):'<p class="stats-muted">Listening clock and full history are part of <a href="/pro">Pro</a>.</p>'}`;
 }
 function clock(counts,title){const max=Math.max(1,...counts);return `<figure class="stats-clock"><figcaption>${e(title)}</figcaption><div>${counts.map((n,h)=>`<span title="${h}:00 · ${n} plays" style="--h:${Math.round(100*n/max)}%"><i></i><small>${h%6===0?h:''}</small></span>`).join('')}</div></figure>`;}

 // Lifetime import: parsed here, aggregated to African-only totals.
 async function importHistory(ev){
  const files=[...ev.target.files];if(!files.length)return;window.AfriTrack?.('stats_import');status('Reading your history in this browser…');
  try{const items=(await Promise.all(files.map(P.readHistory))).flat();state.lifetime=M.lifetime(items,index);renderLifetime();status(`${state.lifetime.events.toLocaleString()} African plays found across ${items.length.toLocaleString()} rows. ${state.lifetime.unmatchedPlays.toLocaleString()} plays by other artists were ignored.`,'ok');}
  catch(err){status(err.message,'error');}finally{ev.target.value='';}
 }
 function renderLifetime(){
  const L=state.lifetime,body=$('#lifetime-body'),top=L.artists[0];
  const headline=`<p class="stats-big">${L.minutes.toLocaleString()} minutes of African music</p><p>${L.events.toLocaleString()} plays${L.first?` from ${e(L.first.slice(0,10))} to ${e(L.last.slice(0,10))}`:''}.${top?` Your number one: ${e(top.name)}.`:''}</p>`;
  if(!state.pro){body.innerHTML=headline+'<p class="stats-muted">Your full lifetime stats, listening clock, year by year history and Afri Wrapped are part of <a href="/pro">Pro</a>.</p>';return;}
  const years=L.years.slice().reverse(),wrapped=years[0]?M.wrapped(L,years[0].year):null,name=s=>index.roster.find(a=>a.slug===s)?.name||s;
  body.innerHTML=`${headline}${wrapped?`<div class="stats-wrapped"><p class="discovery-kicker">AFRI WRAPPED ${wrapped.year}</p><p class="stats-big">${wrapped.minutes.toLocaleString()} minutes</p><p>Top artist: ${e(name(wrapped.topArtist))} · ${wrapped.share}% of your lifetime African listening.</p></div>`:''}
   <div class="stats-grid"><section class="stats-panel"><h3>Lifetime top artists</h3><ol class="stats-list">${L.artists.slice(0,20).map(a=>`<li>${e(a.name)}<small>${a.minutes.toLocaleString()} min · first played ${e(a.firstPlayed.slice(0,10))}</small></li>`).join('')}</ol></section>
   <section class="stats-panel"><h3>Lifetime top tracks</h3><ol class="stats-list">${L.tracks.slice(0,20).map(t=>`<li>${e(t.title)}<small>${e(name(t.artist))} · ${t.plays} plays</small></li>`).join('')}</ol></section>
   <section class="stats-panel"><h3>Year by year</h3><ul class="stats-list">${years.map(y=>`<li>${y.year}<small>${y.minutes.toLocaleString()} min · top: ${e(name(y.topArtist))}</small></li>`).join('')}</ul></section>
   <section class="stats-panel">${clock(L.clockUtc,'Listening clock (UTC)')}</section></div>
   ${state.user?`<button type="button" id="lifetime-save">Save these totals to my account</button>`:'<p class="stats-muted"><a href="/account">Sign in</a> to save these totals.</p>'}`;
  $('#lifetime-save')?.addEventListener('click',async()=>{const {error}=await db.from('personal_lifetime').upsert({user_id:state.user.id,summary:{...L,tracks:L.tracks.slice(0,50),artists:L.artists.slice(0,50)},imported_at:new Date().toISOString()});status(error?'Could not save. Pro is needed to store lifetime stats.':'Saved. Only African-artist totals were stored.',error?'error':'ok');});
 }

 // Social: share a taste profile by handle, compare with a friend, find soulmates.
 async function renderSocial(){
  const body=$('#social-body');
  if(!state.user||!state.profile){body.innerHTML='<p>Sign in and connect a source to share your taste, compare with friends and find your African music soulmates.</p><form id="compare-form" class="stats-inline"><label>Compare with a friend’s handle<input name="handle" pattern="[a-z0-9_]{3,24}" required></label><button type="submit">Compare</button></form><div id="compare-result"></div>';bindCompare();return;}
  const p=state.profile;
  body.innerHTML=`<form id="share-form" class="stats-inline"><label>Your handle<input name="handle" value="${e(p.handle||'')}" pattern="[a-z0-9_]{3,24}" required></label><label class="stats-check"><input type="checkbox" name="publish" ${p.publish_taste?'checked':''}><span>Share my top 20 African artists with people who know my handle</span></label><button type="submit">Save</button></form>
   <form id="compare-form" class="stats-inline"><label>Compare with a friend’s handle<input name="handle" pattern="[a-z0-9_]{3,24}" required></label><button type="submit">Compare</button></form><div id="compare-result"></div>
   ${p.publish_taste?'<button type="button" id="soulmates">Find my African music soulmates</button><div id="soulmates-result"></div>':'<p class="stats-muted">Share your taste to see soulmates. Only people who also share appear.</p>'}`;
  $('#share-form').addEventListener('submit',async ev=>{ev.preventDefault();const f=new FormData(ev.target);const {data,error}=await db.from('personal_profiles').update({handle:String(f.get('handle')).toLowerCase(),publish_taste:f.get('publish')==='on'}).eq('user_id',state.user.id).select().single();if(error)return status('That handle is taken or invalid.','error');state.profile=data;status('Saved.','ok');renderSocial();});
  $('#soulmates')?.addEventListener('click',async()=>{const {data,error}=await db.rpc('taste_soulmates',{p_limit:10});const name=s=>index.roster.find(a=>a.slug===s)?.name||s;$('#soulmates-result').innerHTML=error?'<p>Soulmates could not load.</p>':(data||[]).length?`<ol class="stats-list">${data.map(m=>`<li>@${e(m.handle)} <b>${Math.round(m.score*100)}% match</b><small>Both love ${m.shared.map(name).map(e).join(', ')}</small></li>`).join('')}</ol>`:'<p class="stats-muted">No soulmates yet. As more people share, matches appear here.</p>';});
  bindCompare();
 }
 function bindCompare(){
  $('#compare-form')?.addEventListener('submit',async ev=>{ev.preventDefault();const handle=String(new FormData(ev.target).get('handle')).toLowerCase(),out=$('#compare-result');
   const client=db||window.AfriAccount?.client;if(!client)return out.innerHTML='<p>Comparison could not load.</p>';
   const {data}=await client.rpc('public_taste',{p_handle:handle});if(!data)return out.innerHTML='<p>No shared taste profile for that handle.</p>';
   const mine=state.snapshot?M.tasteVector(state.snapshot.artists):state.profile?.taste||[];if(!mine.length)return out.innerHTML='<p>Load your own stats first.</p>';
   const sim=M.similarity(mine,data.taste),name=s=>index.roster.find(a=>a.slug===s)?.name||s;
   out.innerHTML=`<p class="stats-big">${Math.round(sim.score*100)}% overlap with @${e(handle)}</p><p>${sim.shared.length?'You both play '+sim.shared.slice(0,8).map(name).map(e).join(', ')+'.':'No shared African artists yet. Swap receipts and trade recommendations.'}</p>`;});
 }

 async function deleteData(){
  if(!confirm('Delete your stats data? This removes your play log, lifetime totals, shared taste and handle, and forgets connected sources in this browser. It cannot be undone.'))return;
  P.spotify.disconnect();P.lastfm.disconnect();state.snapshot=null;state.lifetime=null;state.provider=null;
  if(db){const {error}=await db.rpc('delete_personal_data');if(error)return status('Deletion failed on the server. Email us and we will remove it.','error');state.profile=null;}
  renderShell();status('Deleted. Nothing from this feature is stored for you any more.','ok');
 }

 // Return from Spotify, or resume a remembered source.
 const q=new URLSearchParams(location.search);
 if(q.get('code')){history.replaceState({},'',location.pathname);try{await P.spotify.finish(q.get('code'),q.get('state'));$('#stats-consent').checked=true;await use(P.spotify);}catch(err){status(err.message,'error');}}
 else if(q.get('error')){history.replaceState({},'',location.pathname);status('Spotify connection was cancelled.','error');}
 else if(state.profile?.provider==='lastfm'&&P.lastfm.connected())await use(P.lastfm);
 else if(state.profile?.provider==='spotify'&&P.spotify.connected())await use(P.spotify).catch(()=>{});
 else if(!state.profile&&P.lastfm.connected())await use(P.lastfm);
})();
