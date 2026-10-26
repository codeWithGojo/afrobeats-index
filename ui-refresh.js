(function () {
  function syncView(id) {
    const active = document.getElementById(id);
    if (!active || !active.classList.contains('tab-content')) return;
    const onChart = id === 'current';
    document.querySelector('.index-hero')?.toggleAttribute('hidden', !onChart);
    document.querySelector('.freshness-module')?.toggleAttribute('hidden', !onChart);
    document.querySelectorAll('.nav-btn[data-tab]').forEach((button) => {
      const selected = button.dataset.tab === id;
      button.classList.toggle('nav-active', selected);
      button.setAttribute('aria-current', selected ? 'page' : 'false');
    });
    const more = document.getElementById('more-menu');
    if (more) {
      more.open = false;
      more.classList.toggle('has-active', Boolean(more.querySelector(`.nav-active`)));
    }
  }

  function fallbackArtwork(image) {
    if (!(image instanceof HTMLImageElement) || !image.matches('#yearly .yearly-art')) return;
    const row = image.closest('[data-yearly-artist]');
    const artist = (window.AFRI_CURRENT_ARTISTS || []).find((entry) => entry.slug === row?.dataset.yearlyArtist);
    const fallback = artist?.imageFallback || artist?.image;
    if (fallback && !image.dataset.artFallback) {
      image.dataset.artFallback = 'true';
      image.alt = `${artist.name} portrait; release artwork unavailable`;
      image.src = fallback;
      return;
    }
    const placeholder = document.createElement('span');
    placeholder.className = 'yearly-art yearly-art-fallback';
    placeholder.textContent = (artist?.name || row?.querySelector('.yearly-title')?.textContent || '?').slice(0, 1);
    placeholder.setAttribute('aria-label', 'Release artwork unavailable');
    image.replaceWith(placeholder);
  }

  function init() {
    const chart = document.querySelector('#current .current-ranking');
    const search = document.getElementById('chart-search');
    const country = document.getElementById('chart-country');
    const genre = document.getElementById('chart-genre');
    if (chart && search && country && !window.AfriRankings?.managed) {
      const filter = () => {
        const query = search.value.toLocaleLowerCase().trim();
        const rows = [...chart.querySelectorAll('.current-row')];
        let count = 0;
        rows.forEach(row => {
          const matches = (!country.value || row.dataset.country === country.value) && (!query || row.textContent.toLocaleLowerCase().includes(query)) && (!genre?.value || (row.dataset.genres || '').split('|').includes(genre.value));
          row.hidden = !matches;
          if (matches) count++;
        });
        document.getElementById('chart-count').textContent = count === rows.length ? `Showing all ${rows.length} artists` : `${count} of ${rows.length} artists · official ranks retained`;
        document.querySelector('.chart-empty').hidden = count > 0;
      };
      search.addEventListener('input', filter);
      country.addEventListener('change', filter);
      genre?.addEventListener('change', filter);
      document.getElementById('chart-reset')?.addEventListener('click', () => { search.value = ''; country.value = ''; if(genre) genre.value = ''; filter(); search.focus(); });
    }
    document.querySelectorAll('.index-shortcuts a, .hero-edition a').forEach(link => link.addEventListener('click', event => {
      const id = new URL(link.href).searchParams.get('tab');
      if (id && typeof window.showTab === 'function') { event.preventDefault(); window.showTab(id); document.querySelector('.tab-content.active')?.scrollIntoView({block:'start'}); }
    }));
    document.addEventListener('error', (event) => fallbackArtwork(event.target), true);
    document.querySelectorAll('#yearly img.yearly-art').forEach((image) => {
      if (image.complete && !image.naturalWidth) fallbackArtwork(image);
    });
    const previous = window.showTab;
    if (typeof previous === 'function') {
      window.showTab = function (id) {
        previous(id);
        syncView(id);
      };
    }
    syncView(document.querySelector('.tab-content.active')?.id || 'current');
    document.addEventListener('click', (event) => {
      const menu = document.getElementById('more-menu');
      if (menu?.open && !menu.contains(event.target)) menu.open = false;
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') document.getElementById('more-menu')?.removeAttribute('open');
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
