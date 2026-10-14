const compiled = require('../data/quiz/questions.json');
const manifest = require('../data/quiz/manifest.json');
function getArtistQuiz(slug) { return compiled.artists[slug] || null; }
module.exports = { getArtistQuiz, getQuizManifest: () => manifest, version: compiled.version };
