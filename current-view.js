/* Shared presentation of the published chart. Artist records and scores are read-only. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.AfriCurrentView=factory();})(typeof window==='undefined'?globalThis:window,function(){
  const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const compact=value=>Number.isFinite(Number(value))?new Intl.NumberFormat('en',{notation:'compact',maximumFractionDigits:Number(value)>=1e9?2:1}).format(Number(value)):'—';
  function compactParts(input){
    const value=Number(input);if(!Number.isFinite(value))return null;
    const magnitude=Math.abs(value),divisor=magnitude>=1e9?1e9:magnitude>=1e6?1e6:magnitude>=1e3?1e3:1;
    return {value:value/divisor,digits:divisor===1e9?2:divisor>1?1:0,suffix:divisor===1e9?'B':divisor===1e6?'M':divisor===1e3?'K':''};
  }
  const ordered=artists=>[...artists].sort((a,b)=>a.rank-b.rank);
  const flags={Nigeria:'ng',Ghana:'gh','South Africa':'za',Tanzania:'tz',UK:'gb',Eswatini:'sz'};
  const flag=country=>`<span class="country-flag" aria-hidden="true">${String(country).split(/\s*\/\s*/).filter(name=>flags[name]).map(name=>`<img class="edition-flag" width="16" height="11" alt="" loading="lazy" src="/assets/flags/${flags[name]}.png">`).join('')}</span>`;
  function picture(a,{hero=false,index=1,eager=false}={}){
    const src='/artists/'+a.slug+'.webp';
    // Responsive variants (Phase 10): 160 and 320 px files exist for every Current 50 artist.
    const set=`/artists/${escape(a.slug)}-160.webp 160w, /artists/${escape(a.slug)}-320.webp 320w, ${escape(src)} 640w`,sizes=hero?'(max-width: 767px) 180px, 320px':'64px';
    return `<picture><img src="${escape(hero?src:'/artists/'+a.slug+'-160.webp')}" srcset="${set}" sizes="${sizes}" data-fallback-src="${escape(a.imageFallback||'')}" alt="${escape(a.name)}" width="${hero?640:64}" height="${hero?640:64}" ${hero&&index===0?'fetchpriority="high"':eager?'loading="eager"':'loading="lazy"'} decoding="async"></picture>`;
  }

  function movement(a){
    if(!Number.isFinite(a.previousRank))return '<span class="movement movement-new" aria-label="New entry">NEW</span>';
    const delta=a.previousRank-a.rank;
    const label=delta?`${delta>0?'Up':'Down'} ${Math.abs(delta)} from #${a.previousRank}`:'No movement this edition';
    return `<span class="movement movement-${delta>0?'up':delta<0?'down':'flat'}" aria-label="${label}" title="${label}">${delta>0?'↑ '+delta:delta<0?'↓ '+(-delta):'—'}</span>`;
  }
  // Homepage previews omit the flat chip; the full chart keeps it beside its legend.
  const moved=a=>Number.isFinite(a.previousRank)&&a.previousRank===a.rank?'':movement(a);
  function rows(artists){return ordered(artists).map(a=>`<a class="current-row" href="/current/${escape(a.slug)}" data-name="${escape(a.name)}" data-rank="${a.rank}" data-artist-slug="${escape(a.slug)}" data-country="${escape(a.country)}" data-genres="${escape((a.genres||[]).join('|'))}" aria-label="${escape(a.name)}, rank ${a.rank}, score ${Number(a.score).toFixed(1)}. Open artist page">
    <span class="current-rank">${String(a.rank).padStart(2,'0')}</span><span class="current-avatar">${picture(a,{eager:a.rank<=6})}</span>
    <span class="current-identity"><span class="current-name-line"><span class="current-name">${escape(a.name)}</span>${movement(a)}</span><small class="index-rank-subtitle" hidden></small><span class="current-kicker">${flag(a.country)}${escape(a.country)}</span><span class="current-blurb">${escape(a.bio)}</span><span class="current-tags">${(a.genres||[]).map(g=>`<span>${escape(g)}</span>`).join('')}</span></span>
    <span class="current-streams"><span><small>Daily Spotify</small><strong>${compact(a.dailySpotifyStreams)}</strong></span><span><small>Tracked Spotify total</small><strong>${compact(a.trackedAudioStreams??a.totalSpotifyStreams)}</strong><small>Observed ${escape(String(a.spotifySourceUpdatedAt||a.statsLastUpdatedAt||"Unknown").slice(0,10))}</small></span></span>
    <span class="current-score"><small>Index score</small><strong>${Number(a.score).toFixed(1)}</strong><i style="--score:${a.score}%"></i></span><span class="current-open" aria-hidden="true">→</span></a><details class="chart-row-stats" data-stats-for="${escape(a.slug)}"><summary>Stream details<span class="sr-only"> for ${escape(a.name)}</span></summary><p>Daily Spotify: ${compact(a.dailySpotifyStreams)} · Tracked Spotify total: ${compact(a.totalSpotifyStreams)}<br>Stream observation: ${escape(String(a.spotifySourceUpdatedAt||a.statsLastUpdatedAt||'Unknown').slice(0,10))}</p></details>`).join('');}
  function scoreTrend(a){
    const previous=a.movementBasis?.previousScore;
    if(!Number.isFinite(previous))return '';
    const delta=a.score-previous, rise=Math.max(-6,Math.min(6,delta*6));
    return `<svg class="edition-trend" width="32" height="16" viewBox="0 0 32 16" role="img" aria-label="Previous score ${previous.toFixed(2)}, current score ${a.score.toFixed(2)}"><path d="M2 ${8+rise} L30 ${8-rise}" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="30" cy="${8-rise}" r="1.6" fill="currentColor"/></svg>`;
  }
  const LABELS={recentStreams:'recent streams',momentum:'momentum',editorial:'editorial',activity:'activity'};
  const pts=v=>`${v>=0?'+':'−'}${Math.abs(v).toFixed(1)}`;
  const pct=ratio=>`${ratio>=1?'+':'−'}${Math.abs((ratio-1)*100).toFixed(0)}%`;
  // Plain-language reason for a move. v2 explains the four inputs; older editions keep the v1 wording.
  function movementReason(a){
    const b=a.scoreBreakdown;if(!b)return 'Open the profile for the published score and sources.';
    if(b.version===2){
      const m=b.momentum,parts=[],prior=a.movementBasis?.previousPoints;
      if(prior){const deltas=Object.keys(LABELS).map(k=>[k,b.points[k]-(prior[k]||0)]).filter(([,d])=>Math.abs(d)>=.05).sort((x,y)=>Math.abs(y[1])-Math.abs(x[1])).slice(0,2);if(deltas.length)parts.push(deltas.map(([k,d])=>`${LABELS[k]} ${pts(d)} pts`).join(', '));}
      if(m?.available&&Number.isFinite(m.ratio))parts.push(`Streams this week ${pct(m.ratio)} vs their own baseline`);
      else parts.push('No momentum baseline yet, scored neutral');
      const signal=b.activity?.signals?.[0];if(signal)parts.push(signal.label);
      if(b.capped)parts.push(`${b.maxMovePlaces}-place weekly cap applied: the score alone points to #${b.targetRank}`);
      return parts.map(p=>/[.?!]$/.test(p)?p:p+'.').join(' ');
    }
    const points=.17*b.streamsIndex,prior=a.movementBasis;
    if(prior&&Number.isFinite(prior.previousStreamPoints)){
      const delta=points-prior.previousStreamPoints;
      const editorialUnchanged=Math.abs(b.editorialContribution-prior.previousEditorialPoints)<.0001;
      return `Streaming contribution ${delta>=0?'+':'−'}${Math.abs(delta).toFixed(2)} pts; ${editorialUnchanged?'editorial unchanged':'editorial contribution '+b.editorialContribution.toFixed(2)+' pts'}. Rank also reflects the other artists’ scores.`;
    }
    return `${b.editorialContribution.toFixed(2)} editorial + ${points.toFixed(2)} streaming points. Full calculation in the artist profile.`;
  }
  function leadSummary(a){
    const b=a?.scoreBreakdown;if(!b)return '';
    if(b.version===2)return `${escape(a.name)} leads: ${b.points.recentStreams.toFixed(1)} recent streams + ${b.points.momentum.toFixed(1)} momentum + ${b.points.editorial.toFixed(1)} editorial + ${b.points.activity.toFixed(1)} activity.`;
    return `${escape(a.name)} leads with ${b.editorialContribution.toFixed(2)} editorial + ${(b.streamsIndex*.17).toFixed(2)} streaming points.`;
  }
  // Biggest risers and fallers of the week. Rank moves first; momentum fills the strip when ranks barely move.
  function movers(artists,size=3){
    const ranked=artists.filter(a=>Number.isFinite(a.previousRank));
    const risers=ranked.filter(a=>a.previousRank>a.rank).sort((a,b)=>(b.previousRank-b.rank)-(a.previousRank-a.rank)||a.rank-b.rank).slice(0,size);
    const fallers=ranked.filter(a=>a.previousRank<a.rank).sort((a,b)=>(b.rank-b.previousRank)-(a.rank-a.previousRank)||a.rank-b.rank).slice(0,size);
    const ratio=a=>a.scoreBreakdown?.momentum?.available?a.scoreBreakdown.momentum.ratio:null,used=new Set([...risers,...fallers].map(a=>a.slug));
    const byMomentum=artists.filter(a=>Number.isFinite(ratio(a))&&!used.has(a.slug));
    const hot=byMomentum.filter(a=>ratio(a)>1).sort((a,b)=>ratio(b)-ratio(a)).slice(0,size-risers.length);
    const cold=byMomentum.filter(a=>ratio(a)<1).sort((a,b)=>ratio(a)-ratio(b)).slice(0,size-fallers.length);
    return {risers:[...risers.map(a=>({a,kind:'rank'})),...hot.map(a=>({a,kind:'momentum'}))],fallers:[...fallers.map(a=>({a,kind:'rank'})),...cold.map(a=>({a,kind:'momentum'}))]};
  }
  function moverItem({a,kind},up){
    const line=kind==='rank'?`#${a.previousRank} → #${a.rank} · ${up?'Riser':'Faller'}`:`#${a.rank} · ${up?'Heating up':'Cooling'} · ${pct(a.scoreBreakdown.momentum.ratio)} streams vs baseline`;
    return `<a href="/current/${escape(a.slug)}" class="mover-${up?'up':'down'}"><span class="mover-avatar">${picture(a)}</span><span class="mover-detail"><strong>${escape(a.name)}</strong><small>${line}</small><span class="mover-reason">${escape(movementReason(a))}</span></span>${movement(a)}</a>`;
  }
  function hero(artists){
    const sorted=ordered(artists),top=sorted.slice(0,3);
    const strip=movers(artists),basis=artists.find(a=>a.movementBasis)?.movementBasis.date;
    const basisLabel=basis?new Intl.DateTimeFormat('en-GB',{day:'numeric',month:'short',year:'numeric',timeZone:'Africa/Lagos'}).format(new Date(basis)):'the last published edition';
    const lead=top[0],breakdown=lead?.scoreBreakdown;
    const leadNote=breakdown?leadSummary(lead):'';
    const adjacent=sorted.slice(1).map((a,i)=>({artist:a,other:sorted[i],gap:Math.abs(sorted[i].score-a.score)})).sort((a,b)=>a.gap-b.gap)[0];
    const changes=sorted.filter(a=>Number.isFinite(a.movementBasis?.previousScore)).map(a=>({artist:a,delta:a.score-a.movementBasis.previousScore})).sort((a,b)=>Math.abs(b.delta)-Math.abs(a.delta));
    const biggest=changes[0];
    const quietEdition=[
      adjacent&&`<p><small>Closest gap</small><strong>${escape(adjacent.other.name)} / ${escape(adjacent.artist.name)}</strong> ${adjacent.gap.toFixed(2)} pts</p>`,
      biggest&&`<p><small>Biggest score change</small><strong>${escape(biggest.artist.name)}</strong> ${biggest.delta>=0?'+':''}${biggest.delta.toFixed(2)} pts</p>`
    ].filter(Boolean).join('');
    return `<div class="publication-hero"><div class="edition-heading"><h2>The Current 50</h2><span>Top 10</span></div>
    <div class="publication-stage"><div class="hero-artists" aria-label="Current top three artists">${top.map((a,i)=>`<a class="hero-artist hero-artist-${i+1}" href="/current/${escape(a.slug)}">${picture(a,{hero:true,index:i})}<span class="hero-photo-rank">${String(a.rank).padStart(2,'0')}</span><span class="podium-top-label">${i===0?'TOP OF THE INDEX':'CURRENT 50'}</span><span class="hero-photo-copy"><small>${flag(a.country)}${escape(a.country)}</small><strong>${escape(a.name)}</strong><span>${moved(a)}<b>${a.score.toFixed(1)} <small>PTS</small></b></span></span><span class="podium-arrow" aria-hidden="true">→</span></a>`).join('')}</div><aside class="publication-chart" aria-labelledby="chart-preview-title"><div><p class="index-eyebrow">THE CHART CONTINUES</p><h2 id="chart-preview-title">In the conversation.</h2></div><div class="publication-chart-list">${sorted.slice(3,10).map(a=>`<a href="/current/${escape(a.slug)}"><span>${String(a.rank).padStart(2,'0')}</span>${picture(a)}<div><strong>${escape(a.name)}</strong><small>${flag(a.country)} ${escape(a.country)}${moved(a)?' · '+moved(a):''}</small>${scoreTrend(a)}<i class="edition-bar" style="width:${Number(a.score)}%"></i></div><b>${a.score.toFixed(1)}<small>PTS</small></b></a>`).join('')}</div><a class="publication-chart-all" href="/current">All 50 artists <span aria-hidden="true">→</span></a><p class="publication-chart-note">Published index scores. Stream totals and sources live in the full chart.</p></aside></div>
    <div class="movers-strip" role="region" aria-labelledby="movers-title"><div class="movers-label"><div><h2 id="movers-title">Chart movement</h2><p>Compared with ${escape(basisLabel)}</p><p class="movers-lead-note">${leadNote}</p><a href="/method#ranking-movement">How movement is calculated</a> · <a href="/heat">Heat 25: fastest risers</a></div></div><div class="movers-items">${strip.risers.length||strip.fallers.length?`<div class="movers-group" aria-label="Biggest risers"><h3 class="movers-group-title">Rising</h3>${strip.risers.map(x=>moverItem(x,true)).join('')}</div><div class="movers-group" aria-label="Biggest fallers"><h3 class="movers-group-title">Falling</h3>${strip.fallers.map(x=>moverItem(x,false)).join('')}</div>`:quietEdition}</div></div></div>`;

  }
  const weightsOf=artists=>artists.find(a=>a.scoreBreakdown?.version===2)?.scoreBreakdown.weights;
  function formula(artists){const w=weightsOf(artists);return w?`Index score · ${w.recentStreams}% recent streams, ${w.momentum}% momentum, ${w.editorial}% editorial, ${w.activity}% activity.`:'Index score · up to 83 editorial points + 17 points from comparable tracked Spotify streams.';}
  function sourceNote(artists){const w=weightsOf(artists);return w?`Recent Spotify streams (last 28 days, log scale) carry ${w.recentStreams}%. Momentum, this week against the artist’s own 4-week baseline, carries ${w.momentum}%. Editorial carries ${w.editorial}% and fades after 8 weeks without a review. Releases, chart entries, awards and live dates carry ${w.activity}%. Scores are a 4-week average, and no artist moves more than 8 places in one week.`:'Nine cross-era signals carry 83% of the score. Comparable tracked Spotify streams carry 17%. Other audio providers and video views stay separate until sourced.';}
  function chart(artists){
    const countries=[...new Set(artists.map(a=>a.country))].sort(),genres=[...new Set(artists.flatMap(a=>a.genres||[]))].sort();
    return `<div class="chart-section-head"><div><p class="chart-eyebrow">CURRENT EDITION</p><h2>Current 50 <span class="chart-count">${artists.length}</span></h2></div><p class="chart-formula">${formula(artists)}</p><button type="button" class="share-open-button" data-share-open data-share-kind="current-50" data-share-url="/current" data-share-title="The Current 50 · AFR/INDEX" data-share-text="This week's Current 50: who is leading African music right now." data-share-image="/api/card?board=current&amp;format=story" data-share-image-name="afri-current-50.png">Share the chart</button><p id="chart-count" role="status">Showing all ${artists.length} artists</p></div>
      <div class="chart-layout"><aside class="chart-filters" aria-label="Ranking filters"><div class="filter-heading"><h3>Refine the chart</h3><button type="button" id="chart-reset">Reset</button></div><details class="mobile-filter-details"><summary>Refine the chart <span aria-hidden="true">⌄</span></summary><div class="filter-body"><div class="filter-group"><p>Country</p><select id="chart-country" aria-label="Country" hidden><option value="">All countries</option>${countries.map(c=>`<option>${escape(c)}</option>`).join('')}</select><div class="filter-chips country-chips" role="group" aria-label="Filter by country"><button type="button" data-country-filter="" aria-pressed="true">All countries</button>${countries.map(c=>`<button type="button" data-country-filter="${escape(c)}" aria-pressed="false">${flag(c)}${escape(c)}</button>`).join('')}</div></div><div class="filter-group"><label for="chart-genre">Genre</label><select id="chart-genre"><option value="">Every sound</option>${genres.map(g=>`<option>${escape(g)}</option>`).join('')}</select><div class="filter-chips genre-chips" role="group" aria-label="Quick genre filters">${['AFROBEATS','AMAPIANO','AFROPOP','HIP-HOP'].map(g=>`<button type="button" data-genre-filter="${g}" aria-pressed="false">${escape(g.toLowerCase().replace(/\b\w/g,c=>c.toUpperCase()))}</button>`).join('')}</div></div></div></details><div class="active-chart-filters" aria-label="Active filters" hidden></div><div class="filter-footer"><span class="brand-symbol" aria-hidden="true">A/</span><p>Independent rankings.<br>African music, in context.</p><a href="/boards">Explore specialist boards →</a></div></aside>
      <div class="chart-results"><div class="chart-toolbar"><label for="chart-search"><span class="sr-only">Search artists</span><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/></svg><input id="chart-search" type="search" placeholder="Search artists" autocomplete="off"></label><label class="ranking-sort-control" for="chart-sort"><span class="sr-only">Sort rankings</span><select id="chart-sort" aria-label="Sort rankings"><option value="index">Index score</option><option value="daily">Daily streams</option><option value="total">Total streams</option><option value="movers">Movers</option></select></label></div><div class="chart-columns" aria-hidden="true"><span>Rank</span><span>Artist</span><span>Spotify streams</span><span>Score</span></div><div class="current-ranking" aria-label="Current Afrobeats artist ranking">${rows(artists)}</div><div class="chart-empty" hidden><strong>Nobody here. Even the DJ went home.</strong><p>Try another name, country or genre.</p><button type="button" data-clear-filters>Clear filters</button></div><details class="stream-source-note"><summary>About this chart & its sources</summary><p>${sourceNote(artists)} <a href="/method#current-formula">Full method →</a> · <a href="/studio/streams">Platform coverage →</a></p></details><div class="chart-secondary-modules"></div></div></div>`;
  }
  return {rows,hero,chart,ordered,compactParts,flag,picture,movement,movementReason,movers,formula};
});
