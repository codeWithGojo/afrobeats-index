// Sponsors service (/api/product?service=sponsors). Three fixed slots; rankings never carry sponsor content.
// action=active   GET   live slots (from sponsor_slots, cached 5 minutes; falls back to data/product-config.json)
// action=event    POST  {slot, kind:'impression'|'click'} daily counters per slot
// action=inquiry  POST  media kit inquiry, stored only with consent
const { rest, publicOrigin } = require('./product-server.cjs');
const commerce = require('./commerce.cjs');
const SLOTS = ['newsletter-header', 'watch-inline', 'board-presented-by'];
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const clean = s => ({ id: s.id, slot: s.slot, board: s.board || null, sponsorName: s.sponsor_name, headline: s.headline || null, copy: s.copy || null, ctaLabel: s.cta_label || 'Learn more', url: s.url, logoUrl: s.logo_url || null, endsOn: s.ends_on });
const valid = s => SLOTS.includes(s.slot) && commerce.safeLink(s.url) && s.sponsorName && (s.slot !== 'board-presented-by' || ['heat', 'current-100'].includes(s.board));

async function active(today = new Date().toISOString().slice(0, 10)) {
  try {
    const rows = await rest(`sponsor_slots?select=*&active=eq.true&starts_on=lte.${today}&ends_on=gte.${today}&order=starts_on.desc`);
    const out = [], seen = new Set();
    for (const s of (rows || []).map(clean).filter(valid)) { const key = s.slot + '|' + (s.board || ''); if (!seen.has(key)) { seen.add(key); out.push(s); } }
    return out;
  } catch {
    // Database not reachable or not migrated: the deploy-time list fills the newsletter header only.
    return commerce.activeSponsors(today).slice(0, 1).map(s => ({ id: null, slot: 'newsletter-header', board: null, sponsorName: s.name, headline: null, copy: s.copy, ctaLabel: s.label, url: s.url, logoUrl: null, endsOn: s.end }));
  }
}
const body = req => typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});

module.exports = async (req, res) => {
  const action = String(req.query.action || 'active');
  try {
    if (action === 'active') {
      res.setHeader('Cache-Control', 'public,max-age=0,s-maxage=300,stale-while-revalidate=600');
      return res.json({ slots: await active(), disclosure: 'Sponsored. A paid placement. Sponsors never affect rankings, scores or movement.' });
    }
    if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).end(); }
    if (!publicOrigin(req)) return res.status(403).json({ error: 'Forbidden' });
    const b = body(req);
    if (action === 'event') {
      if (!UUID.test(String(b.slot || '')) || !['impression', 'click'].includes(b.kind)) return res.status(400).json({ error: 'Invalid event' });
      await rest('rpc/sponsor_event', { method: 'POST', admin: true, body: { p_slot: b.slot, p_kind: b.kind } });
      return res.status(204).end();
    }
    if (action === 'inquiry') {
      if (b.website) return res.status(204).end(); // honeypot
      const email = String(b.email || '').trim().toLowerCase(), name = String(b.name || '').trim(), message = String(b.message || '').trim();
      if (b.consent !== true) return res.status(400).json({ error: 'Tick the box so we can reply to you.' });
      if (name.length < 2 || name.length > 100) return res.status(400).json({ error: 'Add your name.' });
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || email.length > 254) return res.status(400).json({ error: 'Enter a valid email address.' });
      if (message.length < 10 || message.length > 2000) return res.status(400).json({ error: 'Tell us a little about the campaign (10 to 2000 characters).' });
      const slots = (Array.isArray(b.slots) ? b.slots : []).filter(s => SLOTS.includes(s));
      await rest('sponsor_inquiries', { method: 'POST', admin: true, headers: { Prefer: 'return=minimal' }, body: { name, company: String(b.company || '').trim().slice(0, 120) || null, email, slots, budget: String(b.budget || '').slice(0, 60) || null, message, consent_at: new Date().toISOString() } });
      return res.json({ ok: true, message: 'Thanks. We reply within 3 working days.' });
    }
    return res.status(404).json({ error: 'Unknown action' });
  } catch (error) {
    return res.status(error.status && error.status < 500 ? error.status : 503).json({ error: 'This could not be saved. Please email us instead.' });
  }
};
module.exports.active = active;
module.exports.SLOTS = SLOTS;
