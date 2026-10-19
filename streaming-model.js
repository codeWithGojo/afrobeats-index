/* Shared by the browser and data export: counts, coverage and Current scoring. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.AfriStreaming=api;})(typeof window==='object'?window:globalThis,function(){
 'use strict';
 const platforms=['spotify','appleMusic','audiomack','boomplay','youtube'];
 const labels={spotify:'Spotify',appleMusic:'Apple Music',audiomack:'Audiomack',boomplay:'Boomplay',youtube:'YouTube'};
 const valid=o=>o&&Number.isFinite(o.value)&&o.value>=0&&/^https:\/\//.test(o.sourceUrl||'')&&Number.isFinite(Date.parse(o.observedAt))&&o.period==='lifetime';
 const measurement=(value,sourceUrl,observedAt,sourceDate,metric='audio_streams')=>Number.isFinite(value)&&value>=0?{value,metric,period:'lifetime',sourceUrl,observedAt,sourceDate:sourceDate||null,status:'sourced',scope:'tracked_catalogue'}:null;
 function summary(observations){
  const audio=platforms.filter(p=>valid(observations[p])&&observations[p].metric==='audio_streams');
  const video=platforms.filter(p=>valid(observations[p])&&observations[p].metric==='video_views');
  return {audioStreams:audio.length?audio.reduce((n,p)=>n+observations[p].value,0):null,videoViews:video.length?video.reduce((n,p)=>n+observations[p].value,0):null,coverage:audio,videoCoverage:video,available:audio.length,possible:4,complete:audio.length===4,label:'Tracked audio streams',observations};
 }
 function apply(state,baseline,extras={artists:{},recordings:{},albums:{}}){
  const editorialMaximum=Math.max(...Object.values(baseline).map(b=>b.editorialContribution));
  if(!Number.isFinite(editorialMaximum)||editorialMaximum<=0)throw Error('Invalid editorial baseline');
  for(const a of state.artists){
   const observations=Object.fromEntries(platforms.map(p=>[p,null]));
   observations.spotify=measurement(a.totalSpotifyStreams,a.sources?.catalogue,a.statsLastUpdatedAt,a.spotifySourceUpdatedAt);
   for(const p of platforms.filter(p=>p!=='spotify')){const o=extras.artists?.[a.slug]?.[p];if(valid(o)&&o.scope==='tracked_catalogue'&&(p==='youtube'?o.metric==='video_views':o.metric==='audio_streams'))observations[p]=o;}
   a.streaming=summary(observations);a.trackedAudioStreams=a.streaming.audioStreams;
   a.recordingIds=[...new Set((a.songs||[]).filter(t=>t.spotifyId).map(t=>'spotify:'+t.spotifyId))];
  }
  // Use identical provider coverage for every candidate. Partial totals remain visible,
  // but cannot reward an artist just because their other-platform data was available.
  const rankingPlatforms=platforms.filter(p=>p!=='youtube'&&state.artists.every(a=>valid(a.streaming.observations[p])&&a.streaming.observations[p].metric==='audio_streams'));
  const values=state.artists.map(a=>rankingPlatforms.length?rankingPlatforms.reduce((n,p)=>n+a.streaming.observations[p].value,0):null);
  const maximum=Math.max(0,...values.filter(Number.isFinite));
  for(const [i,a] of state.artists.entries()){
   const b=baseline[a.slug];if(!b)throw Error('Missing published baseline: '+a.slug);
   const index=maximum>0&&values[i]!==null?100*values[i]/maximum:null;
   if(index===null)throw Error('No comparable streaming coverage for Current ranking');
   if(!Number.isFinite(b.editorialContribution)||b.editorialContribution<0)throw Error('Invalid editorial contribution: '+a.slug);
   const editorialContribution=83*b.editorialContribution/editorialMaximum;
   a.previousRank=b.rank;a.score=Number((editorialContribution+.17*index).toFixed(6));
   a.scoreBreakdown={editorialContribution,rawEditorialContribution:b.editorialContribution,editorialMaximum,editorialWeight:83,streamsIndex:index,streamsScore:index,streamWeight:17,listenerWeight:0,streamCoverage:rankingPlatforms,previousScore:b.score,baselineDate:'2026-10-05',method:'83 × (locked editorial contribution / locked editorial maximum) + 17% × comparable tracked audio-stream index'};
  }
  state.artists.sort((a,b)=>b.score-a.score||a.previousRank-b.previousRank||a.slug.localeCompare(b.slug)).forEach((a,i)=>a.rank=i+1);
  state.meta.rankingMethod={editorial:'Locked published editorial contribution normalized to 83 points using the maximum of the complete locked baseline; individual editorial marks are not available',editorialWeight:83,streamWeight:17,listenerWeight:0,streams:'17% × (100 × comparable tracked audio streams / maximum)',rankingPlatforms,coveragePolicy:'Only audio platforms with sourced catalogue totals for every Current candidate enter the score. Partial platform totals and video views remain separate.',tieBreak:'Previous published rank, then artist slug',baselineDate:'2026-10-05'};
  state.meta.rankingUpdatedAt=state.meta.lastRefreshAttemptAt||state.meta.streamsUpdatedAt;
  return state;
 }
 function catalogue(artists,extras={},kind='songs'){
  const records=new Map();
  for(const a of artists)for(const t of a[kind]||[]){
   if(!t.spotifyId)continue;const id=(kind==='songs'?'spotify:':'spotify-album:')+t.spotifyId;const prior=records.get(id);
   if(prior){if(!prior.artistSlugs.includes(a.slug))prior.artistSlugs.push(a.slug);if(Date.parse(t.lastVerifiedAt)<=Date.parse(prior.observedAt))continue;}
   const observations={...Object.fromEntries(platforms.map(p=>[p,null])),spotify:measurement(t.streams,a.sources.catalogue,t.lastVerifiedAt||a.statsLastUpdatedAt,a.spotifySourceUpdatedAt)};
   for(const p of platforms.filter(p=>p!=='spotify')){const o=extras[id]?.[p];if(valid(o))observations[p]=o;}
   if(observations.spotify)observations.spotify.scope=kind==='songs'?'recording':'album';
   records.set(id,{id,title:t.title,artistSlugs:prior?.artistSlugs||[a.slug],identifiers:{spotify:t.spotifyId,isrc:t.isrc||null},observedAt:t.lastVerifiedAt||a.statsLastUpdatedAt,...summary(observations)});
  }
  return [...records.values()];
 }
 return {apply,catalogue,summary,measurement,platforms,labels};
});
