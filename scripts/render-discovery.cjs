const fs = require('node:fs');
const { data } = require('../lib/shared.cjs');
const { discoveryBoard, discoveryMarkup, signupMarkup } = require('../lib/discovery.cjs');
const { buildBrief, briefMarkup } = require('../lib/weekly-brief.cjs');
const board = discoveryBoard(data), brief = buildBrief(data);
function document(title, description, body) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="description" content="${description}"><meta name="theme-color" content="#151812"><title>${title} · Afri Index</title><link rel="icon" href="/afr-index-favicon.svg"><link rel="stylesheet" href="/discovery.css"><link rel="manifest" href="/manifest.webmanifest"><script src="/discovery.js" defer></script></head><body class="discovery-site-body"><header class="discovery-site-nav"><a href="/">AFR / INDEX</a><nav aria-label="Explore"><a href="/">Current 50</a><a href="/underground">Underground</a><a href="/newsletter">Sunday brief</a></nav></header>${body}</body></html>`;
}
fs.writeFileSync('newsletter.html', document('The Sunday brief', 'African music every Sunday: Top 10, chart movers, a head-to-head and an underground artist worth hearing.', `<main><article class="brief-page">${briefMarkup(brief)}<p><a href="/api/newsletter?action=preview">Open the email template ↗</a></p></article>${signupMarkup('signup','newsletter')}<footer class="discovery-footer" id="privacy"><strong>Your email, your choice.</strong><p>When signup is available, your address is sent to Buttondown to deliver the Sunday brief and its confirmation email. Subscription requires your consent and email confirmation. Each email includes an unsubscribe link. Your email is never shown on public artist pages.</p><p>Rankings are editorial. Any future paid sponsor slot will be labelled and separate from the chart.</p><a href="https://buttondown.com/legal/privacy" style="color:inherit">Buttondown privacy policy ↗</a></footer></main>`));
let html = fs.readFileSync('index.html','utf8');
html = html.replace(/\n?[ \t]*<!-- discovery-generated:start -->[\s\S]*?<!-- discovery-generated:end -->[ \t]*\n?/g,'');
html = html.replace('</main>', `<!-- discovery-generated:start -->\n<section id="underground" class="tab-content supplement-section discovery-page">${discoveryMarkup(board)}</section>\n${signupMarkup('home-signup','homepage')}\n<!-- discovery-generated:end -->\n</main>`);
if (!html.includes('href="/discovery.css"')) html = html.replace('</head>', '<link rel="stylesheet" href="/discovery.css">\n</head>');
if (!html.includes('src="/discovery.js"')) html = html.replace('</body>', '<script src="/discovery.js" defer></script>\n</body>');
if (!html.includes('id="receipt-signup"')) html = html.replace('<p id="receipt-output-note">Your receipt will appear here.</p>', `<p id="receipt-output-note">Your receipt will appear here.</p>${signupMarkup('receipt-signup','music-receipt')}`);
fs.writeFileSync('index.html', html.replace(/[ \t]+$/gm, ''));
console.log(`Rendered Watch ${board.artists.length} and Sunday brief ${brief.issue}; chart snapshot ${data.asOf.slice(0,10)}`);
