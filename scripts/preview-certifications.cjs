// Local QA fixture only. Uses the production renderer and unchanged source records.
const fs=require('fs'),c=require('../certifications.js'),d=require('../data/current.json'),p=require('../artist-presentation.js');
const {headLinks,shellHeader,bottomNav}=require('../lib/ui-shell.cjs');
const rows=Object.entries(d.certifications).flatMap(([slug,records])=>records.map(r=>({...r,slug})));
const examples=['diamond','multi','platinum','gold'].map(t=>c.order(rows).find(r=>c.tier(r)===t));
const body=`<h1>Certified records</h1><p>Published certification records · unchanged source ledger</p><div class="certification-list">${examples.map(r=>c.card(r,{artistName:d.artists.find(a=>a.slug===r.slug)?.name||r.slug})).join('')}</div>`;
fs.writeFileSync('preview-dist/certifications-qa.html',`<!doctype html><html lang="en"><head><meta name="viewport" content="width=device-width">${headLinks()}</head><body data-design="premium">${shellHeader()}<main id="studio" style="max-width:1000px;margin:40px auto;padding:16px">${body}</main>${bottomNav()}</body></html>`);
