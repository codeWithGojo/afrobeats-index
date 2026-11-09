import datetime,json,urllib.request,urllib.parse,re,concurrent.futures
from bs4 import BeautifulSoup
from pathlib import Path
artists=json.load(open('data/current.json'))['artists']
checked=datetime.datetime.now(datetime.timezone.utc).date().isoformat()
previous={a['artist_slug']:a for a in json.load(open('data/artist-evidence.json'))}
exceptions={'fave':'Fave_(singer)','ciza':'Ciza','mavo':'Mavo_(musician)','fola':'Fola_(singer)','young-jonn':'Young_Jonn','bnxn':'Bnxn','ckay':'CKay','omah-lay':'Omah_Lay','jazzwrld':'Jazzwrld','odumodublvck':'Odumodublvck'}
women={'tems','tyla','ayra-starr','moliy','amaarae','fave','tiwa-savage','darkoo','uncle-waffles'}
def read(a):
 title=exceptions.get(a['slug'],a['name'].title().replace(' ','_'))
 url='https://en.wikipedia.org/wiki/'+urllib.parse.quote(title,safe='()_')
 try:
  html=urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':'AfriIndex/1.0 (editorial source verification)'}),timeout=18).read()
  soup=BeautifulSoup(html,'html.parser');box=soup.select_one('.infobox');year=None;excerpt=''
  if box:
   for tr in box.select('tr'):
    th=tr.find('th');td=tr.find('td')
    if th and td and 'Years active' in th.get_text(' ',strip=True):
     excerpt=td.get_text(' ',strip=True);m=re.search(r'\b(19\d{2}|20\d{2})\b',excerpt);year=int(m[1]) if m else None
  
  if year is None and a['slug'] in previous:return {**previous[a['slug']],'lastAttemptAt':checked,'reviewStatus':'retained_last_good_no_year_found'}
  return {'artist_slug':a['slug'],'career_started':year,'gender':'woman' if a['slug'] in women else None,'evidence':{'biography':{'url':url,'checked_at':checked,'career_excerpt':excerpt,'precision':'year'}}}
 except Exception as e:return {**previous.get(a['slug'],{'artist_slug':a['slug']}),'lastAttemptAt':checked,'reviewStatus':'retained_last_good','lastAttemptError':str(e)}
with concurrent.futures.ThreadPoolExecutor(max_workers=5) as pool:rows=list(pool.map(read,artists))
Path('data/artist-evidence.json').write_text(json.dumps(rows,indent=2)+'\n')
print('Biographical evidence:',sum(r.get('evidence',{}).get('biography',{}).get('checked_at')==checked for r in rows),'of',len(rows),'rechecked; remaining entries retain earlier evidence dates.')
