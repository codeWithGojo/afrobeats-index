const {buildSync}=require('esbuild');
require('./export-data.cjs');
buildSync({entryPoints:['account-client.js'],bundle:true,format:'esm',target:'es2022',outfile:'assets/account.js',minify:true});

buildSync({entryPoints:['scripts/scenario-client.js'],bundle:true,format:'iife',outfile:'assets/board-engine.js',minify:true});
