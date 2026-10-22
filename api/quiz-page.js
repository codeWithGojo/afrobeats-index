const fs = require('node:fs');
const path = require('node:path');
const { getArtistQuiz } = require('../lib/quiz-bank.cjs');
const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
module.exports = (req, res) => {
  const slug = req.query.artist ? String(req.query.artist).toLowerCase() : '';
  const bank = /^[a-z0-9-]{1,80}$/.test(slug) ? getArtistQuiz(slug) : null;
  if (slug && !bank) return res.status(404).send('Artist quiz not found. <a href="/quiz">Browse artist quizzes</a>');
  const title = bank ? `${bank.artist.name} Fan Quiz · Afri Index` : 'Fan quizzes · Afri Index';
  const description = bank ? `Test your ${bank.artist.name} knowledge with ten sourced questions per round, three difficulty levels and cover-art clues. Challenge a friend on Afri Index.` : 'Choose an African artist, play ten sourced music questions and challenge a friend. Three difficulty levels, career milestones and cover-art clues.';
  const url = `https://afrobeats-index.vercel.app/quiz${slug ? '/' + slug : ''}`;
  const image = bank && bank.artist.lists.includes('current') ? `https://afrobeats-index.vercel.app/api/card?artist=${slug}` : 'https://afrobeats-index.vercel.app/afri-index-og.png';
  let html = fs.readFileSync(path.join(__dirname, '..', 'quiz.html'), 'utf8');
  html = html.replace(/<title>.*?<\/title>/, `<title>${escape(title)}</title>`).replace(/<meta name="description"[^>]*>/, '').replace(/<link rel="canonical"[^>]*>/, '');
  html = html.replace('</head>', `<meta name="description" content="${escape(description)}"><link rel="canonical" href="${url}"><meta property="og:title" content="${escape(title)}"><meta property="og:description" content="${escape(description)}"><meta property="og:url" content="${url}"><meta property="og:type" content="website"><meta property="og:image" content="${image}"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:image" content="${image}"></head>`);
  html = html.replace('<h1>Loading the artist file…</h1>', `<h1>${bank ? `How well do you know ${escape(bank.artist.name)}?` : 'Know the music. Prove it.'}</h1><p>${escape(description)}</p><noscript>Enable JavaScript to play the interactive quiz. <a href="/">Return to the index</a>.</noscript>`);
  res.setHeader('Content-Type', 'text/html; charset=utf-8'); res.setHeader('Cache-Control', 'public,max-age=0,s-maxage=300'); res.send(html);
};
