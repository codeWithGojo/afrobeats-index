"""Compile distinct factual questions from reviewed primary Apple catalogue records.
No LLM-written answers. Each question retains the exact metadata used to derive it.
"""
import collections,datetime,hashlib,json,pathlib,re,unicodedata
ROOT=pathlib.Path(__file__).resolve().parents[2]
D=ROOT/'data/quiz'; NOW=datetime.datetime.now(datetime.timezone.utc)

def key(s):return re.sub(r'[^a-z0-9]','',unicodedata.normalize('NFKD',str(s)).casefold())
def titlekey(s):return key(re.sub(r'\s*[\(\[]\s*(?:feat\.|ft\.|with)\b.*?[\)\]]','',str(s),flags=re.I))
def clean_title(s):
 s=re.sub(r'\s*[\(\[](?:feat\.|ft\.|with)\s+[^\)\]]+[\)\]]','',s,flags=re.I)
 return re.sub(r'\s+(?:feat\.|ft\.)\s+.*$','',s,flags=re.I).strip()
def personkey(s):return {'2faceidibia':'2baba','2face':'2baba','tufaceidibia':'2baba','buju':'bnxn'}.get(key(s),key(s))
def stable(s):return hashlib.sha256(s.encode()).hexdigest()

def bank(packet,global_albums,people):
 a=packet; records=[]
 for t in a['tracks']:
  if re.search(r'\b(?:DJ Mix|Mixed)\b',t.get('collectionName','')+' '+t.get('trackName',''),re.I):continue
  if t.get('releaseDate') and t['releaseDate'][:10]>NOW.date().isoformat():continue
  if not t.get('trackName') or not t.get('collectionName'):continue
  if t.get('artistId')!=a['appleArtistId'] and key(a['name']) not in key(t.get('artistName','')+' '+t['trackName']):continue
  records.append(t)
 # Prefer album/EP recordings to single copies and remove the same record repeated in clean/explicit duplicates.
 records.sort(key=lambda t:(t.get('trackCount',0)<4,'deluxe' in t['collectionName'].lower(),t.get('releaseDate') or '9999',str(t['trackId'])))
 unique={}
 for t in records:unique.setdefault((titlekey(t['trackName']),key(t['collectionName'])),t)
 records=list(unique.values()); songs={}
 for t in records:songs.setdefault(titlekey(t['trackName']),t)
 titles=[t['trackName'] for t in songs.values()]
 albums={}
 for t in records:albums.setdefault(key(t['collectionName']),t)
 all_album_titles=[t['collectionName'] for t in albums.values()]
 track_albums=collections.defaultdict(set)
 for t in records:track_albums[titlekey(t['trackName'])].add(key(t['collectionName']))
 q=[]
 def add(category,prompt,answer,distractors,fact,source_records,explanation,image=None,difficulty='medium'):
  others=[]
  for x in sorted(set(str(x) for x in distractors if str(x)!=str(answer)),key=lambda x:stable(a['slug']+category+fact+str(x))):
   if key(x)!=key(answer) and key(x) not in {key(y) for y in others}:others.append(x)
   if len(others)==3:break
  if len(others)<3:return
  qs={'id':stable(a['slug']+'|'+category+'|'+fact)[:20],'category':category,'prompt':prompt,'options':[str(answer)]+others,'answerIndex':0,'difficulty':difficulty,'explanation':explanation,'sources':[{'url':t['trackViewUrl'],'label':t.get('sourceProvider','Apple Music catalogue record'),'verifiedAt':a['checkedAt'],'recordId':t['trackId'],'evidence':{k:t[k] for k in ['artistName','trackName','collectionName','trackNumber','trackCount','releaseDate','artworkUrl100','discCount','discNumber'] if k in t}} for t in source_records]}
  if image:qs['image']={'url':image,'alt':'Release artwork to identify'}
  q.append(qs)
 for t in songs.values():
  others=[x for x in all_album_titles if key(x) not in track_albums[titlekey(t['trackName'])]]
  if len(others)<3:others +=[x for x in global_albums if key(x) not in track_albums[titlekey(t['trackName'])]]
  if t.get('trackCount',0)>=4:
   add('song-album',f'Which of these releases includes {a["name"]}’s recording “{clean_title(t["trackName"])}”?',t['collectionName'],others,str(t['trackId']),[t],f'The source catalogue lists this recording on {t["collectionName"]}.',difficulty='easy')
  year=int(t['releaseDate'][:4]) if t.get('releaseDate') else None
  if year:add('release-year',f'Apple Music lists which release year for “{clean_title(t["trackName"])}” on “{t["collectionName"]}”?',year,[year-2,year-1,year+1,year+2],str(t['trackId']),[t],f'This catalogue recording is dated {t["releaseDate"][:10]}. Reissues and other editions can have different dates.',difficulty='hard')
  feature=re.search(r'[\(\[]?(?:feat\.|ft\.|with)\s+([^\)\]]+)',t['trackName'],re.I)
  if feature and t.get('artistId')==a['appleArtistId']:
   guests=[x.strip() for x in re.split(r',|/|\s+&\s+|\s+and\s+',feature[1]) if x.strip()]
   eligible=[x for x in guests if key(x)!=key(a['name'])]
   if eligible:
    guest=eligible[0];others=[x for x in people if personkey(x) not in {personkey(y) for y in guests} and personkey(x)!=personkey(t['artistName'])]
    add('collaboration',f'Who is named as a featured guest on {a["name"]}’s “{clean_title(t["trackName"])}”?',guest,others,str(t['trackId']),[t],f'The official track title credits {feature[1]}.',difficulty='easy')
  elif feature and key(a['name']) in key(feature[1]) and key(t['artistName'])!=key(a['name']):
   add('collaboration',f'Which main artist credit is listed for “{clean_title(t["trackName"])}”, featuring {a["name"]}?',t['artistName'],people,str(t['trackId']),[t],f'The catalogue credits {t["artistName"]}, with {a["name"]} named in the featured credit.',difficulty='medium')
 by_collection=collections.defaultdict(dict)
 for t in records:
  if t.get('discCount')==1 and t.get('trackCount',0)>=4:by_collection[t['collectionId']][t.get('trackNumber')]=t
 for cid,tracks in by_collection.items():
  for n,t in tracks.items():
   if not isinstance(n,int):continue
   other=[x for x in titles if titlekey(x)!=titlekey(t['trackName'])]
   add('track-position',f'What track number is “{t["trackName"]}” on “{t["collectionName"]}”?',n,[max(1,n-2),max(1,n-1),n+1,n+2,n+3],f'{cid}:position:{n}',[t],f'The source tracklist places it at number {n}.',difficulty='hard')
   if n==1:
    add('tracklist',f'Which song opens “{t["collectionName"]}” in the listed tracklist?',t['trackName'],other,f'{cid}:first',[t],f'{t["trackName"]} is listed as track 1.',difficulty='medium')
   if n==t.get('trackCount'):
    add('tracklist',f'Which song closes the single-disc edition of “{t["collectionName"]}”?',t['trackName'],other,f'{cid}:last',[t],f'{t["trackName"]} is track {n} of {t["trackCount"]}.',difficulty='hard')
   if n+1 in tracks:
    nxt=tracks[n+1]; distract=[x for x in titles if titlekey(x) not in {titlekey(t['trackName']),titlekey(nxt['trackName'])}]
    add('tracklist',f'On “{t["collectionName"]}”, which song comes immediately after “{t["trackName"]}”?',nxt['trackName'],distract,f'{cid}:after:{n}',[t,nxt],f'The tracklist places {t["trackName"]} at {n}, followed by {nxt["trackName"]} at {n+1}.',difficulty='hard')
 seen_images=set()
 for t in albums.values():
  if t.get('discCount')==1 and t.get('trackCount',0)>=4:
   size=t['trackCount'];add('release-size',f'How many tracks does the catalogue list for the single-disc edition of “{t["collectionName"]}”?',size,[max(1,size-2),max(1,size-1),size+1,size+2],str(t['collectionId']),[t],f'The listed edition contains {size} tracks.',difficulty='medium')
  image=t.get('artworkUrl100')
  if not image:continue
  image_key=re.sub(r'/\d+x\d+bb[^/]*$','',image)
  if image_key in seen_images:continue
  seen_images.add(image_key)
  others=[x['collectionName'] for x in albums.values() if key(x['collectionName'])!=key(t['collectionName']) and re.sub(r'/\d+x\d+bb[^/]*$','',x.get('artworkUrl100') or '')!=image_key]
  if len(others)<3:others += [x for x in global_albums if key(x)!=key(t['collectionName'])]
  add('artwork','Which release uses this artwork?',t['collectionName'],others,str(t['collectionId']),[t],f'This artwork accompanies {t["collectionName"]} in the source catalogue.',image=re.sub(r'100x100bb','600x600bb',image),difficulty='easy')
 # Bounded, reproducible chronology candidates avoid turning a small catalogue into thousands of similar prompts.
 songlist=[t for t in songs.values() if t.get('releaseDate')]; pairs=[]
 for i,t in enumerate(songlist):
  for u in songlist[i+1:]:
   if t['releaseDate'][:10]!=u['releaseDate'][:10]:pairs.append((t,u))
 pairs.sort(key=lambda pair:stable(a['slug']+str(pair[0]['trackId'])+str(pair[1]['trackId'])))
 for t,u in pairs[:300]:
   first,second=sorted([t,u],key=lambda x:x['releaseDate'])
   add('release-order','Which of these catalogue recordings is dated earlier on Apple Music?',f'{first["trackName"]} — {first["collectionName"]}',[f'{second["trackName"]} — {second["collectionName"]}','Both have the same listed date','Neither recording has a listed date'],f'{min(t["trackId"],u["trackId"])}:{max(t["trackId"],u["trackId"])}',[t,u],f'{first["trackName"]} is dated {first["releaseDate"][:10]}; {second["trackName"]} is dated {second["releaseDate"][:10]}.',difficulty='medium')
 # Round-robin categories; the chronology category can contribute at most 25% of a complete bank.
 dedup={x['id']:x for x in q}; buckets={c:sorted([x for x in dedup.values() if x['category']==c],key=lambda x:stable(a['slug']+x['id'])) for c in ['song-album','collaboration','artwork','tracklist','release-year','release-order','release-size','track-position']}
 selected=[]; counts=collections.Counter();caps={'track-position':20,'release-size':15,'release-order':25,'release-year':30,'song-album':40,'tracklist':40,'artwork':25,'collaboration':25}
 while len(selected)<100:
  changed=False
  for c,b in buckets.items():
   if b and counts[c]<caps[c] and len(selected)<100:selected.append(b.pop(0));counts[c]+=1;changed=True
  if not changed:break
 return {'artist':{k:a[k] for k in ['slug','name','lists','image']},'identitySource':a['artistSource'],'checkedAt':a['checkedAt'],'questionCount':len(selected),'categoryCounts':dict(counts),'questions':selected,'candidateCount':len(dedup),'sourceRecordCount':len(records)}

def main():
 packets=[json.loads(p.read_text()) for p in sorted((D/'catalogues').glob('*.json'))]
 all_albums=[t['collectionName'] for p in packets for t in p['tracks'] if t.get('trackCount',0)>=4 and not re.search('DJ Mix|Mixed',t['collectionName'],re.I)]
 all_albums=sorted(set(all_albums)); people=[p['name'] for p in packets]
 result={}
 for p in packets:
  if p['identityStatus']!='reviewed':continue
  b=bank(p,all_albums,people);result[p['slug']]=b
  print(p['name'],b['questionCount'],b['categoryCounts'],flush=True)
 # Career questions are manually researched from named event organisers, labels and interviews.
 career=json.loads((D/'career-facts.json').read_text())
 grouped=collections.defaultdict(list)
 for question in career['questions']:
  slug=question['artist']
  if slug not in result:raise ValueError('Unknown career artist: '+slug)
  q={k:v for k,v in question.items() if k!='artist'}
  grouped[slug].append(q)
 for slug,questions in grouped.items():
  b=result[slug]
  # Replace catalogue chronology first, preserving a 100-question bank and the other categories.
  retained=list(b['questions'])
  for _ in questions:
   index=next((i for c in ['release-order','release-year','track-position','release-size'] for i in range(len(retained)-1,-1,-1) if retained[i]['category']==c),None)
   if index is None:raise ValueError('Too many career questions: '+slug)
   retained.pop(index)
  b['questions']=questions+retained
  b['categoryCounts']=dict(collections.Counter(q['category'] for q in b['questions']))
  b['careerQuestionCount']=len(questions)
  b['careerCheckedAt']=career['checkedAt']
 version=stable(json.dumps(result,sort_keys=True))[:12]
 (D/'questions.json').write_text(json.dumps({'version':version,'artists':result},ensure_ascii=False,separators=(',',':')))
 roster=json.loads((D/'roster.json').read_text())
 manifest=[{**a,'questionCount':result.get(a['slug'],{}).get('questionCount',0),'categories':result.get(a['slug'],{}).get('categoryCounts',{})} for a in roster]
 (D/'manifest.json').write_text(json.dumps({'version':version,'artists':manifest},ensure_ascii=False,indent=2))
if __name__=='__main__':main()
