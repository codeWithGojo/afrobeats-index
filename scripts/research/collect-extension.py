"""Collect Current 100 extension candidates (ranks 51 to 100).

Pool: artists credited on the Kworb Spotify weekly charts for Nigeria and South Africa who are not in
the Current 50. Identity: Wikidata items linked by the exact Spotify artist ID (P1902), kept only when
the citizenship (P27) or country of origin (P495) is an African country. Streams: each artist's Kworb
Spotify song ledger summary (total, latest daily, publisher date).

Nothing is inferred. Bios, editorial scores, review dates and photos stay null until an editor adds
them; such artists rank as provisional and are labelled "Not yet reviewed".
Run: python scripts/research/collect-extension.py   (then npm run build)
"""
import datetime,json,pathlib,re,time,urllib.parse,urllib.request
from html.parser import HTMLParser
ROOT=pathlib.Path(__file__).resolve().parents[2];D=ROOT/'data'
NOW=datetime.datetime.now(datetime.timezone.utc).replace(microsecond=0).isoformat()
UA={'User-Agent':'AfriIndex source audit/1.0'}
CHARTS={'NG':'https://kworb.net/spotify/country/ng_weekly.html','ZA':'https://kworb.net/spotify/country/za_weekly.html'}
POOL_LIMIT=80  # collect more than 50 so incomplete or unmatched artists do not leave gaps

def get(url,tries=3):
 for i in range(tries):
  try:
   with urllib.request.urlopen(urllib.request.Request(url,headers=UA),timeout=40) as r:return r.read().decode()
  except Exception:
   if i==tries-1:raise
   time.sleep(2+i*3)

class ChartRows(HTMLParser):
 def __init__(self):super().__init__();self.rows=[];self.row=None;self.cell=None
 def handle_starttag(self,tag,attrs):
  a=dict(attrs)
  if tag=='tr':self.row=[]
  elif tag=='td' and self.row is not None:self.cell={'text':'','artists':[]}
  elif tag=='a' and self.cell is not None:
   m=re.search(r'artist/([A-Za-z0-9]{22})\.html',a.get('href',''))
   if m:self.cell['artists'].append([m[1],''])
 def handle_data(self,data):
  if self.cell is not None:
   self.cell['text']+=data
   if self.cell['artists'] and not self.cell['artists'][-1][1]:self.cell['artists'][-1][1]=data.strip()
 def handle_endtag(self,tag):
  if tag=='td' and self.cell is not None:self.row.append(self.cell);self.cell=None
  elif tag=='tr' and self.row is not None:self.rows.append(self.row);self.row=None

def chart(code,url):
 raw=get(url);p=ChartRows();p.feed(raw)
 date=re.search(r'pagetitle">[^<]*?(\d{4}/\d{2}/\d{2})',raw)
 out={}
 for cells in p.rows:
  if len(cells)<3 or not cells[0]['text'].strip().isdigit():continue
  pos=int(cells[0]['text'].strip())
  for sid,name in cells[2]['artists']:
   e=out.setdefault(sid,{'spotifyId':sid,'name':name,'best':pos,'entries':0})
   e['best']=min(e['best'],pos);e['entries']+=1
 return {'code':code,'url':url,'date':date[1].replace('/','-') if date else None,'artists':out}

def wikidata(ids):
 found={}
 for i in range(0,len(ids),60):
  values=' '.join('"%s"'%x for x in ids[i:i+60])
  q=f'''SELECT ?sid ?item ?itemLabel ?itemDescription ?cc ?countryLabel ?image ?article WHERE {{
   VALUES ?sid {{{values}}} ?item wdt:P1902 ?sid.
   OPTIONAL {{ ?item wdt:P27|wdt:P495 ?country. ?country wdt:P30 wd:Q15; wdt:P297 ?cc. }}
   OPTIONAL {{ ?item wdt:P18 ?image. }}
   OPTIONAL {{ ?article schema:about ?item; schema:isPartOf <https://en.wikipedia.org/>. }}
   SERVICE wikibase:label {{ bd:serviceParam wikibase:language "en". }} }}'''
  raw=get('https://query.wikidata.org/sparql?format=json&query='+urllib.parse.quote(q))
  for b in json.loads(raw)['results']['bindings']:
   v={k:x['value'] for k,x in b.items()};r=found.setdefault(v['sid'],{'wikidata':v['item'],'label':v.get('itemLabel'),'description':v.get('itemDescription'),'countries':{},'image':v.get('image'),'wikipedia':v.get('article')})
   if v.get('cc'):r['countries'][v['cc']]=v.get('countryLabel')
   r['image']=r['image'] or v.get('image');r['wikipedia']=r['wikipedia'] or v.get('article')
  time.sleep(1)
 return found

def by_name(names):
 """Fallback when Wikidata lacks the Spotify ID. The English label must belong to exactly one musician or
 group worldwide, and that item must have an African country. Deceased artists are skipped."""
 hits={}
 for i in range(0,len(names),30):
  values=' '.join(json.dumps(n)+'@en' for n in names[i:i+30])
  q=f'''SELECT ?name ?item ?itemDescription ?cc ?countryLabel ?image ?article ?sid ?died WHERE {{
   VALUES ?name {{{values}}} ?item rdfs:label ?name.
   {{ ?item wdt:P106/wdt:P279* wd:Q639669. }} UNION {{ ?item wdt:P31/wdt:P279* wd:Q215380. }}
   OPTIONAL {{ ?item wdt:P27|wdt:P495 ?country. ?country wdt:P30 wd:Q15; wdt:P297 ?cc. }}
   OPTIONAL {{ ?item wdt:P1902 ?sid. }} OPTIONAL {{ ?item wdt:P570 ?died. }} OPTIONAL {{ ?item wdt:P18 ?image. }}
   OPTIONAL {{ ?article schema:about ?item; schema:isPartOf <https://en.wikipedia.org/>. }}
   SERVICE wikibase:label {{ bd:serviceParam wikibase:language "en". }} }}'''
  try:raw=get('https://query.wikidata.org/sparql?format=json&query='+urllib.parse.quote(q))
  except Exception as e:print('name lookup failed',e);continue
  for b in json.loads(raw)['results']['bindings']:
   v={k:x['value'] for k,x in b.items()};per=hits.setdefault(v['name'],{})
   r=per.setdefault(v['item'],{'wikidata':v['item'],'description':v.get('itemDescription'),'countries':{},'image':None,'wikipedia':None,'spotifyId':None,'died':None,'match':'name'})
   if v.get('cc'):r['countries'][v['cc']]=v.get('countryLabel')
   for k,f in [('image','image'),('wikipedia','article'),('spotifyId','sid'),('died','died')]:r[k]=r[k] or v.get(f)
  time.sleep(1)
 return {n:next(iter(items.values())) for n,items in hits.items() if len(items)==1 and next(iter(items.values()))['countries'] and not next(iter(items.values()))['died']}

def ledger(sid):
 url=f'https://kworb.net/spotify/artist/{sid}_songs.html';raw=get(url)
 m=re.search(r'Last updated:\s*(\d{4}/\d{2}/\d{2})',raw);s={}
 for label,field in [('Streams','total'),('Daily','daily'),('Tracks','count')]:
  x=re.search(r'<tr><td class="text">'+label+r'</td><td>([0-9,]+)',raw);s[field]=int(x[1].replace(',','')) if x else None
 return {'url':url,'source_date':m[1].replace('/','-') if m else None,**s}

def slugify(name):return re.sub(r'[^a-z0-9]+','-',name.lower()).strip('-')[:60]

def main():
 current=json.loads((D/'current.json').read_text(encoding='utf8'))
 known={a['spotifyId'] for a in current['artists'] if a.get('spotifyId')};slugs={a['slug'] for a in current['artists']}
 path=D/'current-extension.json';prior=json.loads(path.read_text(encoding='utf8')) if path.exists() else {'candidates':[]}
 kept={c['spotifyId']:c for c in prior.get('candidates',[])}
 charts=[chart(c,u) for c,u in CHARTS.items()]
 pool={}
 for c in charts:
  for sid,e in c['artists'].items():
   if sid in known:continue
   p=pool.setdefault(sid,{'spotifyId':sid,'name':e['name'],'charts':[]})
   p['charts'].append({'chart':f"Spotify weekly {c['code']} (via Kworb)",'best':e['best'],'entries':e['entries'],'date':c['date'],'sourceUrl':c['url']})
 ordered=sorted(pool.values(),key=lambda p:min([x['best'] for x in p['charts']] or [999]))[:POOL_LIMIT*2]
 # Second pool: All-Time artists outside the Current 50 (identity already established editorially).
 alltime=json.loads((D/'all-time.json').read_text(encoding='utf8'))['artists']
 legacy=[a for a in alltime if a['slug'] not in slugs and '·' not in a['name']]
 found=by_name([a['name'].replace('’',"'") for a in legacy])
 for a in legacy:
  w=found.get(a['name'].replace('’',"'"))
  if not w or not w['spotifyId'] or w['spotifyId'] in known or w['spotifyId'] in pool:continue
  pool[w['spotifyId']]={'spotifyId':w['spotifyId'],'name':a['name'],'charts':[],'allTime':{'slug':a['slug'],'rank':a.get('rank'),'image':a.get('image'),'blurb':a.get('blurb')}}
  ordered.append(pool[w['spotifyId']])
 ids=wikidata([p['spotifyId'] for p in ordered])
 for r in ids.values():r['match']='spotify-id'
 names=by_name([p['name'] for p in ordered if p['spotifyId'] not in ids or not ids[p['spotifyId']]['countries']])
 for p in ordered:
  if (p['spotifyId'] not in ids or not ids[p['spotifyId']]['countries']) and p['name'] in names:ids[p['spotifyId']]=names[p['name']]
 unmatched=[];candidates=[]
 for p in ordered:
  w=ids.get(p['spotifyId'])
  if not w or not w['countries']:unmatched.append({'spotifyId':p['spotifyId'],'name':p['name'],'reason':'no Wikidata item with an African country' if w else 'no unique Wikidata musician for this Spotify ID or name'});continue
  old=kept.get(p['spotifyId'],{});at=p.get('allTime') or {}
  slug=old.get('slug') or at.get('slug') or slugify(p['name'])
  if slug in slugs:slug=slug+'-'+p['spotifyId'][:4].lower()
  try:l=ledger(p['spotifyId'])
  except Exception as e:l={'url':f"https://kworb.net/spotify/artist/{p['spotifyId']}_songs.html",'error':str(e)}
  time.sleep(.6)
  candidates.append({
   'slug':slug,'name':old.get('name') or p['name'],'spotifyId':p['spotifyId'],
   'country':old.get('country') or ' / '.join(sorted(w['countries'].values())),'countryCodes':sorted(w['countries']),
   'identity':{'wikidata':w['wikidata'],'wikipedia':w['wikipedia'],'description':w['description'],'match':w.get('match'),'checkedAt':NOW},
   'photoSource':w['image'],'image':old.get('image') or at.get('image'),'imageCredit':old.get('imageCredit') or ('Existing All-Time portrait; see data/alltime-portrait-sources.json' if at.get('image') else None),
   'allTime':{'rank':at['rank'],'blurb':at.get('blurb')} if at else None,
   'bio':old.get('bio'),'bioSource':old.get('bioSource'),'editorialScore':old.get('editorialScore'),'reviewedAt':old.get('reviewedAt'),
   'charts':p['charts'],'streams':l,'addedAt':old.get('addedAt') or NOW[:10]})
  print(slug,l.get('daily'),l.get('source_date'),flush=True)
 # Editor-added artists: {"spotifyId","name","country","countryCodes":["NG"],"identitySource":"https://..."}.
 have={c['spotifyId'] for c in candidates}
 for m in prior.get('manual',[]):
  if m.get('spotifyId') in have or m.get('spotifyId') in known or not m.get('country') or not str(m.get('identitySource','')).startswith('https://'):continue
  old=kept.get(m['spotifyId'],{})
  try:l=ledger(m['spotifyId'])
  except Exception as e:l={'url':f"https://kworb.net/spotify/artist/{m['spotifyId']}_songs.html",'error':str(e)}
  candidates.append({**{k:old.get(k) for k in ['image','imageCredit','bio','bioSource','editorialScore','reviewedAt']},'slug':old.get('slug') or slugify(m['name']),'name':m['name'],'spotifyId':m['spotifyId'],'country':m['country'],'countryCodes':m.get('countryCodes',[]),
   'identity':{'source':m['identitySource'],'match':'manual','checkedAt':NOW},'photoSource':None,'allTime':None,'charts':[],'streams':l,'addedAt':old.get('addedAt') or NOW[:10]})
 out={'note':'Current 100 extension candidates. Collected by scripts/research/collect-extension.py. Editors complete bio, bioSource, editorialScore (0-100), reviewedAt, image (webp) and imageCredit; until then the artist ranks as provisional.',
  'checkedAt':NOW,'pool':[{'chart':c['code'],'url':c['url'],'date':c['date'],'artists':len(c['artists'])} for c in charts],
  'candidates':candidates,'manual':prior.get('manual',[]),'excluded':prior.get('excluded',[]),'unmatched':unmatched[:80]}
 path.write_text(json.dumps(out,ensure_ascii=False,indent=1),encoding='utf8')
 print(len(candidates),'candidates,',len(unmatched),'unmatched')

if __name__=='__main__':main()
