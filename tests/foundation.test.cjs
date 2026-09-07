const test=require('node:test'),assert=require('node:assert/strict');
const handler=require('../api/card');
const data=require('../data/current.json');
test('Ranking PNGs have exact Story and OG dimensions',()=>{for(const [format,w,h] of [['story',1080,1920],['og',1200,630]]){let bytes;const res={setHeader(){},end(b){bytes=b;},status(s){throw Error('HTTP '+s);}};handler({query:{artist:data.artists[0].slug,format}},res);assert(Buffer.isBuffer(bytes)||bytes instanceof Uint8Array);const b=Buffer.from(bytes);assert.equal(b.readUInt32BE(16),w);assert.equal(b.readUInt32BE(20),h);}});
test('Unrecognized artist cannot produce a misleading ranking card',()=>{let code;handler({query:{artist:'not-an-artist'}},{status(c){code=c;return this},end(){}});assert.equal(code,404);});
test('Shared configuration contains only a publishable key',()=>{const c=require('../community-config.json');assert(c.key&&c.url.endsWith('.supabase.co'));assert(c.key.startsWith('sb_publishable_')||JSON.parse(Buffer.from(c.key.split('.')[1],'base64')).role==='anon');});
