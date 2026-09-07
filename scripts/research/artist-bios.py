import json,urllib.request,urllib.parse,re,concurrent.futures
from bs4 import BeautifulSoup
from pathlib import Path
artists=json.load(open('data/current.json'))['artists']
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
  return {'artist_slug':a['slug'],'career_started':year,'gender':'woman' if a['slug'] in women else None,'evidence':{'biography':{'url':url,'checked_at':'2026-09-07','career_excerpt':excerpt,'precision':'year'}}}
 except Exception as e:return {'artist_slug':a['slug'],'error':str(e)}
with concurrent.futures.ThreadPoolExecutor(max_workers=5) as pool:rows=list(pool.map(read,artists))
Path('data/artist-evidence.json').write_text(json.dumps(rows,indent=2)+'\n')
print(json.dumps(rows,indent=2))
