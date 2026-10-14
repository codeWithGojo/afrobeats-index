"""Supplement Weird MC's digital catalogue with an explicitly identified physical-CD edition.
Track titles/order/features transcribed from the retailer's listing; no original release year inferred.
"""
import datetime,json,pathlib
ROOT=pathlib.Path(__file__).resolve().parents[2]
p=ROOT/'data/quiz/catalogues/weird-mc.json';data=json.loads(p.read_text())
url='https://www.afrocrafters.com/products/weird-mc-ijoya-after-da-storm-cd'
titles=['Kampe [I Still Dey]','Ijoya','Da Way We Blo’','Ready 2 Party','Tireni Ft. Kween','African Woman','What U Waitin’ 4 Ft. JJC & Da 419 Squad','Kampe [Club Mix]','Da Way We Blo’ [Radio]','Palava Ft. 2face Idibia/Black Face/Femi Kuti','Da Way We Blo’ [Blagmoney] Remix']
image='https://www.afrocrafters.com/cdn/shop/products/hip-hop-music-weird-mc-ijoya-after-da-storm-cd-1161227010_grande.png?v=1766395066'
data['tracks']=[t for t in data['tracks'] if not str(t['trackId']).startswith('physical-after-da-storm')]
for n,title in enumerate(titles,1):
 data['tracks'].append({'trackId':f'physical-after-da-storm-{n:02d}','trackName':title,'artistId':data['appleArtistId'],'artistName':'Weird MC','collectionId':'physical-after-da-storm-cd','collectionName':'After Da Storm (CD edition)','trackNumber':n,'trackCount':len(titles),'discNumber':1,'discCount':1,'releaseDate':None,'trackViewUrl':url,'collectionViewUrl':url,'artistViewUrl':data['artistSource'],'artworkUrl100':image,'sourceProvider':'Afro Crafters physical-CD catalogue','sourceText':f'{n:02d}. {title}'})
data['supplementalSources']=[{'url':url,'checkedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'scope':'Tracklist of the 11-track physical CD edition; label listed as Ahbu Ventures Ltd','releaseYear':'not asserted'}]
p.write_text(json.dumps(data,ensure_ascii=False,indent=2))
print('Added 11 physical-CD track records without inventing a release date.')
