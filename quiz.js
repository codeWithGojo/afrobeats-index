(() => {
  'use strict';
  const app = document.getElementById('quiz-app');
  const params = new URLSearchParams(location.search);
  const parts = location.pathname.split('/').filter(Boolean);
  const slug = parts[0] === 'quiz' && parts[1] ? parts[1] : params.get('artist');
  const html = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[char]));
  const labels = { 'song-album':'Songs & releases', collaboration:'Collaborations', artwork:'Cover art', tracklist:'Tracklists', 'release-year':'Release history', 'release-order':'Earlier or later', 'release-size':'Albums & EPs', 'track-position':'Track positions', awards:'Awards', performance:'On stage', breakout:'Breakout moments' };
  const levels = { casual:'Casual', fan:'Fan', superfan:'Superfan' };
  const state = { bank:null, session:[], answers:[], index:0, seed:'', level:'fan', locked:false, timer:null, deadline:0, imageRequest:0 };
  const freshSeed = () => Array.from(crypto.getRandomValues(new Uint32Array(2)), (value) => value.toString(36)).join('');
  const portrait = (artist) => artist.image ? `<img class="artist-photo" src="/${html(artist.image.replace(/^\//,''))}" alt="Portrait of ${html(artist.name)}">` : `<span class="artist-initial" aria-hidden="true">${html(artist.name.slice(0,1))}</span>`;
  const date = (value) => Number.isFinite(Date.parse(value)) ? new Intl.DateTimeFormat('en-GB',{dateStyle:'medium'}).format(new Date(value)) : 'date not recorded';
  function focusHeading() { const heading=app.querySelector('h1'); if(heading){heading.tabIndex=-1;heading.focus({preventScroll:true});} }
  async function fetchData(url) {
    const response = await fetch(url, { signal:AbortSignal.timeout(15000) });
    const payload = await response.json();
    if (!response.ok) { const error=new Error(payload.error || 'The quiz is temporarily unavailable.');error.code=payload.code;throw error; }
    return payload;
  }
  async function directory() {
    document.title='Fan quizzes · Afri Index';
    try {
      const data=await fetchData('/api/quiz');
      const list = ['current','alltime'].includes(params.get('list')) ? params.get('list') : 'all';
      app.innerHTML=`<p class="eyebrow">AFRI INDEX · FAN FILES</p><h1>Know the music.<br>Prove it.</h1><p class="muted">Pick an artist, play ten questions and challenge a friend. The question banks use catalogue records and researched career milestones, with a source behind every answer.</p><div class="directory-controls"><label for="quiz-search">Find your artist<input id="quiz-search" type="search" placeholder="Omah Lay, Fela Kuti, Tems…" autocomplete="off"></label><label for="quiz-list">Artist list<select id="quiz-list"><option value="all">Both lists</option><option value="current">Current 50</option><option value="alltime">All-Time 50</option></select></label></div><p id="directory-count" class="source-note" role="status"></p><div id="quiz-artists" class="quiz-artist-grid"></div>`;
      const search=document.getElementById('quiz-search'),select=document.getElementById('quiz-list');select.value=list;
      function render(){
        const filtered=data.artists.filter((artist)=>artist.name.toLowerCase().includes(search.value.trim().toLowerCase())&&(select.value==='all'||artist.lists.includes(select.value)));
        document.getElementById('directory-count').textContent=`${filtered.length} artists · ${filtered.filter((artist)=>artist.questionCount>=10).length} playable banks`;
        document.getElementById('quiz-artists').innerHTML=filtered.map((artist)=>`<a class="quiz-artist-card" href="/quiz/${html(artist.slug)}">${portrait(artist)}<span><strong>${html(artist.name)}</strong><small>${artist.questionCount} sourced questions</small></span><span aria-hidden="true">↗</span></a>`).join('') || '<p class="muted">No artist matches that search.</p>';
      }
      search.addEventListener('input',render);select.addEventListener('change',render);render();
    }catch(error){renderError(error);}
  }
  function renderStart() {
    clearArtworkTimer();state.imageRequest+=1;
    const bank=state.bank,artist=bank.artist;
    document.title=`${artist.name} Fan Quiz · Afri Index`;
    const challenge = params.has('round');
    const target = Number(params.get('beat'));
    const challengeText = challenge ? `You’ve been challenged${Number.isFinite(target)&&target>=0&&target<=100 ? ` to beat ${target}%` : ''}. This link uses the same questions as your friend’s round.` : 'Songs, covers and career moments. How much do you remember?';
    app.innerHTML=`<a class="back-link" href="/quiz">← All artist quizzes</a><p class="eyebrow">AFRI INDEX · FAN QUIZ</p><h1>How well do you know ${html(artist.name)}?</h1><div class="artist-line">${portrait(artist)}<div><strong>${html(artist.name)}</strong><div class="rank-tag">${artist.lists.map((list)=>list==='current'?'CURRENT 50':'ALL-TIME 50').join(' · ')}</div></div></div><section class="panel quiz-start"><p class="muted">${html(challengeText)}</p><div class="quiz-facts"><span><strong>10</strong> questions per round</span><span><strong>${bank.questionCount}</strong> in the bank</span></div><p class="source-note">${Object.keys(bank.categoryCounts).map((category)=>labels[category]).join(' · ')}</p>${challenge ? `<button class="primary" id="play-challenge">Play this ${html(levels[params.get('level')]||'Fan')} challenge →</button><a class="secondary" href="/quiz/${html(artist.slug)}">Start my own round</a>` : `<p class="muted">Choose your level:</p><div class="quiz-actions">${Object.entries(levels).map(([level,label])=>`<button class="${level==='fan'?'primary':'secondary'}" data-level="${level}">${label}</button>`).join('')}</div>`}</section><p class="source-note">Cover rounds show a cropped, pixelated clue with 20 seconds to answer. The clock starts when the clue is ready. Dates refer to the recording or edition named in each question. Reissues can carry a different date from the first release. Catalogue checked ${html(date(bank.checkedAt))}.${bank.careerCheckedAt?` Career sources checked ${html(date(bank.careerCheckedAt))}.`:``}</p>`;
    if(challenge) document.getElementById('play-challenge').addEventListener('click',()=>start(levels[params.get('level')]?params.get('level'):'fan',params.get('round')));
    else app.querySelectorAll('[data-level]').forEach((button)=>button.addEventListener('click',()=>start(button.dataset.level)));
  }
  function start(level,seed) {
    state.level=level;state.seed=seed&&/^[a-z0-9]{1,64}$/i.test(seed)?seed:freshSeed();
    state.session=window.AfriQuizSession.selectSession(state.bank.questions,level,state.seed,10);
    state.answers=[];state.index=0;state.locked=false;renderQuestion();
  }
  function renderQuestion() {
    clearArtworkTimer();state.imageRequest+=1;
    const question=state.session[state.index];
    const correct=state.answers.filter((answer)=>answer.correct).length;
    app.innerHTML=`<p class="eyebrow">${html(state.bank.artist.name)} · ${html(levels[state.level])}</p><div class="progress-row"><span>Question ${state.index+1} of ${state.session.length}</span><span>${correct} correct</span></div><progress class="quiz-progress" value="${state.index}" max="${state.session.length}" aria-label="Quiz progress"></progress><section class="panel question-panel"><p class="question-count">${html(labels[question.category])}</p><h1 class="question-heading">${html(question.prompt)}</h1>${question.image?`<div class="quiz-artwork-wrap"><canvas class="quiz-artwork" width="14" height="14" role="img" aria-label="Cropped, pixelated cover detail to identify" hidden></canvas><p class="artwork-loading" role="status">Loading your cover clue…</p><p class="artwork-note" hidden>Artwork could not load. You can skip this question.</p><div class="artwork-clock" hidden><span>Cover clue · cropped & pixelated</span><strong id="artwork-time" role="timer" aria-label="Seconds remaining">20s</strong></div><progress class="artwork-progress" value="20" max="20" aria-label="Cover time remaining" hidden></progress></div>`:''}<div class="choices" role="group" aria-label="Choose an answer">${question.options.map((option,index)=>`<button class="choice" data-option="${index}"><span class="option-letter" aria-hidden="true">${'ABCD'[index]}</span><span>${html(option)}</span></button>`).join('')}</div><div class="feedback" role="status" aria-live="polite"></div><div class="quiz-actions"><button class="primary" id="next-question" disabled>${state.index===state.session.length-1?'See my score':'Next question'} →</button>${question.image?'<button class="secondary" id="skip-artwork" hidden>Skip unavailable artwork</button>':''}<button class="secondary" id="quit-quiz">Leave round</button></div></section>`;
    app.querySelectorAll('[data-option]').forEach((button)=>button.addEventListener('click',()=>answer(Number(button.dataset.option))));
    document.getElementById('next-question').addEventListener('click',nextQuestion);
    document.getElementById('quit-quiz').addEventListener('click',renderStart);
    if(question.image){
      app.querySelectorAll('[data-option]').forEach((button)=>button.disabled=true);
      loadArtworkClue(question);
      document.getElementById('skip-artwork').addEventListener('click',()=>{if(!state.locked){clearArtworkTimer();state.imageRequest+=1;state.answers.push({correct:false,choice:null,skipped:true});state.locked=true;nextQuestion();}});
    }
    focusHeading();
  }
  function clearArtworkTimer(){clearInterval(state.timer);state.timer=null;state.deadline=0;}
  function tickArtwork(){
    if(!state.deadline||state.locked)return;
    const remaining=window.AfriQuizSession.secondsRemaining(state.deadline,Date.now());
    const label=document.getElementById('artwork-time'),bar=app.querySelector('.artwork-progress');
    if(label)label.textContent=remaining+'s';if(bar)bar.value=remaining;
    if(remaining===0)answer(null);
  }
  document.addEventListener('visibilitychange',tickArtwork);
  function loadArtworkClue(question){
    const request=state.imageRequest,image=new Image();
    let settled=false;
    const unavailable=()=>{
      if(settled||request!==state.imageRequest)return;settled=true;clearTimeout(timeout);clearArtworkTimer();
      app.querySelector('.artwork-loading').hidden=true;app.querySelector('.artwork-note').hidden=false;
      document.getElementById('skip-artwork').hidden=false;
    };
    const timeout=setTimeout(unavailable,15000);
    image.onerror=unavailable;
    image.onload=()=>{
      if(settled||request!==state.imageRequest)return;
      try{
        const canvas=app.querySelector('.quiz-artwork'),ctx=canvas.getContext('2d');
        if(!ctx||!image.naturalWidth)throw Error('Artwork unavailable');
        const crop=window.AfriQuizSession.artworkCrop(image.naturalWidth,image.naturalHeight,question.id);
        ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
        ctx.drawImage(image,crop.x,crop.y,crop.size,crop.size,0,0,14,14);
        settled=true;clearTimeout(timeout);canvas.hidden=false;app.querySelector('.artwork-loading').hidden=true;
        app.querySelector('.artwork-clock').hidden=false;app.querySelector('.artwork-progress').hidden=false;
        app.querySelectorAll('[data-option]').forEach((button)=>button.disabled=false);
        state.deadline=Date.now()+20000;state.timer=setInterval(tickArtwork,200);tickArtwork();
      }catch{unavailable();}
    };
    image.src=question.image.url;
  }
  function answer(choice) {
    if(state.locked)return;
    if(choice!==null&&state.deadline&&Date.now()>=state.deadline){answer(null);return;}
    clearArtworkTimer();state.locked=true;
    const question=state.session[state.index],correct=choice===question.answerIndex;
    state.answers.push({choice,correct,skipped:false,timedOut:choice===null});
    app.querySelectorAll('[data-option]').forEach((button,index)=>{button.disabled=true;if(index===question.answerIndex)button.classList.add('is-correct');else if(index===choice)button.classList.add('is-wrong');});
    app.querySelector('.feedback').innerHTML=`<strong>${correct?'Correct.':(choice===null?'Time’s up. The answer is ':'The answer is ')+html(question.options[question.answerIndex])+'.'}</strong><p>${html(question.explanation)}</p><div class="source-links">${question.sources.map((source,index)=>`<a href="${html(source.url)}" target="_blank" rel="noopener noreferrer">${question.sources.length>1?'Source '+(index+1):'Check the source'} ↗</a>`).join('')}</div>`;
    document.getElementById('next-question').disabled=false;
    const skip=document.getElementById('skip-artwork');if(skip)skip.hidden=true;
  }
  function nextQuestion(){if(!state.locked)return;clearArtworkTimer();if(state.index+1<state.session.length){state.index+=1;state.locked=false;renderQuestion();}else renderResult();}
  function results() { const played=state.answers.filter((answer)=>!answer.skipped),correct=played.filter((answer)=>answer.correct).length;return {correct,total:played.length,percent:played.length?Math.round(correct/played.length*100):0,skipped:state.answers.filter((answer)=>answer.skipped).length}; }
  function challengeUrl(percent){const query=new URLSearchParams({round:state.seed,level:state.level,v:state.bank.version,beat:String(percent)});return `${location.origin}/quiz/${encodeURIComponent(state.bank.artist.slug)}?${query}`;}
  function renderResult() {
    clearArtworkTimer();state.imageRequest+=1;
    const score=results(),artist=state.bank.artist;
    const badge=score.percent>=90?'SUPERFAN':score.percent>=70?'DEEP CUT DETECTOR':score.percent>=40?'ON THE RISE':'KEEP DISCOVERING';
    app.innerHTML=`<p class="eyebrow">AFRI INDEX · FAN QUIZ</p><h1>Your fan file.</h1><div class="score-card"><div class="score-card-head"><small>${html(artist.name.toUpperCase())}</small>${artist.image?portrait(artist):''}</div><div class="score">${score.percent}<span>%</span></div><strong>Can you beat that?</strong><small>AFR / INDEX · ${html(badge)}</small></div><div class="score-summary"><div><strong>${score.correct}/${score.total}</strong><span>Correct answers</span></div><div><strong>${html(levels[state.level])}</strong><span>Difficulty</span></div><div><strong>${html(badge)}</strong><span>Fan status</span></div></div>${score.skipped?`<p class="source-note">${score.skipped} unavailable artwork question${score.skipped===1?' was':'s were'} skipped and excluded from your score.</p>`:''}<div class="quiz-actions"><button class="primary" id="share-score">Challenge a friend ↗</button><button class="secondary" id="download-score">Save score card</button><button class="secondary" id="play-again">Play again</button><a class="secondary" href="/quiz">Try another artist</a></div><p id="share-status" class="source-note" role="status"></p><details class="answer-review"><summary>Review your answers and sources</summary>${state.session.map((question,index)=>`<article><span class="question-count">${index+1} · ${html(labels[question.category])}</span><h2>${html(question.prompt)}</h2><p><strong>${html(question.options[question.answerIndex])}</strong> · ${state.answers[index]?.skipped?'Skipped':state.answers[index]?.timedOut?'Time ran out':state.answers[index]?.correct?'You got it':'Missed this one'}</p><p class="muted">${html(question.explanation)}</p><div class="source-links">${question.sources.map((source,i)=>`<a href="${html(source.url)}" target="_blank" rel="noopener noreferrer">${question.sources.length>1?'Source '+(i+1):'Source'} ↗</a>`).join('')}</div></article>`).join('')}</details>`;
    document.getElementById('play-again').addEventListener('click',()=>{history.replaceState({},'',`/quiz/${encodeURIComponent(artist.slug)}`);params.delete('round');renderStart();});
    document.getElementById('download-score').addEventListener('click',async()=>{try{const file=await scoreImage(score.percent,badge);const url=URL.createObjectURL(file),anchor=document.createElement('a');anchor.href=url;anchor.download=file.name;anchor.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}catch{document.getElementById('share-status').textContent='The card could not be saved. You can still share your challenge link.';}});
    document.getElementById('share-score').addEventListener('click',async()=>{
      const text=`I scored ${score.percent}% on the ${artist.name} Afri Index quiz. Can you beat that?`,url=challengeUrl(score.percent),status=document.getElementById('share-status');
      try{
        if(navigator.share){let payload={title:`${artist.name} Fan Quiz`,text,url};try{const file=await scoreImage(score.percent,badge);if(navigator.canShare?.({files:[file]}))payload.files=[file];}catch{}await navigator.share(payload);}
        else if(navigator.clipboard){await navigator.clipboard.writeText(`${text} ${url}`);status.textContent='Challenge link copied. Your friend will get the same questions.';}
        else{status.textContent=`Your challenge link: ${url}`;}
      }catch(error){if(error.name!=='AbortError')status.textContent=`Share this challenge link: ${url}`;}
    });focusHeading();
  }
  function loadImage(url){return new Promise((resolve)=>{const image=new Image(),timeout=setTimeout(()=>resolve(null),8000);image.onload=()=>{clearTimeout(timeout);resolve(image);};image.onerror=()=>{clearTimeout(timeout);resolve(null);};image.src=url;});}
  async function scoreImage(percent,badge){
    const canvas=document.createElement('canvas');canvas.width=1080;canvas.height=1080;const ctx=canvas.getContext('2d');
    const gradient=ctx.createLinearGradient(0,0,1080,1080);gradient.addColorStop(0,'#271844');gradient.addColorStop(.7,'#0b0911');ctx.fillStyle=gradient;ctx.fillRect(0,0,1080,1080);
    ctx.fillStyle='#d4ff00';ctx.fillRect(70,70,10,940);ctx.fillStyle='#e9e4f1';ctx.font='700 28px Arial';ctx.fillText('AFR / INDEX  ·  FAN QUIZ',120,145);
    ctx.font='bold 44px Arial';ctx.fillText(state.bank.artist.name,120,235,650);
    if(state.bank.artist.image){const photo=await loadImage('/'+state.bank.artist.image.replace(/^\//,''));if(photo){ctx.save();ctx.beginPath();ctx.roundRect(750,180,230,230,30);ctx.clip();const side=Math.min(photo.naturalWidth,photo.naturalHeight);ctx.drawImage(photo,(photo.naturalWidth-side)/2,(photo.naturalHeight-side)/2,side,side,750,180,230,230);ctx.restore();}}
    ctx.fillStyle='#c9bcff';ctx.font='900 230px Arial';ctx.fillText(percent+'%',110,580,850);ctx.fillStyle='#f3f0e8';ctx.font='bold 56px Arial';ctx.fillText('CAN YOU BEAT THAT?',120,740,850);ctx.fillStyle='#d4ff00';ctx.font='bold 32px Arial';ctx.fillText(badge+' · '+levels[state.level].toUpperCase(),120,830,850);ctx.fillStyle='#b7b0c6';ctx.font='28px Arial';ctx.fillText('AFROBEATS-INDEX.VERCEL.APP',120,980);
    const blob=await new Promise((resolve)=>canvas.toBlob(resolve,'image/png'));if(!blob)throw new Error('No card');return new File([blob],`afri-index-${state.bank.artist.slug}-score.png`,{type:'image/png'});
  }
  function renderError(error){app.innerHTML=`<p class="eyebrow">AFRI INDEX · FAN QUIZ</p><section class="panel error"><h1>${error.code==='BANK_VERSION_CHANGED'?'Start a fresh challenge':'Couldn’t open the quiz'}</h1><p class="muted">${html(error.message)}</p><div class="quiz-actions"><a class="primary" href="${slug?'/quiz/'+encodeURIComponent(slug):'/quiz'}">Try again</a><a class="secondary" href="/quiz">Choose another artist</a></div></section>`;}
  async function init(){if(!slug){await directory();return;}if(!/^[a-z0-9-]{1,80}$/.test(slug)){renderError(new Error('That artist link is invalid.'));return;}try{const version=params.get('v');state.bank=await fetchData(`/api/quiz?artist=${encodeURIComponent(slug)}${version?'&version='+encodeURIComponent(version):''}`);renderStart();}catch(error){renderError(error);}}
  init();
})();
