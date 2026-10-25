export async function renderAwards({root,index,e,eventMarkup}) {
  const response=await fetch('/data/awards-seasons.json');
  if(!response.ok)throw Error('Awards calendar could not load. Please retry.');
  const {seasons,checkedAt}=await response.json();
  const date=value=>new Intl.DateTimeFormat('en-GB',{day:'numeric',month:'short',year:'numeric',timeZone:'UTC'}).format(new Date(value+'T12:00:00Z'));
  const today=new Date().toISOString().slice(0,10);
  root.querySelector('.lede').textContent='The next ceremonies, key deadlines and artist submissions. Follow each season from entries to awards night.';
  root.insertAdjacentHTML('beforeend',`<div class="calendar-toolbar"><div class="calendar-tabs" role="group" aria-label="Calendar view"><button type="button" data-calendar-view="upcoming" aria-pressed="true">Upcoming awards</button><button type="button" data-calendar-view="past" aria-pressed="false">Past results</button></div><label>Find an award or artist<input id="award-search" type="search" placeholder="Grammys, Tems, AFRIMA…"></label></div><p class="source">Calendar checked ${date(checkedAt)} · Dates may change; organiser updates take priority.</p><p id="award-count" role="status" aria-live="polite"></p><div id="award-seasons"></div>`);
  const target=root.querySelector('#award-seasons'),search=root.querySelector('#award-search');let view='upcoming';
  function seasonMarkup(s){
    const days=Math.ceil((new Date(s.date+'T12:00:00Z')-new Date(today+'T12:00:00Z'))/86400000);
    const status=s.entryOpen&&today>=s.entryOpen&&today<=s.entryClose?'Entries open':s.status==='Entries open'?'Entries closed':s.status;
    return `<article class="award-season panel"><div class="award-season-head"><div class="award-date"><span>${e(new Intl.DateTimeFormat('en',{month:'short',timeZone:'UTC'}).format(new Date(s.date+'T12:00:00Z')))}</span><strong>${Number(s.date.slice(8))}</strong><small>${s.date.slice(0,4)}</small></div><div><p class="kicker">${e(s.body)}</p><h2>${e(s.title)}</h2><span class="preview-badge">${e(status)}</span></div></div><dl class="award-facts"><div><dt>When</dt><dd>${date(s.date)}${s.endDate?' – '+date(s.endDate):''}${days>=0?`<small>In ${days} days</small>`:''}</dd></div><div><dt>Where</dt><dd>${e(s.venue||'Venue to be announced')}<small>${e(s.city)}</small></dd></div></dl>${s.note?`<p class="muted">${e(s.note)}</p>`:''}<details class="award-timeline" open><summary>Key dates</summary><ol>${s.milestones.map(([day,label])=>`<li class="${day<today?'is-past':''}"><time datetime="${day}">${date(day)}</time><span>${e(label)}</span></li>`).join('')}</ol></details><details class="award-submissions" ${s.submissions.length?'open':''}><summary>Artist submissions <span>${s.submissions.length?s.submissions.length+' artists tracked':'Awaiting verified list'}</span></summary><p class="muted">${e(s.submissionNote)}</p><div class="submission-list">${s.submissions.map(a=>{const artist=index.artists.find(x=>x.slug===a.slug);return `<section class="submission-artist"><div class="submission-identity">${artist?`<img src="${e("/"+String(artist.image).replace(/^\//,""))}" alt="" width="40" height="40" loading="lazy">`:''}<strong>${a.slug?`<a href="/current/${e(a.slug)}">${e(a.artist)}</a>`:e(a.artist)}</strong><small>${e(a.status)}</small></div><ul>${a.works.map(work=>`<li>${e(work)}</li>`).join('')}</ul><a class="source" href="${e(a.source)}" target="_blank" rel="noopener noreferrer">Submission report ↗</a></section>`;}).join('')}</div></details><div class="actions"><a href="${e(s.source)}" target="_blank" rel="noopener noreferrer">Official announcement ↗</a><button type="button" data-save-date="${e(s.id)}">Save date</button></div></article>`;
  }
  function render(){
    const q=search.value.trim().toLowerCase();
    if(view==='past'){
      const events=(index.events||[]).filter(x=>['award','nomination'].includes(x.kind)&&!['scheduled','upcoming'].includes(x.details?.status)&&(!x.event_date||x.event_date<today)&&JSON.stringify(x).toLowerCase().includes(q)).sort((a,b)=>(b.event_date||String(b.details?.year||'')).localeCompare(a.event_date||String(a.details?.year||'')));
      target.innerHTML=events.map(eventMarkup).join('')||'<p class="empty">No past results match your search.</p>';root.querySelector('#award-count').textContent=events.length+' sourced past results';return;
    }
    const selected=seasons.filter(s=>(s.endDate||s.date)>=today&&JSON.stringify(s).toLowerCase().includes(q)).sort((a,b)=>a.date.localeCompare(b.date));
    root.querySelector('#award-count').textContent=selected.length+' upcoming award '+(selected.length===1?'season':'seasons');
    target.innerHTML=selected.map(seasonMarkup).join('')||'<p class="empty">No upcoming awards match. Try an artist or award name.</p>';
    target.querySelectorAll('[data-save-date]').forEach(button=>button.onclick=()=>{
      const s=seasons.find(s=>s.id===button.dataset.saveDate),end=new Date((s.endDate||s.date)+'T12:00:00Z');end.setUTCDate(end.getUTCDate()+1);
      const escape=value=>String(value).replace(/\\/g,'\\\\').replace(/\n/g,'\\n').replace(/[,;]/g,c=>'\\'+c);
      const lines=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Afri Index//Awards//EN','BEGIN:VEVENT','UID:'+s.id+'@afrobeats-index.vercel.app','DTSTAMP:'+checkedAt.replaceAll('-','')+'T000000Z','DTSTART;VALUE=DATE:'+s.date.replaceAll('-',''),'DTEND;VALUE=DATE:'+end.toISOString().slice(0,10).replaceAll('-',''),'SUMMARY:'+escape(s.title),'LOCATION:'+escape([s.venue||'Venue to be announced',s.city].join(', ')),'URL:'+s.source,'END:VEVENT','END:VCALENDAR'];
      const url=URL.createObjectURL(new Blob([lines.join('\r\n')+'\r\n'],{type:'text/calendar;charset=utf-8'})),a=document.createElement('a');a.href=url;a.download=s.id+'.ics';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
    });
  }
  search.addEventListener('input',render);
  root.querySelectorAll('[data-calendar-view]').forEach(button=>button.onclick=()=>{view=button.dataset.calendarView;root.querySelectorAll('[data-calendar-view]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));render();});
  render();
}
