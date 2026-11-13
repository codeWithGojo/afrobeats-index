(() => {
  const { sources } = window.AfriMusicEmbed;
  let active;

  function close(restoreFocus = false) {
    if (!active) return;
    const { trigger, container } = active;
    active = null;
    container.remove();
    trigger.setAttribute('aria-expanded', 'false');
    trigger.removeAttribute('aria-controls');
    if (restoreFocus) trigger.focus();
  }

  function syncControls() {
    if (active && (!active.trigger.isConnected || active.trigger.closest('tr')?.hidden)) close();
    document.querySelectorAll('[data-music-provider]:not([aria-expanded])').forEach(trigger => {
      trigger.setAttribute('aria-expanded', 'false');
    });
  }

  syncControls();

  document.addEventListener('click', event => {
    const trigger = event.target.closest('[data-music-provider]');
    if (!trigger || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    const { musicProvider: provider, musicId: id, musicTitle: title } = trigger.dataset;
    const source = sources({ provider, id });
    const row = trigger.closest('tr');
    const release = trigger.closest('.release-row');
    if (!source || (!row && !release)) return;
    event.preventDefault();
    if (active?.trigger === trigger) {
      close();
      return;
    }
    close();

    const panel = document.createElement('div');
    panel.className = 'music-player';
    panel.id = 'afri-music-player';
    panel.setAttribute('role', 'group');
    panel.setAttribute('aria-label', 'Player for ' + title);
    const controls = document.createElement('div');
    controls.className = 'music-player-controls';

    const link = document.createElement('a');
    link.href = source.url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.textContent = 'Open on ' + source.label + ' ↗';

    const dismiss = document.createElement('button');
    dismiss.type = 'button';
    dismiss.textContent = 'Close player';
    dismiss.addEventListener('click', () => close(true));
    controls.append(link, dismiss);

    const frame = document.createElement('iframe');
    frame.title = title + ' on ' + source.label;
    frame.className = 'music-frame music-frame-' + provider;
    frame.allow = 'autoplay; encrypted-media; fullscreen; picture-in-picture';
    frame.referrerPolicy = 'strict-origin-when-cross-origin';
    frame.allowFullscreen = true;
    frame.src = source.embed;
    panel.append(controls, frame);

    let container = panel;
    if (row) {
      container = document.createElement('tr');
      container.className = 'music-player-row';
      const cell = container.insertCell();
      cell.colSpan = row.cells.length;
      cell.append(panel);
      row.after(container);
    } else {
      release.append(panel);
    }

    active = { trigger, container };
    trigger.setAttribute('aria-expanded', 'true');
    trigger.setAttribute('aria-controls', panel.id);
    dismiss.focus({ preventScroll: true });
    controls.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  });

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && active &&
        (active.trigger === document.activeElement || active.container.contains(document.activeElement))) {
      close(true);
    }
  });

  document.addEventListener('afri:chart-filtered', syncControls);
  document.addEventListener('afri:visual-content', syncControls);
})();
