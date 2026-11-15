/* Shared, deterministic touring calculations. No provider totals are invented. */
(function (root, factory) { if (typeof module === 'object' && module.exports)
    module.exports = factory();
else
    root.AfriTouring = factory(); })(typeof window === 'undefined' ? globalThis : window, function () {
    'use strict';
    const statuses = ['verified', 'partially-verified', 'pending', 'disputed', 'unreported', 'retracted'];
    const collections = ['sources', 'tours', 'venues', 'concerts', 'reports', 'streamingSnapshots', 'rankingSnapshots', 'records', 'articles'];
    const regions = ['Africa', 'Europe', 'North America', 'South America', 'Asia', 'Oceania'];
    const subregions = ['West Africa', 'East Africa', 'Southern Africa', 'North Africa', 'Central Africa'];
    const reusable = s => !!s && ['licensed', 'permission', 'public-domain', 'public-facts', 'existing-site'].includes(s.reuse);
    const escape = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const date = v => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v)) && new Date(v).toISOString().slice(0, 10) === v;
    const https = v => { try {
        return new URL(v).protocol === 'https:';
    }
    catch {
        return false;
    } };
    const number = v => Number.isFinite(v) && v >= 0 && v <= Number.MAX_SAFE_INTEGER;
    const id = v => typeof v === 'string' && /^[a-z0-9][a-z0-9-]{0,119}$/.test(v);
    function validateRecords(data, artists) {
        const errors = [], check = (ok, message) => { if (!ok)
            errors.push(message); };
        check(data?.schemaVersion === 1, 'Unsupported schema version');
        check(date(data?.cutoff), 'A valid reporting cutoff is required');
        if (!data || typeof data !== 'object')
            return errors;
        if (collections.some(k => !Array.isArray(data[k]) || data[k].some(r => !r || typeof r !== 'object' || Array.isArray(r))))
            return [...errors, 'Every collection must be an array of records'];
        const maps = {};
        for (const key of collections) {
            check(Array.isArray(data[key]), key + ' must be an array');
            maps[key] = new Map();
            for (const row of data[key] || []) {
                check(id(row.id), key + ': invalid ID');
                check(!maps[key].has(row.id), key + ': duplicate ID ' + row.id);
                maps[key].set(row.id, row);
            }
        }
        const artistIds = new Set(artists.map(a => a.slug));
        for (const s of data.sources || []) {
            check(https(s.url) && (date(s.publishedAt) && s.publishedAt <= data.cutoff || s.reuse === 'public-facts' && s.publishedAt === null && date(s.accessedAt) && s.accessedAt <= data.cutoff) && typeof s.publisher === 'string' && s.publisher.trim(), 'Source requires publisher, HTTPS URL and publication date within cutoff: ' + s.id);
            check(['licensed', 'permission', 'public-domain', 'public-facts', 'unconfirmed'].includes(s.reuse), 'Invalid reuse basis: ' + s.id);
            if (s.reuse !== 'unconfirmed')
                check(typeof s.permissionEvidence === 'string' && s.permissionEvidence.length >= 10, 'Document reuse permission: ' + s.id);
        }
        for (const t of data.tours || []) {
            check(id(t.slug) && t.name && Array.isArray(t.artistIds) && t.artistIds.length > 0 && t.artistIds.every(a => artistIds.has(a)), 'Tour must use existing artist identities: ' + t.id);
            check((t.startDate === null || date(t.startDate)) && (!t.endDate || date(t.endDate) && (!t.startDate || t.endDate >= t.startDate)), 'Invalid tour period: ' + t.id);
            check(['unknown', 'announced', 'ongoing', 'completed', 'cancelled'].includes(t.status), 'Invalid tour status: ' + t.id);
            check(t.totalShows === null || Number.isSafeInteger(t.totalShows) && t.totalShows > 0, 'Invalid total shows: ' + t.id);
        }
        const venueKeys = new Set(), tourSlugs = new Set(), normal = v => String(v || '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '');
        for (const v of data.venues || []) {
            check(v.name && v.city && v.country && regions.includes(v.region) && (v.region !== 'Africa' || subregions.includes(v.subregion)), 'Venue requires city, country, region and African subregion: ' + v.id);
            const key = [v.name, v.city, v.country].map(normal).join('|');
            check(!venueKeys.has(key), 'Duplicate venue identity: ' + v.id);
            venueKeys.add(key);
        }
        for (const t of data.tours) {
            check(!tourSlugs.has(t.slug), 'Duplicate tour slug: ' + t.slug);
            tourSlugs.add(t.slug);
        }
        const eventKeys = new Set();
        for (const c of data.concerts || []) {
            const key = [c.venueId, c.date, c.performance || 'evening'].join('|');
            check(!eventKeys.has(key), 'Duplicate physical concert: ' + c.id);
            eventKeys.add(key);
            check(date(c.date) && maps.venues.has(c.venueId), 'Invalid concert date or venue: ' + c.id);
            check(!c.tourId || maps.tours.has(c.tourId), 'Unknown tour: ' + c.id);
            check(Array.isArray(c.artistIds) && c.artistIds.length && new Set(c.artistIds).size === c.artistIds.length && c.artistIds.every(a => artistIds.has(a)), 'Unknown concert artist: ' + c.id);
            check(['headline', 'coheadline', 'festival', 'support'].includes(c.billing), 'Invalid concert billing: ' + c.id);
            for (const k of ['capacity', 'attendance'])
                check(c[k] === null || Number.isSafeInteger(c[k]) && c[k] >= 0, 'Invalid ' + k + ': ' + c.id);
            check(c.sellout === null || typeof c.sellout === 'boolean', 'Sellout must be confirmed or null: ' + c.id);
            if (c.sellout !== null || c.attendance !== null || c.capacity !== null)
                check(maps.sources.has(c.sourceId), 'Concert claims require a source: ' + c.id);
        }
        for (const r of data.reports || []) {
            check(statuses.includes(r.status), 'Invalid verification status: ' + r.id);
            check(date(r.reportedAt) && r.reportedAt <= data.cutoff, 'Report date exceeds cutoff: ' + r.id);
            check(Array.isArray(r.eventIds) && r.eventIds.length > 0 && new Set(r.eventIds).size === r.eventIds.length && r.eventIds.every(e => maps.concerts.has(e)), 'Report needs unique known events: ' + r.id);
            check(Array.isArray(r.eventIds) && r.eventIds.every(e => (maps.concerts.get(e)?.date || '9999') <= r.reportedAt), 'Report precedes performance: ' + r.id);
            check(r.gross === null || number(r.gross), 'Invalid original gross: ' + r.id);
            check(/^[A-Z]{3}$/.test(r.currency || ''), 'ISO currency required: ' + r.id);
            check(r.tickets === null || Number.isSafeInteger(r.tickets) && r.tickets >= 0, 'Invalid ticket sales: ' + r.id);
            check(r.gross !== null || r.tickets !== null, 'Report contains no measurements: ' + r.id);
            const source = maps.sources.get(r.sourceId);
            check(!!source, 'Report source missing: ' + r.id);
            if (r.status === 'verified')
                check(reusable(source) && source.reuse !== 'public-facts' && date(r.verifiedAt) && r.verifiedAt >= r.reportedAt && r.verifiedAt <= data.cutoff, 'Verified financial report needs dated verification and explicit financial reuse rights: ' + r.id);
            if (r.fx)
                check(number(r.fx.rate) && r.fx.rate > 0 && date(r.fx.date) && r.fx.date <= r.reportedAt && reusable(maps.sources.get(r.fx.sourceId)) && r.fx.to === 'USD', 'Invalid historical FX evidence: ' + r.id);
            if (r.supersedes) {
                const old = maps.reports.get(r.supersedes);
                check(old && Array.isArray(r.eventIds) && Array.isArray(old.eventIds) && r.reportedAt >= old.reportedAt && JSON.stringify([...r.eventIds].sort()) === JSON.stringify([...old.eventIds].sort()), 'Revision must replace the same event coverage: ' + r.id);
            }
            const seen = new Set([r.id]);
            let parent = r.supersedes;
            while (parent) {
                if (seen.has(parent)) {
                    check(false, 'Revision cycle: ' + r.id);
                    break;
                }
                seen.add(parent);
                parent = maps.reports.get(parent)?.supersedes;
            }
        }
        const replaced = new Set((data.reports || []).filter(r => ['verified', 'disputed', 'retracted'].includes(r.status)).map(r => r.supersedes).filter(Boolean)), covered = new Set();
        for (const r of data.reports || []) {
            if (replaced.has(r.id) || r.status !== 'verified' || !Array.isArray(r.eventIds))
                continue;
            for (const e of r.eventIds) {
                check(!covered.has(e), 'Overlapping active reports for event ' + e);
                covered.add(e);
            }
        }
        for (const s of data.streamingSnapshots || []) {
            check(artistIds.has(s.artistId) && ['spotify', 'youtube', 'audiomack', 'boomplay'].includes(s.platform) && number(s.value), 'Invalid streaming observation: ' + s.id);
            check(['cumulative', 'period'].includes(s.kind) && date(s.periodEnd) && s.periodEnd <= data.cutoff && (!s.periodStart || date(s.periodStart) && s.periodStart <= s.periodEnd), 'Invalid streaming period: ' + s.id);
            check(s.kind !== 'period' || date(s.periodStart), 'Period observation needs a start: ' + s.id);
            check(maps.sources.has(s.sourceId) && statuses.includes(s.status), 'Streaming source/status missing: ' + s.id);
        }
        for (const r of data.records || [])
            check(r.definition && r.limitation && date(r.publishedAt) && r.publishedAt <= data.cutoff && maps.sources.has(r.sourceId) && statuses.includes(r.status) && Array.isArray(r.reportIds) && r.reportIds.every(x => maps.reports.has(x)) && (r.reportIds.length || Array.isArray(r.eventIds) && r.eventIds.length && r.eventIds.every(x => maps.concerts.has(x))), 'Record needs precise definition, scope and supporting reports or concerts: ' + r.id);
        for (const s of data.rankingSnapshots || [])
            check(date(s.asOf) && s.scope && Array.isArray(s.rows), 'Invalid ranking snapshot: ' + s.id);
        for (const a of data.articles || [])
            check(a.title && a.body && date(a.publishedAt) && Array.isArray(a.sourceIds) && a.sourceIds.length && a.sourceIds.every(x => maps.sources.has(x)) && statuses.includes(a.status), 'Editorial requires dated sources: ' + a.id);
        for (const c of data.concerts) {
            check(statuses.includes(c.status) && ['completed', 'announced', 'cancelled', 'postponed'].includes(c.eventStatus), 'Concert requires verification and event status: ' + c.id);
            check(maps.sources.has(c.sourceId), 'Concert requires an original source: ' + c.id);
            if (['verified', 'partially-verified', 'unreported'].includes(c.status))
                check(reusable(maps.sources.get(c.sourceId)) && date(c.verifiedAt) && c.verifiedAt <= data.cutoff && (!maps.sources.get(c.sourceId)?.publishedAt || maps.sources.get(c.sourceId).publishedAt <= c.verifiedAt) && (c.eventStatus !== 'completed' || c.date <= c.verifiedAt), 'Confirmed concert needs source review and a valid verification date: ' + c.id);
            const tour = maps.tours.get(c.tourId);
            if (tour)
                check((!tour.startDate || c.date >= tour.startDate) && (!tour.endDate || c.date <= tour.endDate) && c.artistIds.some(id => tour.artistIds.includes(id)), 'Concert falls outside tour period or artist roster: ' + c.id);
        }
        for (const s of data.streamingSnapshots)
            if (s.status === 'verified')
                check(reusable(maps.sources.get(s.sourceId)) && maps.sources.get(s.sourceId)?.reuse !== 'public-facts', 'Streaming totals require explicit reuse rights: ' + s.id);
        return errors;
    }
    function validate(data, artists) { try {
        return validateRecords(data, artists);
    }
    catch {
        return ['Malformed record: check collection types, event IDs and source references'];
    } }
    function concerts(data, artists, o = {}) {
        const venues = new Map(data.venues.map(v => [v.id, v]));
        return data.concerts.filter(c => ['verified', 'partially-verified', 'unreported'].includes(c.status)).filter(c => {
            const v = venues.get(c.venueId), aa = artists.filter(a => c.artistIds.includes(a.slug));
            return v && (!o.artist || c.artistIds.includes(o.artist)) && (!o.year || c.date.slice(0, 4) === String(o.year)) && (!o.decade || Math.floor(Number(c.date.slice(0, 4)) / 10) * 10 === Number(o.decade)) && (!o.from || c.date >= o.from) && (!o.to || c.date <= o.to) && (!o.region || [v.region, v.subregion].includes(o.region)) && (!o.eventCountry || v.country === o.eventCountry) && (!o.city || v.city === o.city) && (!o.venue || v.id === o.venue) && (!o.billing || c.billing === o.billing) && (!o.country || aa.some(a => a.countries?.includes(o.country))) && (!o.genre || aa.some(a => a.genres?.includes(o.genre))) && (!o.search || [c.title, v.name, v.city, v.country, ...aa.map(a => a.name)].join(' ').toLowerCase().includes(o.search.toLowerCase()));
        }).sort((a, b) => b.date.localeCompare(a.date) || a.id.localeCompare(b.id));
    }
    function qualified(data) {
        const replaced = new Set(data.reports.filter(r => ['verified', 'disputed', 'retracted'].includes(r.status)).map(r => r.supersedes).filter(Boolean));
        const sources = new Map(data.sources.map(s => [s.id, s]));
        const events = new Map(data.concerts.map(c => [c.id, c]));
        return data.reports.filter(r => r.status === 'verified' && !replaced.has(r.id) && reusable(sources.get(r.sourceId)) && sources.get(r.sourceId).reuse !== 'public-facts' && r.eventIds.every(id => { const c = events.get(id); return c && c.eventStatus === 'completed' && ['verified', 'partially-verified', 'unreported'].includes(c.status) && reusable(sources.get(c.sourceId)); }));
    }
    function usd(r) { if (r.gross === null)
        return null; if (r.currency === 'USD')
        return r.gross; const amount = r.fx?.to === 'USD' ? Math.round(r.gross * r.fx.rate * 100) / 100 : null; return amount !== null && number(amount) ? amount : null; }
    function aggregate(data, artists, options = {}) {
        const events = new Map(data.concerts.map(c => [c.id, c])), venues = new Map(data.venues.map(v => [v.id, v])), artistMap = new Map(artists.map(a => [a.slug, a])), tours = new Map(data.tours.map(t => [t.id, t]));
        const groups = new Map();
        for (const r of qualified(data)) {
            const all = r.eventIds.map(e => events.get(e));
            if (all.some(e => !e))
                continue;
            // Combined reports cannot be prorated across years, regions, artists or tours.
            if (all.some(e => options.year && e.date.slice(0, 4) !== String(options.year) || options.decade && Math.floor(Number(e.date.slice(0, 4)) / 10) * 10 !== Number(options.decade) || options.region && ![venues.get(e.venueId)?.region, venues.get(e.venueId)?.subregion].includes(options.region) || options.venue && e.venueId !== options.venue || options.eventCountry && venues.get(e.venueId)?.country !== options.eventCountry))
                continue;
            if (all.some(e => e.billing !== 'headline' || e.artistIds.length !== 1))
                continue;
            const artistId = all[0].artistIds[0];
            if (all.some(e => e.artistIds[0] !== artistId))
                continue;
            const artist = artistMap.get(artistId);
            if (!artist)
                continue;
            if (options.artist && artistId !== options.artist || options.country && !artist.countries?.includes(options.country) || options.genre && !artist.genres?.some(g => g.toLowerCase() === options.genre.toLowerCase()))
                continue;
            const level = options.level || 'artists', tour = tours.get(all[0].tourId);
            if (level === 'tours' && (!tour || all.some(e => e.tourId !== tour.id)))
                continue;
            if (level === 'concerts' && all.length !== 1)
                continue;
            if (options.status && tour?.status !== options.status)
                continue;
            const key = level === 'tours' ? tour.id : level === 'concerts' ? all[0].id : artistId;
            if (options.search && !([artist.name, tour?.name, venues.get(all[0].venueId)?.name].join(' ').toLowerCase().includes(options.search.toLowerCase())))
                continue;
            let g = groups.get(key);
            if (!g) {
                g = { id: key, artistId, artist: artist.name, title: level === 'tours' ? tour.name : level === 'concerts' ? venues.get(all[0].venueId)?.name : artist.name, tourId: tour?.id, tourSlug: tour?.slug, gross: null, tickets: null, grossShows: 0, ticketShows: 0, eventIds: [], reportIds: [], currencies: [], dates: [], totalShows: level === 'tours' ? tour.totalShows : null, complete: false };
                groups.set(key, g);
            }
            const amount = usd(r);
            if (amount !== null) {
                g.gross = Math.round(((g.gross ?? 0) + amount) * 100) / 100;
                g.grossShows += all.length;
            }
            if (r.tickets !== null) {
                g.tickets = (g.tickets ?? 0) + r.tickets;
                g.ticketShows += all.length;
            }
            g.eventIds.push(...r.eventIds);
            g.reportIds.push(r.id);
            g.currencies.push(r.currency);
            g.dates.push(...all.map(e => e.date));
        }
        const metric = options.metric === 'tickets' ? 'tickets' : 'gross';
        return [...groups.values()].filter(g => g[metric] !== null).sort((a, b) => b[metric] - a[metric] || a.id.localeCompare(b.id)).map((g, i, list) => ({ ...g, rank: i && g[metric] === list[i - 1][metric] ? list.findIndex(x => x[metric] === g[metric]) + 1 : i + 1, shows: g.eventIds.length, averageGross: g.grossShows ? g.gross / g.grossShows : null, averageAttendance: g.eventIds.map(id => events.get(id).attendance).filter(v => v !== null).length ? g.eventIds.map(id => events.get(id).attendance).filter(v => v !== null).reduce((a, b) => a + b, 0) / g.eventIds.map(id => events.get(id).attendance).filter(v => v !== null).length : null, averageTickets: g.ticketShows ? g.tickets / g.ticketShows : null, complete: g.totalShows !== null && g.totalShows === g.eventIds.length && g.grossShows === g.eventIds.length && g.ticketShows === g.eventIds.length }));
    }
    function snapshot(data, artistId, platform, year) {
        return data.streamingSnapshots.filter(s => s.artistId === artistId && s.platform === platform && s.status === 'verified' && (!year ? s.kind === 'cumulative' : s.kind === 'period' && s.periodStart === year + '-01-01' && s.periodEnd === year + '-12-31')).sort((a, b) => b.periodEnd.localeCompare(a.periodEnd))[0] || null;
    }
    function comparison(data, artists, artistId, options = {}) {
        const artist = artists.find(a => a.slug === artistId);
        if (!artist)
            return null;
        const gross = aggregate(data, artists, { ...options, artist: artistId, metric: 'gross' })[0], tickets = aggregate(data, artists, { ...options, artist: artistId, metric: 'tickets' })[0];
        const spotify = snapshot(data, artistId, 'spotify', options.year), youtube = snapshot(data, artistId, 'youtube', options.year);
        const compatible = !!(options.year && spotify && spotify.kind === 'period' && !options.region);
        return { artist, spotify, youtube, audiomack: snapshot(data, artistId, 'audiomack', options.year), boomplay: snapshot(data, artistId, 'boomplay', options.year), gross: gross?.gross ?? null, tickets: tickets?.tickets ?? null, shows: gross?.shows ?? tickets?.shows ?? null, averageGross: gross?.averageGross ?? null, grossPerMillion: compatible && spotify.value > 0 && gross ? gross.gross / spotify.value * 1e6 : null, ticketsPerMillion: compatible && spotify.value > 0 && tickets ? tickets.tickets / spotify.value * 1e6 : null, ratioNote: compatible ? 'Same calendar year; touring reports may be incomplete. Descriptive ratio, not profitability or fan conversion.' : 'A ratio requires matching full-year Spotify observations and touring periods. Cumulative totals are not annual streams.' };
    }
    function movement(data, id, scope, metric) { const list = data.rankingSnapshots.filter(s => s.scope === scope && s.metric === metric).sort((a, b) => b.asOf.localeCompare(a.asOf)); if (list.length < 2)
        return null; const now = list[0].rows.find(r => r.id === id), before = list[1].rows.find(r => r.id === id); return now && before ? before.rank - now.rank : null; }
    function growth(current, previous) { return number(current) && number(previous) && previous > 0 ? (current - previous) / previous : null; }
    function csvRows(text) {
        if (typeof text !== 'string' || text.length > 1000000)
            throw Error('CSV must be smaller than 1 MB');
        const rows = [];
        let row = [], cell = '', quoted = false;
        for (let i = 0; i < text.length; i++) {
            const c = text[i];
            if (c === '"') {
                if (quoted && text[i + 1] === '"') {
                    cell += '"';
                    i++;
                }
                else if (!quoted && cell.length)
                    throw Error('Unexpected quote');
                else
                    quoted = !quoted;
            }
            else if (c === ',' && !quoted) {
                row.push(cell);
                cell = '';
            }
            else if ((c === '\n' || c === '\r') && !quoted) {
                if (c === '\r' && text[i + 1] === '\n')
                    i++;
                row.push(cell);
                if (row.some(Boolean))
                    rows.push(row);
                row = [];
                cell = '';
            }
            else
                cell += c;
        }
        if (quoted)
            throw Error('Unclosed CSV quote');
        row.push(cell);
        if (row.some(Boolean))
            rows.push(row);
        if (!rows.length)
            throw Error('CSV is empty');
        const headers = rows.shift().map(x => x.trim().replace(/^\uFEFF/, ''));
        if (new Set(headers).size !== headers.length)
            throw Error('Duplicate CSV columns');
        return rows.map((cells, i) => { if (cells.length !== headers.length)
            throw Error('Column count differs on row ' + (i + 2)); return Object.fromEntries(headers.map((h, j) => [h, cells[j].trim()])); });
    }
    function parseCSV(text) { return csvRows(text).map(r => { const required = ['id', 'eventIds', 'sourceId', 'reportedAt', 'gross', 'currency', 'tickets']; if (required.some(k => !Object.hasOwn(r, k)))
        throw Error('Required columns: ' + required.join(', ')); return { id: r.id, eventIds: r.eventIds.split('|'), sourceId: r.sourceId, reportedAt: r.reportedAt, gross: r.gross === '' ? null : Number(r.gross), currency: r.currency, tickets: r.tickets === '' ? null : Number(r.tickets), status: 'pending', verifiedAt: null, ...(r.supersedes ? { supersedes: r.supersedes } : {}) }; }); }
    function importCSV(text, dataset) {
        const d = JSON.parse(JSON.stringify(dataset)), slug = s => s.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 100), num = v => v === '' || v === undefined ? null : Number(v);
        const rows = csvRows(text);
        if (!rows.length)
            throw Error('No rows to import');
        if (Object.hasOwn(rows[0], 'eventIds')) {
            d.reports.push(...parseCSV(text));
            return d;
        }
        for (const [i, r] of rows.entries()) {
            const required = ['artist_id', 'event_date', 'venue', 'city', 'country', 'source_url', 'source_date', 'region'];
            if (required.some(k => !r[k]))
                throw Error('Row ' + (i + 2) + ' requires ' + required.join(', '));
            const vid = slug(r.venue + '-' + r.city + '-' + r.country), eid = slug(vid + '-' + r.event_date + '-' + (r.performance || 'evening')), sid = 'source-' + eid, tid = r.tour_name ? slug(r.artist_id + '-' + r.tour_name) : null;
            if (d.concerts.some(c => c.id === eid || c.venueId === vid && c.date === r.event_date && (c.performance || 'evening') === (r.performance || 'evening')))
                throw Error('Duplicate concert on row ' + (i + 2));
            if (!d.venues.some(v => v.id === vid))
                d.venues.push({ id: vid, name: r.venue, city: r.city, country: r.country, region: r.region, subregion: r.subregion || null });
            if (tid && !d.tours.some(t => t.id === tid))
                d.tours.push({ id: tid, slug: tid, name: r.tour_name, artistIds: [r.artist_id], startDate: null, endDate: null, status: 'unknown', totalShows: null });
            d.sources.push({ id: sid, url: r.source_url, publisher: r.publisher || 'Review publisher', publishedAt: r.source_date, reuse: 'unconfirmed', permissionEvidence: '' });
            d.concerts.push({ id: eid, title: r.tour_name || r.venue, artistIds: [r.artist_id], tourId: tid, venueId: vid, date: r.event_date, performance: r.performance || 'evening', billing: r.billing || 'headline', eventStatus: r.event_status || 'completed', status: 'pending', sourceId: sid, verifiedAt: null, capacity: null, attendance: num(r.attendance), sellout: null });
            if (num(r.gross) !== null || num(r.tickets_sold) !== null)
                d.reports.push({ id: 'report-' + eid, eventIds: [eid], sourceId: sid, reportedAt: r.source_date, gross: num(r.gross), currency: r.currency || 'USD', tickets: num(r.tickets_sold), status: 'pending', verifiedAt: null });
        }
        return d;
    }
    return { statuses, collections, regions, subregions, reusable, escape, validate, qualified, usd, aggregate, concerts, snapshot, comparison, movement, growth, parseCSV, importCSV };
});
