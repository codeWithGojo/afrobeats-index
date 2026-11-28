/* Music Receipt: prints line by line with a tear-off edge. Optional printer sound, off by default. */
(function(){
 'use strict';
 const canvas=document.getElementById('music-receipt-canvas');if(!canvas)return;
 const KEY='afri_receipt_sound',reduced=matchMedia('(prefers-reduced-motion: reduce)');
 canvas.classList.add('receipt-tear');
 const toggle=document.createElement('label');toggle.className='receipt-sound';
 let on=false;try{on=localStorage.getItem(KEY)==='1';}catch{}
 toggle.innerHTML=`<input type="checkbox" ${on?'checked':''}><span>Printer sound</span>`;
 canvas.insertAdjacentElement('afterend',toggle);
 toggle.querySelector('input').addEventListener('change',ev=>{on=ev.target.checked;try{localStorage.setItem(KEY,on?'1':'0');}catch{}});
 let audio=null;
 function ticks(count,duration){
  if(!on)return;try{audio??=new (window.AudioContext||window.webkitAudioContext)();}catch{return;}
  const start=audio.currentTime+.02;
  for(let i=0;i<count;i++){const t=start+i*duration/count,o=audio.createOscillator(),g=audio.createGain();o.type='square';o.frequency.value=1800+Math.random()*400;g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(.05,t+.004);g.gain.exponentialRampToValueAtTime(.0001,t+.03);o.connect(g).connect(audio.destination);o.start(t);o.stop(t+.035);}
 }
 window.addEventListener('afri:receipt-printed',ev=>{
  const lines=Math.max(8,Math.min(30,(ev.detail?.lines||10)+8));
  ticks(lines,1.2);
  if(reduced.matches||document.documentElement.classList.contains('lite'))return;
  canvas.style.setProperty('--print-steps',String(lines));
  canvas.classList.remove('is-printing');void canvas.offsetWidth;canvas.classList.add('is-printing');
 });
})();
