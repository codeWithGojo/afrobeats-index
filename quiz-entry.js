(() => {
  const normalize = (name) => name.normalize('NFKD').toLowerCase().replace(/[^a-z0-9]/g, '');
  async function addQuizEntries() {
    try {
      const response = await fetch('/api/quiz');
      if (!response.ok) return;
      const data = await response.json();
      const artists = new Map(data.artists.filter((artist) => artist.questionCount >= 10).map((artist) => [normalize(artist.name), artist]));
      const section = document.getElementById('alltime');
      if (!section) return;
      const directory = document.createElement('a');
      directory.href = '/quiz?list=alltime'; directory.textContent = 'Play the All-Time artist quizzes ↗';
      directory.className = 'methodology-link'; directory.style.display = 'inline-block'; directory.style.marginBottom = '24px';
      section.querySelector(':scope > h2')?.insertAdjacentElement('afterend', directory);
      section.querySelectorAll('h3').forEach((heading) => {
        const names = heading.textContent.trim().split(' · ');
        const holder = document.createElement('div'); holder.style.display='flex';holder.style.gap='12px';holder.style.flexWrap='wrap';holder.style.marginTop='8px';
        names.forEach((name) => {
          const artist=artists.get(normalize(name));if(!artist)return;
          const link=document.createElement('a');link.href='/quiz/'+encodeURIComponent(artist.slug);link.textContent=names.length>1?artist.name+' quiz ↗':'Take fan quiz ↗';link.className='methodology-link';link.addEventListener('click',(event)=>event.stopPropagation());holder.append(link);
        });
        if(holder.childElementCount && !heading.closest('button'))heading.insertAdjacentElement('afterend',holder);
      });
    } catch (_) { /* Artist profiles keep their direct quiz link if the directory API is unavailable. */ }
  }
  addQuizEntries();
})();
