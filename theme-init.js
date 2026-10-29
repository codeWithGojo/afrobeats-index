// Apply the saved palette before paint. Older email templates can return to /.
(() => {
  try { document.documentElement.dataset.theme = localStorage.getItem('afri-theme') === 'light' ? 'light' : 'dark'; } catch { document.documentElement.dataset.theme = 'dark'; }
  try { const language=JSON.parse(localStorage.getItem('afri-reader-language')||'"en"'); if(['en','fr','pt'].includes(language))document.documentElement.lang=language; const size=JSON.parse(localStorage.getItem('afri-reader-size')||'"normal"'); if(['normal','large','larger'].includes(size))document.documentElement.dataset.readerSize=size; } catch {}
  const hash = new URLSearchParams(location.hash.slice(1));
  const query = new URLSearchParams(location.search);
  // Only old email templates return to the homepage. Spotify owns callbacks on
  // /music-receipt and /studio/playlists; never move their codes to Supabase.
  const legacyEmailReturn = location.pathname === '/' && !query.has('state') &&
    (hash.has('access_token') || hash.has('error_description') || query.has('token_hash') || query.has('code'));
  if (legacyEmailReturn) {
    location.replace('/account' + location.search + location.hash);
  }
})();
