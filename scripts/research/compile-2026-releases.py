"""Compile a bounded, source-linked release-year cohort; never label catalogue totals as YTD."""
import datetime,json,pathlib,re,unicodedata
ROOT=pathlib.Path(__file__).resolve().parents[2];D=ROOT/'data'
def key(s):
 s=re.sub(r'\s*[([](?:feat\.?|ft\.?|with)\s+.*','',str(s),flags=re.I)
 s=re.sub(r'\s*-\s*(?:EP|Single)$','',s,flags=re.I)
 return re.sub(r'[^a-z0-9]','',unicodedata.normalize('NFKD',s).casefold())
def compile_snapshot():
 sources=json.loads((D/'releases-2026-sources.json').read_text());today=sources['checked_at'][:10]
 albums={};songs={};excluded=[];coverage=[]
 for a in sources['artists']:
  slug=a['artist_slug'];packet=json.loads((D/'quiz/catalogues'/f'{slug}.json').read_text());appleid=packet['appleArtistId']
  coverage.append({'artist_slug':slug,'albums':len(a['albums']['rows']),'songs':len(a['songs']['rows']),'release_metadata':len(a['apple_albums']),'errors':{k:a[k] for k in ['apple_error'] if k in a},'source_dates':{k:a[k].get('source_date') for k in ['albums','songs']}})
  for r in a['albums']['rows']:
   matches=[t for t in a['apple_albums'] if key(t['collectionName'])==key(r['title']) and t.get('artistId')==appleid and t.get('trackCount',0)>=4]
   if not matches:excluded.append({'artist_slug':slug,'type':'album','title':r['title'],'reason':'No matching primary-artist album/EP metadata with at least four tracks'});continue
   t=min(matches,key=lambda t:t.get('releaseDate','9999'));date=t.get('releaseDate','')[:10]
   if not date.startswith('2026') or date>today:continue
   if not a['albums'].get('source_date'):continue
   ident=r['spotify_url'].split('/')[-1].split('?')[0]
   row={'album_title':r['title'],'artist':t['artistName'],'artist_slug':slug,'release_date':date,'total_streams':r['total'],'daily_streams':r['daily'],'year':2026,'spotify_url':r['spotify_url'],'spotify_id':ident,'artwork_url':t.get('artworkUrl100','').replace('100x100bb','300x300bb'),'source_url':a['albums']['url'],'source_date':a['albums']['source_date'],'last_updated':sources['checked_at'][:10],'release_source':t['collectionViewUrl'],'apple_collection_id':t['collectionId'],'track_count':t['trackCount'],'metric':'global_spotify_tracked_album_total'}
   if ident not in albums or row['total_streams']>albums[ident]['total_streams']:albums[ident]=row
  for r in a['songs']['rows']:
   matches=[t for t in packet['tracks'] if key(t.get('trackName'))==key(r['title']) and t.get('releaseDate')]
   if not matches:continue
   t=min(matches,key=lambda t:t['releaseDate']);date=t['releaseDate'][:10]
   if not date.startswith('2026') or date>today or not a['songs'].get('source_date'):continue
   ident=r['spotify_url'].split('/')[-1].split('?')[0]
   row={'song_title':r['title'],'artist':t['artistName'],'artist_slug':slug,'release_date':date,'total_streams':r['total'],'daily_streams':r['daily'],'year':2026,'spotify_url':r['spotify_url'],'spotify_id':ident,'artwork_url':t.get('artworkUrl100','').replace('100x100bb','300x300bb'),'source_url':a['songs']['url'],'source_date':a['songs']['source_date'],'last_updated':sources['checked_at'][:10],'release_source':t['trackViewUrl'],'apple_track_id':t['trackId'],'metric':'global_spotify_recording_total'}
   if ident not in songs or row['total_streams']>songs[ident]['total_streams']:songs[ident]=row
 # Same primary credit and title can have multiple Spotify editions; show the largest ledger row once.
 def unique(rows,title):
  result={}
  for r in sorted(rows,key=lambda r:-r['total_streams']):result.setdefault((key(r[title]),key(r['artist'])),r)
  return list(result.values())
 result={'checked_at':sources['checked_at'],'year':2026,'basis':'release_year_cohort','scope':'Matched 2026 recordings and primary-artist albums/EPs in the Current 50 source ledgers. Not an exhaustive Africa-wide or year-to-date consumption chart. Album totals can include plays of advance singles.','albums':unique(albums.values(),'album_title'),'songs':unique(songs.values(),'song_title'),'coverage':coverage,'excluded_albums':excluded}
 (D/'releases-2026.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
 print('Released, matched:',len(result['albums']),'albums/EPs;',len(result['songs']),'songs')
 for kind in ['albums','songs']:
  print(kind,[(r.get('album_title',r.get('song_title')),r['artist'],r['total_streams']) for r in result[kind][:15]])
if __name__=='__main__':compile_snapshot()
