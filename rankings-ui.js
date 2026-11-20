(function(){
 window.AfriRankings={managed:true};
 function init(){const chart=document.querySelector('.current-ranking'),search=document.getElementById('chart-search'),sort=document.getElementById('chart-sort');if(!chart||!search||!sort)return;
 const model=window.AfriRankingSort,country=document.getElementById('chart-country'),genre=document.getElementById('chart-genre'),details=document.querySelector('.mobile-filter-details'),summary=details?.querySelector('summary'),reduced=matchMedia('(prefers-reduced-motion: reduce)');chart.dataset.sortManaged='true';
 let sources=[],frame=0,animations=[];
 const load=()=>{sources=window.AFRI_CURRENT_ARTISTS||window.AfriReaderIndex?.artists||sources;};
 function render(animate=true){load();if(!sources.length)return;animations.forEach(a=>a.cancel());animations=[];const rows=[...chart.querySelectorAll('.current-row')],bySlug=new Map(rows.map(r=>[r.dataset.artistSlug,r])),before=new Map(rows.filter(r=>!r.hidden).map(r=>[r,r.getBoundingClientRect().top]));
 const detailsBySlug=new Map([...chart.querySelectorAll('[data-stats-for]')].map(el=>[el.dataset.statsFor,el]));
 const query=search.value.trim().toLocaleLowerCase(),selected=model.mode(sort.value);const list=model.ordered(sources,selected);let position=0;
 for(const a of list){const row=bySlug.get(a.slug);if(!row)continue;const matches=(!country.value||(a.countries||[a.country]).includes(country.value)||a.country===country.value)&&(!genre.value||(a.genres||[]).includes(genre.value))&&(!query||[a.name,a.country,...(a.genres||[]),...(a.tags||[])].join(' ').toLocaleLowerCase().includes(query));row.hidden=!matches;const stats=detailsBySlug.get(a.slug);if(stats)stats.hidden=!matches;if(matches)position++;
 row.querySelector('.current-rank').textContent=String(a.rank).padStart(2,'0');
 row.querySelector('.current-score strong').textContent=Number(a.score).toFixed(1);
 row.setAttribute('aria-label',`${a.name}, published rank ${a.rank}, index score ${Number(a.score).toFixed(1)}. Open artist page`);
 }
 const orderedRows=list.map(a=>bySlug.get(a.slug)).filter(Boolean);const nodes=orderedRows.flatMap(row=>[row,detailsBySlug.get(row.dataset.artistSlug)].filter(Boolean));
 if(nodes.some((node,i)=>chart.children[i]!==node))chart.append(...nodes);
 if(animate&&!reduced.matches)for(const row of orderedRows){if(row.hidden||!before.has(row))continue;const delta=before.get(row)-row.getBoundingClientRect().top;if(Math.abs(delta)>1)animations.push(row.animate([{transform:`translateY(${delta}px)`},{transform:'translateY(0)'}],{duration:250,easing:'ease-out'}));}
 document.getElementById('chart-count').textContent=`${position} artist${position===1?'':'s'} · ${sort.selectedOptions[0].textContent}`;document.querySelector('.chart-empty').hidden=position>0;document.querySelector('.chart-columns>span:last-child').textContent='Index score';
 const active=document.querySelector('.active-chart-filters');active.replaceChildren();for(const [control,label]of [[country,country.value],[genre,genre.value]]){if(!label)continue;const chip=document.createElement('button');chip.type='button';chip.textContent=label+' ×';chip.setAttribute('aria-label','Remove '+label+' filter');chip.onclick=()=>{control.value='';control.dispatchEvent(new Event('change',{bubbles:true}));};active.append(chip);}active.hidden=!active.children.length;
 }
 function schedule(){if(frame)return;frame=requestAnimationFrame(()=>{frame=0;render(false);});}
 sort.value=model.mode(new URLSearchParams(location.search).get('sort'));sort.addEventListener('change',()=>{const url=new URL(location.href);url.searchParams.set('sort',sort.value);history.pushState({},'',url);render();});
 search.addEventListener('input',()=>render());country.addEventListener('change',()=>render());genre.addEventListener('change',()=>render());document.getElementById('chart-reset')?.addEventListener('click',()=>{search.value='';country.value='';genre.value='';country.dispatchEvent(new Event('change',{bubbles:true}));genre.dispatchEvent(new Event('change',{bubbles:true}));render();search.focus();});
 window.addEventListener('popstate',()=>{sort.value=model.mode(new URLSearchParams(location.search).get('sort'));render();});window.addEventListener('afri:artists-updated',()=>render(false));new MutationObserver(schedule).observe(chart,{childList:true});reduced.addEventListener('change',()=>{if(reduced.matches)animations.forEach(a=>a.cancel());});
 document.addEventListener('keydown',e=>{if(e.key==='/'&&!/INPUT|TEXTAREA|SELECT/.test(e.target.tagName)&&!e.target.isContentEditable){e.preventDefault();search.focus();}});
 render(false);
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
