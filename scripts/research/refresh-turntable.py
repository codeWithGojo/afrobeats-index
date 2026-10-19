"""Refresh the official chart, preserving its publisher week and original positions."""
import datetime,json,pathlib,re,urllib.request
root=pathlib.Path(__file__).resolve().parents[2]
url='https://www.turntablecharts.com/charts/1'
raw=urllib.request.urlopen(url,timeout=30).read().decode()
match=re.search(r'<script id="__NEXT_DATA__" type="application/json">(.*?)</script>',raw)
if not match:raise ValueError('Official chart payload not found; previous snapshot retained')
chart=json.loads(match[1])['props']['pageProps']['chartData']
items=sorted(chart['chartItems'],key=lambda x:x['rank'])
if [x['rank'] for x in items]!=list(range(1,101)):raise ValueError('Incomplete official Top 100; previous snapshot retained')
end=datetime.date.fromisoformat(chart['dateCreated'][:10]);start=end-datetime.timedelta(days=6)
result={'checkedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'weekStart':str(start),'weekEnd':str(end),'sourceUrl':url,'publisherChartId':chart['id'],'rows':[[x['rank'],x['title'],x['artiste'],x.get('lastPosition') or 0,x['weeksOnChart'],x['highestPosition'],'NEW' if not x.get('lastPosition') else ''] for x in items]}
(root/'data/nigeria-top100.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
print('Official TurnTable Top 100:',start,'–',end,'100 positions checked')
