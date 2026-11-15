const model = require('../touring-model.js');
const current = require('../data/current.json');
const seed = require('../data/touring.json');
function withStreaming(dataset) {
    const d = structuredClone(dataset);
    for (const a of current.artists) {
        const source = a.sources?.catalogue || a.sources?.kworb, date = a.spotifySourceUpdatedAt || a.statsLastUpdatedAt?.slice(0, 10);
        if (!source || !date || !Number.isFinite(a.totalSpotifyStreams))
            continue;
        const sourceId = 'existing-spotify-' + a.slug;
        if (!d.sources.some(s => s.id === sourceId))
            d.sources.push({ id: sourceId, publisher: 'Existing Afri Index Spotify source', url: source, publishedAt: date, reuse: 'existing-site', permissionEvidence: 'Existing published Afri Index observation; not a newly imported touring source.' });
        if (!d.streamingSnapshots.some(s => s.id === sourceId))
            d.streamingSnapshots.push({ id: sourceId, artistId: a.slug, platform: 'spotify', kind: 'cumulative', periodStart: null, periodEnd: date, value: a.totalSpotifyStreams, status: 'verified', sourceId, scope: 'Tracked artist catalogue; global cumulative observation' });
    }
    return d;
}
function publicData(dataset) {
    const d = withStreaming(dataset);
    d.reports = model.qualified(d).map(({ supersedes, ...r }) => r);
    const reports = new Set(d.reports.map(r => r.id));
    const permitted = id => model.reusable(d.sources.find(s => s.id === id));
    d.concerts = d.concerts.filter(c => ['verified', 'partially-verified', 'unreported'].includes(c.status) && permitted(c.sourceId));
    d.tours = d.tours.filter(t => d.concerts.some(c => c.tourId === t.id));
    d.venues = d.venues.filter(v => d.concerts.some(c => c.venueId === v.id));
    d.records = d.records.filter(r => r.status === 'verified' && permitted(r.sourceId) && r.reportIds.every(id => reports.has(id)) && (!r.eventIds || r.eventIds.every(id => d.concerts.some(c => c.id === id))));
    d.articles = d.articles.filter(a => a.status === 'verified' && a.sourceIds.every(permitted));
    d.streamingSnapshots = d.streamingSnapshots.filter(s => s.status === 'verified' && permitted(s.sourceId));
    const used = new Set([...d.reports.flatMap(r => [r.sourceId, r.fx?.sourceId]), ...d.concerts.map(c => c.sourceId), ...d.records.map(r => r.sourceId), ...d.streamingSnapshots.map(s => s.sourceId), ...d.articles.flatMap(a => a.sourceIds)]);
    d.sources = d.sources.filter(s => used.has(s.id)).map(({ permissionEvidence, ...source }) => source);
    return d;
}
function artists() { return current.artists.map(a => ({ slug: a.slug, name: a.name, countries: a.countries, genres: a.genres, gender: a.gender, image: '/artists/' + a.slug + '.webp', songs: (a.songs || []).slice(0, 5), albums: (a.catalogueAlbums || []).slice(0, 5) })); }
module.exports = { seed, artists, publicData, withStreaming, model };
