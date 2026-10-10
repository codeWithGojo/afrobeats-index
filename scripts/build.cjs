const {execFileSync}=require('node:child_process');
const path=require('node:path');
execFileSync(process.execPath,[path.join(path.dirname(require.resolve('tailwindcss/package.json')),'lib/cli.js'),'-i','styles/tailwind.css','-o','assets/tailwind.css','--minify'],{stdio:'inherit'});
const {buildSync}=require('esbuild');
require('./export-data.cjs');
buildSync({entryPoints:['account-client.js'],bundle:true,format:'esm',target:'es2022',outfile:'assets/account.js',minify:true});

buildSync({entryPoints:['scripts/scenario-client.js'],bundle:true,format:'iife',outfile:'assets/board-engine.js',minify:true});
