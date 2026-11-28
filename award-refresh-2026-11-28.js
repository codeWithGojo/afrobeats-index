// Add the newly announced 2027 Grammy nominations without replacing history.
(function refreshAwardNominations(){
  const state=window.AFRI_EMBEDDED_STATE;
  if(!state)return;
  const checkedAt='2026-11-28T08:40:00.000Z';
  const sourceUrl='https://www.grammy.com/news/2027-grammys-full-nominations-full-winners-nominees-list/';
  const rows=[
    {slug:'asake',work:'Gratitude'},
    {slug:'ayra-starr',work:'Aye Kan (Are You Coming Back?)'},
    {slug:'tems',work:'Big Daddy'},
    {slug:'wizkid',work:'Jogodo'},
    {slug:'asake',work:'Jogodo'}
  ];
  const awards=state.awards||(state.awards={});
  for(const row of rows){
    const records=awards[row.slug]||(awards[row.slug]=[]);
    const record={name:'Grammy Awards',organisation:'Recording Academy',year:2027,category:'Best African Music Performance',work:row.work,result:'nominee',sourceUrl,lastVerifiedAt:checkedAt,eventDate:'2026-11-16',announcedDate:'2026-11-16',ceremonyDate:'2027-02-07'};
    const old=records.find(x=>x.organisation===record.organisation&&x.year===record.year&&x.category===record.category&&x.work===record.work);
    if(old)Object.assign(old,record);else records.push(record);
  }
  state.meta.awardsLastAttemptAt=checkedAt;
})();
