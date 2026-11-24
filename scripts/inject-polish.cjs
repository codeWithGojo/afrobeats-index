// Runs last in the build: every rendered page loads the shared polish stylesheet after its own styles.
const fs=require('node:fs'),path=require('node:path');
const link='<link rel="stylesheet" href="/site-polish.css">';
const pages=[...fs.readdirSync('.').filter(name=>name.endsWith('.html')),...(fs.existsSync('touring')?fs.readdirSync('touring').filter(name=>name.endsWith('.html')).map(name=>path.join('touring',name)):[])];
let count=0;
for(const file of pages){
  const html=fs.readFileSync(file,'utf8');
  if(html.includes(link)||!html.includes('</head>'))continue;
  fs.writeFileSync(file,html.replace('</head>',link+'</head>'));count++;
}
console.log(`Linked site polish on ${count} pages.`);
