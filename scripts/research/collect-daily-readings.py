"""Nightly readings (Phase 11): one Kworb Spotify reading per artist per night into data/stream-history.json.

Covers the Current 50 and the Current 100 candidates. Each reading keeps the publisher date, so a page
Kworb did not update is recorded once (stream-history de-duplicates repeated readings). The official
Current 50 is still published weekly; these readings give momentum a real 4-week daily baseline.
Run: python -I scripts/research/collect-daily-readings.py
"""
import datetime,json,os,pathlib,re,time,urllib.request
# AFRI_ROOT lets the script run from a short path (Windows path-length limits); CI uses the default.
ROOT=pathlib.Path(os.environ.get('AFRI_ROOT') or pathlib.Path(__file__).resolve().parents[2]);D=ROOT/'data'
NOW=datetime.datetime.now(datetime.timezone.utc).replace(microsecond=0).isoformat()
UA={'User-Agent':'AfriIndex source audit/1.0'}
KEEP=90  # snapshots kept (about three months of nightly readings)

def summary(sid):
 url=f'https://kworb.net/spotify/artist/{sid}_songs.html'
 with urllib.request.urlopen(urllib.request.Request(url,headers=UA),timeout=40) as r:raw=r.read().decode()
 m=re.search(r'Last updated:\s*(\d{4}/\d{2}/\d{2})',raw);out={'sourceDate':m[1].replace('/','-') if m else None}
 for label,field in [('Streams','totalSpotifyStreams'),('Daily','dailySpotifyStreams')]:
  x=re.search(r'<tr><td class="text">'+label+r'</td><td>([0-9,]+)',raw);out[field]=int(x[1].replace(',','')) if x else None
 return out

def main():
 current=json.loads((D/'current.json').read_text(encoding='utf8'))['artists']
 ext=json.loads((D/'current-extension.json').read_text(encoding='utf8')) if (D/'current-extension.json').exists() else {'candidates':[]}
 targets=[(a['slug'],a['spotifyId']) for a in current if a.get('spotifyId')]+[(c['slug'],c['spotifyId']) for c in ext.get('candidates',[]) if c.get('spotifyId')]
 reading={'capturedAt':NOW,'source':'nightly','artists':{}};failed=[]
 for slug,sid in targets:
  try:
   s=summary(sid)
   if s['dailySpotifyStreams'] is not None and s['sourceDate']:reading['artists'][slug]=s
   else:failed.append(slug)
  except Exception:failed.append(slug)
  time.sleep(.5)
 path=D/'stream-history.json';hist=json.loads(path.read_text(encoding='utf8'))
 if reading['artists']:
  hist['snapshots']=sorted([s for s in hist['snapshots'] if s['capturedAt']!=NOW]+[reading],key=lambda s:s['capturedAt'])[-KEEP:]
  path.write_text(json.dumps(hist),encoding='utf8')
 # Record the run for the data-health page.
 runs_path=D/'refresh-runs.json';runs=json.loads(runs_path.read_text(encoding='utf8')) if runs_path.exists() else {'runs':[]}
 runs['runs']=(runs['runs']+[{'job':'nightly-readings','at':NOW,'ok':len(reading['artists']),'failed':failed[:40]}])[-60:]
 runs_path.write_text(json.dumps(runs,indent=1),encoding='utf8')
 print(f"{len(reading['artists'])} readings, {len(failed)} failed")

if __name__=='__main__':main()
