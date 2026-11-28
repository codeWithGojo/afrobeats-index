// WCAG 2.x relative luminance and contrast ratio. Shared by the image pipeline and the contrast tests.
const channel=v=>{v/=255;return v<=.03928?v/12.92:((v+.055)/1.055)**2.4;};
function parse(c){const m=String(c).trim().replace('#','');const full=m.length===3?m.split('').map(x=>x+x).join(''):m;if(!/^[0-9a-f]{6}$/i.test(full))throw Error('Bad colour '+c);return [0,2,4].map(i=>parseInt(full.slice(i,i+2),16));}
function luminance(c){const [r,g,b]=parse(c).map(channel);return .2126*r+.7152*g+.0722*b;}
function contrast(a,b){const [x,y]=[luminance(a),luminance(b)].sort((p,q)=>q-p);return (x+.05)/(y+.05);}
const hex=rgb=>'#'+rgb.map(v=>Math.max(0,Math.min(255,v)).toString(16).padStart(2,'0')).join('');
module.exports={parse,luminance,contrast,hex};
