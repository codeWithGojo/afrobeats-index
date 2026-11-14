/* Shared chart presentation and stream lookup. No scores or source counts are changed. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.AfriCharts=factory();})(typeof window==='undefined'?globalThis:window,function(){
  const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const paths={up:'m6 15 6-6 6 6M12 9v12',down:'m6 9 6 6 6-6M12 3v12',flat:'M5 12h14',new:'M12 5v14M5 12h14',re:'M4 10a8 8 0 1 1 1 8M4 4v6h6',unknown:'M8 8a4 4 0 0 1 8 0c0 3-4 3-4 6m0 4h.01'};
  const icon=type=>`<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${paths[type]||paths.flat}"/></svg>`;
  function movement(rank,last,status=''){
    if(status==='NEW'||last===0)return {type:'new',text:'NEW',label:'New entry'};
    if(status==='RE-ENTRY'||status==='RE'||last<0)return {type:'re',text:'RE',label:'Re-entry'};
    if(!Number.isFinite(last)||!Number.isFinite(rank))return {type:'unknown',text:'—',label:'Previous position unavailable'};
    const delta=last-rank,type=delta>0?'up':delta<0?'down':'flat';
    return {type,text:delta?String(Math.abs(delta)):'',label:delta?`${delta>0?'Up':'Down'} ${Math.abs(delta)} ${Math.abs(delta)===1?'place':'places'} from #${last}`:'No change'};
  }
  function badge(rank,last,status){const m=movement(rank,last,status);return `<span class="rank-movement rank-movement-${m.type}" aria-label="${escape(m.label)}" title="${escape(m.label)}">${icon(m.type)}<span>${escape(m.text)}</span></span>`;}
  function query(value){const text=String(value||'').trim();const id=text.match(/(?:open\.spotify\.com\/(?:intl-[a-z]+\/)?(?:track|album|artist)\/|spotify:(?:track|album|artist):)([A-Za-z0-9]{22})/i)?.[1];return (id||text).toLocaleLowerCase();}
  function filter(rows,{search='',type='songs',year='',sort='total'}={}){
    const needle=query(search);
    return rows.filter(r=>r.type===type&&(!year||String(r.year)===String(year))&&(!needle||[r.title,r.artist,r.spotifyId].join(' ').toLocaleLowerCase().includes(needle)))
      .sort((a,b)=>(sort==='daily'?(b.daily??-1)-(a.daily??-1):b.total-a.total)||b.total-a.total||a.title.localeCompare(b.title));
  }
  return {escape,icon,movement,badge,query,filter};
});
