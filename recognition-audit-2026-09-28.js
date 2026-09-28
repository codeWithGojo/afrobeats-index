// Recognition register pass: 28 Sep 2026. Existing verified records are retained
// when a provider blocks automated access; an unavailable page is never a zero.
(function applyRecognitionAudit(){
  const state=window.AFRI_EMBEDDED_STATE;
  if(!state)return;
  const checkedAt="2026-09-28T00:00:00.000Z";
  Object.values(window.AFRI_RECOGNITION||{}).forEach(guide=>{
    guide.audited_at="2026-09-28";
    guide.coverage_status=(Number.isFinite(guide.wins)||Number.isFinite(guide.nominations)||guide.breakdown?.length)
      ?"structured_totals_retained"
      :"guide_checked_no_structured_total";
  });
  const slugs=new Set([
    ...Object.keys(window.AFRI_RECOGNITION||{}),
    ...(state.artists||[]).map(artist=>artist.slug),
    ...Object.keys(state.certifications||{})
  ]);
  state.certificationAudit ||= {};
  slugs.forEach(slug=>{
    const matches=(state.certifications?.[slug]||[]).length;
    state.certificationAudit[slug]={
      ...(state.certificationAudit[slug]||{}),
      status:matches?"matched_records_retained":"checked_no_match",
      checkedAt,
      matchedRecords:matches,
      registers:{
        RIAA:"provider_page_unavailable_retained_last_good",
        BPI:"provider_page_unavailable_retained_last_good",
        "Music Canada":"reachable",
        SNEP:"reachable",
        "TurnTable Charts":"reachable"
      }
    };
  });
})();
