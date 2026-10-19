"""Collect publisher ledgers and Apple release identities before compiling the 2026 release cohort.
Raw HTTP caches are ignored. This does not infer calendar-year consumption from lifetime totals.
"""
import concurrent.futures,datetime,html,json,pathlib,re,threading,time,urllib.request
from html.parser import HTMLParser
ROOT=pathlib.Path(__file__).resolve().parents[2];D=ROOT/'data';CACHE=D/'streaming-cache'/datetime.date.today().isoformat();CACHE.mkdir(parents=True,exist_ok=True)
NOW=datetime.datetime.now(datetime.timezone.utc).isoformat(); lock=threading.Lock();last_apple=0
class Rows(HTMLParser):
 def __init__(self):super().__init__();self.rows=[];self.row=None;self.cell=None;self.link=None
 def handle_starttag(self,tag,attrs):
  a=dict(attrs)
  if tag=='tr':self.row=[]
  if tag=='td' and self.row is not None:self.cell={'text':'','links':[]}
  if tag=='a' and self.cell is not None:self.cell['links'].append(a.get('href',''))
 def handle_data(self,data):
  if self.cell is not None:self.cell['text']+=data
 def handle_endtag(self,tag):
  if tag=='td' and self.cell is not None:self.row.append(self.cell);self.cell=None
  if tag=='tr' and self.row is not None:self.rows.append(self.row);self.row=None

def get(url,key,apple=False):
 global last_apple
 p=CACHE/(key+'.txt')
 if p.exists():return p.read_text()
 if apple:
  with lock:
   pause=3.5-(time.monotonic()-last_apple)
   if pause>0:time.sleep(pause)
   last_apple=time.monotonic()
 req=urllib.request.Request(url,headers={'User-Agent':'AfriIndex source audit/1.0'})
 with urllib.request.urlopen(req,timeout=35) as r:s=r.read().decode()
 p.write_text(s);return s

def ledger(raw,entity):
 p=Rows();p.feed(raw);out=[]
 for cells in p.rows:
  if len(cells)<3:continue
  link=next((u for u in cells[0]['links'] if '/'+entity+'/' in u and 'open.spotify.com' in u),None)
  if not link:continue
  n=re.sub(r'[^0-9]','',cells[1]['text']);daily=re.sub(r'[^0-9]','',cells[2]['text'])
  if n:out.append({'title':cells[0]['text'].strip().lstrip('*').strip(),'total':int(n),'daily':int(daily) if daily else None,'spotify_url':link})
 m=re.search(r'Last updated:\s*(\d{4}/\d{2}/\d{2})',raw)
 summary={}
 for label,field in [('Streams','total'),('Daily','daily'),('Tracks','count')]:
  match=re.search(r'<tr><td class="text">'+label+r'</td><td>([0-9,]+)',raw)
  summary[field]=int(match[1].replace(',','')) if match else None
 return {'source_date':m[1].replace('/','-') if m else None,'rows':out,**summary}

def one(a):
 slug=a['slug'];out={'artist_slug':slug,'name':a['name'],'checked_at':NOW}
 packet=json.loads((D/'quiz/catalogues'/f'{slug}.json').read_text());appleid=packet['appleArtistId']
 for kind,entity in [('albums','album'),('songs','track')]:
  url=f'https://kworb.net/spotify/artist/{a["spotifyId"]}_{kind}.html'
  try:out[kind]={'url':url,**ledger(get(url,slug+'-'+kind),entity)}
  except Exception as e:out[kind]={'url':url,'error':str(e),'rows':[]}
 url=f'https://itunes.apple.com/lookup?id={appleid}&entity=album&limit=200&country=NG'
 try:
  raw=json.loads(get(url,slug+'-apple-albums',True));out['apple_source']=url
  out['apple_albums']=[{k:t[k] for k in ['artistId','artistName','collectionId','collectionName','releaseDate','trackCount','collectionViewUrl','artworkUrl100'] if k in t} for t in raw.get('results',[]) if t.get('wrapperType')=='collection']
 except Exception as e:out['apple_albums']=[];out['apple_error']=str(e)
 print(slug,len(out['albums']['rows']),len(out['songs']['rows']),len(out['apple_albums']),flush=True);return out

def main():
 artists=json.loads((D/'current.json').read_text())['artists']
 previous={a['artist_slug']:a for a in json.loads((D/'releases-2026-sources.json').read_text())['artists']}
 with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:packets=list(pool.map(one,artists))
 for a in packets:
  old=previous.get(a['artist_slug'],{})
  for kind in ['albums','songs']:
   if not a[kind]['rows'] and old.get(kind,{}).get('rows'):
    error=a[kind].get('error','No valid rows returned');a[kind]={**old[kind],'status':'retained_last_good','last_attempt_error':error,'verified_at':old[kind].get('verified_at',old.get('checked_at'))}
   elif a[kind]['rows']:a[kind]['verified_at']=NOW
  if not a['apple_albums'] and old.get('apple_albums'):a['apple_albums']=old['apple_albums'];a['apple_status']='retained_last_good'
 (D/'releases-2026-sources.json').write_text(json.dumps({'checked_at':NOW,'scope':'Current 50 artists; publisher catalogue coverage','artists':packets},ensure_ascii=False,separators=(',',':'))+'\n')
 print('Saved',len(packets),'artist source packets')
if __name__=='__main__':main()
