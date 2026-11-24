/* Touring uses published editions; importing never changes a public edition. */
(() => {
    'use strict';
    const M = window.AfriTouring, e = M.escape, $ = s => document.querySelector(s), mode = document.body.dataset.touringMode, detail = document.body.dataset.touringDetail;
    let data, artists, page = 1, publication = 0;
    const fmt = v => v == null ? 'Not publicly reported' : Number(v).toLocaleString('en', { maximumFractionDigits: 0 });
    const money = v => v == null ? 'Not publicly reported' : '$' + Number(v).toLocaleString('en', { maximumFractionDigits: 2 });
    const empty = (title, copy) => `<div class="tour-empty"><h3>${e(title)}</h3><p>${e(copy)}</p><a href="/touring/methodology">Read the reporting methodology</a></div>`;
    const values = form => Object.fromEntries(new FormData(form));
    const artist = id => artists.find(a => a.slug === id);
    const venue = id => data.venues.find(v => v.id === id);
    const source = id => { const s = data.sources.find(s => s.id === id); return s ? `<a href="${e(s.url)}" target="_blank" rel="noopener noreferrer">${e(s.publisher)}</a> <small>${e(s.publishedAt || 'Publication date unavailable; checked ' + (s.accessedAt || data.cutoff))}</small>` : 'Source unavailable'; };
    const sources = ids => [...new Set(ids.filter(Boolean))].map(source).join('<br>');
    const image = a => `<img src="${e(a.image)}" width="72" height="72" alt="" loading="lazy">`;
    function table(headers, rows, caption) { return `<p class="tour-note">Scroll the table horizontally for all fields.</p><div class="tour-table-wrap" role="region" aria-label="${e(caption)}" tabindex="0"><table class="tour-table"><caption class="sr-only">${e(caption)}</caption><thead><tr>${headers.map(h => `<th scope="col">${e(h)}</th>`).join('')}</tr></thead><tbody>${rows.join('')}</tbody></table></div>`; }
    function setOptions(select, list) { if (!select)
        return; const first = select.options[0]?.outerHTML || ''; select.innerHTML = first + [...new Set(list)].filter(Boolean).sort().map(v => `<option value="${e(v)}">${e(v)}</option>`).join(''); }
    function syncURL(form) { const q = new URLSearchParams(values(form)); for (const [k, v] of [...q])
        if (!v)
            q.delete(k); history.replaceState(null, '', location.pathname + (q.size ? '?' + q : '')); }
    function options() { const f = $('#tour-filters'); return f ? values(f) : {}; }
    function eventReport(c) { return M.qualified(data).find(r => r.eventIds.length === 1 && r.eventIds[0] === c.id); }
    function eventRows(list) { return list.map(c => { const v = venue(c.venueId), r = eventReport(c); return `<tr><th scope="row"><a href="/touring/concerts/${e(c.id)}">${e(c.title || v.name)}</a><small>${c.artistIds.map(id => e(artist(id)?.name || id)).join(', ')}</small></th><td>${e(c.date)}<small>${e(c.eventStatus)}</small></td><td>${e(v.name)}<small>${e(v.city)}, ${e(v.country)}</small></td><td>${e(c.billing)}<small>${e(c.status.replaceAll('-', ' '))}</small></td><td>${r ? money(M.usd(r)) : fmt(null)}${r && r.currency !== 'USD' ? `<small>${e(r.currency)} ${fmt(r.gross)}</small>` : ''}</td><td>${fmt(r?.tickets)}</td><td>${fmt(c.attendance)}</td><td>${sources([c.sourceId, r?.sourceId])}</td></tr>`; }); }
    function eventTable(list) { return list.length ? table(['Event / artists', 'Date', 'Venue', 'Classification', 'Reported gross · USD', 'Tickets sold', 'Attendance', 'Sources'], eventRows(list), 'Confirmed concerts') : empty('No confirmed concerts match.', 'Try another period, artist or region. Missing records do not mean no live activity.'); }
    function rankingTable(list, level = 'artists') {
        if (!list.length)
            return empty('No eligible box-office reports.', 'Financial results need verified sources and documented reuse rights. Confirmed concerts remain available in Concerts.');
        return table(['Rank', 'Artist / tour', 'Period', 'Gross · USD', 'Tickets sold', 'Reported shows', 'Average gross', 'Average reported attendance', 'Coverage / movement', 'Sources'], list.map(g => { const a = artist(g.artistId), url = level === 'tours' ? '/touring/tours/' + g.tourSlug : level === 'concerts' ? '/touring/concerts/' + g.id : '/touring/artists/' + g.artistId; const move = Object.entries(options()).some(([k, v]) => v && !['year', 'metric'].includes(k)) ? null : M.movement(data, g.id, (options().year || 'all-time') + ':' + level, options().metric || 'gross'); return `<tr><td>${g.rank}</td><th scope="row">${image(a)}<a href="${e(url)}">${e(g.title)}</a>${level !== 'artists' ? `<small>${e(g.artist)}</small>` : ''}</th><td>${e([...g.dates].sort()[0])}<small>to ${e([...g.dates].sort().at(-1))}</small></td><td>${money(g.gross)}</td><td>${fmt(g.tickets)}</td><td>${g.shows}${g.totalShows ? ' / ' + g.totalShows : ''}</td><td>${money(g.averageGross)}</td><td>${fmt(g.averageAttendance)}</td><td>${g.complete ? 'Complete reported coverage' : 'Partial / total unknown'}<small>${move === null ? 'Movement unavailable' : move === 0 ? 'Unchanged' : move > 0 ? 'Up ' + move : 'Down ' + Math.abs(move)}</small></td><td>${sources(g.reportIds.flatMap(id => { const r = data.reports.find(r => r.id === id); return [r?.sourceId, r?.fx?.sourceId]; }))}</td></tr>`; }), 'Verified touring rankings');
    }
    function footprint(list) { const counts = new Map(); for (const c of list.filter(c => c.eventStatus === 'completed')) {
        const v = venue(c.venueId);
        counts.set(v.country, (counts.get(v.country) || 0) + 1);
    } if (!counts.size)
        return empty('Regional coverage is unavailable.', 'Confirmed performances will appear here without needing financial results.'); const max = Math.max(...counts.values()); return `<p class="tour-note">Confirmed physical events in this selection. This is reporting coverage, not audience geography or a complete touring history.</p><div class="tour-country-list">${[...counts].sort((a, b) => b[1] - a[1]).map(([country, n]) => `<a href="/touring/concerts?eventCountry=${encodeURIComponent(country)}"><span>${e(country)}</span><strong>${n} ${n === 1 ? 'event' : 'events'}</strong><span class="tour-bar-track"><span class="tour-bar" style="--bar-width:${n / max * 100}%"></span></span></a>`).join('')}</div>`; }
    function rankings() { const o = options(), level = mode === 'concerts' ? 'concerts' : mode === 'all-time' ? $('input[name=level]:checked').value : 'artists'; const rows = mode === 'concerts' ? M.concerts(data, artists, o) : M.aggregate(data, artists, { ...o, level }); if (mode === 'concerts' && o.metric !== 'date')
        rows.sort((a, b) => { const ar = eventReport(a), br = eventReport(b), av = o.metric === 'tickets' ? ar?.tickets : ar ? M.usd(ar) : null, bv = o.metric === 'tickets' ? br?.tickets : br ? M.usd(br) : null; return (bv ?? -1) - (av ?? -1) || b.date.localeCompare(a.date); }); page = Math.max(1, Math.min(page, Math.ceil(rows.length / 25) || 1)); $('#tour-results').innerHTML = mode === 'concerts' ? eventTable(rows.slice((page - 1) * 25, page * 25)) : rankingTable(rows.slice((page - 1) * 25, page * 25), level); $('#tour-page').textContent = `Page ${page} of ${Math.ceil(rows.length / 25) || 1} · ${rows.length} results`; $('#tour-prev').disabled = page === 1; $('#tour-next').disabled = page * 25 >= rows.length; if ($('#tour-activity'))
        $('#tour-activity').innerHTML = eventTable(M.concerts(data, artists, o).slice(0, 25)); if ($('#tour-footprint'))
        $('#tour-footprint').innerHTML = footprint(M.concerts(data, artists, o)); }
    function initFilters() { const f = $('#tour-filters'); if (!f)
        return; setOptions(f.elements.year, data.concerts.map(c => c.date.slice(0, 4)).concat(data.cutoff.slice(0, 4))); setOptions(f.elements.genre, artists.flatMap(a => a.genres || [])); setOptions(f.elements.country, artists.flatMap(a => a.countries || [])); setOptions(f.elements.eventCountry, data.venues.map(v => v.country)); setOptions(f.elements.city, data.venues.map(v => v.city)); if (f.elements.artist)
        f.elements.artist.innerHTML = '<option value="">All artists</option>' + artists.map(a => `<option value="${e(a.slug)}">${e(a.name)}</option>`).join(''); if (f.elements.venue)
        f.elements.venue.innerHTML = '<option value="">All venues</option>' + data.venues.map(v => `<option value="${e(v.id)}">${e(v.name)}</option>`).join(''); if (mode === 'current')
        f.elements.year.value = data.cutoff.slice(0, 4); if (mode === 'concerts') {
        f.elements.metric.insertAdjacentHTML('afterbegin', '<option value="date">Most recent performances</option>');
        f.elements.metric.value = 'date';
    } for (const [k, v] of new URLSearchParams(location.search))
        if (f.elements[k])
            f.elements[k].value = v; f.addEventListener('input', () => { page = 1; syncURL(f); rankings(); }); f.addEventListener('submit', ev => ev.preventDefault()); f.addEventListener('reset', () => setTimeout(() => { page = 1; syncURL(f); rankings(); }, 0)); document.querySelectorAll('input[name=level]').forEach(n => n.onchange = () => { page = 1; rankings(); }); $('#tour-prev').onclick = () => { page--; rankings(); }; $('#tour-next').onclick = () => { page++; rankings(); }; rankings(); }
    function metric(label, aa, get, format = fmt, notes = () => '', bars = true) { const vv = aa.map(get), max = Math.max(0, ...vv.filter(v => v != null)); return `<div class="tour-metric"><h3>${e(label)}</h3>${aa.map((a, i) => `<div class="tour-value"><strong>${format(vv[i])}</strong>${bars && vv[i] != null && max ? `<div class="tour-bar-track"><div class="tour-bar" style="--bar-width:${vv[i] / max * 100}%"></div></div>` : ''}<small>${notes(a)}</small></div>`).join('')}</div>`; }
    function compare() { const f = $('#tour-compare'), o = values(f), aa = [o.a, o.b].map(id => M.comparison(data, artists, id, o)); if (aa.some(a => !a))
        return; syncURL(f); $('#tour-comparison').innerHTML = `<div class="tour-artist-pair">${aa.map(a => `<div class="tour-artist">${image(a.artist)}<div><h2><a href="/touring/artists/${e(a.artist.slug)}">${e(a.artist.name)}</a></h2><p>${e(a.artist.countries.join(' · '))}</p></div></div>`).join('')}</div><p class="tour-note">${o.year ? 'Calendar year ' + e(o.year) : 'Latest cumulative streaming observations; all-time reported touring coverage. These are different time windows.'} No combined score or overall winner.</p>${['spotify', 'youtube', 'audiomack', 'boomplay'].map(p => metric(({ spotify: 'Spotify catalogue streams', youtube: 'YouTube official video views', audiomack: 'Audiomack plays', boomplay: 'Boomplay streams' })[p], aa, a => a[p]?.value ?? null, fmt, a => a[p] ? `${e(a[p].kind)} · ${e(a[p].periodStart || 'Through')} ${e(a[p].periodEnd)}<br>${source(a[p].sourceId)}` : 'No verified observation for this period', aa[0][p]?.periodStart === aa[1][p]?.periodStart && aa[0][p]?.periodEnd === aa[1][p]?.periodEnd)).join('')}${metric('Reported touring gross · USD', aa, a => a.gross, money, () => 'Verified headline reports only; incomplete coverage')}${metric('Reported tickets sold', aa, a => a.tickets)}${metric('Confirmed concert appearances', aa, a => M.concerts(data, artists, { ...o, artist: a.artist.slug }).filter(c => c.eventStatus === 'completed').length, fmt, () => 'Tracked history only; not all career appearances')}${metric('Gross per million Spotify streams', aa, a => a.grossPerMillion, money, a => e(a.ratioNote), false)}${metric('Tickets per million Spotify streams', aa, a => a.ticketsPerMillion, fmt, a => e(a.ratioNote), false)}<div class="tour-artist-pair">${aa.map(a => `<section><h3>${e(a.artist.name)}: touring footprint</h3>${footprint(M.concerts(data, artists, { ...o, artist: a.artist.slug }))}<details><summary>Tracked songs & albums</summary><ul>${a.artist.songs.map(s => `<li>${e(s.title || s.name)} · ${fmt(s.streams)} Spotify streams</li>`).join('')}${a.artist.albums.map(s => `<li>${e(s.title || s.name)} · album</li>`).join('')}</ul></details></section>`).join('')}</div>`; scatter(o); trends(aa, o); }
    function scatter(o) { const x = $('#tour-x').value, y = $('#tour-y').value; const points = artists.filter(a => !o.genre || a.genres?.includes(o.genre)).map(a => M.comparison(data, artists, a.slug, o)).filter(a => a[x] && a[y] != null); if (!o.year || points.length < 2) {
        $('#tour-scatter').innerHTML = empty('Comparable points are not available.', 'Choose a year with full-year streaming observations and verified touring reports for at least two artists.');
        return;
    } const xmax = Math.max(1, ...points.map(a => a[x].value)), ymax = Math.max(1, ...points.map(a => a[y])); $('#tour-scatter').innerHTML = `<svg class="tour-chart" viewBox="0 0 680 340" role="img" aria-label="${e(x)} versus ${e(y)}"><path d="M85 20V280H655"/><text x="85" y="302">0</text><text x="590" y="302">${e(fmt(xmax))}</text><text x="5" y="30">${e(fmt(ymax))}</text><text x="280" y="330">${e(x)} · annual observation</text>${points.map(a => `<circle tabindex="0" cx="${85 + a[x].value / xmax * 550}" cy="${280 - a[y] / ymax * 250}" r="7" aria-label="${e(a.artist.name + ': ' + fmt(a[x].value) + ' ' + x + ', ' + fmt(a[y]) + ' ' + y)}"><title>${e(a.artist.name + ': ' + fmt(a[x].value) + ' / ' + fmt(a[y]))}</title></circle>`).join('')}</svg><details><summary>Read chart data</summary>${table(['Artist', x, y], points.map(a => `<tr><th scope="row">${e(a.artist.name)}</th><td>${fmt(a[x].value)}</td><td>${fmt(a[y])}</td></tr>`), 'Scatter chart values')}</details>`; }
    function annualCharts(aa, o, years) { return aa.map(a => ['spotify', 'gross'].map(metricName => { const points = years.map(year => ({ year, c: M.comparison(data, artists, a.artist.slug, { year, region: o.region }) })).map(p => ({ year: p.year, value: metricName === 'spotify' ? p.c.spotify?.value : p.c.gross })).filter(p => p.value != null); if (points.length < 2)
        return ''; const max = Math.max(1, ...points.map(p => p.value)); return `<section><h3>${e(a.artist.name)} · ${metricName === 'spotify' ? 'annual Spotify streams' : 'reported annual gross (USD)'}</h3><div class="tour-country-list">${points.map(p => `<div><strong>${p.year}: ${metricName === 'gross' ? money(p.value) : fmt(p.value)}</strong><div class="tour-bar-track"><div class="tour-bar" style="--bar-width:${p.value / max * 100}%"></div></div></div>`).join('')}</div></section>`; }).join('')).join(''); }
    function trends(aa, o) { const years = [...new Set(data.concerts.map(c => c.date.slice(0, 4)).concat(data.streamingSnapshots.filter(s => s.kind === 'period').map(s => s.periodEnd.slice(0, 4))))].sort(); const rows = years.flatMap(year => aa.map(a => { const cur = M.comparison(data, artists, a.artist.slug, { year, region: o.region }), prev = M.comparison(data, artists, a.artist.slug, { year: String(Number(year) - 1), region: o.region }), g = cur.spotify?.scope && cur.spotify.scope === prev.spotify?.scope ? M.growth(cur.spotify?.value, prev.spotify?.value) : null; return `<tr><th scope="row">${e(a.artist.name)} · ${year}</th><td>${fmt(cur.spotify?.value)}</td><td>${g === null ? 'Unavailable' : (g * 100).toFixed(1) + '%'}</td><td>${money(cur.gross)}</td><td>${fmt(cur.tickets)}</td></tr>`; })); $('#tour-trends').innerHTML = rows.length ? annualCharts(aa, o, years) + table(['Artist / year', 'Annual Spotify streams', 'Spotify growth', 'Reported gross · USD', 'Reported tickets'], rows, 'Annual performance') + `<p class="tour-note">Annual streaming requires a full calendar-year observation. Touring totals include only qualifying reported shows, so changes in reporting coverage are not presented as commercial growth.</p>` : empty('Annual history is unavailable.', 'Full-year observations are needed before showing growth.'); }
    function initComparison() { const f = $('#tour-compare'); if (!f)
        return; for (const name of ['a', 'b'])
        f.elements[name].innerHTML = artists.map(a => `<option value="${e(a.slug)}">${e(a.name)}</option>`).join(''); f.elements.a.value = artists.some(a => a.slug === 'burna-boy') ? 'burna-boy' : artists[0].slug; f.elements.b.value = artists.some(a => a.slug === 'wizkid') ? 'wizkid' : artists[1].slug; setOptions(f.elements.year, data.concerts.map(c => c.date.slice(0, 4)).concat(data.cutoff.slice(0, 4)).concat(data.streamingSnapshots.filter(s => s.kind === 'period').map(s => s.periodEnd.slice(0, 4)))); setOptions(f.elements.genre, artists.flatMap(a => a.genres || [])); for (const [k, v] of new URLSearchParams(location.search))
        if (f.elements[k] && [...f.elements[k].options].some(x => x.value === v))
            f.elements[k].value = v; f.onchange = compare; f.onsubmit = ev => ev.preventDefault(); $('#tour-swap').onclick = () => { [f.elements.a.value, f.elements.b.value] = [f.elements.b.value, f.elements.a.value]; compare(); }; $('#tour-x').onchange = $('#tour-y').onchange = compare; compare(); }
    function records(list) { return list.length ? list.map(r => `<article class="tour-record"><h2>${e(r.title || r.definition)}</h2><p>${e(r.definition)}</p><p>${e(r.limitation)}</p>${source(r.sourceId)}<p class="tour-note">Verified · ${e(r.publishedAt)}</p></article>`).join('') : empty('No records published yet.', 'A milestone needs a precise definition, eligible evidence and a dated source. Promotional claims do not establish a record.'); }
    function detailPage() {
        const root = $('#tour-detail');
        if (!root)
            return;
        if (mode === 'records') {
            root.innerHTML = records(data.records);
            return;
        }
        if (mode === 'editorial') {
            root.innerHTML = data.articles.length ? data.articles.map(a => `<article class="tour-record"><h2>${e(a.title)}</h2><p>${e(a.body)}</p>${sources(a.sourceIds)}</article>`).join('') : empty('No touring stories published.', 'Reviewed articles will link to their original evidence.');
            return;
        }
        const t = data.tours.find(t => t.slug === detail), a = artist(detail), c = data.concerts.find(c => c.id === detail);
        let list = [];
        if (mode === 'tour' && t) {
            list = data.concerts.filter(c => c.tourId === t.id);
            $('.tour-heading h1').textContent = t.name;
        }
        else if (mode === 'artist' && a) {
            list = data.concerts.filter(c => c.artistIds.includes(a.slug));
            $('.tour-heading h1').textContent = a.name + ' · Touring';
        }
        else if (mode === 'concert' && c) {
            list = [c];
            $('.tour-heading h1').textContent = c.title || venue(c.venueId).name;
        }
        else {
            root.innerHTML = empty('This record is unavailable.', 'It may be unreviewed, retracted or outside the published dataset.');
            return;
        }
        const scoped = { ...data, concerts: list }, gross = M.aggregate(scoped, artists, { level: mode === 'tour' ? 'tours' : 'artists' })[0], tickets = M.aggregate(scoped, artists, { metric: 'tickets', level: mode === 'tour' ? 'tours' : 'artists' })[0];
        root.innerHTML = `${a ? `<nav class="tour-nav" aria-label="Artist sections"><a href="/current/${e(a.slug)}">Overview</a><a href="/touring/artists/${e(a.slug)}" aria-current="page">Touring</a><a href="/touring/vs-streaming?a=${e(a.slug)}">Touring vs Streaming</a></nav>` : ''}<dl class="tour-detail-facts"><div><dt>Reported headline gross</dt><dd>${money(gross?.gross)}</dd></div><div><dt>Reported headline tickets</dt><dd>${fmt(tickets?.tickets)}</dd></div><div><dt>Confirmed completed events</dt><dd>${list.filter(c => c.eventStatus === 'completed').length}</dd></div><div><dt>Events with box-office reports</dt><dd>${new Set(M.qualified(scoped).flatMap(r => r.eventIds)).size}</dd></div><div><dt>Countries documented</dt><dd>${new Set(list.map(c => venue(c.venueId).country)).size}</dd></div><div><dt>Coverage</dt><dd>${gross?.complete ? 'Complete reported tour' : 'Partial history'}</dd></div></dl>${t ? `<p>${e(t.startDate || 'Start date unconfirmed')} to ${e(t.endDate || 'end date unconfirmed')} · ${e(t.status)} · ${t.totalShows === null ? 'Total show count unknown' : t.totalShows + ' confirmed shows'}</p>` : ''}<p class="tour-note">Only documented events appear here. Missing African box-office reporting is not evidence of poor commercial performance. Festival and shared-bill revenue is not assigned to individual artists.</p>${c ? `<dl class="tour-detail-facts"><div><dt>Venue capacity</dt><dd>${fmt(c.capacity)}</dd></div><div><dt>Attendance</dt><dd>${fmt(c.attendance)}</dd></div><div><dt>Sellout confirmation</dt><dd>${c.sellout === null ? 'Not confirmed' : c.sellout ? 'Confirmed' : 'Not sold out'}</dd></div></dl><p>Last verified: ${e(c.verifiedAt)} · ${source(c.sourceId)}</p>` : ''}<h2>Concert history</h2>${eventTable(list)}${M.qualified(scoped).filter(r => r.eventIds.length > 1).map(r => `<p>Combined report for ${r.eventIds.length} nights: ${e(r.currency)} ${fmt(r.gross)}, ${fmt(r.tickets)} tickets. Not allocated to individual nights. ${source(r.sourceId)}</p>`).join('')}<section class="tour-section"><h2>Countries on record</h2>${footprint(list)}</section>${a ? `<section class="tour-section"><h2>Reported tour timeline</h2>${rankingTable(M.aggregate(scoped, artists, { level: 'tours' }), 'tours')}<h2>Largest reported headline concerts</h2>${rankingTable(M.aggregate(scoped, artists, { level: 'concerts' }).slice(0, 3), 'concerts')}<h2>Touring records</h2>${records(data.records.filter(r => r.artistId === a.slug))}</section>` : ''}`;
        document.title = $('.tour-heading h1').textContent + ' · AFR/INDEX';
    }
    function overview() { if (mode !== '')
        return; $('#tour-overview-leaders').innerHTML = [['All-Time highest-grossing tours', { level: 'tours' }], ['Current-year leaders', { year: data.cutoff.slice(0, 4) }], ['Most reported tickets sold', { metric: 'tickets' }]].map(([title, o]) => `<section><h3>${title}</h3>${rankingTable(M.aggregate(data, artists, o).slice(0, 5), o.level)}</section>`).join(''); $('#tour-recent').innerHTML = eventTable(M.concerts(data, artists).slice(0, 5)); $('#tour-africa').innerHTML = footprint(M.concerts(data, artists, { region: 'Africa' })); const recent = M.concerts(data, artists)[0]; $('#tour-featured').innerHTML = data.records.length ? records(data.records.slice(0, 1)) : recent ? `<div class="tour-feature-event">${image(artist(recent.artistIds[0]))}<div><h3><a href="/touring/concerts/${e(recent.id)}">${e(recent.title)}</a></h3><p>${e(venue(recent.venueId).city)} · ${e(recent.date)}</p><p>Performance confirmed · Box office unreported</p></div></div>` : ''; if (!data.reports.length)
        $('#tour-overview-leaders').innerHTML = ['All-Time highest-grossing tours', 'Current-year leaders', 'Most reported tickets sold', 'Biggest reported headline concerts'].map(t => `<div class="tour-unavailable-row"><strong>${t}</strong><span>No eligible reports yet</span></div>`).join('') + `<p class="tour-note">Financial rankings await verified, reusable reports. Confirmed concerts remain available regardless of financial coverage. <a href="/touring/records">Touring records</a></p>`; }
    async function load() { const status = $('#tour-status'); status.hidden = false; status.textContent = 'Loading the published touring edition…'; $('#tour-retry').hidden = true; try {
        let result;
        const response = await fetch('/api/product?service=touring&action=data');
        if (response.ok)
            result = await response.json();
        else {
            const fallback = await fetch('/data/touring-public.json');
            if (!fallback.ok)
                throw Error('The touring edition could not load.');
            result = await fallback.json();
            status.textContent = 'Live updates are unavailable. Showing the source-reviewed edition included with this site. Retry for the latest publication.';
            $('#tour-retry').hidden = false;
        }
        data = result.dataset;
        artists = result.artists;
        publication = result.publication;
        $('#tour-coverage').textContent = `Updated ${new Date(data.updatedAt || data.cutoff).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })} · ${data.concerts.length} confirmed events · ${M.qualified(data).length} verified financial reports · Partial coverage`;
        if (response.ok)
            status.hidden = true;
        initFilters();
        initComparison();
        detailPage();
        overview();
    }
    catch (err) {
        status.textContent = err.message + ' Please retry.';
        $('#tour-retry').hidden = false;
    } }
    $('#tour-retry').onclick = load;
    if (mode === 'admin') {
        import('/touring-editor.js').then(m => m.start()).catch(() => { $('#tour-admin-gate').textContent = 'The editor could not load. Reload this page to retry.'; });
    }
    else if (mode !== 'methodology')
        load();
})();
