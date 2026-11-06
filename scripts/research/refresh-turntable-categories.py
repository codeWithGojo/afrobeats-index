"""Import the additional TurnTable categories without merging their dates or scores."""
import concurrent.futures,datetime,json,pathlib,re,urllib.request
ROOT=pathlib.Path(__file__).resolve().parents[2]
SPECS=[
(3,'artists','Official Artiste Top 100','Weekly','Artistes ranked across Nigerian streaming and airplay.','Artist / publisher points'),
(4,'streaming','Official Streaming Songs','Weekly','Songs ranked across streaming services in Nigeria.','Song / artist'),
(5,'radio','Official Radio Songs','Weekly','Songs ranked by Nigerian radio airplay.','Song / artist'),
(18,'producers','Official Producer Top 100','Weekly','Producers ranked across Nigerian streaming and airplay.','Producer / publisher points'),
(13,'international','Top International Songs','Specialist','International songs on the publisher’s Nigerian chart.','Song / artist'),
(14,'emerging','NXT Emerging Top Artistes','Specialist','The publisher’s chart for emerging artistes.','Artist / publisher points'),
(31,'recurrents','Top 100 Recurrents Chart','Specialist','Long-running songs tracked outside the main Top 100.','Song / artist'),
(20,'year-songs','Year-End Top 100 Songs','Archive','The publisher’s available year-end songs chart.','Song / artist'),
(21,'year-producers','Year-End Top Producer 100','Archive','The publisher’s available year-end producer chart.','Producer / publisher points'),
(22,'year-artists','Year-End Top Artiste 100','Archive','The publisher’s available year-end artiste chart.','Artist / publisher points'),
(16,'tv','Official TV Songs','Archive','Discontinued in December 2022; retained as a historical chart.','Song / artist'),
]
def get(spec):
 number,slug,title,group,description,label=spec
 url=f'https://www.turntablecharts.com/charts/{number}'
 raw=urllib.request.urlopen(url,timeout=40).read().decode()
 match=re.search(r'<script id="__NEXT_DATA__" type="application/json">(.*?)</script>',raw)
 if not match:raise ValueError(f'No publisher payload: {slug}')
 chart=json.loads(match[1])['props']['pageProps']['chartData']
 if chart['chartCategoryId']!=number:raise ValueError(f'Category mismatch: {slug}')
 items=sorted(chart['chartItems'],key=lambda x:x['rank'])
 if not items or [x['rank'] for x in items]!=list(range(1,len(items)+1)):raise ValueError(f'Invalid ranks: {slug}')
 rows=[]
 for item in items:
  if not item.get('title') or item.get('weeksOnChart',-1)<0:raise ValueError(f'Invalid row: {slug}')
  last=item.get('lastPosition')
  if last is None and item['weeksOnChart']==1:last=0
  status='RE-ENTRY' if last is not None and last<0 else 'NEW' if last==0 else ''
  rows.append([item['rank'],item['title'],item.get('artiste') or '',last,item['weeksOnChart'],item['highestPosition'],status])
 end=datetime.date.fromisoformat(chart['dateCreated'][:10]); start=end-datetime.timedelta(days=6)
 return dict(categoryId=number,slug=slug,title=title,publisherTitle=chart['category'],group=group,description=description,entryLabel=label,checkedAt=datetime.datetime.now(datetime.timezone.utc).isoformat(),weekStart=str(start),weekEnd=str(end),sourceUrl=url,publisherChartId=chart['id'],rows=rows)
if __name__=='__main__':
 with concurrent.futures.ThreadPoolExecutor(max_workers=5) as pool:charts=list(pool.map(get,SPECS))
 (ROOT/'data/turntable-categories.json').write_text(json.dumps(charts,ensure_ascii=False,indent=2)+'\n')
 for chart in charts:print(chart['slug'],len(chart['rows']),chart['weekStart'],chart['weekEnd'])
