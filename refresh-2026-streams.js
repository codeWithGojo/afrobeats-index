// Active 2026 leaderboard refresh, verified 7 Sep 2026 against Kworb artist ledgers.
// Prior-year snapshots are deliberately excluded from this mutation.
(function refreshActiveYearStreams(){
  const checkedAt="2026-09-07T00:00:00.000Z";
  const lastUpdated="2026-09-07";
  const norm=value=>String(value||"").toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g," ").trim();
  const albumValues={
    "asake|m ney":[450801006,1900149],
    "omah-lay|clarity of mind":[402586243,625434],
    "ayra-starr|starrgirl":[245760270,1599911],
    "wizkid|real vol 1":[177950840,358633],
    "davido|oriade":[96600869,1114863],
    "bnxn|the game needs us":[77200693,385630],
    "mavo|business":[72576061,532345],
    "asake|m ney live in london":[37601990,628956],
    "fola|hybrid":[30118914,64194],
    "odeal|for a good time":[14038502,227686]
  };
  const songValues={
    "wizkid|jogodo":[78298513,176022],
    "asake|gratitude":[56587333,393424],
    "mavo|big bum bum":[47418013,175211],
    "asake|forgiveness":[48932306,283615],
    "asake|worship":[50137825,210542],
    "bnxn|back outside":[43023625,217859],
    "wizkid|turbulence":[46691310,99929],
    "asake|mcbh":[38764363,234367],
    "blaqbonez|chanel":[36490579,254861],
    "mavo|aura salad":[32221577,123983],
    "asake|wa":[31552238,183445],
    "mavo|mofe":[28857469,80590],
    "asake|oba":[24961797,92012],
    "omah-lay|i am":[28525254,133307]
  };
  const yearly=window.AFRI_YEARLY_STREAMS;
  if(!yearly)return;
  let albumsUpdated=0,songsUpdated=0;
  (yearly.albums||[]).forEach(item=>{
    if(Number(item.year)!==2026)return;
    const fresh=albumValues[`${item.artist_slug}|${norm(item.album_title)}`];
    if(!fresh)return;
    item.streams_this_year=fresh[0];item.daily_streams=fresh[1];item.last_updated=lastUpdated;albumsUpdated++;
  });
  (yearly.songs||[]).forEach(item=>{
    if(Number(item.year)!==2026)return;
    const fresh=songValues[`${item.artist_slug}|${norm(item.song_title)}`];
    if(!fresh)return;
    item.streams_this_year=fresh[0];item.daily_streams=fresh[1];item.last_updated=lastUpdated;songsUpdated++;
  });
  yearly.active_year=2026;
  yearly.updated_at=checkedAt;
  yearly.source_audit={
    ...(yearly.source_audit||{}),
    spotify:"Kworb artist song and album ledgers",
    active_2026_albums:{status:"verified",rows_updated:albumsUpdated,total_rows:10},
    active_2026_songs:{status:"partial",rows_updated:songsUpdated,total_rows:15,retained_last_good:["burna-boy|Paparazzi"]},
    youtube:"retained_last_good",
    audiomack:"retained_last_good",
    boomplay:"retained_last_good",
    last_checked_at:checkedAt
  };
})();
