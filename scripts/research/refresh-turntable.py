"""Refresh both official Top 100 charts, preserving publisher weeks and positions."""
import datetime,json,pathlib,re,urllib.request
root=pathlib.Path(__file__).resolve().parents[2]
def snapshot(chart,url):
    items=sorted(chart['chartItems'],key=lambda x:x['rank'])
    if [x['rank'] for x in items]!=list(range(1,101)):
        raise ValueError('Incomplete official Top 100; previous snapshot retained')
    for item in items:
        if not item.get('title') or not item.get('artiste') or not 1<=item['highestPosition']<=item['rank'] or item['weeksOnChart']<1:
            raise ValueError('Invalid official chart row; previous snapshot retained')
    end=datetime.date.fromisoformat(chart['dateCreated'][:10]);start=end-datetime.timedelta(days=6)
    rows=[]
    for item in items:
        last=item.get('lastPosition')
        if last is None and item['weeksOnChart']==1:last=0
        status='RE-ENTRY' if last is not None and last<0 else 'NEW' if last==0 else ''
        rows.append([item['rank'],item['title'],item['artiste'],last,item['weeksOnChart'],item['highestPosition'],status])
    return {'checkedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'weekStart':str(start),'weekEnd':str(end),'sourceUrl':url,'publisherChartId':chart['id'],'rows':rows}

if __name__=='__main__':
    pending=[]
    for number,filename in [(1,'nigeria-top100.json'),(2,'nigeria-albums-top100.json')]:
        url=f'https://www.turntablecharts.com/charts/{number}'
        raw=urllib.request.urlopen(url,timeout=30).read().decode()
        match=re.search(r'<script id="__NEXT_DATA__" type="application/json">(.*?)</script>',raw)
        if not match:raise ValueError('Official chart payload not found; previous snapshots retained')
        chart=json.loads(match[1])['props']['pageProps']['chartData']
        if chart['chartCategoryId']!=number:raise ValueError('Wrong chart category; previous snapshots retained')
        pending.append((filename,snapshot(chart,url)))
    # Validate both responses before replacing either last-good snapshot.
    for filename,result in pending:
        (root/'data'/filename).write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
        print(filename,result['weekStart'],'–',result['weekEnd'],'100 positions checked')
