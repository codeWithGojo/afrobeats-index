const fs = require('node:fs');
const { render, sections } = require('../lib/touring-view.cjs');
const { seed, artists, publicData, model } = require('../lib/touring-data.cjs');
const errors = model.validate(seed, artists());
if (errors.length)
    throw Error('Touring seed: ' + errors.join('\n'));
fs.mkdirSync('touring', { recursive: true });
for (const route of ['', ...sections.map(s => s[0]).filter(Boolean), 'reports', 'editorial'])
    fs.writeFileSync(route ? 'touring/' + route + '.html' : 'touring.html', render(route));
fs.writeFileSync('data/touring-public.json', JSON.stringify({ publication: 0, dataset: publicData(seed), artists: artists() }));
fs.writeFileSync('data/touring-import-template.csv', 'artist_id,tour_name,event_date,venue,city,country,region,subregion,gross,currency,tickets_sold,attendance,source_url,source_date,publisher,verification_status,billing,event_status\n');
const sitemap = 'sitemap.xml';
if (fs.existsSync(sitemap)) {
    let xml = fs.readFileSync(sitemap, 'utf8');
    const links = ['', ...sections.map(s => s[0]).filter(Boolean), 'reports', 'editorial'].map(r => 'https://afrobeats-index.vercel.app/touring' + (r ? '/' + r : ''));
    xml = xml.replace('</urlset>', links.filter(url => !xml.includes('<loc>' + url + '</loc>')).map(url => `<url><loc>${url}</loc></url>`).join('') + '</urlset>');
    fs.writeFileSync(sitemap, xml);
}
