const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const P=require('../afri-prefs.js');
test('preferences are capped at 3 artists and 3 genres and reject bad values',()=>{
 const p=P.clean({artists:['wizkid','rema','tems','asake','<x>'],genres:['Afrobeats','Amapiano','Alte','Highlife'],region:'Naija!',onboarding:'maybe'});
 assert.deepEqual(p.artists,['wizkid','rema','tems']);assert.equal(p.genres.length,3);assert.equal(p.region,null);assert.equal(p.onboarding,null);
});
test('the homepage has one personalisation slot, loads onboarding and keeps it skippable',()=>{
 const html=fs.readFileSync('index.html','utf8'),js=fs.readFileSync('onboarding.js','utf8');
 assert.equal(html.split('id="your-artists"').length-1,1);
 assert.ok(html.includes('src="/onboarding.js"')&&html.includes('data-onboarding-open'));
 assert.ok(!/showModal|aria-modal/.test(js),'the panel must not block browsing');
 assert.equal((js.match(/data-skip/g)||[]).length>=2,true);
 assert.ok(/onboarding_shown|onboarding_step|onboarding_skip|onboarding_complete/.test(js));
});
