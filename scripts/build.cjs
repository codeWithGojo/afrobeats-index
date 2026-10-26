const fs=require('node:fs');
fs.copyFileSync('templates/app.html','index.html');
require('./sync-editorial.cjs');
require('./sync-release-audit.cjs');
const {execFileSync}=require('node:child_process');
const path=require('node:path');
execFileSync(process.execPath,[path.join(path.dirname(require.resolve('tailwindcss/package.json')),'lib/cli.js'),'-i','styles/tailwind.css','-o','assets/tailwind.css','--minify'],{stdio:'inherit'});
const {buildSync}=require('esbuild');
require('./sync-streaming.cjs');
require('./export-data.cjs');
require('./render-current.cjs');
require('./render-discovery.cjs');
require('./render-premium.cjs');
require('./render-reader.cjs');
require('./render-trust.cjs');
require('./render-routes.cjs');
buildSync({entryPoints:['account-client.js'],bundle:true,format:'esm',target:'es2022',outfile:'assets/account.js',minify:true});

buildSync({entryPoints:['scripts/scenario-client.js'],bundle:true,format:'iife',outfile:'assets/board-engine.js',minify:true});

// Shared typed Motion components are bundled for the existing vanilla pages.
buildSync({entryPoints:["src/motion/index.tsx"],bundle:true,format:"iife",target:"es2022",outfile:"assets/motion.js",minify:true,jsx:"automatic"});

// Focused Motion layer for liquid-glass feedback and ranking layout transitions.
buildSync({entryPoints:["src/motion/Glass.tsx"],bundle:true,format:"iife",target:"es2022",outfile:"assets/glass-motion.js",minify:true,jsx:"automatic"});
