window.AFRI_RECOGNITION = (() => {
  const wiki = (title) => `https://en.wikipedia.org/wiki/${encodeURIComponent(title).replace(/%20/g, "_")}`;
  const search = (name) => `https://en.wikipedia.org/w/index.php?search=${encodeURIComponent(`${name} awards and nominations`)}`;
  const pageTitle = (url, fallback) => {
    try {
      const marker = new URL(url).pathname.split("/wiki/")[1];
      return marker ? decodeURIComponent(marker).replace(/_/g, " ") : fallback;
    } catch (error) {
      return fallback;
    }
  };
  const data = {
    "burna-boy": { wikipedia_url:wiki("List of awards and nominations received by Burna Boy"), records:[
      {year:2019,name:"BET Awards",category:"Best International Act",result:"winner"},{year:2019,name:"MTV Europe Music Awards",category:"Best African Act",result:"winner"},{year:2019,name:"The Headies",category:"Artiste of the Year",result:"winner"}] },
    "wizkid": { wikipedia_url:wiki("List of awards and nominations received by Wizkid"), wins:98, nominations:318, breakdown:[["AFRIMA",8,21],["BET Awards",4,8],["Billboard Music Awards",3,7],["Grammy Awards",1,6],["MOBO Awards",5,11],["MTV Europe Music Awards",2,6],["NAACP Image Awards",6,8],["Soul Train Music Awards",3,11],["The Headies",19,63]], records:[
      {year:2021,name:"Grammy Awards",category:"Best Music Video",work:"Brown Skin Girl",result:"winner"},{year:2021,name:"MOBO Awards",category:"Best African Act",result:"winner"},{year:2020,name:"The Headies",category:"Artiste of the Year",result:"winner"},{year:2016,name:"MTV Europe Music Awards",category:"Best Worldwide Act",result:"winner"}] },
    "tems": { wikipedia_url:wiki("List of awards and nominations received by Tems"), wins:42, nominations:121, breakdown:[["Academy Awards",0,1],["AFRIMA",3,8],["American Music Awards",2,4],["BET Awards",4,9],["Grammy Awards",2,8],["iHeartRadio Music Awards",2,6],["NAACP Image Awards",4,10],["Soul Train Music Awards",2,8],["The Headies",5,13]], records:[
      {year:2025,name:"Grammy Awards",category:"Best African Music Performance",work:"Love Me JeJe",result:"winner"},{year:2024,name:"Billboard Women in Music",category:"Breakthrough Award",result:"honoree"},{year:2023,name:"Academy Awards",category:"Best Original Song",work:"Lift Me Up (as songwriter)",result:"nominee"},{year:2022,name:"BET Awards",category:"Best International Act",result:"winner"}] },
    "tyla": { wikipedia_url:wiki("List of awards and nominations received by Tyla"), wins:39, nominations:124, breakdown:[["American Music Awards",3,6],["BET Awards",2,7],["Billboard Music Awards",2,8],["Grammy Awards",2,2],["MTV Europe Music Awards",3,4],["MTV Video Music Awards",2,5],["South African Music Awards",5,10],["Trace Awards",1,7]], records:[
      {year:2024,name:"Grammy Awards",category:"Best African Music Performance",work:"Water",result:"winner"},{year:2024,name:"BET Awards",category:"Best International Act",result:"winner"},{year:2024,name:"BET Awards",category:"Best New Artist",result:"winner"},{year:2024,name:"MTV Video Music Awards",category:"Best Afrobeats Video",work:"Water",result:"winner"}] },
    "davido": { wikipedia_url:wiki("List of awards and nominations received by Davido"), breakdown:[["BET Awards",2,8],["MTV Africa Music Awards",2,4],["MTV Europe Music Awards",2,4],["MOBO Awards",1,5],["African Muzik Magazine Awards",2,6],["Nigeria Entertainment Awards",2,8],["Grammy Awards",0,3]], records:[
      {year:2024,name:"Grammy Awards",category:"Best Global Music Album",work:"Timeless",result:"nominee"},{year:2018,name:"BET Awards",category:"Best International Act",result:"winner"},{year:2017,name:"MTV Europe Music Awards",category:"Best African Act",result:"winner"}] },
    "tiwa-savage": { wikipedia_url:wiki("List of awards and nominations received by Tiwa Savage"), records:[
      {year:2020,name:"Soundcity MVP Awards",category:"African Video of the Year",work:"49-99",result:"winner"},{year:2019,name:"AFRIMA",category:"Best Female Artiste in Western Africa",result:"winner"},{year:2018,name:"MTV Europe Music Awards",category:"Best African Act",result:"winner"}] },
    "rema": { wikipedia_url:wiki("List of awards and nominations received by Rema"), records:[
      {year:2026,name:"AFRIMMA",category:"Artist of the Year",result:"winner"},{year:2023,name:"Billboard Music Awards",category:"Top Afrobeats Song",work:"Calm Down (Remix)",result:"winner"},{year:2023,name:"AFRIMMA",category:"Crossing Boundaries with Music",result:"winner"},{year:2019,name:"City People Music Awards",category:"Revelation of the Year",result:"winner"}] },
    "asake": { wikipedia_url:wiki("Asake"), records:[
      {year:2024,name:"TurnTable Music Awards",category:"No. 1 Artiste",result:"winner"},{year:2023,name:"MOBO Awards",category:"Best African Act",result:"winner"},{year:2023,name:"Ghana Music Awards",category:"African Artist of the Year",result:"winner"},{year:2024,name:"Grammy Awards",category:"Best African Music Performance",work:"Amapiano",result:"nominee"}] },
    "omah-lay": { wikipedia_url:wiki("Omah Lay"), records:[
      {year:2026,name:"Grammy Awards",category:"Best African Music Performance",work:"With You",result:"nominee"},{year:2021,name:"Net Honours",category:"Most Played Pop Song",work:"Godly",result:"winner"},{year:2020,name:"The Headies",category:"Next Rated",result:"winner"},{year:2020,name:"The Headies",category:"Viewer's Choice",result:"nominee"}] },
    "olamide": { wikipedia_url:wiki("Olamide"), records:[
      {year:2025,name:"Billboard Music Awards",category:"Global Power Player",result:"honoree"},{year:2024,name:"Grammy Awards",category:"Best African Music Performance",work:"Amapiano",result:"nominee"},{year:2022,name:"The Headies",category:"Best Rap Album",work:"Carpe Diem",result:"winner"},{year:2016,name:"Nigeria Entertainment Awards",category:"Rap Act of the Year",result:"winner"}] },
    "2baba": { wikipedia_url:wiki("List of awards and nominations received by 2Baba"), wins:66, nominations:140, breakdown:[["The Headies",10,35],["Channel O Music Video Awards",8,11],["Nigeria Entertainment Awards",7,12],["MTV Africa Music Awards",4,8],["MOBO Awards",1,2],["Kora Awards",2,2],["World Music Awards",2,5]], records:[
      {year:2019,name:"AFRIMA",category:"Legend Award",result:"honoree"},{year:2015,name:"The Headies",category:"Hall of Fame",result:"honoree"},{year:2010,name:"MTV Africa Music Awards",category:"Artist of the Year",result:"winner"},{year:2007,name:"MOBO Awards",category:"Best African Act",result:"winner"},{year:2005,name:"MTV Europe Music Awards",category:"Best African Act",result:"winner"}] },
    "wande-coal": { wikipedia_url:wiki("Wande Coal"), records:[
      {year:2010,name:"The Headies",category:"Artiste of the Year",result:"winner"},{year:2010,name:"The Headies",category:"Album of the Year",work:"Mushin 2 Mo'Hits",result:"winner"},{year:2010,name:"The Headies",category:"Best Pop Single",work:"You Bad",result:"winner"},{year:2010,name:"The Headies",category:"Best R&B/Pop Album",work:"Mushin 2 Mo'Hits",result:"winner"},{year:2010,name:"The Headies",category:"Hip Hop World Revelation",result:"winner"}] },
    "yemi-alade": { wikipedia_url:wiki("List of awards and nominations received by Yemi Alade"), records:[
      {year:2025,name:"Grammy Awards",category:"Best African Music Performance",work:"Tomorrow",result:"nominee"},{year:2018,name:"AFRIMMA",category:"Best Female Western Africa",result:"winner"},{year:2016,name:"MTV Africa Music Awards",category:"Best Female",result:"winner"},{year:2015,name:"MTV Africa Music Awards",category:"Best Female",result:"winner"}] },
    "kizz-daniel": { wikipedia_url:wiki("Kizz Daniel"), records:[
      {year:2024,name:"TurnTable Music Awards",category:"No. 1 Song",work:"Twe Twe (Remix)",result:"winner"},{year:2023,name:"Soundcity MVP Awards",category:"Song of the Year",work:"Buga",result:"winner"},{year:2016,name:"The Headies",category:"Album of the Year",work:"New Era",result:"winner"},{year:2016,name:"The Headies",category:"Best R&B/Pop Album",work:"New Era",result:"winner"}] },
    "fireboy-dml": { wikipedia_url:wiki("Fireboy DML"), records:[
      {year:2022,name:"The Headies",category:"Best Afrobeats Single",work:"Peru",result:"winner"},{year:2021,name:"AFRIMA",category:"African Fan's Favourite",result:"winner"},{year:2020,name:"MOBO Awards",category:"Best African Act",result:"winner"},{year:2020,name:"The Headies",category:"Album of the Year",work:"Apollo",result:"winner"}] },
    "ckay": { wikipedia_url:wiki("CKay"), records:[
      {year:2022,name:"BMI London Music Awards",category:"Most-Performed Song",work:"Love Nwantiti",result:"honoree"},{year:2022,name:"Brit Awards",category:"Best International Song",work:"Love Nwantiti",result:"nominee"},{year:2021,name:"Muzikol Music Awards",category:"Best African Song",work:"Love Nwantiti",result:"winner"}] },
    "victony": { wikipedia_url:wiki("Victony"), records:[
      {year:2023,name:"The Headies",category:"Best Recording of the Year",work:"Soweto",result:"winner"},{year:2023,name:"The Headies",category:"Viewer's Choice",work:"Soweto",result:"winner"},{year:2023,name:"Billboard Music Awards",category:"Top Afrobeats Song",work:"Soweto",result:"nominee"}] },
    "ayra-starr": { wikipedia_url:wiki("Ayra Starr"), records:[
      {year:2026,name:"MOBO Awards",category:"Best International Act",result:"winner"},{year:2025,name:"MOBO Awards",category:"Best African Music Act",result:"winner"},{year:2022,name:"Net Honours",category:"Breakout Artist of the Year (Female)",result:"winner"},{year:2022,name:"The Headies",category:"Next Rated",result:"nominee"}] },
    "seyi-vibez": { wikipedia_url:wiki("Seyi Vibez"), records:[
      {year:2025,name:"AAEA Awards",category:"Best Male Artist West Africa",result:"winner"},{year:2024,name:"BET Awards",category:"Best New International Act",result:"nominee"},{year:2023,name:"The Headies",category:"Best Street-Hop Artiste",result:"winner"},{year:2023,name:"The Headies",category:"Best Collaboration",result:"winner"}] },
    "bnxn": { wikipedia_url:wiki("Bnxn"), records:[
      {year:2023,name:"Soundcity MVP Awards",category:"Best Collaboration",work:"Finesse",result:"winner"},{year:2022,name:"The Headies",category:"Next Rated",result:"winner"},{year:2022,name:"The Headies",category:"Best Rap Single",work:"Feeling",result:"winner"},{year:2020,name:"City People Entertainment Awards",category:"Revelation of the Year",result:"winner"}] },
    "odumodublvck": { wikipedia_url:wiki("Odumodublvck"), records:[
      {year:2025,name:"The Headies",category:"Next Rated",result:"winner"},{year:2025,name:"The Headies",category:"Best Rap Single",work:"Cast",result:"winner"},{year:2023,name:"The Headies",category:"Rookie of the Year",result:"winner"},{year:2023,name:"The Headies",category:"Best Rap Single",work:"Declan Rice",result:"winner"}] },
    "black-sherif": { wikipedia_url:wiki("Black Sherif"), records:[
      {year:2023,name:"BET Hip Hop Awards",category:"Best International Flow",result:"winner"},{year:2023,name:"The Headies",category:"West African Artiste of the Year",result:"winner"},{year:2023,name:"Vodafone Ghana Music Awards",category:"Artist of the Year",result:"winner"},{year:2022,name:"3Music Awards",category:"Song of the Year",work:"Second Sermon",result:"winner"}] },
    "adekunle-gold": { wikipedia_url:wiki("Adekunle Gold"), records:[
      {year:2024,name:"TurnTable Music Awards",category:"Outstanding Achievement in Music in Film",result:"winner"},{year:2023,name:"The Headies",category:"Songwriter of the Year",result:"winner"},{year:2017,name:"IARA",category:"Best African Music Artist",result:"winner"},{year:2016,name:"The Headies",category:"Best Alternative Song",work:"Sade",result:"winner"}] },
    "joeboy": { wikipedia_url:wiki("Joeboy"), wins:2, nominations:11, records:[
      {year:2020,name:"Soundcity MVP Awards",category:"Best Pop",result:"winner"},{year:2019,name:"AFRIMA",category:"Best Artiste in African Pop",result:"winner"},{year:2019,name:"The Headies",category:"Next Rated",result:"nominee"}] },
    "focalistic": { wikipedia_url:wiki("Focalistic"), records:[
      {year:2023,name:"The Headies",category:"Best Southern African Artiste",result:"winner"},{year:2022,name:"The Headies",category:"Best Southern African Artiste",result:"winner"},{year:2021,name:"AFRIMMA",category:"Best Male Southern Africa",result:"winner"},{year:2021,name:"AFRIMMA",category:"Best Collaboration",work:"Ke Star (Remix)",result:"winner"}] },
    "uncle-waffles": { wikipedia_url:wiki("Uncle Waffles"), records:[
      {year:2023,name:"GQ Men of the Year Awards (SA)",category:"Woman of the Year",result:"winner"},{year:2023,name:"BET Awards",category:"Best International Act",result:"nominee"},{year:2022,name:"AFRIMMA",category:"Best DJ Africa",result:"winner"},{year:2022,name:"AFRIMA",category:"Best African DJ",result:"nominee"}] },
    "stonebwoy": { wikipedia_url:wiki("Stonebwoy"), records:[
      {year:2020,name:"International Reggae and World Music Awards",category:"Best African Reggae/Dancehall Entertainer",result:"winner"},{year:2019,name:"AFRIMA",category:"Best Reggae/Dancehall Artiste",result:"winner"},{year:2018,name:"Nickelodeon Kids' Choice Awards",category:"Favorite African Star",result:"winner"},{year:2015,name:"BET Awards",category:"Best International Act",result:"winner"}] },
    "shatta-wale": { wikipedia_url:wiki("Shatta Wale"), records:[
      {year:2014,name:"Ghana Music Awards",category:"Artiste of the Year",result:"winner"},{year:2014,name:"Nigeria Entertainment Awards",category:"African Artiste of the Year",result:"winner"},{year:2014,name:"International Reggae and World Music Awards",category:"Best New Entertainer",result:"winner"}] },
    "diamond-platnumz": { wikipedia_url:wiki("List of awards and nominations received by Diamond Platnumz"), wins:28, nominations:38 }
  };
  (window.AFRI_CURRENT_ARTISTS || []).forEach((artist) => {
    data[artist.slug] ||= {};
    data[artist.slug].wikipedia_url ||= search(artist.name);
    data[artist.slug].page_title ||= pageTitle(data[artist.slug].wikipedia_url, artist.name);
    data[artist.slug].audited_at = "2026-08-28";
  });
  const legacyNames = { "2baba":"2Baba", "wande-coal":"Wande Coal", "yemi-alade":"Yemi Alade" };
  Object.entries(legacyNames).forEach(([slug, name]) => {
    if (data[slug]) {
      data[slug].page_title ||= pageTitle(data[slug].wikipedia_url, name);
      data[slug].audited_at = "2026-08-28";
    }
  });
  return data;
})();
