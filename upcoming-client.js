/* Progressive enhancement: the published list and reminders work without JS. */
(() => {
  const model = window.AfriUpcoming;
  if (!model) return;
  const list = document.querySelector('[data-upcoming-list]');
  if (!list) return;
  const compact = list.hasAttribute('data-upcoming-preview');
  const search = document.getElementById('release-search');
  const buttons = [...document.querySelectorAll('[data-release-type]')];
  const status = document.getElementById('release-count');
  const feedback = document.querySelector('[data-release-feedback]');
  let snapshot, type = 'All';
  function render() {
    const q = (search?.value || '').trim().toLocaleLowerCase();
    const all = model.upcoming(snapshot);
    const rows = all.filter(r=>(type==='All'||r.type===type)&&(!q||(r.artist+' '+r.title).toLocaleLowerCase().includes(q)));
    if (rows.length || !all.length) list.innerHTML = model.listMarkup(compact?rows.slice(0,3):rows,new Date(),compact);
    else list.innerHTML = '<div class="releases-empty"><h2>No releases match.</h2><p>Try another artist or select All releases.</p><button type="button" data-release-reset>Clear filters</button></div>';
    if (status) status.textContent = `${rows.length} ${rows.length===1?'release':'releases'} scheduled`;
    const next = document.querySelector('[data-release-next]');
    if (next) next.textContent = all[0] ? model.prettyDate(all[0].date,{day:'numeric',month:'short'}) : 'To be announced';
    document.querySelector('[data-release-controls]')?.removeAttribute('hidden');
    buttons.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.releaseType===type)));
  }
  search?.addEventListener('input',render);
  buttons.forEach(b=>b.addEventListener('click',()=>{type=b.dataset.releaseType;render();}));
  list.addEventListener('click',event=>{if(event.target.closest('[data-release-reset]')){type='All';search.value='';render();search.focus();}});
  async function load() {
    try {
      const response = await fetch('/data/upcoming-releases.json',{cache:'no-cache'});
      if (!response.ok) throw Error('Unavailable');
      const data = await response.json();
      if (!Array.isArray(data.releases) || Number.isNaN(Date.parse(data.checkedAt))) throw Error('Invalid calendar');
      snapshot = data;
      render();
      const updated = document.querySelector('[data-release-checked]');
      if (updated) {updated.dateTime=data.checkedAt;updated.textContent=model.prettyDate(model.dateKey(new Date(data.checkedAt)));}
      if (feedback) feedback.textContent = Date.now()-Date.parse(data.checkedAt)>172800000?'Showing the latest saved calendar update. New announcements may not be included yet.':'';
    } catch {
      // Retain the server-rendered calendar and its working reminder links.
      if (feedback) feedback.textContent = 'Showing the saved calendar. Reconnect and reload for the latest update.';
    }
  }
  load();
  // Refresh after a background tab is reopened and across the WAT date boundary.
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)load();});
  let day = model.dateKey();
  setInterval(()=>{const current=model.dateKey();if(snapshot&&!document.hidden&&day!==current){day=current;render();}},60000);
})();
