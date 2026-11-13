const { sources } = require('../music-embed.js');
const curated = require('../data/music-playback.json').songs;

function normalize(value) {
  return value.normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase()
    .replace(/[’‘]/g, "'").replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
}

function key(title, artist) {
  const featured = title.match(/^(.*?)\s*\((?:feat\.|ft\.|with)\s+([^()]*)\)$/i);
  if (featured) {
    title = featured[1];
    artist += ' & ' + featured[2];
  }
  const credits = artist.split(/\s+(?:ft\.?|feat\.?|featuring|&|and|x|with)\s+|,\s*/i).map(normalize);
  return normalize(title) + ':' + [...new Set(credits)].sort().join('|');
}

const exact = new Map();
const candidates = new Map();

for (const { song_title, artist, spotify_id } of require('../data/releases-2026.json').songs) {
  add(song_title, artist, spotify_id);
}
for (const row of require('../data/stream-counter.json').rows) {
  if (row.type === 'songs') add(row.title, row.artist, row.spotifyId);
}

function add(title, artist, id) {
  if (!sources({ provider: 'spotify', id })) return;
  const k = key(title, artist);
  if (!candidates.has(k)) candidates.set(k, new Set());
  candidates.get(k).add(id);
}

for (const [title, artist, provider, id] of curated) {
  exact.set(key(title, artist), { provider, id });
}

function recording(title, artist) {
  const k = key(title, artist);
  if (exact.has(k)) return exact.get(k);
  const ids = candidates.get(k);
  if (ids?.size === 1) return { provider: 'spotify', id: [...ids][0] };
}

module.exports = { recording, key };
