const saved=require('../data/nigeria-top100.json');
module.exports=async function checkChartLag(){
  try{
    const response=await fetch(saved.sourceUrl,{signal:AbortSignal.timeout(7000)});
    if(!response.ok)throw Error('Publisher HTTP '+response.status);
    const html=await response.text(),payload=html.match(/<script[^>]*id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
    const chart=JSON.parse(payload?.[1]).props.pageProps.chartData;
    if(chart.chartCategoryId!==1||!chart.dateCreated)throw Error('Unrecognized chart payload');
    const official=chart.dateCreated.slice(0,10);
    if(official>saved.weekEnd)console.error('TurnTable import behind',{saved:saved.weekEnd,official,action:'Run npm run refresh:charts'});
    return {saved:saved.weekEnd,official};
  }catch(error){console.warn('TurnTable source check unavailable:',error.message);return null}
};
