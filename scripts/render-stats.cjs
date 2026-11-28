// /stats: personal African music stats. The page is a static shell; data loads in the browser.
const fs=require('node:fs');
const {page}=require('./render-rankings.cjs');
const body=`<section class="chart-table-page stats-page"><header class="ranking-page-head"><p class="index-eyebrow">YOUR LISTENING / AFRICAN ARTISTS ONLY</p><h1>Your African music stats.</h1><p>Your top African artists, tracks and albums, your genre and country mix, and where your taste sits against the Current 50. Only African artists in the index are counted.</p></header>
<div id="stats-app" class="stats-app"><noscript><p>Your stats need JavaScript because they are built in your browser.</p></noscript><div class="stats-skeleton" aria-hidden="true"><span></span><span></span><span></span></div></div></section>
<link rel="stylesheet" href="/stats.css"><script src="/music-receipt-config.js"></script><script src="/stats-model.js"></script><script src="/stats-providers.js"></script><script src="/personal-stats.js" defer></script>`;
page('/stats','Your African music stats','See your top African artists and tracks from Spotify, Last.fm or your Spotify history file, with genre, country and era mix and how your taste compares with the Current 50.',body);
// Entry point from Music Receipt. Idempotent.
let receipt=fs.readFileSync('music-receipt.html','utf8');
receipt=receipt.replace(/<p class="stats-entry-link">[\s\S]*?<\/p>/g,'').replace('id="receipt-title">Music Receipt</h2>','id="receipt-title">Music Receipt</h2><p class="stats-entry-link">Want the full picture? <a href="/stats">See your African music stats →</a></p>');
fs.writeFileSync('music-receipt.html',receipt);
let xml=fs.readFileSync('sitemap.xml','utf8');if(!xml.includes('/stats</loc>'))xml=xml.replace('</urlset>','<url><loc>https://afrobeats-index.vercel.app/stats</loc></url></urlset>');fs.writeFileSync('sitemap.xml',xml);
console.log('Rendered /stats.');
