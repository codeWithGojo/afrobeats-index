const { rest, user } = require('./product-server.cjs');
const { seed, artists, publicData, model } = require('./touring-data.cjs');
const fail = (message, status = 400) => Object.assign(Error(message), { status });
async function admin(req) {
    const identity = await user(req);
    // Membership is read on each write; revocation does not wait for JWT expiry.
    const members = await rest('touring_editors?user_id=eq.' + encodeURIComponent(identity.data.id) + '&select=user_id', { token: identity.token });
    if (!members.length)
        throw fail('Touring editor access is required.', 403);
    return identity;
}
async function latest() { const rows = await rest('touring_publications?select=id,payload,created_at&order=id.desc&limit=1', { admin: true }); return rows[0] || { id: 0, payload: seed }; }
module.exports = async (req, res) => {
    const action = String(req.query.action || 'data');
    res.setHeader('Cache-Control', 'no-store');
    try {
        if (req.method === 'GET' && ['data', 'rankings', 'tour'].includes(action)) {
            let release;
            try {
                release = await latest();
            }
            catch {
                return res.status(503).json({ error: 'Touring updates could not load. Retry to check the latest publication.', fallback: { publication: 0, dataset: publicData(seed), artists: artists() } });
            }
            res.setHeader('Cache-Control', 'public,max-age=0,s-maxage=30');
            const dataset = publicData(release.payload), list = artists();
            if (action === 'rankings') {
                const options = Object.fromEntries(['year', 'region', 'artist', 'country', 'genre', 'search', 'metric', 'level', 'status', 'venue', 'eventCountry'].map(k => [k, String(req.query[k] || '').slice(0, 120)]));
                if (!['', 'artists', 'tours', 'concerts'].includes(options.level))
                    throw fail('Unknown ranking level');
                const rows = model.aggregate(dataset, list, options), page = Math.max(1, Math.min(10000, Number(req.query.page) || 1)), size = 50;
                return res.json({ rows: rows.slice((page - 1) * size, page * size), total: rows.length, page, cutoff: dataset.cutoff });
            }
            if (action === 'tour') {
                const tour = dataset.tours.find(t => t.slug === req.query.slug);
                if (!tour)
                    return res.status(404).json({ error: 'Tour not found' });
                return res.json({ tour, concerts: dataset.concerts.filter(c => c.tourId === tour.id), reports: model.qualified(dataset).filter(r => r.eventIds.every(id => dataset.concerts.find(c => c.id === id)?.tourId === tour.id)), sources: dataset.sources });
            }
            return res.json({ publication: release.id, dataset, artists: list });
        }
        const identity = await admin(req);
        if (req.method === 'GET' && action === 'admin') {
            const release = await latest(), drafts = await rest('touring_drafts?select=id,payload,note,created_at&order=created_at.desc&limit=20', { token: identity.token }), audit = await rest('touring_audit?select=action,note,created_at&order=created_at.desc&limit=50', { token: identity.token });
            return res.json({ publication: release.id, dataset: release.payload, artists: artists(), drafts, audit });
        }
        if (req.method !== 'POST') {
            res.setHeader('Allow', 'GET, POST');
            return res.status(405).end();
        }
        if (req.headers.origin) {
            let origin;
            try {
                origin = new URL(req.headers.origin);
            }
            catch {
                throw fail('Invalid origin', 403);
            }
            if (origin.host !== req.headers.host)
                throw fail('Use this site to submit touring changes.', 403);
        }
        const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
        if (!body || JSON.stringify(body).length > 1500000)
            throw fail('Import exceeds 1.5 MB');
        if (!['validate', 'save', 'publish'].includes(action))
            throw fail('Unknown action');
        const errors = model.validate(body.dataset, artists());
        if (body.dataset?.cutoff > new Date().toISOString().slice(0, 10))
            errors.push('The reporting cutoff cannot be in the future.');
        if (action === 'validate')
            return res.json({ valid: !errors.length, errors, eligibleReports: errors.length ? 0 : model.qualified(body.dataset).length });
        if (errors.length)
            return res.status(422).json({ error: 'Import needs correction', errors });
        if (typeof body.note !== 'string' || body.note.trim().length < 10)
            throw fail('Explain the source review or correction in at least 10 characters.');
        if (action === 'save') {
            const saved = await rest('touring_drafts', { method: 'POST', token: identity.token, body: { payload: body.dataset, note: body.note, created_by: identity.data.id }, headers: { Prefer: 'return=representation' } });
            return res.json({ saved: saved[0]?.id });
        }
        if (!Number.isSafeInteger(body.expectedPublication))
            throw fail('Reload the latest publication before publishing.');
        const previous = await latest();
        if (previous.id !== body.expectedPublication)
            throw fail('Another edition was published. Reload before applying these changes.', 409);
        // Movement is calculated from actual publications; imported positions cannot manufacture history.
        const today = new Date().toISOString().slice(0, 10), payload = structuredClone(body.dataset);
        payload.updatedAt = new Date().toISOString();
        payload.rankingSnapshots = (previous.payload.rankingSnapshots || []).filter(s => s.asOf !== today);
        for (const year of ['', payload.cutoff.slice(0, 4)])
            for (const level of ['artists', 'tours'])
                for (const metric of ['gross', 'tickets']) {
                    const scope = (year || 'all-time') + ':' + level;
                    payload.rankingSnapshots.push({ id: today + '-' + (year || 'all-time') + '-' + level + '-' + metric, asOf: today, scope, metric, rows: model.aggregate(payload, artists(), { year, level, metric }).map(r => ({ id: r.id, rank: r.rank, value: r[metric] })) });
                }
        payload.rankingSnapshots = payload.rankingSnapshots.filter((s, i, list) => list.slice(i + 1).filter(x => x.scope === s.scope && x.metric === s.metric).length < 24);
        // Service-role RPC is inaccessible to public clients. Validation and editor checks precede it.
        const result = await rest('rpc/publish_touring', { method: 'POST', admin: true, body: { p_payload: payload, p_expected: body.expectedPublication, p_actor: identity.data.id, p_note: body.note } });
        return res.json({ publication: result });
    }
    catch (error) {
        return res.status(error.status || 503).json({ error: error.status ? error.message : 'Touring could not save or load. Reload the latest publication and retry.' });
    }
};
module.exports.loadPublic = async () => { const release = await latest(); return { publication: release.id, dataset: publicData(release.payload), artists: artists() }; };
