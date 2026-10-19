const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
test('2026 renderer waits for audited payload and shows sourced finite totals on initial load and year changes',()=>{
 const nodes=new Map(),listeners=new Map();
 const node=id=>{if(!nodes.has(id))nodes.set(id,{innerHTML:'',textContent:'',addEventListener(type,fn){this[type]=fn;}});return nodes.get(id);};
 const document={readyState:'loading',getElementById:node,querySelector:()=>null,querySelectorAll:()=>[],addEventListener(type,fn){listeners.set(type,fn);}};
 const context={window:{},document,Intl,Date};vm.createContext(context);
 vm.runInContext(fs.readFileSync('assets/inline-09.js','utf8'),context);
 assert.equal(nodes.size,0,'old hardcoded rows must not render before the audited payload');
 vm.runInContext(fs.readFileSync('release-audit-2026.js','utf8'),context);
 listeners.get('DOMContentLoaded')();
 const audit=context.window.AFRI_RELEASE_AUDIT;
 const albums=node('yearly-albums-list'),songs=node('yearly-songs-list'),select=node('yearly-year-select');
 const fmt=new Intl.NumberFormat('en',{notation:'compact',maximumFractionDigits:1});
 for(const [items,output,title] of [[audit.albums,albums,'album_title'],[audit.songs,songs,'song_title']]){
  assert(!output.innerHTML.includes('NaN'));
  assert(output.innerHTML.includes(fmt.format(items[0].total_streams)));
  assert(output.innerHTML.includes('Lifetime Spotify total'));
  assert(output.innerHTML.includes('kworb.net'));
  assert(output.innerHTML.includes('Release record'));
  assert(output.innerHTML.indexOf(items[0][title])>=0);
 }
 assert(albums.innerHTML.includes('Shoday'));
 assert(!albums.innerHTML.includes('FOLA, Shoday &amp; guests'));
 select.change({target:{value:'2025'}});assert(!songs.innerHTML.includes('NaN'));
 select.change({target:{value:'2026'}});assert(!albums.innerHTML.includes('NaN'));
 assert(albums.innerHTML.includes(fmt.format(audit.albums[0].total_streams)));
});
test('external release links do not open the artist dialog',()=>{
 const source=fs.readFileSync('assets/inline-09.js','utf8');
 assert(source.includes('if (!event.target.closest("a,button"))'));
});
