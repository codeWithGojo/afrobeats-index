const { getArtistQuiz, getQuizManifest, version } = require('../lib/quiz-bank.cjs');
module.exports = (req, res) => {
  if (req.method && req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=3600');
  if (!req.query.artist) return res.json(getQuizManifest());
  const slug = String(req.query.artist).toLowerCase();
  if (!/^[a-z0-9-]{1,80}$/.test(slug)) return res.status(400).json({ error: 'Choose a valid artist.' });
  if (req.query.version && req.query.version !== version) {
    return res.status(409).json({ error: 'This challenge belongs to an older question bank. Start a fresh round to use the current edition.', code: 'BANK_VERSION_CHANGED' });
  }
  const bank = getArtistQuiz(slug);
  if (!bank || bank.questionCount < 10) return res.status(404).json({ error: 'A checked question bank is not available for this artist yet.' });
  return res.json({ ...bank, version });
};
