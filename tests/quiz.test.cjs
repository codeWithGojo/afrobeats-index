const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { getArtistQuiz, getQuizManifest } = require('../lib/quiz-bank.cjs');
const { selectSession } = require('../quiz-session.js');
const quizApi = require('../api/quiz.js');
const normalized = (value) => String(value).normalize('NFKD').toLowerCase().replace(/[^a-z0-9]/g, '');

test('both ranked lists have 100 distinct questions per reviewed artist, across multiple categories', () => {
  const manifest = getQuizManifest();
  assert.equal(manifest.artists.length, 79);
  assert.equal(manifest.artists.filter((artist) => artist.lists.includes('current')).length, 50);
  for (const artist of manifest.artists) {
    const bank = getArtistQuiz(artist.slug);
    assert.ok(bank, `Missing bank: ${artist.name}`);
    assert.equal(bank.questions.length, 100, `Incomplete bank: ${artist.name}`);
    assert.equal(new Set(bank.questions.map((question) => question.id)).size, 100);
    assert.ok(Object.keys(bank.categoryCounts).length >= 4, `Not enough variety: ${artist.name}`);
    assert.ok((bank.categoryCounts['release-order'] || 0) <= 25);
  }
});

test('each answer agrees with its downloaded primary-source record and carries provenance', () => {
  for (const artist of getQuizManifest().artists) {
    const bank = getArtistQuiz(artist.slug);
    assert.ok(bank, `Missing bank: ${artist.name}`);
    const packet = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/quiz/catalogues', `${artist.slug}.json`)));
    assert.equal(packet.identityStatus, 'reviewed');
    const tracks = new Map(packet.tracks.map((track) => [track.trackId, track]));
    for (const question of bank.questions) {
      assert.equal(new Set(question.options.map(normalized)).size, 4, `${artist.name}: duplicate option`);
      assert.ok(question.sources.length > 0);
      for (const source of question.sources) {
        const record = tracks.get(source.recordId);
        assert.ok(record, 'Evidence record must exist in the harvested catalogue');
        assert.equal(source.url, record.trackViewUrl);
        assert.match(source.url, /^https:\/\/(music\.apple\.com|www\.afrocrafters\.com)\//);
        for (const [field, value] of Object.entries(source.evidence)) assert.deepEqual(value, record[field]);
        assert.ok(Number.isFinite(Date.parse(source.verifiedAt)));
      }
      const correct = question.options[question.answerIndex], evidence = question.sources[0].evidence;
      if (question.category === 'song-album' || question.category === 'artwork') assert.equal(correct, evidence.collectionName);
      if (question.category === 'release-year') assert.equal(correct, evidence.releaseDate.slice(0, 4));
      if (question.category === 'track-position') assert.equal(correct, String(evidence.trackNumber));
      if (question.category === 'release-size') assert.equal(correct, String(evidence.trackCount));
      if (question.category === 'tracklist') assert.equal(correct, question.sources.at(-1).evidence.trackName);
      if (question.category === 'release-order') {
        const first = question.sources.slice().sort((a, b) => a.evidence.releaseDate.localeCompare(b.evidence.releaseDate))[0].evidence;
        assert.equal(correct, `${first.trackName} — ${first.collectionName}`);
      }
      if (question.category === 'collaboration') assert.ok(normalized(evidence.trackName + evidence.artistName).includes(normalized(correct)));
    }
  }
});

test('a challenge reproduces the same ten questions and options without mutating the bank', () => {
  const questions = getArtistQuiz('omah-lay').questions;
  const before = JSON.stringify(questions);
  for (const level of ['casual', 'fan', 'superfan']) {
    const first = selectSession(questions, level, 'friend-round-123');
    assert.deepEqual(first, selectSession(questions, level, 'friend-round-123'));
    assert.equal(first.length, 10);
    assert.equal(new Set(first.map((q) => q.id)).size, 10);
    assert.ok(new Set(first.map((q) => q.category)).size >= 2);
    for (const question of first) {
      const original = questions.find((q) => q.id === question.id);
      assert.equal(question.options[question.answerIndex], original.options[original.answerIndex]);
    }
  }
  assert.equal(JSON.stringify(questions), before);
  assert.notDeepEqual(selectSession(questions, 'fan', 'one'), selectSession(questions, 'fan', 'two'));
});

test('quiz API supports the directory, legacy artists and version-safe challenges', () => {
  function invoke(query, method = 'GET') {
    const result = { headers: {}, statusCode: 200, body: null };
    const res = { setHeader(name, value) { result.headers[name] = value; return this; }, status(code) { result.statusCode = code; return this; }, json(body) { result.body = body; return this; } };
    quizApi({ method, query }, res); return result;
  }
  assert.equal(invoke({}).body.artists.length, 79);
  assert.equal(invoke({ artist: 'omah-lay' }).body.questions.length, 100);
  assert.equal(invoke({ artist: 'fela-kuti' }).body.questions.length, 100);
  assert.equal(invoke({ artist: 'omah-lay', version: 'old-bank' }).statusCode, 409);
  assert.equal(invoke({ artist: '../invalid' }).statusCode, 400);
  assert.equal(invoke({ artist: 'unknown-artist' }).statusCode, 404);
  assert.equal(invoke({}, 'POST').statusCode, 405);
});
