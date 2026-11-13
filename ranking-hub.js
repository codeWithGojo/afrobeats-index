/* Shared chart navigation, movement glyphs and the source-backed stream table. */
(() => {
  'use strict';
  const $=id=>document.getElementById(id),model=window.AfriCharts;
  if(!model)return;
  const e=model.escape;
  function navigation(){
    const path=location.pathname.replace(/\.html$/,'').replace(/\/$/,'')||'/';
    const ranking=/^\/(?:rankings|current|all-time|albums|releases|regions|net-worth|top100|top100-albums|streams|turntable(?:-[a-z-]+)?)(?:\/|$)/.test(path);
    document.querySelectorAll('.app-primary a,.app-bottom-nav a').forEach(link=>{
      const href=new URL(link.href).pathname;
      if((href==='/rankings'&&ranking)||(href==='/pro'&&(path==='/pro'||path==='/studio/api')))link.setAttribute('aria-current','page');
    });
    const picker=$('ranking-destination');
    if(picker){if(path==='/streams'&&new URLSearchParams(location.search).get('year')==='2026')picker.value='/streams?year=2026';picker.addEventListener('change',()=>location.assign(picker.value));}
    document.querySelectorAll('.movement').forEach(node=>{
      if(node.querySelector('svg'))return;
      const text=node.textContent.trim(),type=node.classList.contains('movement-up')?'up':node.classList.contains('movement-down')?'down':node.classList.contains('movement-new')?'new':'flat';
      node.innerHTML=model.icon(type)+`<span>${type==='flat'?'':e(text.replace(/^[↑↓]\s*/,''))}</span>`;
    });
  }
  function turntable(){
    const root=document.querySelector('[data-turntable-chart]');if(!root)return;
    const rows=[...root.querySelectorAll('tbody tr')],search=$('table-search'),movement=$('table-movement');
    const render=()=>{const query=search.value.trim().toLocaleLowerCase();let count=0;for(const row of rows){row.hidden=!!((query&&!row.dataset.chartSearch.includes(query))||(movement.value&&row.dataset.chartMovement!==movement.value));if(!row.hidden)count++;}$('table-count').textContent=`${count} ${count===1?'entry':'entries'} · official chart positions`;$('table-empty').hidden=count>0;document.dispatchEvent(new Event('afri:chart-filtered'));};
    search.addEventListener('input',render);movement.addEventListener('change',render);
    root.querySelector('[data-table-reset]').addEventListener('click',()=>{search.value='';movement.value='';render();search.focus();});
  }
  async function streams(){
    const root=document.querySelector('[data-stream-counter]');if(!root)return;
    const search=$('stream-search'),type=$('stream-type'),year=$('stream-year'),sort=$('stream-sort'),status=$('stream-load-status');
    let rows=[],filtered=[],page=0,ready=false;const size=50;
    const compact=value=>new Intl.NumberFormat('en',{notation:'compact',maximumFractionDigits:1}).format(value);
    const controls=[search,type,year,sort];
    function setQuery(){const url=new URL(location.href);for(const [key,value]of [['q',search.value],['type',type.value==='songs'?'':type.value],['year',year.value],['sort',sort.value==='total'?'':sort.value]]){if(value)url.searchParams.set(key,value);else url.searchParams.delete(key);}history.replaceState({},'',url);const picker=$('ranking-destination');if(picker)picker.value=year.value==='2026'?'/streams?year=2026':'/streams';}
    function feature(row){
      $('stream-feature').hidden=!row;if(!row)return;
      $('counter-kind').textContent=`${row.type==='artists'?'ARTIST CATALOGUE':row.type==='albums'?'ALBUM':'SONG'} / SPOTIFY`;
      $('counter-title').textContent=row.title;$('counter-artist').textContent=row.artist;$('counter-total').textContent=row.total.toLocaleString('en');
      $('counter-daily').textContent=row.daily===null?'Daily count unavailable':row.daily<0?`${row.daily.toLocaleString('en')} source adjustment`:`+${compact(row.daily)} daily streams`;
      $('counter-source').href=row.source;$('counter-source').textContent=`Source · ${row.sourceDate||'date unavailable'} ↗`;
    }
    function tableRow(row,index){const daily=row.daily===null?'—':row.daily<0?e(row.daily.toLocaleString('en')):model.icon('up')+' +'+e(row.daily.toLocaleString('en'));return `<tr><td class="table-rank">${page*size+index+1}</td><th scope="row" class="table-entry"><button type="button" class="stream-pick" data-stream-id="${e(row.id)}">${e(row.title)}</button><small>${e(row.artist)}</small></th><td class="stream-total">${row.total.toLocaleString('en')}</td><td><span class="stream-daily">${daily}</span></td><td><a href="${e(row.source)}" target="_blank" rel="noopener noreferrer">${e(row.sourceDate||'Source')} ↗</a></td></tr>`;}
    function render(reset=true){
      if(!ready)return;
      if(reset)page=0;
      if(type.value==='artists')year.value='';year.disabled=type.value==='artists';
      filtered=model.filter(rows,{search:search.value,type:type.value,year:year.value,sort:sort.value});
      const visible=filtered.slice(page*size,(page+1)*size),pages=Math.max(1,Math.ceil(filtered.length/size));
      $('stream-rows').innerHTML=visible.map(tableRow).join('');
      const noun=filtered.length===1?type.value.slice(0,-1):type.value;
      $('stream-count').textContent=`${filtered.length.toLocaleString('en')} ${noun}${filtered.length?` · showing ${page*size+1}–${Math.min((page+1)*size,filtered.length)}`:''}`;
      $('stream-entry-heading').textContent=type.value==='artists'?'Artist / country':`${type.value==='albums'?'Album':'Song'} / tracked artist`;
      $('stream-chart-title').textContent=`${sort.value==='daily'?'Biggest daily streams':'Most streamed'}${year.value?' · '+year.value+' releases':' '+type.value}`;
      root.querySelector('.stream-year-note').hidden=!year.value;
      $('stream-empty').hidden=filtered.length>0;$('stream-previous').disabled=page===0;$('stream-next').disabled=page+1>=pages;$('stream-page').textContent=`Page ${page+1} of ${pages}`;
      feature(visible[0]);setQuery();
    }
    function restore(){const params=new URLSearchParams(location.search);search.value=params.get('q')||'';type.value=['albums','artists'].includes(params.get('type'))?params.get('type'):'songs';year.value=params.get('year')==='2026'?'2026':'';sort.value=params.get('sort')==='daily'?'daily':'total';render();}
    restore();
    for(const control of controls)control.addEventListener(control===search?'input':'change',()=>render());
    $('stream-previous').addEventListener('click',()=>{page=Math.max(0,page-1);render(false);});
    $('stream-next').addEventListener('click',()=>{if((page+1)*size<filtered.length){page++;render(false);}});
    $('stream-rows').addEventListener('click',event=>{const button=event.target.closest('[data-stream-id]');if(button)feature(rows.find(row=>row.id===button.dataset.streamId));});
    root.querySelector('[data-stream-reset]').addEventListener('click',()=>{search.value='';year.value='';sort.value='total';render();search.focus();});
    window.addEventListener('popstate',restore);
    async function load(){
    controls.forEach(control=>control.disabled=false);
    status.textContent='Loading the searchable stream catalogue…';
    try{
      const response=await fetch('/data/stream-counter.json',{credentials:'omit'});if(!response.ok)throw Error('Catalogue unavailable');
      const data=await response.json();if(!Array.isArray(data.rows)||!data.rows.length)throw Error('Empty catalogue');
      rows=data.rows;ready=true;render();
      status.textContent=`Snapshot checked ${new Intl.DateTimeFormat('en-GB',{day:'numeric',month:'short',year:'numeric',timeZone:'UTC'}).format(new Date(data.asOf))}. Daily counts are source observations, not a live play counter. A dash means no daily observation is available.`;
    }catch{
      controls.forEach(control=>control.disabled=true);
      status.replaceChildren(document.createTextNode('The full catalogue could not load. The published first 50 remain below. '));
      const retry=document.createElement('button');retry.type='button';retry.className='stream-retry';retry.textContent='Retry';retry.addEventListener('click',load,{once:true});status.append(retry);
    }
    }
    await load();
  }
  function init(){navigation();turntable();streams();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
