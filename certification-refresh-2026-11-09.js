// Add only observed official records. Unavailable registers retain earlier evidence.
(function(){
 const s=window.AFRI_EMBEDDED_STATE;if(!s)return;
 const checkedAt='2026-11-09T16:40:00.000Z';
 const record={title:'Rush',creditedArtist:'Ayra Starr',format:'song',tier:'Platinum',multiplier:1,market:'United States',authority:'RIAA',certificationDate:'2026-11-05',sourceUrl:'https://www.riaa.com/gold-platinum/',lastVerifiedAt:checkedAt};
 const ledger=s.certifications||(s.certifications={}),entries=ledger['ayra-starr']||(ledger['ayra-starr']=[]);
 const existing=entries.find(r=>r.authority==='RIAA'&&r.title.toLowerCase()==='rush');
 if(existing)Object.assign(existing,record);else entries.push(record);
 s.meta.certificationsLastAttemptAt=checkedAt;
 s.meta.certificationProviderChecks={
  'TurnTable Charts':{checkedAt,status:'revalidated',publisherRows:500,artistMatches:512},
  'RIAA':{checkedAt,status:'recent_register_checked',newMatches:1},
  'Music Canada':{checkedAt,status:'recent_register_checked',newMatches:0},
  'BPI':{checkedAt,status:'unavailable_404',note:'Existing records retain earlier evidence dates.'},
  'SNEP':{checkedAt,status:'unavailable_403',note:'Existing records retain earlier evidence dates.'}
 };
})();
