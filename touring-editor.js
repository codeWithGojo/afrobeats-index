const $ = s => document.querySelector(s), M = window.AfriTouring, e = M.escape;
const fields = {
    sources: { id: 'text', publisher: 'text', url: 'url', publishedAt: 'date?', accessedAt: 'date?', reuse: ['unconfirmed', 'public-facts', 'permission', 'licensed', 'public-domain'], permissionEvidence: 'textarea' },
    venues: { id: 'text', name: 'text', city: 'text', country: 'text', region: M.regions, subregion: ['', ...M.subregions] },
    tours: { id: 'text', slug: 'text', name: 'text', artistIds: 'list', startDate: 'date?', endDate: 'date?', status: ['unknown', 'announced', 'ongoing', 'completed', 'cancelled'], totalShows: 'number?' },
    concerts: { id: 'text', title: 'text', artistIds: 'list', tourId: 'text?', venueId: 'text', date: 'date', performance: 'text', billing: ['headline', 'coheadline', 'festival', 'support'], eventStatus: ['completed', 'announced', 'cancelled', 'postponed'], status: M.statuses, sourceId: 'text', verifiedAt: 'date?', capacity: 'number?', attendance: 'number?', sellout: ['', 'true', 'false'] },
    reports: { id: 'text', eventIds: 'list', sourceId: 'text', reportedAt: 'date', gross: 'number?', currency: 'text', tickets: 'number?', status: M.statuses, verifiedAt: 'date?', supersedes: 'text?' },
    streamingSnapshots: { id: 'text', artistId: 'text', platform: ['spotify', 'youtube', 'audiomack', 'boomplay'], kind: ['cumulative', 'period'], periodStart: 'date?', periodEnd: 'date', value: 'number', status: M.statuses, sourceId: 'text', scope: 'text' },
    records: { id: 'text', artistId: 'text', title: 'text', definition: 'textarea', limitation: 'textarea', publishedAt: 'date', status: M.statuses, sourceId: 'text', reportIds: 'list', eventIds: 'list' },
    articles: { id: 'text', title: 'text', body: 'textarea', publishedAt: 'date', status: M.statuses, sourceIds: 'list' }
};
let edition, publication, token, validated = '', pendingImport;
const label = s => s.replace(/([A-Z])/g, ' $1').replace(/^./, c => c.toUpperCase());
function feedback(message) { $('#tour-validation').textContent = message; if (!$('#tour-admin-gate').hidden) {
    let n = $('#tour-gate-feedback');
    if (!n) {
        n = document.createElement('p');
        n.id = 'tour-gate-feedback';
        n.setAttribute('role', 'status');
        $('#tour-admin-gate').append(n);
    }
    n.textContent = message;
} }
function invalidate() { validated = ''; $('#tour-publish').disabled = true; }
function read() { return JSON.parse($('#tour-json').value); }
function write(d) { edition = d; $('#tour-json').value = JSON.stringify(d, null, 2); invalidate(); }
async function request(action, body) { const r = await fetch('/api/product?service=touring&action=' + action, { method: body ? 'POST' : 'GET', headers: { Authorization: 'Bearer ' + token, ...(body ? { 'Content-Type': 'application/json' } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) }); const j = await r.json(); if (!r.ok)
    throw Error(j.error + (j.errors ? '\n' + j.errors.join('\n') : '')); return j; }
function safe(fn) { return async (ev) => { ev?.preventDefault(); try {
    await fn();
}
catch (err) {
    feedback(err.message);
} }; }
function chooseCollection() { const kind = $('#tour-kind').value; edition = read(); $('#tour-record').innerHTML = '<option value="">New record</option>' + edition[kind].map(r => `<option value="${e(r.id)}">${e(r.name || r.title || r.id)}</option>`).join(''); recordForm(); }
function recordForm() { const kind = $('#tour-kind').value, row = read()[kind].find(r => r.id === $('#tour-record').value) || {}; $('#tour-fields').innerHTML = Object.entries(fields[kind]).map(([key, type]) => `<label>${e(label(key))}${Array.isArray(type) ? `<select name="${key}">${type.map(v => `<option value="${e(v)}"${String(row[key] ?? '') === v ? ' selected' : ''}>${e(v || 'Not reported')}</option>`).join('')}</select>` : type === 'textarea' ? `<textarea name="${key}" rows="3">${e(row[key] || '')}</textarea>` : `<input name="${key}" type="${type.startsWith('number') ? 'number' : type.startsWith('date') ? 'date' : type === 'url' ? 'url' : 'text'}" ${type.startsWith('number') ? 'min="0" step="any"' : ''} value="${e(Array.isArray(row[key]) ? row[key].join(', ') : row[key] ?? '')}">`}${type === 'list' ? '<small>Existing IDs, separated by commas</small>' : ''}</label>`).join(''); }
function applyRecord() { const d = read(), kind = $('#tour-kind').value, oldId = $('#tour-record').value, old = d[kind].find(r => r.id === oldId) || {}, row = { ...old }; for (const [key, type] of Object.entries(fields[kind])) {
    const value = $('#tour-record-form').elements[key].value.trim();
    row[key] = type === 'list' ? value.split(',').map(v => v.trim()).filter(Boolean) : key === 'sellout' ? value === '' ? null : value === 'true' : typeof type === 'string' && type.startsWith('number') ? value === '' && type.endsWith('?') ? null : Number(value) : typeof type === 'string' && type.endsWith('?') && value === '' ? null : value;
} if (!row.id)
    throw Error('Provide a stable record ID.'); if (oldId && oldId !== row.id)
    throw Error('Keep the existing ID to preserve references.'); if (!oldId && d[kind].some(r => r.id === row.id))
    throw Error('That ID already exists. Select the record to edit it.'); if (oldId)
    d[kind] = d[kind].map(r => r.id === oldId ? row : r);
else
    d[kind].push(row); write(d); chooseCollection(); feedback('Record updated in this workspace. Validate and save a draft before publication.'); }
function preview(d) { pendingImport = d; const errors = M.validate(d, editionArtists); $('#tour-import-preview').innerHTML = `<h3>Import preview</h3><p>${d.concerts?.length || 0} concerts · ${d.reports?.length || 0} financial reports · ${d.sources?.length || 0} sources</p><p>CSV records remain pending until source review. Nothing has been saved or published.</p><details><summary>Inspect imported records</summary><pre>${e(JSON.stringify({ concerts: d.concerts, reports: d.reports, sources: d.sources }, null, 2))}</pre></details>${errors.length ? `<ul>${errors.slice(0, 100).map(x => `<li>${e(x)}</li>`).join('')}</ul>` : '<p>Structure is valid. Review source permissions and all changes before publishing.</p>'}<button type="button" id="tour-accept-import">Use in workspace</button><button type="button" id="tour-cancel-import">Discard import</button>`; $('#tour-accept-import').onclick = () => { write(pendingImport); chooseCollection(); $('#tour-import-preview').innerHTML = 'Imported into workspace only. Validate the complete edition before saving.'; }; $('#tour-cancel-import').onclick = () => { $('#tour-import-preview').innerHTML = 'Import discarded.'; pendingImport = null; }; }
let editionArtists = [];
async function connect() { await import('/assets/account.js'); const session = await window.AfriAccount.session(); if (!session?.access_token)
    throw Error('Sign in first, then check editor access again.'); token = session.access_token; const result = await request('admin'); publication = result.publication; editionArtists = result.artists; write(result.dataset); $('#tour-admin-gate').hidden = true; $('#tour-admin').hidden = false; $('#tour-artist-ids').textContent = editionArtists.map(a => a.name + ': ' + a.slug).join(' · '); $('#tour-drafts').innerHTML = result.drafts.map(d => `<p><button data-draft="${e(d.id)}">Load ${e(d.created_at.slice(0, 10))}</button> ${e(d.note)}</p>`).join('') || '<p>No saved drafts.</p>'; document.querySelectorAll('[data-draft]').forEach(b => b.onclick = () => { write(result.drafts.find(d => d.id === b.dataset.draft).payload); chooseCollection(); feedback('Draft loaded. Review it against the latest publication before publishing.'); }); $('#tour-audit').innerHTML = result.audit.map(a => `<p>${e(a.created_at)} · ${e(a.action)}<br>${e(a.note)}</p>`).join('') || '<p>No publication history yet.</p>'; chooseCollection(); }
export function start() {
    $('#tour-admin-retry').onclick = safe(connect);
    $('#tour-admin').insertAdjacentHTML('afterbegin', `<section class="tour-manual"><h2>Manage records</h2><p>Add sources and venues before concerts. Review the source’s permitted scope before changing a verification status. Retract or dispute incorrect reports; preserve their IDs and history.</p><details><summary>Existing artist IDs</summary><p id="tour-artist-ids"></p></details><div class="tour-editor-selectors"><label>Collection<select id="tour-kind">${Object.keys(fields).map(k => `<option value="${k}">${e(label(k))}</option>`).join('')}</select></label><label>Record<select id="tour-record"></select></label></div><form id="tour-record-form"><div id="tour-fields" class="tour-fields"></div><button type="submit">Apply to workspace</button></form><div id="tour-import-preview" role="status"></div></section>`);
    $('#tour-kind').onchange = safe(chooseCollection);
    $('#tour-record').onchange = safe(recordForm);
    $('#tour-record-form').onsubmit = safe(applyRecord);
    $('#tour-json').oninput = invalidate;
    $('#tour-json-file').onchange = safe(async () => { const f = $('#tour-json-file').files[0]; if (!f)
        return; if (f.size > 1500000)
        throw Error('JSON exceeds 1.5 MB'); preview(JSON.parse(await f.text())); });
    $('#tour-csv').onchange = safe(async () => { const f = $('#tour-csv').files[0]; if (!f)
        return; if (f.size > 1000000)
        throw Error('CSV exceeds 1 MB'); preview(M.importCSV(await f.text(), read())); });
    $('#tour-validate').onclick = safe(async () => { invalidate(); const d = read(), r = await request('validate', { dataset: d }); feedback(r.valid ? 'Validation passed. ' + r.eligibleReports + ' eligible financial reports. Review your note before publishing.' : r.errors.join('\n')); if (r.valid) {
        validated = JSON.stringify(d);
        $('#tour-publish').disabled = false;
    } });
    $('#tour-save').onclick = safe(async () => { await request('save', { dataset: read(), note: $('#tour-review-note').value }); feedback('Draft saved. Public data is unchanged.'); });
    $('#tour-publish').onclick = safe(async () => { const d = read(); if (JSON.stringify(d) !== validated)
        throw Error('Validate the latest changes first.'); $('#tour-publish').disabled = true; try {
        const r = await request('publish', { dataset: d, note: $('#tour-review-note').value, expectedPublication: publication });
        publication = r.publication;
        validated = '';
        feedback('Edition ' + publication + ' published. Rankings recalculate from verified reports; cached public views update within 30 seconds.');
    }
    catch (err) {
        invalidate();
        throw err;
    } });
    connect().catch(err => feedback(err.message));
}
