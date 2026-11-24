// Validates normalised rows before storage. Invalid rows are dropped and logged, never repaired by guessing.
const METRIC_CLASSES=new Set(['verified_count','estimated_count','chart_position','popularity','airplay','calculated_score']);
const CONFIDENCE=new Set(['first_party','third_party_ledger','official_chart','estimate','editorial']);
const PERIODS=new Set(['lifetime','daily','weekly','monthly']);
const isDate=value=>typeof value==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(value)&&!Number.isNaN(Date.parse(value+'T00:00:00Z'));
const isTime=value=>typeof value==='string'&&!Number.isNaN(Date.parse(value));
const isCount=value=>Number.isFinite(value)&&value>=0&&value<1e13;
const isSlug=value=>typeof value==='string'&&/^[a-z0-9-]+$/.test(value);
const isUrl=value=>{try{return ['http:','https:'].includes(new URL(value).protocol);}catch{return false;}};

function common(row,errors){
  if(!isSlug(row.provider))errors.push('provider');
  if(!row.metric||typeof row.metric!=='string')errors.push('metric');
  if(!METRIC_CLASSES.has(row.metric_class))errors.push('metric_class');
  if(!CONFIDENCE.has(row.confidence))errors.push('confidence');
  if(!isCount(row.value))errors.push('value');
  if(!isDate(row.source_date))errors.push('source_date');
  if(!isTime(row.observed_at))errors.push('observed_at');
  if(row.source_url!=null&&!isUrl(row.source_url))errors.push('source_url');
  if(isDate(row.source_date)&&isTime(row.observed_at)&&Date.parse(row.source_date+'T00:00:00Z')>Date.parse(row.observed_at)+86400000)errors.push('source_date_in_future');
}

const rules={
  track_stream_snapshots(row,errors){if(!row.track_key)errors.push('track_key');common(row,errors);},
  album_stream_snapshots(row,errors){if(!row.album_key)errors.push('album_key');common(row,errors);},
  artist_statistics(row,errors){if(!isSlug(row.artist_slug))errors.push('artist_slug');if(!PERIODS.has(row.period))errors.push('period');common(row,errors);},
  chart_positions(row,errors){
    if(!row.chart)errors.push('chart');
    if(!isDate(row.week_start)||!isDate(row.week_end)||row.week_start>row.week_end)errors.push('week');
    if(!Number.isInteger(row.rank)||row.rank<1||row.rank>500)errors.push('rank');
    if(!row.title||!row.artist_credit)errors.push('title');
    if(row.peak!=null&&(!Number.isInteger(row.peak)||row.peak<1||row.peak>row.rank))errors.push('peak');
    if(!isTime(row.observed_at))errors.push('observed_at');
  },
  ranking_snapshots(row,errors){
    if(!row.board)errors.push('board');
    if(!isDate(row.edition_date))errors.push('edition_date');
    if(!Number.isInteger(row.rank)||row.rank<1)errors.push('rank');
    if(!isSlug(row.artist_slug))errors.push('artist_slug');
    if(row.score!=null&&!(Number.isFinite(row.score)&&row.score>=0&&row.score<=100))errors.push('score');
    if(!row.method_version)errors.push('method_version');
  }
};

function validate(table,row){
  const rule=rules[table];if(!rule)return ['unknown_table'];
  const errors=[];rule(row,errors);return errors;
}

// Splits rows into valid ones and readable rejections.
function partition(table,rows){
  const valid=[],rejected=[];
  for(const row of rows){const errors=validate(table,row);if(errors.length)rejected.push({row,errors});else valid.push(row);}
  return {valid,rejected};
}

module.exports={validate,partition,METRIC_CLASSES};
