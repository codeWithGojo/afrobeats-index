const { test } = require('node:test'), assert = require('node:assert/strict');
const server = require.resolve('../lib/product-server.cjs');
let isEditor = false, signedIn = false, calls = [], current = 0;
require.cache[server] = { id: server, filename: server, loaded: true, exports: { user: async () => { if (!signedIn)
            throw Object.assign(Error('Sign in required'), { status: 401 }); return { data: { id: 'editor-id' }, token: 'verified-token' }; }, rest: async (path, o = {}) => { calls.push({ path, ...o }); if (path.startsWith('touring_editors'))
            return isEditor ? [{ user_id: 'editor-id' }] : []; if (path.startsWith('touring_publications'))
            return current ? [{ id: current, payload: require('../data/touring.json') }] : []; if (path === 'rpc/publish_touring')
            return current + 1; return []; } } };
const handler = require('../lib/product-touring.cjs'), seed = require('../data/touring.json');
async function invoke(action, body, method = 'POST', headers = { host: 'preview.example' }) { const res = { code: 200, headers: {}, setHeader(k, v) { this.headers[k] = v; }, status(n) { this.code = n; return this; }, json(v) { this.body = v; return this; }, end() { return this; } }; await handler({ query: { action }, body, method, headers }, res); return res; }
test('anonymous and ordinary users cannot validate, save, publish or read drafts', async () => { for (const action of ['admin', 'validate', 'save', 'publish']) {
    signedIn = false;
    assert.equal((await invoke(action, {}, action === 'admin' ? 'GET' : 'POST')).code, 401);
    signedIn = true;
    isEditor = false;
    assert.equal((await invoke(action, {}, action === 'admin' ? 'GET' : 'POST')).code, 403);
} assert.ok(!calls.some(c => c.path === 'rpc/publish_touring')); });
test('public data contains confirmed events but no private permission notes', async () => { signedIn = false; const r = await invoke('data', null, 'GET'); assert.equal(r.code, 200); assert.equal(r.body.dataset.concerts.length, 4); assert.ok(r.body.dataset.sources.every(s => !s.permissionEvidence)); });
test('editor writes enforce origin, validation, publication version and review note', async () => { signedIn = true; isEditor = true; assert.equal((await invoke('publish', { dataset: seed }, { 'toString': () => '' })).code, 405); assert.equal((await invoke('publish', { dataset: seed }, 'POST', { host: 'preview.example', origin: 'https://attacker.example' })).code, 403); assert.equal((await invoke('publish', { dataset: {} }, 'POST')).code, 422); assert.equal((await invoke('publish', { dataset: seed, note: 'x', expectedPublication: 0 })).code, 400); current = 2; assert.equal((await invoke('publish', { dataset: seed, note: 'Reviewed sources manually', expectedPublication: 0 })).code, 409); current = 0; const r = await invoke('publish', { dataset: seed, note: 'Reviewed sources manually', expectedPublication: 0 }); assert.equal(r.code, 200); const call = calls.findLast(c => c.path === 'rpc/publish_touring'); assert.equal(call.admin, true); assert.equal(call.body.p_actor, 'editor-id'); assert.equal(call.body.p_payload.rankingSnapshots.length, 8); assert.ok(call.body.p_payload.rankingSnapshots.every(s => s.rows.length === 0)); });
test('revoked membership is checked again for each mutation', async () => { signedIn = true; isEditor = false; assert.equal((await invoke('save', { dataset: seed, note: 'Reviewed' })).code, 403); });
