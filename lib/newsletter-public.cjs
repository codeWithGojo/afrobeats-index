const { isIP } = require('node:net');
const { data, origin } = require('./shared.cjs');
const { buildBrief, emailDocument } = require('./weekly-brief.cjs');
const windows = new Map();
function allowedOrigin(req) {
  const host = req.headers.host;
  return !req.headers.origin || req.headers.origin === origin ||
    (typeof host === 'string' && /^[a-z0-9.-]+(?::\d+)?$/i.test(host) && req.headers.origin === `https://${host}`);
}
function rateLimited(ip, now = Date.now()) {
  // A small per-instance guard; provider anti-abuse checks also remain enabled.
  for (const [key, value] of windows) if (now - value.start > 60000) windows.delete(key);
  const value = windows.get(ip) || {start: now, count: 0};
  value.count++; windows.set(ip, value);
  return value.count > 5;
}
async function buttondown(path, options = {}) {
  const r = await fetch('https://api.buttondown.com/v1/' + path, {
    ...options,
    headers: {Authorization: 'Token ' + process.env.BUTTONDOWN_API_KEY, 'Content-Type':'application/json', ...options.headers},
    signal: AbortSignal.timeout(10000)
  });
  if (!r.ok) {
    const error = Error('Newsletter provider unavailable'); error.status = r.status; throw error;
  }
  return r.json();
}
async function handlePublicNewsletter(req, res, action) {
  if (!['status','subscribe','preview','draft'].includes(action)) return false;
  res.setHeader('Cache-Control','no-store');
  const method = req.method || 'GET';
  if (action === 'status') {
    if (method !== 'GET') { res.setHeader('Allow','GET'); res.status(405).end(); return true; }
    res.json({ signupConfigured: !!process.env.BUTTONDOWN_API_KEY, provider:'Buttondown', cadence:'Sunday', doubleOptIn:true, draftAutomationConfigured:!!(process.env.BUTTONDOWN_API_KEY && process.env.CRON_SECRET), sendsAutomatically:false }); return true;
  }
  if (action === 'preview') {
    if (method !== 'GET') { res.setHeader('Allow','GET'); res.status(405).end(); return true; }
    res.setHeader('Content-Type','text/html; charset=utf-8');
    res.send(emailDocument(buildBrief(data), require('./commerce.cjs').activeSponsors(), 'Preview only. No email has been sent. Buttondown adds the unsubscribe link to delivered issues.')); return true;
  }
  if (action === 'draft') {
    if (method !== 'GET' && method !== 'POST') { res.setHeader('Allow','GET, POST'); res.status(405).end(); return true; }
    if (!process.env.CRON_SECRET || req.headers.authorization !== 'Bearer ' + process.env.CRON_SECRET) {res.status(401).json({error:'Unauthorized'});return true;}
    if (!process.env.BUTTONDOWN_API_KEY) {res.status(503).json({error:'Newsletter provider is not configured'});return true;}
    const brief = buildBrief(data), subject = `Afri Index · Sunday brief · ${brief.issue}`;
    try {
      // Reconcile a previous attempt, including a draft already sent by its editor.
      const existing = await buttondown('emails?subject=' + encodeURIComponent(subject));
      const match = existing.results?.find(issue => issue.subject === subject || issue.metadata?.afri_issue === brief.issue);
      if (match) {res.json({created:false, issue:brief.issue, status:match.status});return true;}
      await buttondown('emails', { method:'POST', body:JSON.stringify({subject,slug:`afri-sunday-${brief.issue}`,status:'draft',body:emailDocument(brief, require('./commerce.cjs').activeSponsors()),metadata:{afri_issue:brief.issue, chart_as_of:brief.chartAsOf}}) });
      res.json({created:true,issue:brief.issue,status:'draft',note:'Review the two commentary lines in Buttondown, then schedule or send the issue.'});
    } catch {res.status(503).json({error:'Could not prepare the draft. Check Buttondown for an existing issue before retrying.'});}
    return true;
  }
  if (method !== 'POST') {res.setHeader('Allow','POST');res.status(405).end();return true;}
  if (!allowedOrigin(req)) {res.status(403).json({error:'Submit the form from Afri Index.'});return true;}
  let body;
  try {body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;} catch {}
  if (!body || typeof body !== 'object' || Array.isArray(body) || JSON.stringify(body).length > 2048) {res.status(400).json({error:'Enter an email address and confirm your consent.'});return true;}
  const email = typeof body.email === 'string' ? body.email.trim() : '';
  if (email.length > 254 || !/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(email) || body.consent !== true) {res.status(400).json({error:'Enter a valid email address and tick the consent box.'});return true;}
  const message = 'If this address can be subscribed, a confirmation email is on its way. Check your inbox; existing subscriptions stay unchanged.';
  if (body.website) {res.json({message});return true;}
  const ip = String(req.headers['x-vercel-forwarded-for'] || req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown').split(',')[0].trim();
  if (rateLimited(ip)) {res.setHeader('Retry-After','60');res.status(429).json({error:'Too many attempts. Wait a minute before trying again.'});return true;}
  if (!process.env.BUTTONDOWN_API_KEY) {res.status(503).json({error:'Email signup opens soon. Read the latest brief while delivery is being connected.'});return true;}
  const sources = ['homepage','music-receipt','underground','newsletter'];
  try {
    await buttondown('subscribers', {method:'POST',body:JSON.stringify({email_address:email,type:'unactivated',...(isIP(ip)?{ip_address:ip}:{}),referrer_url:origin+'/newsletter',utm_source:sources.includes(body.source)?body.source:'website'})});
    res.json({message});
  } catch (error) {
    // Preserve provider suppression and collision rules. Do not reactivate an address.
    if ([400,409].includes(error.status)) res.json({message});
    else res.status(error.status === 429 ? 429 : 503).json({error:error.status === 429 ? 'Signup is busy. Please try again later.' : 'Could not reach the email service. Please retry; your address has not been saved on this page.'});
  }
  return true;
}
module.exports = { handlePublicNewsletter, rateLimited };
