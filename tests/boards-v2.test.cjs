const test=require('node:test'),assert=require('node:assert/strict');
const B=require('../boards-model.js');
const current=require('../data/current.json'),boards=require('../data/boards.json');

test('Heat 25 ranks only by momentum and skips artists without a baseline or a fresh reading',()=>{
 const mk=(slug,ratio,{available=true,staleDays=0,daily=1000,rank=1}={})=>({slug,name:slug,rank,scoreBreakdown:{momentum:{available,ratio,thisWeek:daily,baseline:daily/ratio},components:{momentum:50},recentStreams:{staleDays,dailyAverage:daily,to:'2026-11-21'}}});
 const rows=B.heat([mk('legend',.9,{rank:1,daily:9e6}),mk('riser',1.8,{rank:40,daily:2e5}),mk('nobase',3,{available:false}),mk('stale',2.5,{staleDays:30})],{previous:['legend']});
 assert.deepEqual(rows.map(r=>r.slug),['riser','legend']);
 assert.equal(rows[0].previousHeatRank,null);assert.equal(rows[1].previousHeatRank,1);
});

test('completeness lists every missing requirement for a new artist',()=>{
 const blank=B.completeness({streams:{daily:5,url:'https://kworb.net/x',source_date:'2026-11-20'},countryCodes:['ZA']});
 assert.deepEqual(blank.missing,['photo (webp)','bio','editorial score','review date']);assert.equal(blank.reviewed,false);
 const full=B.completeness({image:'/artists/x.webp',countryCodes:['NG'],streams:{daily:5,url:'https://kworb.net/x',source_date:'2026-11-20'},bio:'Text',bioSource:'https://example.org',editorialScore:70,reviewedAt:'2026-11-20'},{hasFile:()=>true});
 assert.equal(full.complete,true);
});

test('the extension holds stale or excluded candidates and never ranks above 51',()=>{
 const asOf='2026-11-28';
 const c=(slug,daily,date)=>({slug,name:slug,spotifyId:slug.padEnd(22,'x'),countryCodes:['NG'],country:'Nigeria',streams:{daily,url:'https://kworb.net/'+slug,source_date:date}});
 const history=[{capturedAt:asOf,artists:{a:{dailySpotifyStreams:5e5,sourceDate:'2026-11-26'},b:{dailySpotifyStreams:2e5,sourceDate:'2026-11-25'}}}];
 const res=B.extension({candidates:[c('a',5e5,'2026-11-26'),c('b',2e5,'2026-11-25'),c('old',9e5,'2026-06-01'),c('gone',9e5,'2026-11-25')],excluded:[{spotifyId:'gone'.padEnd(22,'x')}],current:current.artists,history,ctx:{},asOf,previous:[]});
 assert.deepEqual(res.rows.map(r=>[r.slug,r.rank]),[['a',51],['b',52]]);
 assert.deepEqual(res.held.map(h=>h.slug).sort(),['gone','old']);
 assert.ok(res.rows.every(r=>r.provisional&&r.missing.includes('editorial score')));
});

test('the 50 line only proposes reviewed artists and never edits the Current 50',()=>{
 const before=JSON.stringify(current.artists.map(a=>[a.slug,a.rank]));
 const line=B.lineWatch(current.artists,[{slug:'x',name:'X',rank:51,officialFormulaScore:99,provisional:true},{slug:'y',name:'Y',rank:52,officialFormulaScore:98,provisional:false}]);
 assert.deepEqual(line.needsReview,['x']);assert.deepEqual(line.proposals.map(p=>p.promote),['y']);
 assert.equal(line.relegation.length,5);assert.equal(line.relegation.at(-1).rank,50);
 assert.equal(JSON.stringify(current.artists.map(a=>[a.slug,a.rank])),before);
});

test('published boards are consistent with the published Current 50',()=>{
 const slugs=new Set(current.artists.map(a=>a.slug));
 assert.ok(boards.heat.rows.length<=25&&boards.heat.rows.every(h=>slugs.has(h.slug)));
 for(let i=1;i<boards.heat.rows.length;i++)assert.ok(boards.heat.rows[i-1].ratio>=boards.heat.rows[i].ratio);
 assert.ok(boards.extension.rows.every((r,i)=>r.rank===51+i&&!slugs.has(r.slug)&&r.streamsSource.startsWith('https://')));
 assert.equal(boards.extension.rows.length+boards.extension.openPlaces,50);
});
