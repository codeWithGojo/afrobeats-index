(function(){
 async function flags(){try{const review=await fetch('/data/stream-review.json').then(r=>r.json());for(const a of review.artists){const row=document.querySelector(`.current-row[data-artist-slug="${a.slug}"]`);if(!row||row.querySelector('.stream-review-flag'))continue;const badge=document.createElement('span');badge.className='stream-review-flag';badge.tabIndex=0;badge.textContent='Streams: review';badge.title=a.reasons.join(' · ');row.querySelector('.current-name')?.append(badge);}}catch(e){console.warn('Stream review unavailable',e);}}
 window.addEventListener('afri:artists-updated',flags);if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',flags);else flags();
})();
