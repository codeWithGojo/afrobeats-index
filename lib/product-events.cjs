// Usage events (/api/product?service=events). Fixed list of names and details; daily totals only.
// action=event   POST {name, detail?}   counted when both are on the allowlist
// action=summary GET  last 30 days; needs the x-admin-token header to match ADMIN_TOKEN
const { rest, publicOrigin } = require('./product-server.cjs');
const crypto = require('node:crypto');
const NAMES = new Set(['view','onboarding_shown','onboarding_step','onboarding_skip','onboarding_complete','share_open','share_click','stats_connect','stats_import','myindex_grade','sandbox_use','receipt_generate','lite_on','lite_off','push_optin']);
const DETAIL = /^[a-z0-9_-]{0,40}$/;
const body = req => typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
function admin(req) {
  const want = process.env.ADMIN_TOKEN || '', got = String(req.headers?.['x-admin-token'] || '');
  if (want.length < 24 || got.length !== want.length) return false;
  return crypto.timingSafeEqual(Buffer.from(got), Buffer.from(want));
}
module.exports = async (req, res) => {
  const action = String(req.query.action || 'event');
  try {
    if (action === 'summary') {
      res.setHeader('Cache-Control', 'no-store');
      if (!admin(req)) return res.status(401).json({ error: 'Admin token required.' });
      const since = new Date(Date.now() - 30 * 864e5).toISOString().slice(0, 10);
      const rows = await rest(`usage_events?select=day,name,detail,count&day=gte.${since}&order=day.desc`, { admin: true });
      return res.json({ since, rows });
    }
    if (action !== 'event') return res.status(404).json({ error: 'Unknown action' });
    if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).end(); }
    if (!publicOrigin(req)) return res.status(403).end();
    const b = body(req), name = String(b.name || ''), detail = String(b.detail || '').toLowerCase().slice(0, 40);
    if (!NAMES.has(name) || !DETAIL.test(detail)) return res.status(400).json({ error: 'Unknown event' });
    await rest('rpc/usage_event', { method: 'POST', admin: true, body: { p_name: name, p_detail: detail } });
    return res.status(204).end();
  } catch { return res.status(204).end(); } // Analytics must never break a page.
};
module.exports.NAMES = NAMES;
