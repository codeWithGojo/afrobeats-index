const test=require('node:test');
const assert=require('node:assert/strict');
const page=require('../api/quiz-page.js');
function render(artist){let html='',status=200;const headers={};const res={setHeader:(k,v)=>headers[k]=v,status:n=>(status=n,res),send:s=>html=s};page({query:artist?{artist}:{}},res);return{html,status,headers};}
test('quiz share URLs return artist-specific metadata before JavaScript runs',()=>{
 const directory=render(),artist=render('wizkid');
 assert.equal(artist.status,200);assert.match(artist.html,/<title>Wizkid Fan Quiz/);
 assert.match(artist.html,/<link rel="canonical" href="https:\/\/afrobeats-index.vercel.app\/quiz\/wizkid">/);
 assert.match(artist.html,/<meta property="og:description"/);
 assert.match(artist.html,/<h1>How well do you know Wizkid\?<\/h1>/);
 assert.match(directory.html,/<title>Fan quizzes/);assert.match(directory.html,/href="https:\/\/afrobeats-index.vercel.app\/quiz"/);
 assert.ok(!directory.html.includes('artist=wizkid'));
});
test('unknown or malformed artist URLs do not publish a valid quiz page',()=>{
 assert.equal(render('not-an-artist').status,404);assert.equal(render('<script>').status,404);
});
