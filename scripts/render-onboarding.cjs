// Homepage: "Your artists this week" slot after the hero, onboarding scripts, footer "Personalise" link. Idempotent.
const fs=require('node:fs');
let html=fs.readFileSync('index.html','utf8');
html=html.replace(/<section id="your-artists"[\s\S]*?<\/section>/g,'').replace(/<link rel="stylesheet" href="\/onboarding.css">|<script src="\/afri-prefs.js"[^>]*><\/script>|<script src="\/onboarding.js"[^>]*><\/script>|<p class="onboard-footer-link">[\s\S]*?<\/p>/g,'');
const hero=html.indexOf('<section class="index-hero"');if(hero<0)throw Error('Homepage hero not found');
const end=html.indexOf('</section>',hero)+'</section>'.length;
html=html.slice(0,end)+'\n<section id="your-artists" class="your-artists" aria-labelledby="your-artists-title" hidden></section>'+html.slice(end);
html=html.replace('</head>','<link rel="stylesheet" href="/onboarding.css"><script src="/afri-prefs.js" defer></script><script src="/onboarding.js" defer></script></head>');
html=html.replace('<footer class="trust-footer">','<footer class="trust-footer"><p class="onboard-footer-link"><a href="/" data-onboarding-open>Personalise your homepage</a></p>');
fs.writeFileSync('index.html',html);
console.log('Rendered homepage personalisation slot and onboarding.');
// Music Receipt reads the same picks to prefill manual selections.
let receipt=fs.readFileSync('music-receipt.html','utf8');
if(!receipt.includes('src="/afri-prefs.js"'))receipt=receipt.replace('<script src="/music-receipt.js">','<script src="/afri-prefs.js"></script><script src="/music-receipt.js">');
fs.writeFileSync('music-receipt.html',receipt);
// Receipt print effects (Phase 6).
let rc=fs.readFileSync('music-receipt.html','utf8');
if(!rc.includes('src="/receipt-print.js"'))rc=rc.replace('<script src="/music-receipt.js">','<script src="/receipt-print.js" defer></script><script src="/music-receipt.js">');
fs.writeFileSync('music-receipt.html',rc);
