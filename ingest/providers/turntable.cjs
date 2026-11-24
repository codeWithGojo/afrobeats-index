// TurnTable official Nigerian charts, collected by scripts/research/refresh-turntable.py.
// Chart positions keep the publisher's chart week; the check time is stored separately.
const id='turntable';
const collector=['scripts/research/refresh-turntable.py'];
const CHARTS={'nigeria-top100':'turntable-ng-top100-songs','nigeria-albums-top100':'turntable-ng-top100-albums'};

function rows(chart,name){
  return (chart.rows||[]).map(([rank,title,artist,last,weeks,peak,status])=>({
    chart:name,provider:id,week_start:chart.weekStart,week_end:chart.weekEnd,rank,title,artist_credit:artist,
    // 0 marks a new entry and negative values a re-entry in the publisher payload: no previous rank.
    last_rank:Number.isInteger(last)&&last>0?last:null,peak:Number.isInteger(peak)?peak:null,weeks_on:Number.isInteger(weeks)?weeks:null,
    status:status||null,source_url:chart.sourceUrl||null,observed_at:chart.checkedAt
  }));
}

function normalize(inputs){
  return {chart_positions:Object.entries(CHARTS).flatMap(([file,name])=>inputs[file]?rows(inputs[file],name):[])};
}

module.exports={id,collector,inputs:Object.keys(CHARTS),normalize};
