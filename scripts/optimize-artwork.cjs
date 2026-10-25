// Presentation assets only. The source artist records and portraits stay intact.
const {execFileSync} = require('node:child_process');
execFileSync('python3',['-c',`
from pathlib import Path
from PIL import Image
for source in Path('artists').glob('*.jpg'):
    target=source.with_suffix('.webp')
    if target.exists() and target.stat().st_mtime >= source.stat().st_mtime: continue
    with Image.open(source) as image:
        image=image.convert('RGB')
        image.thumbnail((640,640),Image.Resampling.LANCZOS)
        image.save(target,'WEBP',quality=80,method=6)
`],{stdio:'inherit'});
