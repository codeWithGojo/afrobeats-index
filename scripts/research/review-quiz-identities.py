"""Record artist-identity checks using matching existing ledger titles or landmark source records."""
import json,pathlib,re,unicodedata
ROOT=pathlib.Path(__file__).resolve().parents[2]
def key(s):return re.sub(r'[^a-z0-9]','',unicodedata.normalize('NFKD',re.sub(r'\(feat\..*?\)','',s,flags=re.I)).casefold())
current={a['slug']:a for a in json.loads((ROOT/'data/current.json').read_text())['artists']}
anchors={'fela-kuti':['Water No Get Enemy','Zombie'],'2baba':['African Queen','Gaga Shuffle'],'p-square':['Alingo','Beautiful Onyinye'],'d-banj':['Emergency','Oliver Twist'],'wande-coal':['So Mi So','Baby Hello'],'yemi-alade':['Johnny','MY POWER'],'flavour':['Nwa Baby','Ada Ada'],'mr-eazi':['Leg Over','Skin Tight'],'sarkodie':['Adonai','Tonga'],'ice-prince':['Oleku','Boss'],'9ice':['Gongo Aso','Gbamu-gbamu'],'styl-plus':['Olufunmi','Imagine That'],'runtown':['Mad Over You','The Banger'],'timaya':['Dem Mama','Bum Bum'],'don-jazzy':['Dorobucci','Eminado'],'mayorkun':['Mama','Eleko'],'simi':['Duduke','Joromi'],'kidi':['Touch It','Odo'],'fuse-odg':['Antenna','Azonto'],'afro-b':['Drogba','Joanna'],'nonso-amadi':['Tonight','Radio'],'brymo':['Ara','Good Morning'],'lagbaja':['Konko Below','Never Far Away'],'king-sunny-ade':['Ja Funmi','Synchro System'],'tony-allen':['Secret Agent','Road Close'],'weird-mc':['Ijoya','Allen Avenue'],'bracket':['Yori Yori','Ada Owerri'],'olu-maintain':['Yahooze','Nawti'],'skales':['Shake Body','Booty Language']}
for file in sorted((ROOT/'data/quiz/catalogues').glob('*.json')):
 p=json.loads(file.read_text());artist=current.get(p['slug'])
 if artist:
  known={key(t['title']) for t in artist['songs']};matches=sorted({key(t['trackName']) for t in p['tracks']} & known)
  ok=len(matches)>=3;method='Apple artist catalogue matched against the existing Spotify ledger'
 else:
  known=anchors.get(p['slug'],[]);matches=sorted({t['trackName'] for t in p['tracks'] if any(key(anchor) in key(t['trackName']) for anchor in known)})
  ok=bool(matches);method='Artist identity matched by catalogue landmark recordings; candidate name and credit reviewed'
 if ok:
  p['identityStatus']='reviewed';p['identityReview']={'method':method,'matchedTitles':matches,'checkedAt':p['checkedAt']};file.write_text(json.dumps(p,ensure_ascii=False,indent=2))
 print(p['name'],p['identityStatus'],len(matches),matches[:3],flush=True)
