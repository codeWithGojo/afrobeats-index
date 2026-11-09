"""Refresh release dates from known Apple artist identities without changing quiz banks."""
import concurrent.futures,datetime,json,pathlib,threading,time,urllib.parse,urllib.request
ROOT=pathlib.Path(__file__).resolve().parents[2];D=ROOT/'data'
NOW=datetime.datetime.now(datetime.timezone.utc).isoformat();lock=threading.Lock();next_request=0
old=json.loads((D/'release-identities.json').read_text()) if (D/'release-identities.json').exists() else {'artists':{}}
def one(artist):
 global next_request
 slug=artist['slug'];packet=json.loads((D/'quiz/catalogues'/f'{slug}.json').read_text())
 url='https://itunes.apple.com/lookup?'+urllib.parse.urlencode({'id':packet['appleArtistId'],'entity':'song','limit':200,'country':'NG'})
 try:
  with lock:
   wait=max(0,next_request-time.monotonic());next_request=max(next_request,time.monotonic())+3.5
  if wait:time.sleep(wait)
  with urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':'AfriIndex release identity audit/1.0'}),timeout=35) as response:data=json.load(response)
  identity=next((r for r in data.get('results',[]) if r.get('wrapperType')=='artist'),None)
  if not identity or identity.get('artistId')!=packet['appleArtistId']:raise ValueError('Apple artist identity mismatch')
  tracks=[{k:r.get(k) for k in ['trackId','trackName','artistName','releaseDate','trackViewUrl','artworkUrl100']} for r in data.get('results',[]) if r.get('kind')=='song' and r.get('trackId') and r.get('releaseDate')]
  if not tracks:raise ValueError('No release identities returned')
  print(slug,len(tracks),'release identities',flush=True)
  return slug,{'checkedAt':NOW,'sourceUrl':url,'status':'refreshed','tracks':tracks}
 except Exception as error:
  prior=old['artists'].get(slug,{'tracks':[]})
  return slug,{**prior,'status':'retained_last_good' if prior['tracks'] else 'unavailable','lastAttemptAt':NOW,'error':str(error)}
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:artists=dict(pool.map(one,json.loads((D/'current.json').read_text())['artists']))
(D/'release-identities.json').write_text(json.dumps({'checkedAt':NOW,'scope':'Release-date identities for the Current 50, using previously reviewed Apple artist IDs. Existing catalogue records remain as fallbacks.','artists':artists},ensure_ascii=False,separators=(',',':'))+'\n')
print('Release identities:',sum(a['status']=='refreshed' for a in artists.values()),'of',len(artists),'refreshed',flush=True)
