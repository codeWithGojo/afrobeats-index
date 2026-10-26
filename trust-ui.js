(function(){
 async function init(){const trust=window.AfriTrust;if(!trust)return;try{const sections=await fetch('/data/section-updates.json').then(r=>r.json());for(const [id,s]of Object.entries(sections)){const section=document.getElementById(id);if(!section||section.querySelector(`[data-section-updated="${id}"]`))continue;const p=document.createElement('p');p.className='section-updated';p.dataset.sectionUpdated=id;p.textContent=`Last updated · ${trust.formatDate(s.updatedAt)} · ${s.basis}`;section.append(p);}const list=document.getElementById('section-freshness-list');if(list){const stale=trust.staleSections(sections);list.textContent=stale.length?'Sections older than 14 days: '+stale.map(s=>`${s.label} (${trust.formatDate(s.updatedAt)})`).join('; '):'No section is older than 14 days.';}}catch(e){console.warn('Section date manifest unavailable',e);}
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
(function(){
 async function flags(){try{const review=await fetch('/data/stream-review.json').then(r=>r.json());for(const a of review.artists){const row=document.querySelector(`.current-row[data-artist-slug="${a.slug}"]`);if(!row||row.querySelector('.stream-review-flag'))continue;const badge=document.createElement('span');badge.className='stream-review-flag';badge.tabIndex=0;badge.textContent='Streams: review';badge.title=a.reasons.join(' · ');row.querySelector('.current-name')?.append(badge);}}catch(e){console.warn('Stream review unavailable',e);}}
 window.addEventListener('afri:artists-updated',flags);if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',flags);else flags();
})();
