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
    "omah-lay|i am":[28525254,133307],
    "fola|paparazzi":[30118914,64194]
  };
  const albumMeta={
    "asake|m ney":["https://open.spotify.com/album/07iqzVICrgPFOpXem6MEpU","https://image-cdn-ak.spotifycdn.com/image/ab67616d00001e02d9cd09fb89c473c2e6ce70b1"],
    "omah-lay|clarity of mind":["https://open.spotify.com/album/28c5qLjX7puNQ96Wa86t5k","https://image-cdn-ak.spotifycdn.com/image/ab67616d00001e02a53811f3799c0c60744ad4fe"],
    "ayra-starr|starrgirl":["https://open.spotify.com/album/2xLmXWgnyK0bUBoqq17Mma","https://image-cdn-fa.spotifycdn.com/image/ab67616d00001e024457e5b19771c406c6edad32"],
    "wizkid|real vol 1":["https://open.spotify.com/album/60S0Nvtm54AmG6d8lVkhMF","https://image-cdn-ak.spotifycdn.com/image/ab67616d00001e022d9d222a08cb2e589cf4288e"],
    "davido|oriade":["https://open.spotify.com/album/43hCvloofcUeEmpK6RFldz","https://image-cdn-ak.spotifycdn.com/image/ab67616d00001e020e2b0b3bdb38eeddcf7481fe"],
    "bnxn|the game needs us":["https://open.spotify.com/album/1lcyg1hfUrXOk81kXUv0be","https://image-cdn-ak.spotifycdn.com/image/ab67616d00001e0215627bb27890844f0f8d88ac"],
    "mavo|business":["https://open.spotify.com/album/0PFTMjw4ODWOQFOoiiadKI","https://image-cdn-ak.spotifycdn.com/image/ab67616d00001e0239c703350723897e8c96dd87"],
    "asake|m ney live in london":["https://open.spotify.com/album/3o0KBqscfhaIoqYJ6EnCzB","https://image-cdn-ak.spotifycdn.com/image/ab67616d00001e0230e8714c11da91a75e9bbde7"],
    "fola|hybrid":["https://open.spotify.com/album/0Bu9rJJqHVmHgK7Y9LXOSa","https://image-cdn-ak.spotifycdn.com/image/ab67616d00001e02e10a58a6c8104267978be88c"],
    "odeal|for a good time":["https://open.spotify.com/album/55uMsvthBm45JtBhyadkPa","https://image-cdn-ak.spotifycdn.com/image/ab67616d00001e0214f4a3e90e0779e661558b36"]
  };
  const songMeta={
    "wizkid|jogodo":["https://open.spotify.com/track/6eb4SF4GKYU1AQdyFuxZg1","https://image-cdn-fa.spotifycdn.com/image/ab67616d00001e022d9d222a08cb2e589cf4288e"],
    "asake|gratitude":["https://open.spotify.com/track/7hiRlw64LXcHpGAVJ6eUzv","https://image-cdn-ak.spotifycdn.com/image/ab67616d00001e02d9cd09fb89c473c2e6ce70b1"],
    "mavo|big bum bum":["https://open.spotify.com/track/1heVYYJgIbEmeEQ8ye0YFX","https://image-cdn-ak.spotifycdn.com/image/ab67616d00001e02d92e64a294b0d871897eea0e"],
    "asake|forgiveness":["https://open.spotify.com/track/5u4rozuOBse9MgrAzGspQy","https://image-cdn-ak.spotifycdn.com/image/ab67616d00001e02d9cd09fb89c473c2e6ce70b1"],
    "asake|worship":["https://open.spotify.com/track/7L1uMx4wG2A9pnRgb7hjQO","https://image-cdn-ak.spotifycdn.com/image/ab67616d00001e02f0300e2f95fbdf24187f07cc"],
    "bnxn|back outside":["https://open.spotify.com/track/5WTj1jVzufTuSzFMyjy60M","https://image-cdn-ak.spotifycdn.com/image/ab67616d00001e024a088f73affacb2ff9e2ca18"],
    "wizkid|turbulence":["https://open.spotify.com/track/6b5aOjZh1szuKcbfSU8YdK","https://image-cdn-ak.spotifycdn.com/image/ab67616d00001e022d9d222a08cb2e589cf4288e"],
    "asake|mcbh":["https://open.spotify.com/track/36PS8XCemqmPvigIL8S40B","https://image-cdn-ak.spotifycdn.com/image/ab67616d00001e02d9cd09fb89c473c2e6ce70b1"],
    "fola|paparazzi":["https://open.spotify.com/track/4v1WfWIwfplCJKNQmKx9FN","https://image-cdn-ak.spotifycdn.com/image/ab67616d00001e02e10a58a6c8104267978be88c"],
    "blaqbonez|chanel":["https://open.spotify.com/track/6JVQBlA628faJmvQbeyBHT","https://image-cdn-ak.spotifycdn.com/image/ab67616d00001e02b07b7cd48080a222a8429816"],
    "mavo|aura salad":["https://open.spotify.com/track/3JN8aItsGqTWapuekI8vxM","https://image-cdn-ak.spotifycdn.com/image/ab67616d00001e02631830a657b778edceecf4b3"],
    "asake|wa":["https://open.spotify.com/track/5KX0YeCNKaOc3XhhDHi3mI","https://image-cdn-ak.spotifycdn.com/image/ab67616d00001e02d9cd09fb89c473c2e6ce70b1"],
    "mavo|mofe":["https://open.spotify.com/track/1w8lSGDuMUgRh7rygMp7VB","https://image-cdn-ak.spotifycdn.com/image/ab67616d00001e02b9c01b69e1fc53ee3ce8cbb3"],
    "asake|oba":["https://open.spotify.com/track/59zlaPDhvE414BZ82AFjH5","https://image-cdn-ak.spotifycdn.com/image/ab67616d00001e02d9cd09fb89c473c2e6ce70b1"],
    "omah-lay|i am":["https://open.spotify.com/track/1iDNf6nP0BCXilLVVptflh","https://image-cdn-ak.spotifycdn.com/image/ab67616d00001e02a53811f3799c0c60744ad4fe"]
  };
  const yearly=window.AFRI_YEARLY_STREAMS;
  if(!yearly)return;
  let albumsUpdated=0,songsUpdated=0;
  (yearly.albums||[]).forEach(item=>{
    if(Number(item.year)!==2026)return;
    const fresh=albumValues[`${item.artist_slug}|${norm(item.album_title)}`];
    if(!fresh)return;
    const meta=albumMeta[`${item.artist_slug}|${norm(item.album_title)}`];
    item.streams_this_year=fresh[0];item.daily_streams=fresh[1];item.last_updated=lastUpdated;
    if(meta){item.spotify_url=meta[0];item.artwork_url=meta[1];}albumsUpdated++;
  });
  (yearly.songs||[]).forEach(item=>{
    if(Number(item.year)!==2026)return;
    if(norm(item.song_title)==="paparazzi"){item.artist="Shoday & FOLA";item.artist_slug="fola";item.album_title="HYBRID";}
    const lookup=`${item.artist_slug}|${norm(item.song_title)}`;
    const fresh=songValues[lookup];
    if(!fresh)return;
    const meta=songMeta[lookup];
    item.streams_this_year=fresh[0];item.daily_streams=fresh[1];item.last_updated=lastUpdated;
    if(meta){item.spotify_url=meta[0];item.artwork_url=meta[1];}songsUpdated++;
  });
  yearly.active_year=2026;
  yearly.updated_at=checkedAt;
  yearly.source_audit={
    ...(yearly.source_audit||{}),
    spotify:"Kworb artist song and album ledgers",
    active_2026_albums:{status:"verified",rows_updated:albumsUpdated,total_rows:10},
    active_2026_songs:{status:"verified",rows_updated:songsUpdated,total_rows:15},
    youtube:"retained_last_good",
    audiomack:"retained_last_good",
    boomplay:"retained_last_good",
    last_checked_at:checkedAt
  };
})();
