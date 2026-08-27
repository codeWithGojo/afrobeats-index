(function () {
  "use strict";

  const UPDATED_AT = "2026-08-27T00:00:00.000Z";
  const TURNTABLE_URL = "https://www.turntablecharts.com/certification";
  const GRAMMY_AFRICAN_URL = "https://www.grammy.com/awards/categories/best-african-music-performance/";
  const AFRIMA_URL = "https://afrima.org/2026/01/21/9th-afrima-rema-beats-davido-burna-boy-tyla-dj-maphorisa-amr-diab-shallipopi-to-win-artiste-of-the-year/";

  const award = (body, category, year, result, tier, work, sourceUrl) => ({
    body,
    category,
    year,
    result,
    tier,
    ...(work ? { work } : {}),
    sourceUrl,
    lastVerifiedAt: UPDATED_AT
  });

  const awards = {
    "burna-boy": [
      award("Grammy Awards", "Best Global Music Album", 2021, "won", 1, "Twice As Tall", "https://www.grammy.com/news/burna-boy-wins-best-global-music-album-twice-tall-2021-grammy-awards-show/"),
      award("BET Awards", "Best International Act", 2019, "won", 1, null, "https://www.bet.com/bet-awards/video-clips/5zx8wq/burna-boy-wins-best-international-act"),
      award("BET Awards", "Best International Act", 2020, "won", 1, null, "https://www.bet.com/bet-awards/video-clips/p9j145/bet-awards-2020-burna-boy-wins-the-best-international-act-award"),
      award("BET Awards", "Best International Act", 2021, "won", 1, null, "https://www.bet.com/bet-awards/video-clips/esxgld/bet-awards-2021-burna-boy-wins-the-best-international-act-award"),
      award("BET Awards", "Best International Act", 2023, "won", 1, null, "https://www.bet.com/bet-awards/articles/erlxre/bet-awards-burna-boy-2023-wins-best-international-act"),
      award("AFRIMA", "Album of the Year", 2026, "won", 1, "No Sign of Weakness", AFRIMA_URL),
      award("Grammy Awards", "Best African Music Performance", 2024, "nominated", 1, "City Boys", GRAMMY_AFRICAN_URL),
      award("Grammy Awards", "Best African Music Performance", 2025, "nominated", 1, "Higher", GRAMMY_AFRICAN_URL),
      award("Grammy Awards", "Best African Music Performance", 2026, "nominated", 1, "Love", GRAMMY_AFRICAN_URL),
      award("AFRIMA", "Artiste of the Year", 2026, "nominated", 1, null, AFRIMA_URL)
    ],
    "wizkid": [
      award("Grammy Awards", "Best Music Video", 2021, "won", 1, "Brown Skin Girl", "https://www.grammy.com/artists/wizkid/287616"),
      award("BET Awards", "Best International Act: Africa", 2012, "won", 1, null, "https://www.bet.com/photo-gallery/f7ajm7/bet-awards-2012-the-winners/xj60vw"),
      award("MOBO Awards", "Best International Act", 2017, "won", 1, null, "https://www.mobo.com/mobo-awards-2017"),
      award("MOBO Awards", "Best African Act", 2020, "won", 1, null, "https://mobo.com/news/nines-mahalia-headie-one-and-aitch-score-top-prizes-mobo-awards-2020"),
      award("Grammy Awards", "Best Global Music Performance", 2022, "nominated", 1, "Essence", "https://www.grammy.com/artists/wizkid/287616"),
      award("Grammy Awards", "Best African Music Performance", 2025, "nominated", 1, "MMS", GRAMMY_AFRICAN_URL),
      award("Grammy Awards", "Best African Music Performance", 2026, "nominated", 1, "Gimme Dat", GRAMMY_AFRICAN_URL)
    ],
    "tems": [
      award("Grammy Awards", "Best Melodic Rap Performance", 2023, "won", 1, "WAIT FOR U", "https://www.grammy.com/artists/Tems/38505/"),
      award("Grammy Awards", "Best African Music Performance", 2025, "won", 1, "Love Me JeJe", "https://www.grammy.com/awards/categories/best-african-music-performance/2025/"),
      award("BET Awards", "Best International Act", 2022, "won", 1, null, "https://www.bet.com/bet-awards/articles/femd2g/bet-awards-2022-best-international-artist-winner-tems"),
      award("Grammy Awards", "Best Global Music Performance", 2022, "nominated", 1, "Essence", "https://www.grammy.com/artists/Tems/38505/"),
      award("Grammy Awards", "Best Song Written for Visual Media", 2024, "nominated", 1, "Lift Me Up", "https://www.grammy.com/artists/Tems/38505/"),
      award("Grammy Awards", "Best Global Music Album", 2025, "nominated", 1, "Born in the Wild", "https://www.grammy.com/artists/Tems/38505/"),
      award("Grammy Awards", "Best R&B Song", 2025, "nominated", 1, "Burning", "https://www.grammy.com/artists/Tems/38505/")
    ],
    "tyla": [
      award("Grammy Awards", "Best African Music Performance", 2024, "won", 1, "Water", "https://www.grammy.com/awards/categories/best-african-music-performance/2024/"),
      award("Grammy Awards", "Best African Music Performance", 2026, "won", 1, "PUSH 2 START", GRAMMY_AFRICAN_URL),
      award("BET Awards", "Best International Act", 2024, "nominated", 1, null, "https://www.bet.com/bet-awards/articles/7nl4ms/bet-awards-2024-see-the-full-winners-list"),
      award("AFRIMA", "Artiste of the Year", 2026, "nominated", 1, null, AFRIMA_URL)
    ],
    "rema": [
      award("AFRIMA", "Artiste of the Year", 2026, "won", 1, null, AFRIMA_URL),
      award("AFRIMA", "Best African Artiste in R&B & Soul", 2026, "won", 2, null, AFRIMA_URL),
      award("Grammy Awards", "Best Global Music Album", 2025, "nominated", 1, "HEIS", "https://www.grammy.com/news/2025-grammys-nominations-full-winners-nominees-list/")
    ],
    "davido": [
      award("MOBO Awards", "Best African Act", 2017, "won", 1, null, "https://www.mobo.com/mobo-awards-2017"),
      award("Grammy Awards", "Best African Music Performance", 2024, "nominated", 1, "UNAVAILABLE", GRAMMY_AFRICAN_URL),
      award("Grammy Awards", "Best African Music Performance", 2025, "nominated", 1, "Sensational", GRAMMY_AFRICAN_URL),
      award("Grammy Awards", "Best African Music Performance", 2026, "nominated", 1, "With You", GRAMMY_AFRICAN_URL),
      award("AFRIMA", "Artiste of the Year", 2026, "nominated", 1, null, AFRIMA_URL)
    ],
    "asake": [
      award("MOBO Awards", "Best African Music Act", 2024, "won", 1, null, "https://mobo.com/history/2024"),
      award("Grammy Awards", "Best African Music Performance", 2024, "nominated", 1, "Amapiano", GRAMMY_AFRICAN_URL),
      award("Grammy Awards", "Best African Music Performance", 2025, "nominated", 1, "MMS", GRAMMY_AFRICAN_URL)
    ],
    "ayra-starr": [
      award("Grammy Awards", "Best African Music Performance", 2024, "nominated", 1, "Rush", GRAMMY_AFRICAN_URL),
      award("Grammy Awards", "Best African Music Performance", 2026, "nominated", 1, "Gimme Dat", GRAMMY_AFRICAN_URL),
      award("AFRIMA", "Artiste of the Year", 2026, "nominated", 1, null, AFRIMA_URL),
      award("BET Awards", "Best International Act", 2024, "nominated", 1, null, "https://www.bet.com/bet-awards/articles/7nl4ms/bet-awards-2024-see-the-full-winners-list")
    ],
    "olamide": [award("Grammy Awards", "Best African Music Performance", 2024, "nominated", 1, "Amapiano", GRAMMY_AFRICAN_URL)],
    "shallipopi": [
      award("AFRIMA", "Song of the Year", 2026, "won", 2, "Laho", AFRIMA_URL),
      award("AFRIMA", "Best African Collaboration", 2026, "won", 2, "Laho", AFRIMA_URL),
      award("AFRIMA", "Artiste of the Year", 2026, "nominated", 1, null, AFRIMA_URL)
    ],
    "phyno": [award("AFRIMA", "Best African Artiste in Hip-Hop", 2026, "won", 2, null, AFRIMA_URL)],
    "ciza": [award("AFRIMA", "Breakout Artiste of the Year", 2026, "won", 2, null, AFRIMA_URL)],
    "moliy": [
      award("AFRIMA", "Breakout Artiste of the Year", 2026, "nominated", 2, null, AFRIMA_URL),
      award("AFRIMA", "Best African Collaboration", 2026, "nominated", 2, "Shake It to the Max", AFRIMA_URL)
    ],
    "fola": [award("AFRIMA", "Most Promising Artiste of the Year", 2026, "nominated", 2, null, AFRIMA_URL)],
    "focalistic": [award("BET Awards", "Best International Act", 2024, "nominated", 1, null, "https://www.bet.com/bet-awards/articles/7nl4ms/bet-awards-2024-see-the-full-winners-list")],
    "uncle-waffles": [award("AFRIMA", "Best African Collaboration", 2026, "nominated", 2, "Zenzele", AFRIMA_URL)],
    "stonebwoy": [award("AFRIMA", "Best African Artiste in African Traditional", 2026, "nominated", 2, "Jejereje", AFRIMA_URL)]
  };

  const certification = (title, artist, level, format = "Single") => ({
    title,
    artist,
    level,
    certified_date: "2026-02-06",
    format,
    sourceUrl: TURNTABLE_URL,
    lastVerifiedAt: UPDATED_AT
  });

  const certifications = {
    "asake": [certification("Lonely At The Top", "Asake", "8xPlatinum"), certification("Terminator", "Asake", "7xPlatinum"), certification("Bandana", "Fireboy DML & Asake", "7xPlatinum"), certification("MMS", "Asake & Wizkid", "6xPlatinum"), certification("Organise", "Asake", "3xPlatinum")],
    "fireboy-dml": [certification("Bandana", "Fireboy DML & Asake", "7xPlatinum"), certification("Dealer", "Ayo Maff & Fireboy DML", "5xPlatinum"), certification("Iseoluwa", "Fireboy DML", "Platinum"), certification("Everyday", "Fireboy DML", "Platinum"), certification("All Of Us (Ashawo)", "Fireboy DML", "Platinum")],
    "omah-lay": [certification("Soso", "Omah Lay", "6xPlatinum"), certification("Reason", "Omah Lay", "5xPlatinum"), certification("Moving", "Omah Lay", "Platinum"), certification("Bend You", "Omah Lay", "Platinum"), certification("Attention", "Omah Lay & Justin Bieber", "Platinum")],
    "seyi-vibez": [certification("Cana", "Seyi Vibez", "6xPlatinum"), certification("Gwagwalada", "BNXN, Seyi Vibez & Kizz Daniel", "5xPlatinum"), certification("Different Pattern", "Seyi Vibez", "4xPlatinum"), certification("Shaolin", "Seyi Vibez", "3xPlatinum"), certification("Karma", "Seyi Vibez", "3xPlatinum")],
    "burna-boy": [certification("Last Last", "Burna Boy", "5xPlatinum"), certification("Common Person", "Burna Boy", "3xPlatinum"), certification("Do I", "Phyno & Burna Boy", "Platinum"), certification("Tested, Approved & Trusted", "Burna Boy", "Platinum"), certification("Way Too Big", "Burna Boy", "Platinum")],
    "wizkid": [certification("MMS", "Asake & Wizkid", "6xPlatinum"), certification("Kai!", "Olamide & Wizkid", "Platinum"), certification("Jogodo", "Wizkid & Asake", "Platinum"), certification("Gimme Dat", "Ayra Starr & Wizkid", "Platinum"), certification("A Million Blessings", "Wizkid", "Platinum")],
    "bnxn": [certification("Gwagwalada", "BNXN, Seyi Vibez & Kizz Daniel", "5xPlatinum"), certification("Pidgin & English", "BNXN", "3xPlatinum"), certification("Kilometer", "BNXN ft. Zinoleesky", "Platinum"), certification("I Alone", "BNXN", "Platinum"), certification("For Days", "BNXN", "Platinum")],
    "kizz-daniel": [certification("Gwagwalada", "BNXN, Seyi Vibez & Kizz Daniel", "5xPlatinum"), certification("Twe Twe", "Kizz Daniel & Davido", "5xPlatinum"), certification("Al-Jannah", "Kizz Daniel, ODUMODUBLVCK & Bella Shmurda", "Platinum"), certification("Shu-Peru", "Kizz Daniel", "Platinum"), certification("My G", "Kizz Daniel", "Platinum")],
    "davido": [certification("Twe Twe", "Kizz Daniel & Davido", "5xPlatinum"), certification("Funds", "Davido, ODUMODUBLVCK & Chike", "3xPlatinum"), certification("Kante", "Davido ft. FAVE", "3xPlatinum"), certification("The Best", "Davido ft. Mayorkun", "Platinum"), certification("Champion Sound", "Davido ft. Focalistic", "Platinum")],
    "odumodublvck": [certification("Cast", "Shallipopi ft. ODUMODUBLVCK", "5xPlatinum"), certification("Blood On The Dance Floor", "ODUMODUBLVCK, Bloody Civilian & Wale", "3xPlatinum"), certification("Funds", "Davido, ODUMODUBLVCK & Chike", "3xPlatinum"), certification("Legolas", "ODUMODUBLVCK", "Platinum"), certification("Big Time", "ODUMODUBLVCK ft. Wizkid", "Platinum")],
    "shallipopi": [certification("Cast", "Shallipopi ft. ODUMODUBLVCK", "5xPlatinum"), certification("Elon Musk", "Shallipopi", "Platinum"), certification("Oscroh (Pepperline)", "Shallipopi", "Platinum"), certification("Evil Receive", "Shallipopi", "Platinum"), certification("Never Ever", "Shallipopi", "Platinum")],
    "chike": [certification("Egwu", "Chike & Mohbad", "5xPlatinum"), certification("Funds", "Davido, ODUMODUBLVCK & Chike", "3xPlatinum"), certification("Could This Be Love", "Nasboi & Chike", "Platinum")],
    "ayra-starr": [certification("Rush", "Ayra Starr", "3xPlatinum"), certification("Who's Dat Girl", "Ayra Starr & Rema", "Platinum"), certification("Gimme Dat", "Ayra Starr & Wizkid", "Platinum"), certification("Hot Body", "Ayra Starr", "Platinum"), certification("Stamina", "Tiwa Savage, Ayra Starr & Young Jonn", "Platinum")],
    "rema": [certification("Soweto", "Victony, Tempoe & Rema ft. Don Toliver", "3xPlatinum"), certification("Who's Dat Girl", "Ayra Starr & Rema", "Platinum"), certification("Azaman", "Rema", "Platinum"), certification("Bout U", "Rema", "Platinum")],
    "fola": [certification("You", "FOLA", "3xPlatinum"), certification("Healer", "FOLA", "Platinum")],
    "young-jonn": [certification("Stronger", "Young Jonn", "3xPlatinum"), certification("Che Che", "Young Jonn ft. Asake", "Platinum"), certification("Cash Flow", "Young Jonn ft. Wizkid", "Platinum"), certification("2Factor", "Young Jonn, Asake & Focalistic", "Platinum"), certification("If You Leave", "Young Jonn", "Platinum")],
    "adekunle-gold": [certification("Party No Dey Stop", "Adekunle Gold & Zinoleesky", "3xPlatinum"), certification("Pami", "DJ Tunez ft. Wizkid, Adekunle Gold & Omah Lay", "Platinum"), certification("Sinner", "Adekunle Gold ft. Lucky Daye", "Platinum")],
    "victony": [certification("Soweto", "Victony, Tempoe & Rema ft. Don Toliver", "3xPlatinum"), certification("Kolomental", "Victony", "Platinum"), certification("Ohema", "Victony", "Platinum"), certification("Holy Father", "Mayorkun ft. Victony", "Platinum")],
    "olamide": [certification("Sometimes", "T.I BLAZE ft. Olamide", "3xPlatinum"), certification("Kai!", "Olamide & Wizkid", "Platinum"), certification("New Religion", "Olamide & Asake", "Platinum"), certification("Uptown Disco", "Olamide, Fireboy DML & Asake", "Platinum"), certification("Hello Habibi", "Olamide", "Platinum")],
    "bella-shmurda": [certification("My Brother", "Bella Shmurda", "Platinum"), certification("Loner", "Bella Shmurda", "Platinum"), certification("Al-Jannah", "Kizz Daniel, ODUMODUBLVCK & Bella Shmurda", "Platinum"), certification("Rush", "Bella Shmurda", "Platinum"), certification("World", "Dangbana Republik & Bella Shmurda", "Platinum")],
    "ruger": [certification("Romeo Must Die", "BNXN & Ruger", "Platinum"), certification("Toma Toma", "Ruger & Tiwa Savage", "Platinum"), certification("Bounce", "Ruger", "Platinum"), certification("Dior", "Ruger", "Platinum")],
    "black-sherif": [certification("So It Goes", "Black Sherif & Fireboy DML", "Platinum"), certification("Soja", "Black Sherif", "Platinum"), certification("Second Sermon (Remix)", "Black Sherif ft. Burna Boy", "Platinum")],
    "joeboy": [certification("Body & Soul", "Joeboy", "Platinum"), certification("Show Me", "Joeboy", "Platinum"), certification("Focus", "Joeboy", "Platinum"), certification("Adenuga", "Joeboy & Qing Madi", "Platinum")],
    "tiwa-savage": [certification("Toma Toma", "Ruger & Tiwa Savage", "Platinum"), certification("Loaded", "Tiwa Savage & Asake", "Platinum"), certification("Stamina", "Tiwa Savage, Ayra Starr & Young Jonn", "Platinum")],
    "mavo": [certification("Tumo Weto", "Mavo", "Platinum"), certification("Money Constant", "DJ Maphorisa, DJ Tunez, Wizkid & Mavo", "Platinum")],
    "shoday": [certification("Gaddem", "Rybeena & Shoday", "Platinum"), certification("Casablanca", "Shoday ft. Ayo Maff", "Platinum"), certification("Hey Jago", "Poco Lee, Shoday & Rahman Jago", "Platinum")],
    "king-promise": [certification("Terminator", "King Promise", "Platinum"), certification("Sugarcane (Remix)", "Camidoh ft. Mayorkun, Darkoo & King Promise", "Platinum")],
    "zlatan": [certification("Bust Down", "Zlatan ft. Asake", "Platinum"), certification("Hallelu", "Masterkraft ft. Bella Shmurda & Zlatan", "Platinum")],
    "sarz": [certification("Getting Paid", "Sarz, Asake, Wizkid & Skillibeng", "Platinum"), certification("Monalisa", "Lojay ft. Sarz & Chris Brown", "Platinum")],
    "darkoo": [certification("Sugarcane (Remix)", "Camidoh ft. Mayorkun, Darkoo & King Promise", "Platinum"), certification("Billionaires Club", "Olamide, Wizkid & Darkoo", "Platinum")],
    "focalistic": [certification("Champion Sound", "Davido ft. Focalistic", "Platinum"), certification("Ke Star (Remix)", "Focalistic & Davido ft. Virgo Deep", "Platinum"), certification("2Factor", "Young Jonn, Asake & Focalistic", "Platinum")],
    "lojay": [certification("Monalisa", "Lojay ft. Sarz & Chris Brown", "Platinum")],
    "khaid": [certification("Jolie", "Khaid", "Platinum")],
    "phyno": [certification("Do I", "Phyno & Burna Boy", "Platinum")],
    "oxlade": [certification("Ku Lo Sa - A Colors Show", "Oxlade", "Platinum")],
    "ckay": [certification("Emiliana", "CKay", "Platinum")],
    "fave": [certification("Kante", "Davido ft. FAVE", "3xPlatinum")],
    "ciza": [certification("Isaka (6AM)", "Ciza, Tems & Omah Lay", "Platinum")]
  };

  const awardTierWeight = { 1: 5, 2: 2, 3: 0.75 };
  const awardResultWeight = { won: 1, nominated: 0.3 };
  const certificationWeight = { Gold: 1, Platinum: 2, "2xPlatinum": 3, "3xPlatinum": 4, "4xPlatinum": 5, "5xPlatinum": 6, "6xPlatinum": 7, "7xPlatinum": 8, "8xPlatinum": 9 };

  const logNormalize = (value, maximum) => maximum > 0 ? Math.log1p(Math.max(0, value)) / Math.log1p(maximum) * 100 : 0;
  const round = (value) => Math.round(value * 10) / 10;
  const median = (values) => {
    const sorted = values.filter(Number.isFinite).sort((a, b) => a - b);
    if (!sorted.length) return 50;
    const middle = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
  };

  function applyRankingUpgrade(state) {
    if (!state || !Array.isArray(state.artists)) return state;
    const artists = state.artists;
    const awardRaw = new Map();
    const certRaw = new Map();
    const spotifyMax = Math.max(...artists.map((artist) => Number(artist.totalSpotifyStreams) || 0), 0);
    const boomplayMax = Math.max(...artists.map((artist) => Number(artist.boomplay_streams) || 0), 0);
    const youtubeMax = Math.max(...artists.map((artist) => Number(artist.youtube_views) || 0), 0);
    const monthlyMax = Math.max(...artists.map((artist) => Number(artist.monthlyListeners) || 0), 0);

    artists.forEach((artist) => {
      const records = awards[artist.slug] || [];
      awardRaw.set(artist.slug, records.reduce((sum, entry) => sum + (awardTierWeight[entry.tier] || 0) * (awardResultWeight[entry.result] || 0), 0));
      certRaw.set(artist.slug, (certifications[artist.slug] || []).reduce((sum, entry) => sum + (certificationWeight[entry.level] || 0), 0));
    });

    const awardMax = Math.max(...awardRaw.values(), 0);
    const certMax = Math.max(...certRaw.values(), 0);
    const coveredAwardScores = artists.filter((artist) => awardRaw.get(artist.slug) > 0).map((artist) => logNormalize(awardRaw.get(artist.slug), awardMax));
    const pendingAwardMedian = median(coveredAwardScores);

    artists.forEach((artist) => {
      const baseline = Number(artist.baselineScore ?? artist.score) || 0;
      const structuredAwards = awards[artist.slug] || [];
      const structuredCertifications = (certifications[artist.slug] || []).slice().sort((a, b) => (certificationWeight[b.level] || 0) - (certificationWeight[a.level] || 0));
      const hasAwardCoverage = structuredAwards.length > 0;
      const awardScore = hasAwardCoverage ? logNormalize(awardRaw.get(artist.slug), awardMax) : pendingAwardMedian;
      const certificationScore = logNormalize(certRaw.get(artist.slug), certMax);
      const platformComponents = [
        { key: "spotify", weight: 0.45, value: Number(artist.totalSpotifyStreams) || 0, maximum: spotifyMax },
        { key: "boomplay", weight: 0.30, value: Number(artist.boomplay_streams) || 0, maximum: boomplayMax },
        { key: "youtube", weight: 0.25, value: Number(artist.youtube_views) || 0, maximum: youtubeMax }
      ].filter((entry) => entry.value > 0 && entry.maximum > 0);
      const availableWeight = platformComponents.reduce((sum, entry) => sum + entry.weight, 0);
      const streamsScore = availableWeight ? platformComponents.reduce((sum, entry) => sum + logNormalize(entry.value, entry.maximum) * entry.weight, 0) / availableWeight : 0;
      const monthlyListenersScore = logNormalize(Number(artist.monthlyListeners) || 0, monthlyMax);
      const commercialPowerScore = baseline * 0.75 + certificationScore * 0.25;
      const recomputedScore = baseline * 0.62 + commercialPowerScore * 0.12 + awardScore * 0.09 + streamsScore * 0.10 + monthlyListenersScore * 0.07;

      artist.baselineScore = baseline;
      artist.score = round(recomputedScore);
      artist.awards = structuredAwards;
      artist.certifications = structuredCertifications;
      artist.boomplay_streams = Number.isFinite(Number(artist.boomplay_streams)) ? Number(artist.boomplay_streams) : null;
      artist.youtube_views = Number.isFinite(Number(artist.youtube_views)) ? Number(artist.youtube_views) : null;
      artist.platformStreamsLastUpdatedAt = artist.platformStreamsLastUpdatedAt || null;
      artist.scoreBreakdown = {
        coreEditorialScore: round(baseline),
        awardScore: round(awardScore),
        awardCoverage: hasAwardCoverage ? "verified" : "median-imputed-pending-audit",
        certificationScore: round(certificationScore),
        commercialPowerScore: round(commercialPowerScore),
        streamsScore: round(streamsScore),
        monthlyListenersScore: round(monthlyListenersScore),
        availableStreamPlatforms: platformComponents.map((entry) => entry.key),
        formulaVersion: "2026-08-27-tiered-awards-turntable-blended-streams"
      };
    });

    artists.sort((a, b) => b.score - a.score || a.previousRank - b.previousRank || a.name.localeCompare(b.name));
    artists.forEach((artist, index) => { artist.rank = index + 1; });

    state.awards = Object.fromEntries(artists.map((artist) => [artist.slug, artist.awards]));
    state.certifications = Object.fromEntries(artists.map((artist) => [artist.slug, artist.certifications]));
    state.meta = {
      ...(state.meta || {}),
      streamsUpdatedAt: UPDATED_AT,
      awardsUpdatedAt: UPDATED_AT,
      certificationsUpdatedAt: UPDATED_AT,
      scoringUpdatedAt: UPDATED_AT,
      canonicalUrl: "https://afrobeats-index.vercel.app/",
      streamCoverageNote: "Spotify is verified across the Current 50. Boomplay and YouTube fields are integrated and reweight automatically when verified periodic snapshots are entered."
    };
    state.scoring = {
      currentWeights: { coreCrossEra: 62, commercialPower: 12, awards: 9, blendedStreams: 10, monthlyListeners: 7 },
      awardTierWeights: awardTierWeight,
      awardResultWeights: awardResultWeight,
      certificationWeights: certificationWeight,
      streamPlatformWeights: { spotify: 0.45, boomplay: 0.30, youtube: 0.25 },
      certificationCommercialShare: 0.25,
      missingAwardsPolicy: "Use the median normalized verified-awards score until an artist's structured award audit is complete.",
      missingStreamsPolicy: "Renormalize the published 45/30/25 platform weights across verified platform snapshots only."
    };
    state.audit = { ...(state.audit || {}), rankingUpgradeAppliedAt: UPDATED_AT };
    return state;
  }

  window.AFRI_APPLY_RANKING_UPGRADE = applyRankingUpgrade;
  if (window.AFRI_EMBEDDED_STATE) applyRankingUpgrade(window.AFRI_EMBEDDED_STATE);
  if (Array.isArray(window.AFRI_CURRENT_ARTISTS) && window.AFRI_EMBEDDED_STATE?.artists) {
    const upgraded = new Map(window.AFRI_EMBEDDED_STATE.artists.map((artist) => [artist.slug, artist]));
    window.AFRI_CURRENT_ARTISTS.forEach((artist) => Object.assign(artist, upgraded.get(artist.slug) || {}));
    window.AFRI_CURRENT_ARTISTS.sort((a, b) => a.rank - b.rank);
  }
})();
