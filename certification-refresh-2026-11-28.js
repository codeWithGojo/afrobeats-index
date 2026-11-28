// Additive refresh from the live Music Canada register; preserve source dates.
(function refreshCertifications(){
  const state=window.AFRI_EMBEDDED_STATE;
  if(!state)return;
  const checkedAt='2026-11-28T08:40:00.000Z';
  const sourceUrl='https://musiccanada.com/gold-platinum/';
  const rows=[
    {slug:'wizkid',title:'Brown Skin Girl',creditedArtist:'Blue Ivy, Saint Jhn, Beyoncé, Wizkid',tier:'Platinum',multiplier:1,certificationDate:'2026-11-23'},
    {slug:'wizkid',title:'Joro',creditedArtist:'Wizkid',tier:'Multi-Platinum',multiplier:2,certificationDate:'2026-11-20'},
    {slug:'wizkid',title:'Call Me Every Day',creditedArtist:'Chris Brown, Wizkid',tier:'Platinum',multiplier:1,certificationDate:'2026-11-20'},
    {slug:'wizkid',title:'Ginger',creditedArtist:'Wizkid, Burna Boy',tier:'Platinum',multiplier:1,certificationDate:'2026-11-20'},
    {slug:'burna-boy',title:'Ginger',creditedArtist:'Wizkid, Burna Boy',tier:'Platinum',multiplier:1,certificationDate:'2026-11-20'},
    {slug:'wizkid',title:'Fever',creditedArtist:'Wizkid',tier:'Gold',multiplier:1,certificationDate:'2026-11-19'}
  ];
  const ledger=state.certifications||(state.certifications={});
  for(const row of rows){
    const records=ledger[row.slug]||(ledger[row.slug]=[]);
    const record={title:row.title,creditedArtist:row.creditedArtist,format:'song',tier:row.tier,multiplier:row.multiplier,market:'Canada',authority:'Music Canada',certificationDate:row.certificationDate,sourceUrl,lastVerifiedAt:checkedAt};
    const old=records.find(x=>x.title===record.title&&x.market===record.market&&x.authority===record.authority);
    if(!old)records.push(record);
    else if(record.multiplier>=(old.multiplier||1)&&!(record.tier==='Gold'&&old.tier!=='Gold'))Object.assign(old,record);
  }
  state.meta.certificationsCheckedAt=checkedAt;
  state.meta.certificationsLastAttemptAt=checkedAt;
  state.meta.certificationProviderChecks={
    ...(state.meta.certificationProviderChecks||{}),
    'TurnTable Charts':{checkedAt,status:'revalidated',note:'Live register checked; latest listed certification date remains 6 Feb 2026.'},
    'RIAA':{checkedAt,status:'recent_register_checked',note:'Live register page checked; no Current or All-Time roster records appeared in the returned recent rows.'},
    'Music Canada':{checkedAt,status:'recent_register_checked',newMatches:6,note:'Five published certification rows dated 19–23 Nov 2026 added across six artist-record associations.'},
    'BPI':{checkedAt,status:'unavailable_404',note:'The previously used public register URL still returns 404.'},
    'SNEP':{checkedAt,status:'reachable_recent_register_checked',note:'Public register page is reachable; no Current or All-Time roster records appeared in the returned page content.'}
  };
})();
