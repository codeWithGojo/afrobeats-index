// Additive certification refresh. Missing provider records never remove prior plaques.
(function(){
 const s=window.AFRI_EMBEDDED_STATE;if(!s)return;
 const fresh={"rema": [{"title": "Secondhand (feat. Rema)", "creditedArtist": "Don Toliver feat. Rema", "format": "song", "tier": "Platinum", "multiplier": 1, "market": "Canada", "authority": "Music Canada", "certificationDate": "2026-09-25", "sourceUrl": "https://musiccanada.com/gold-platinum/", "lastVerifiedAt": "2026-10-05T07:18:05.000Z"}], "burna-boy": [{"title": "Dai Dai", "creditedArtist": "Shakira & Burna Boy", "format": "song", "tier": "Multi-Platinum", "multiplier": 2, "market": "Canada", "authority": "Music Canada", "certificationDate": "2026-09-21", "sourceUrl": "https://musiccanada.com/gold-platinum/", "lastVerifiedAt": "2026-10-05T07:18:05.000Z"}]};
 const norm=v=>String(v||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
 const ledger=s.certifications||(s.certifications={});
 for(const [slug,records] of Object.entries(fresh)){
  const existing=ledger[slug]||(ledger[slug]=[]);
  for(const record of records){
   const match=existing.find(r=>norm(r.title)===norm(record.title)&&r.market===record.market&&r.authority===record.authority);
   if(!match)existing.push(record);
   else if((record.multiplier||1)>=(match.multiplier||1)&&!(record.tier==='Gold'&&match.tier!=='Gold'))Object.assign(match,record);
  }
 }
 s.meta.certificationsCheckedAt='2026-10-05T07:18:05.000Z';
 s.certificationAudit ||= {};
 for(const slug of new Set([...(s.artists||[]).map(a=>a.slug),...Object.keys(ledger)])){
  s.certificationAudit[slug]={...(s.certificationAudit[slug]||{}),checkedAt:s.meta.certificationsCheckedAt,matchedRecords:(ledger[slug]||[]).length,registers:{RIAA:'reachable_recent_page_checked_existing_records_retained',BPI:'404_existing_records_retained','Music Canada':'recent_register_checked_new_matches_added',SNEP:'recent_register_checked_existing_records_retained','TurnTable Charts':'500_entries_rechecked_no_new_records'}};
 }
})();
