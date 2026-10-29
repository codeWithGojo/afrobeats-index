(() => {
  const desk = document.querySelector('.artist-desk');
  if (!desk) return;
  const search = desk.querySelector('#desk-artist-search');
  const country = desk.querySelector('#desk-country');
  const reset = desk.querySelector('#desk-reset');
  const status = desk.querySelector('#desk-count');
  const empty = desk.querySelector('.artist-desk-empty');
  const rows = [...desk.querySelectorAll('[data-artist]')];
  const normalize = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
  function update() {
    const query = normalize(search.value);
    const filtered = rows.filter(row => normalize(row.dataset.artist + ' ' + row.dataset.countries).includes(query) && (!country.value || row.dataset.countries.split('|').includes(country.value)));
    const active = Boolean(query || country.value);
    const shown = active ? filtered : filtered.slice(0, 8);
    const visible = new Set(shown);
    rows.forEach(row => { row.hidden = !visible.has(row); });
    empty.hidden = shown.length > 0;
    status.textContent = active ? `${filtered.length} ${filtered.length === 1 ? 'artist' : 'artists'} found in the Current 50` : '8 artists from the published Current 50';
    reset.disabled = !active;
  }
  search.addEventListener('input', update);
  country.addEventListener('change', update);
  reset.addEventListener('click', () => { search.value = ''; country.value = ''; update(); search.focus(); });
  desk.querySelector('.artist-desk-controls').hidden = false;
  update();
})();
