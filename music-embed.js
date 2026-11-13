/* Shared by the page renderers and the click-to-load player. */
(function (factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else window.AfriMusicEmbed = factory();
})(function () {
  const escape = value => String(value).replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[char]);

  function sources(media) {
    if (!media) return null;
    const { provider, id } = media;
    if (provider === 'youtube' && /^[\w-]{11}$/.test(id)) {
      return {
        label: 'YouTube',
        embed: 'https://www.youtube-nocookie.com/embed/' + id + '?autoplay=1&playsinline=1',
        url: 'https://www.youtube.com/watch?v=' + id
      };
    }
    if (provider === 'spotify' && /^[a-zA-Z0-9]{22}$/.test(id)) {
      return {
        label: 'Spotify',
        embed: 'https://open.spotify.com/embed/track/' + id,
        url: 'https://open.spotify.com/track/' + id
      };
    }
    return null;
  }

  function trigger(media, title, label = 'Play', context = title) {
    const source = sources(media);
    if (!source) return '';
    return `<a class="music-play" href="${source.url}" target="_blank" rel="noopener noreferrer" data-music-provider="${media.provider}" data-music-id="${media.id}" data-music-title="${escape(title)}" aria-label="${escape(label === 'Play teaser' ? 'Play teaser for ' + context : 'Play ' + title)}"><span aria-hidden="true">▶</span> ${escape(label)}</a>`;
  }

  return { sources, trigger };
});
