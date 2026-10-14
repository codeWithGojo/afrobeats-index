"""Collect source records from Apple's public iTunes artist lookup API.
Each artist identity and every track record retain source URLs and collection IDs.
API responses are cached; ambiguous identities are held for manual review.
"""
import concurrent.futures, datetime, json, pathlib, re, threading, time, unicodedata, urllib.parse, urllib.request
ROOT=pathlib.Path(__file__).resolve().parents[2]
OUT=ROOT/'data/quiz/catalogues'; OUT.mkdir(parents=True,exist_ok=True)
CACHE=ROOT/'data/quiz/research-cache'; CACHE.mkdir(parents=True,exist_ok=True)
lock=threading.Lock(); next_request=0

def norm(value):
    return re.sub(r'[^a-z0-9]', '', unicodedata.normalize('NFKD', value).lower())

def fetch(params):
    global next_request
    url='https://itunes.apple.com/'+params.pop('_route','search')+'?'+urllib.parse.urlencode(params)
    filename=CACHE/(str(__import__('hashlib').sha256(url.encode()).hexdigest())+'.json')
    if filename.exists(): return json.loads(filename.read_text()),url
    for attempt in range(3):
        with lock:
            delay=max(0,next_request-time.monotonic()); next_request=max(next_request,time.monotonic())+3.4
        if delay:time.sleep(delay)
        try:
            req=urllib.request.Request(url,headers={'User-Agent':'AfriIndexCatalogueResearch/1.0'})
            with urllib.request.urlopen(req,timeout=35) as res: data=json.load(res)
            filename.write_text(json.dumps(data));return data,url
        except Exception:
            if attempt==2:raise
            time.sleep(3*(attempt+1))

aliases={'2baba':['2Baba','2Face Idibia'],'dbanj':["D'banj"],'stylplus':['Styl-Plus'],'kingsunnyade':['King Sunny Ade'],'jazzwrld':['JAZZWRLD']}

def collect(a):
    try:
        target=OUT/(a['slug']+'.json')
        if target.exists():return a['name'],'cached'
        searches=[]; candidates=[]
        for term in aliases.get(norm(a['name']),[a['name']]):
            result,url=fetch({'term':term,'entity':'musicArtist','limit':20,'country':'NG'})
            searches.append(url); candidates +=result.get('results',[])
        exact=[x for x in candidates if norm(x.get('artistName','')) in {norm(n) for n in aliases.get(norm(a['name']),[a['name']])}]
        if not exact: return a['name'],'NEEDS IDENTITY REVIEW '+str([(x.get('artistName'),x.get('artistId')) for x in candidates[:5]])
        # Search relevance provides the initial candidate; distinct exact-name identities stay visible in the audit.
        chosen=exact[0]
        result,url=fetch({'_route':'lookup','id':chosen['artistId'],'entity':'song','limit':200,'country':'NG'})
        records=[x for x in result.get('results',[]) if x.get('kind')=='song' and x.get('trackViewUrl') and x.get('collectionId')]
        clean=[]
        for x in records:
            clean.append({k:x.get(k) for k in ['trackId','trackName','artistId','artistName','collectionId','collectionName','trackNumber','trackCount','discNumber','discCount','releaseDate','trackViewUrl','collectionViewUrl','artistViewUrl','artworkUrl100']})
        packet={**a,'appleArtistId':chosen['artistId'],'appleArtistName':chosen['artistName'],'artistSource':chosen.get('artistLinkUrl'),'identityCandidates':[{'name':x.get('artistName'),'id':x.get('artistId'),'genre':x.get('primaryGenreName')} for x in exact],'identityStatus':'pending-review','checkedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'searchSources':searches,'lookupSource':url,'tracks':clean}
        target.write_text(json.dumps(packet,ensure_ascii=False,indent=2))
        return a['name'],str(len(clean))+' catalogue records; '+str(len(exact))+' exact artist candidates'
    except Exception as e:return a['name'],'ERROR '+str(e)

if __name__=='__main__':
    roster=json.loads((ROOT/'data/quiz/roster.json').read_text())
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
        for name,status in pool.map(collect,roster):print(name+' | '+status,flush=True)
