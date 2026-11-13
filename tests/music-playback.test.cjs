const assert = require('node:assert/strict');
const test = require('node:test');
const { chartTable, streamRows } = require('../lib/ranking-ui.cjs');
const { sources } = require('../music-embed.js');
const chart = require('../data/nigeria-top100.json');
const catalogue = require('../data/stream-counter.json');

test('every song in the published Nigeria Top 100 has an exact provider embed', () => {
  const html = chartTable(chart, 'songs', true);
  const rows = [...html.matchAll(/<tr data-chart-search=.*?<\/tr>/g)];
  assert.equal(rows.length, 100);
  for (const [index, [row]] of rows.entries()) {
    const media = row.match(/data-music-provider="([^"]+)" data-music-id="([^"]+)"/);
    assert.ok(media && sources({ provider: media[1], id: media[2] }), chart.rows[index][1]);
  }
});

test('all stream catalogue songs have playable Spotify recording IDs', () => {
  for (const row of catalogue.rows.filter(row => row.type === 'songs')) {
    assert.ok(sources({ provider: 'spotify', id: row.spotifyId }), row.title);
  }
  const sample = catalogue.rows.find(row => row.type === 'songs');
  assert.match(streamRows([sample]), /data-music-provider="spotify"/);
});

test('every published TurnTable song chart has an exact provider embed for each row', () => {
  const charts = require('../data/turntable-categories.json');
  for (const chart of charts.filter(chart => chart.entryLabel === 'Song / artist')) {
    const html = chartTable(chart, 'entries', true);
    const rows = [...html.matchAll(/<tr data-chart-search=.*?<\/tr>/g)];
    assert.equal(rows.length, chart.rows.length, chart.slug);
    for (const [index, [row]] of rows.entries()) {
      const media = row.match(/data-music-provider="([^"]+)" data-music-id="([^"]+)"/);
      assert.ok(media && sources({ provider: media[1], id: media[2] }), chart.slug + ' · ' + chart.rows[index][1]);
    }
  }
});
