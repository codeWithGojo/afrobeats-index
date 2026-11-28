// /my-index: user-graded rankings and the Community Index. Static shell; grading happens in the browser.
const fs=require('node:fs');
const {page}=require('./render-rankings.cjs');
const {rankingNav}=require('../lib/ranking-ui.cjs');
const body=`${rankingNav('/my-index')}<section class="chart-table-page my-index-page"><header class="ranking-page-head"><p class="index-eyebrow">YOUR CHART / YOUR RULES</p><h1>My Index.</h1><p>Music is personal. Pick what matters to you, grade artists from 1 to 10 and watch your own chart build. Then see how it compares with the official Current 50 and with everyone else.</p></header>
<div id="my-index-app" class="my-index-app"><noscript><p>My Index runs in your browser and needs JavaScript.</p></noscript><div class="stats-skeleton" aria-hidden="true"><span></span><span></span></div></div></section>
<link rel="stylesheet" href="/stats.css"><link rel="stylesheet" href="/my-index.css"><script src="/assets/board-engine.js"></script><script src="/afri-prefs.js"></script><script src="/my-index-model.js"></script><script src="/my-index.js" defer></script>`;
page('/my-index','My Index: build your own African music chart','Grade African artists on the metrics you care about, build your own chart, compare it with the official Current 50 and see the fan-powered Community Index.',body);
let xml=fs.readFileSync('sitemap.xml','utf8');if(!xml.includes('/my-index</loc>'))xml=xml.replace('</urlset>','<url><loc>https://afrobeats-index.vercel.app/my-index</loc></url></urlset>');fs.writeFileSync('sitemap.xml',xml);
console.log('Rendered /my-index.');
// 404: short, on-brand, with ways back.
page('/404','Page not found','This page left the party early.',`<section class="chart-table-page" style="display:grid;gap:14px;max-width:640px"><p class="index-eyebrow">404 / NOT ON THE CHART</p><h1>This page left the party early.</h1><p>The link may be old, or the artist moved. The music is still playing over here:</p><p><a href="/current">Current 50 →</a> · <a href="/heat">Heat 25 →</a> · <a href="/rankings">All rankings →</a></p></section>`);
