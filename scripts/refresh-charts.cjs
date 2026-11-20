const {execFileSync}=require('node:child_process');
const fs=require('node:fs');
const python=process.env.PYTHON||(process.platform==='win32'?'python':'python3');
execFileSync(python,['scripts/research/refresh-turntable.py'],{stdio:'inherit',env:{...process.env,PYTHONUTF8:'1'}});
const edition=require('../data/edition.json');
for(const [key,file] of [['turntableSongs','nigeria-top100'],['turntableAlbums','nigeria-albums-top100']]){
  const {checkedAt,weekStart,weekEnd}=require('../data/'+file+'.json');
  Object.assign(edition.datasets[key],{checkedAt,weekStart,weekEnd});
}
fs.writeFileSync('data/edition.json',JSON.stringify(edition,null,2)+'\n');
execFileSync(process.execPath,['scripts/build.cjs'],{stdio:'inherit'});

