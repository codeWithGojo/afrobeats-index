// Personal stats service (/api/product?service=stats). No new serverless function.
// action=config   feature flags read from the environment.
// action=lastfm   read-only proxy for public Last.fm profiles (LASTFM_API_KEY stays on the server).
// action=waitlist Apple Music waitlist, email stored only with explicit consent.
const { rest, publicOrigin } = require('./product-server.cjs');
const flag = v => /^(1|true|yes|on)$/i.test(String(v || ''));
const flags = () => ({
  appleMusic: flag(process.env.APPLE_MUSIC_ENABLED),
  lastfm: !!process.env.LASTFM_API_KEY,
  spotify: { beta: true, note: 'Spotify limits apps in Development Mode to 5 allowlisted users. Ask to be added, or use Last.fm or a history file.' },
});
const PERIODS = { short_term: '1month', medium_term: '6month', long_term: 'overall' };
const USER = /^[A-Za-z][A-Za-z0-9_-]{1,14}$/;

async function lastfm(req, res) {
  const key = process.env.LASTFM_API_KEY;
  if (!key) return res.status(503).json({ error: 'Last.fm is not configured yet.' });
  const user = String(req.query.user || ''), kind = String(req.query.kind || '');
  if (!USER.test(user)) return res.status(400).json({ error: 'Enter a valid Last.fm username.' });
  const params = new URLSearchParams({ api_key: key, format: 'json', user });
  if (kind === 'artists' || kind === 'tracks') {
    const period = PERIODS[String(req.query.range || 'short_term')];
    if (!period) return res.status(400).json({ error: 'Unknown range' });
    params.set('method', kind === 'artists' ? 'user.gettopartists' : 'user.gettoptracks'); params.set('period', period); params.set('limit', '50');
    res.setHeader('Cache-Control', 'public,max-age=0,s-maxage=600');
  } else if (kind === 'recent') {
    const from = Number(req.query.from || 0);
    if (!Number.isInteger(from) || from < 0) return res.status(400).json({ error: 'Invalid start time' });
    params.set('method', 'user.getrecenttracks'); params.set('limit', '200'); params.set('page', String(Math.min(50, Math.max(1, Number(req.query.page) || 1))));
    if (from) params.set('from', String(from));
    res.setHeader('Cache-Control', 'no-store');
  } else return res.status(400).json({ error: 'Unknown request' });
  const r = await fetch('https://ws.audioscrobbler.com/2.0/?' + params, { headers: { 'User-Agent': 'AfriIndex/1.0' }, signal: AbortSignal.timeout(8000) });
  const body = await r.json().catch(() => null);
  if (!r.ok || !body || body.error) return res.status(body?.error === 6 ? 404 : 502).json({ error: body?.error === 6 ? 'That Last.fm user was not found or is private.' : 'Last.fm could not answer. Try again later.' });
  // Return only the fields the dashboard needs.
  if (kind === 'artists') return res.json({ items: (body.topartists?.artist || []).map((a, i) => ({ name: a.name, rank: i + 1, plays: Number(a.playcount) || null })) });
  if (kind === 'tracks') return res.json({ items: (body.toptracks?.track || []).map((t, i) => ({ title: t.name, artists: [t.artist?.name].filter(Boolean), rank: i + 1, plays: Number(t.playcount) || null })) });
  const rt = body.recenttracks || {};
  return res.json({ page: Number(rt['@attr']?.page) || 1, totalPages: Number(rt['@attr']?.totalPages) || 1,
    items: (rt.track || []).filter(t => t.date?.uts).map(t => ({ playedAt: new Date(Number(t.date.uts) * 1000).toISOString(), title: t.name, artist: t.artist?.['#text'] || t.artist?.name || '', album: t.album?.['#text'] || null })) });
}

async function waitlist(req, res) {
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).end(); }
  if (!publicOrigin(req)) return res.status(403).json({ error: 'Forbidden' });
  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  const email = String(body.email || '').trim().toLowerCase();
  if (body.feature !== 'apple-music') return res.status(400).json({ error: 'Unknown feature' });
  if (body.consent !== true) return res.status(400).json({ error: 'Tick the box to agree before joining.' });
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || email.length > 254) return res.status(400).json({ error: 'Enter a valid email address.' });
  await rest('feature_waitlist?on_conflict=feature,email', { method: 'POST', admin: true, headers: { Prefer: 'resolution=ignore-duplicates,return=minimal' }, body: { feature: 'apple-music', email, consent_at: new Date().toISOString() } });
  return res.json({ ok: true, message: 'You are on the list. We will email you once when Apple Music is ready.' });
}

module.exports = async (req, res) => {
  const action = String(req.query.action || 'config');
  try {
    if (action === 'config') { res.setHeader('Cache-Control', 'public,max-age=0,s-maxage=300'); return res.json(flags()); }
    if (action === 'lastfm') return await lastfm(req, res);
    if (action === 'waitlist') return await waitlist(req, res);
    return res.status(404).json({ error: 'Unknown action' });
  } catch (error) {
    return res.status(error.status || 503).json({ error: error.status && error.status < 500 ? error.message : 'This feature could not load. Please retry.' });
  }
};
module.exports.flags = flags;
