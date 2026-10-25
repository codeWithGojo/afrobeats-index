const fs = require('node:fs');
const {shellHeader,bottomNav,headLinks} = require('../lib/ui-shell.cjs');
for(const file of ['index.html','underground.html','newsletter.html','quiz.html','offline.html']) {
  let html=fs.readFileSync(file,'utf8');
  html=html.replaceAll('main > section:first-child','main > section[data-legacy-hero]');
  html=html.replace(/<link[^>]+href="https:\/\/fonts\.googleapis[^"]*"[^>]*>/g,'');
  html=html.replace(/<link[^>]+href="(?:\/)?(?:glass-theme|ui-refresh|uk-editorial)\.css"[^>]*>/g,'');
  html=html.replace(/<script[^>]+src="\/motion\.js"[^>]*><\/script>/g,'');
  html=html.replace(/<body([^>]*)>/,(_,attrs)=>'<body'+attrs.replace(/\sdata-design="[^"]*"/g,'')+' data-design="premium">');
  if(file==='index.html'){
    const start=html.indexOf('<div class="masthead-kicker');
    if(start>=0){const end=html.indexOf('<a class="afri-skip"',start);if(end<0)throw Error('Missing main navigation boundary');html=html.slice(0,start)+shellHeader({home:true})+'\n\n  '+html.slice(end);}
    else html=html.replace(/<header class="app-topbar"[\s\S]*?<\/header>/,shellHeader({home:true}));
  }else if(['underground.html','newsletter.html'].includes(file)){
    html=html.replace(/<header class="discovery-site-nav"[\s\S]*?<\/header>/,shellHeader());
    html=html.replace(/<header class="app-topbar"[\s\S]*?<\/header>/,shellHeader());
  }
  html=html.replace(/<nav class="app-bottom-nav"[\s\S]*?<\/nav>/g,'');
  html=html.replace('</body>',bottomNav({home:file==='index.html'})+'\n</body>');
  html=html.replace(/<img\b[^>]*>/g,tag=>{
    if(!/\bloading=|fetchpriority=/.test(tag))tag=tag.replace('<img','<img loading="lazy"');
    if(!/\bdecoding=/.test(tag))tag=tag.replace('<img','<img decoding="async"');
    if(!/\bwidth=/.test(tag))tag=tag.replace('<img','<img width="400" height="400"');
    return tag;
  });
  if(!html.includes('href="/premium.css"'))html=html.replace('</head>',headLinks()+'\n</head>');
  fs.writeFileSync(file,html);
}
console.log('Rendered the shared premium navigation and visual layer');
