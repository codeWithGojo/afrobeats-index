(function () {
  "use strict";

  // Release-year archive. Exact totals appear only after a track-by-track
  // source audit; rounded or unavailable historical totals are never presented
  // as precise data.
  const checkedAt = "28 Aug 2026";
  const spotifySearch = (title, artist) => `https://open.spotify.com/search/${encodeURIComponent(`${title} ${artist}`)}`;
  const parse = (entry) => {
    const [title, artist, rawTotal] = entry.split("|");
    return { title, artist, total: rawTotal ? Number(rawTotal) : null, url: spotifySearch(title, artist) };
  };
  const records = (songs, albums) => ({ songs: songs.map(parse), albums: albums.map(parse) });

  const archive = {
    2010: records([
      "Holla at Your Boy|Wizkid","Kele Kele Love|Tiwa Savage","Oleku|Ice Prince feat. Brymo","Tease Me / Bad Guys|Wizkid","Jollof|Wizkid","Number One|D'banj","Implication|2Baba","Mr Endowed|D'banj","Gbon Gbon|D'banj","Give It to Me|D'Prince feat. D'banj","Thank God|DaGrin feat. Omawumi","Ten Ten|Naeto C","If You Ask Me|Omawumi","Strong Ting|Banky W","Only Me|2Baba"
    ],[
      "MI 2: The Movie|M.I Abaga","Turning Point|Dr SID","Unstoppable International Edition|2Baba","The W Experience|Banky W","The CEO|DaGrin","Super C Season|Naeto C","Legacy|Faze","Asha|Brymo","Music Business|DJ Jimmy Jatt","African Dream|Waje"
    ]),
    2011: records([
      "Oliver Twist|D'banj","Don't Dull|Wizkid","Dami Duro|Davido","Love My Baby|Wizkid","Pakurumo|Wizkid","Ara|Brymo","Nwa Baby (Ashawo Remix)|Flavour","Superstar|Ice Prince","Chop My Money|P-Square feat. Akon & May D","Beautiful Onyinye|P-Square feat. Rick Ross","Ihe Neme|2Baba","Bumper to Bumper|Wande Coal","Gbono Feli Feli|D'banj","No One Like You|P-Square","Kukere|Iyanya"
    ],[
      "Superstar|Wizkid","Everybody Loves Ice Prince|Ice Prince","The Invasion|P-Square","Blessed|Flavour","The Dreamer|Chidinma","Phoenix Rising|Terry G","Versus|9ice","The Return of the Kings|Trybesmen","Asha|Brymo","Double Dare|Bracket"
    ]),
    2012: records([
      "Azonto|Fuse ODG feat. Itz Tiffany","Like to Party|Burna Boy","Kukere|Iyanya","Dami Duro|Davido","Ihe Neme|2Baba","First of All|Olamide","Go Low|Wande Coal","Carolina|Sauce Kid feat. Davido","Alingo|P-Square","Gaga Crazy|Chuddy K","Dance For Me|Wizkid","Baddest Boy|Wizkid feat. Skales & Banky W","Omoge|LKT feat. P-Square","Ara|Brymo","Take Banana|D'Prince"
    ],[
      "Omo Baba Olowo|Davido","YBNL|Olamide","Empire Mates State of Mind|EME","Away & Beyond|2Baba","Son of a Kapenta|Brymo","Upgrade|Iyanya","Franchise Celebrity|Mo'Cheddah","Book of Rap Stories|Reminisce","The Unstoppable|Sarkodie","My World|Efya"
    ]),
    2013: records([
      "Johnny|Yemi Alade","Skelewu|Davido","Personally|P-Square","Pull Over|Kcee feat. Wizkid","Woju|Kizz Daniel","Limpopo|Kcee","Caro|Starboy feat. Wizkid & L.A.X","Eminado|Tiwa Savage feat. Don Jazzy","Rotate|Wande Coal","Sho Lee|Sean Tizzle","Run My Race|Burna Boy","Gobe|Davido","Jaiye Jaiye|Wizkid feat. Femi Kuti","Durosoke|Olamide","Down|R2Bees"
    ],[
      "L.I.F.E|Burna Boy","Once Upon a Time|Tiwa Savage","Baddest Guy Ever Liveth|Olamide","Journey|Sean Tizzle","Sarkology|Sarkodie","Blessed|Flavour","Rebellious Soul|Seyi Shay","R&BW|Banky W","Jagz Nation, Vol. 1|Jesse Jagz","The Journey|Brymo"
    ]),
    2014: records([
      "Aye|Davido","Dorobucci|Mavin All Stars","Girlie O (Remix)|Patoranking feat. Tiwa Savage","Ojuelegba|Wizkid","Shake Body|Skales","Mummy Mi|Kiss Daniel","Shoki|Lil Kesh","Show You the Money|Wizkid","My Woman, My Everything|Patoranking feat. Wande Coal","Baby Hello|Wande Coal","The Sound|Davido feat. Uhuru & DJ Buckz","Ada Ada|Flavour","Story for the Gods|Olamide","In My City|Phyno","Tchelete|Davido & Mafikizolo"
    ],[
      "Ayo|Wizkid","The Ascension|2Baba","Street OT|Olamide","No Guts No Glory|Phyno","King of Queens|Yemi Alade","Above Ground Level|Iyanya","Bed of Stone|Asa","The Journey|Brymo","Grace|Waje","Alaga Ibile|Reminisce"
    ]),
    2015: records([
      "Ojuelegba|Wizkid","Godwin|Korede Bello","My Woman, My Everything|Patoranking feat. Wande Coal","Woju (Remix)|Kiss Daniel feat. Tiwa Savage & Davido","Bobo|Olamide","Fans Mi|Davido feat. Meek Mill","Katapot|Reekado Banks","Duro|Tekno","Reggae Blues|Harrysong feat. Olamide, Iyanya, Orezi & Kcee","Owo Blow|Olamide","Orente|Adekunle Gold","Ashimapeyin|Wande Coal","Laye|Kiss Daniel","The Money|Davido feat. Olamide","Condo|AKA feat. Burna Boy"
    ],[
      "Eyan Mayweather|Olamide","Wanted|Wande Coal","Mama Africa|Yemi Alade","Stories That Touch|Falz","Man of the Year|Skales","The Collectiv3 LP|The Collectiv3","The Indestructible Choc Boi Nation|Chocolate City","Tabula Rasa|Brymo","Rich & Famous|Praiz","Baba Hafusa|Reminisce"
    ]),
    2016: records([
      "Mad Over You|Runtown","Pana|Tekno","Mama|Kiss Daniel","No Kissing Baby|Patoranking feat. Sarkodie","Fada Fada|Phyno feat. Olamide","If I Start to Talk|Tiwa Savage feat. Dr SID","Kontrol|Maleek Berry","Ohema|DJ Spinall feat. Mr Eazi","Leg Over|Mr Eazi","Omo Alhaji|Ycee","Hollup|Mr Eazi feat. Dammy Krane","Skin Tight|Mr Eazi feat. Efya","The Matter|Maleek Berry feat. Wizkid","Daddy Yo|Wizkid","Bank Alert|P-Square"
    ],[
      "New Era|Kiss Daniel","Life Is Eazi, Vol. 1|Mr Eazi","Klitoris|Brymo","The Glory|Olamide","Gold|Adekunle Gold","God Over Everything|Patoranking","Jos to the World|Ice Prince","Illy Bomaye|Illbliss","Spotlight|Reekado Banks","The Playmaker|Phyno"
    ]),
    2017: records([
      "Fall|Davido","IF|Davido","Yawa|Tekno","Come Closer|Wizkid feat. Drake","Leg Over|Mr Eazi","Mad Over You|Runtown","Juice|Ycee feat. Maleek Berry","All Over|Tiwa Savage","Yeba|Kiss Daniel","Easy (Jeje)|Reekado Banks","Iskaba|Wande Coal & DJ Tunez","For Life|Runtown","Mama|Mayorkun","Said|Nasty C & Runtown","Tonight|Nonso Amadi"
    ],[
      "Sounds from the Other Side|Wizkid","Sugarcane EP|Tiwa Savage","Accra to Lagos|Mr Eazi","Ijele the Traveler|Flavour","Blessings|Sarkodie","Thuto|Cassper Nyovest","Throne|K.O","Simisola|Simi","This Is Me|Niniola","The Chief|Jidenna"
    ]),
    2018: records([
      "On the Low|Burna Boy|423316009","Ye|Burna Boy|333431528","Gbona|Burna Boy|284909918","Drogba (Joanna)|Afro B|157269944","Soco|Starboy feat. Wizkid, Terri, Spotless & Ceeza Milli|122702965","Fever|Wizkid|54274099","Kana|Olamide feat. Wizkid|39144916","Case|Teni|31006566","Assurance|Davido|29731421","Fake Love|Duncan Mighty feat. Wizkid|26364719","SMA|Nasty C feat. Rowlene|24818510","Askamaya|Teni|24366961","Madu|Kizz Daniel|17905470","Jogodo|Tekno|16618833","One Ticket|Kizz Daniel feat. Davido|15704637"
    ],[
      "Outside|Burna Boy|500738475","No Bad Songz|Kizz Daniel|206619843","Life Is Eazi, Vol. 2 — Lagos to London|Mr Eazi|154627430","Strings and Bling|Nasty C|103029832","Afrikan Sauce|Sauti Sol|62981718","A Boy From Tandale|Diamond Platnumz|62335761","The Mayor of Lagos|Mayorkun|48826640","Touch My Blood|AKA|29155817","Iyanu|SPINALL|25656257","About 30|Adekunle Gold|23334092"
    ]),
    2019: records([
      "Dumebi|Rema","Anybody|Burna Boy","Blow My Mind|Davido feat. Chris Brown","Risky|Davido feat. Popcaan","Jealous|Fireboy DML","Baby|Joeboy","Don't Call Me Back|Joeboy feat. Mayorkun","Soapy|Naira Marley","Beginning|Joeboy","Scatter|Fireboy DML","Bounce|Rema","Reason With Me|Rudeboy","King|Fireboy DML","Joro|Wizkid","Gbeku|Zlatan feat. Burna Boy"
    ],[
      "African Giant|Burna Boy","A Good Time|Davido","Laughter, Tears & Goosebumps|Fireboy DML","Rema|Rema","Love & Light|Joeboy","Woman of Steel|Yemi Alade","Wilmer|Patoranking","Zanku|Zlatan","Celia|Tiwa Savage","I Am the King of Amapiano: Sweet & Dust|Kabza De Small"
    ]),
    2020: records([
      "Essence|Wizkid feat. Tems","Ginger|Wizkid feat. Burna Boy","Nobody|DJ Neptune feat. Joeboy & Mr Eazi","Duduke|Simi","Abule|Patoranking","Damages|Tems","Woman|Rema","Away|Oxlade","Infinity|Olamide feat. Omah Lay","Godly|Omah Lay","Bad Influence|Omah Lay","Zoom|Cheque","Know You|Ladipoe feat. Simi","Cash App|Bella Shmurda feat. Zlatan & Lincoln","Loading|Olamide feat. Bad Boy Timz"
    ],[
      "Made in Lagos|Wizkid","Twice as Tall|Burna Boy","Get Layd|Omah Lay","For Broken Ears|Tems","Apollo|Fireboy DML","Carpe Diem|Olamide","A Better Time|Davido","Celia|Tiwa Savage","Three|Patoranking","Yellow|Brymo"
    ]),
    2021: records([
      "Peru|Fireboy DML","Love Nwantiti (Ah Ah Ah)|CKay","Understand|Omah Lay","Alcohol|Joeboy","High|Adekunle Gold feat. Davido","Monalisa|Lojay & Sarz","Bloody Samaritan|Ayra Starr","Feeling|Ladipoe feat. BNXN","Bounce|Ruger","Sip (Alcohol)|Joeboy","Kilometre|BNXN","Lie|Kizz Daniel","Ozumba Mbadiwe|Reekado Banks","Running (To You)|Chike feat. Simi","Baby Riddim|Fave"
    ],[
      "19 & Dangerous|Ayra Starr","Somewhere Between Beauty & Magic|Joeboy","Sex Over Love|Blaqbonez","Providence|LadiPoe","Barnabas|Kizz Daniel","The Prince I Became|Ric Hassani","Before We Fall Asleep|Johnny Drille","UY Scuti|Olamide","Golden|A-Q","Esan|Brymo"
    ]),
    2022: records([
      "Calm Down|Rema","Last Last|Burna Boy","Rush|Ayra Starr","Buga|Kizz Daniel & Tekno","Soweto|Victony & Tempoe","KU LO SA|Oxlade","Peru (Remix)|Fireboy DML & Ed Sheeran","Bandana|Fireboy DML & Asake","Sungba (Remix)|Asake feat. Burna Boy","Electricity|Pheelz & Davido","Finesse|Pheelz feat. BNXN","For My Hand|Burna Boy feat. Ed Sheeran","Girlfriend|Ruger","Xtra Cool|Young Jonn","Cough (ODO)|Kizz Daniel"
    ],[
      "Rave & Roses|Rema","Love, Damini|Burna Boy","Boy Alone|Omah Lay","Mr. Money With the Vibe|Asake","Playboy|Fireboy DML","More Love, Less Ego|Wizkid","To Be Honest|Simi","Catch Me If You Can|Adekunle Gold","The Brother's Keeper|Chike","Outlaw|Victony"
    ]),
    2023: records([
      "Water|Tyla","People|Libianca","Charm|Rema","Lonely at the Top|Asake","City Boys|Burna Boy","Party No Dey Stop|Adekunle Gold feat. Zinoleesky","Unavailable|Davido feat. Musa Keys","Sability|Ayra Starr","Reason|Omah Lay","Gwagwalada|BNXN, Kizz Daniel & Seyi Vibez","Terminator|Asake","Ngozi|Crayon feat. Ayra Starr","Cast|Shallipopi feat. Odumodublvck","Me & U|Tems","Twe Twe|Kizz Daniel"
    ],[
      "Timeless|Davido","Work of Art|Asake","I Told Them...|Burna Boy","EZIOKWU|Odumodublvck","Presido La Pluto|Shallipopi","Tequila Ever After|Adekunle Gold","Ruger RU the World|Ruger","No Bad Boy, No Party|Black Sherif","Body & Soul|Joeboy","RAVAGE|Rema"
    ]),
    2024: records([
      "Santa|Rvssian, Rauw Alejandro & Ayra Starr","Love Me JeJe|Tems","Tshwala Bam|TitoM & Yuppe feat. S.N.E","Commas|Ayra Starr","Ozeba|Rema","Jump|Tyla, Gunna & Skillibeng","Dealer|Ayo Maff feat. Fireboy DML","Egwu|Chike feat. MohBad","Higher|Burna Boy","Ogechi (Remix)|Brown Joel, BoyPee & Hyce feat. Davido","Awuke|Davido feat. YG Marley","MMS|Asake feat. Wizkid","Active|Asake feat. Travis Scott","Piece of My Heart|Wizkid feat. Brent Faiyaz","Fi Kan We Kan|BNXN feat. Rema"
    ],[
      "The Year I Turned 21|Ayra Starr","Born in the Wild|Tems","HEIS|Rema","Lungu Boy|Asake","TYIT21 Deluxe|Ayra Starr","Morayo|Wizkid","Loseyi Professor|Seyi Vibez","adedamola|Fireboy DML","Full Time Job|Phyno","Son of Chike|Chike"
    ]),
    2025: records([
      "With You|Davido feat. Omah Lay","Laho|Shallipopi","Baby (Is It a Crime)|Rema","Pity This Boy|Odumodublvck feat. Victony","Funds|Davido feat. Odumodublvck & Chike","Joy Is Coming|Fido","Arike|Kunmie","Why Love|Asake","Pressure|Seyi Vibez","99|Olamide feat. Seyi Vibez, Asake & Young Jonn","My Darling|Cheque","TaTaTa|Burna Boy feat. Travis Scott","You4Me|Tyla","SHAOLIN|Seyi Vibez","Kese (Dance)|Wizkid"
    ],[
      "5ive|Davido","No Sign of Weakness|Burna Boy","Olamidé|Olamide","Children of Africa|Seyi Vibez","Gen Z|Zinoleesky","The Machine Is Coming|Odumodublvck","Morayo Deluxe|Wizkid","Protect Sarz at All Costs|Sarz","The Villain I Never Was II|Black Sherif","Captain|Seyi Vibez"
    ])
  };

  const fmt = new Intl.NumberFormat("en-GB");
  const safe = (value) => String(value ?? "").replace(/[&<>'"]/g, (char) => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", "'":"&#39;", '"':"&quot;" })[char]);
  const cleanArtist = (value) => String(value || "").split(/\s+(?:feat\.|ft\.|&|x)\s+|,/i)[0].trim();
  const key = (value) => String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  const localPortraits = {
    "burna boy":"burna.jpg","wizkid":"wizkid.jpg","davido":"davido.jpg","tiwa savage":"tiwa.jpg","rema":"rema.jpg","tems":"tems.jpg","asake":"asake.jpg","omah lay":"omahlay.jpg","fireboy dml":"fireboy.jpg","ayra starr":"ayra.jpg","kizz daniel":"kizzdaniel.jpg","tyla":"tyla.jpg","ckay":"ckay.jpg","olamide":"olamide.jpg","victony":"victony.jpg","yemi alade":"yemialade.jpg","wande coal":"wandecoal.jpg"
  };

  function portraitFor(artist) {
    const primary = key(cleanArtist(artist));
    const live = (window.AFRI_EMBEDDED_STATE?.artists || []).find(entry => key(entry.name) === primary);
    return live?.imageFallback || live?.image || localPortraits[primary] || "";
  }

  function row(item, index, year) {
    const metric = item.total
      ? `<strong>${fmt.format(item.total)}</strong><small>verified Spotify plays</small>`
      : `<strong>#${index + 1}</strong><small>${year} catalogue rank</small>`;
    const portrait = portraitFor(item.artist);
    const art = portrait
      ? `<img class="yearly-art" src="${safe(portrait)}" alt="${safe(item.title)} artwork" loading="lazy" data-archive-art data-title="${safe(item.title)}" data-artist="${safe(item.artist)}" data-kind="${safe(item.kind || "song")}">`
      : `<span class="yearly-art yearly-art-fallback" data-archive-placeholder data-title="${safe(item.title)}" data-artist="${safe(item.artist)}" data-kind="${safe(item.kind || "song")}" aria-label="Artwork loading">${safe(item.artist.slice(0,1))}</span>`;
    return `<a class="yearly-entry archive-entry" href="${safe(item.url)}" target="_blank" rel="noopener noreferrer" aria-label="Open ${safe(item.title)} by ${safe(item.artist)} on Spotify"><span class="yearly-rank">${String(index + 1).padStart(2, "0")}</span>${art}<span><span class="yearly-title">${safe(item.title)}</span><span class="yearly-meta">${safe(item.artist)} · released ${year}</span></span><span class="yearly-count">${metric}</span></a>`;
  }

  function currentRows(items, type) {
    return [...items].filter(item => Number(item.year) === 2026).sort((a,b) => b.streams_this_year - a.streams_this_year).slice(0, type === "song" ? 15 : 10).map((item,index) => {
      const title = type === "song" ? item.song_title : item.album_title;
      return row({ title, artist:item.artist, total:item.streams_this_year, url:spotifySearch(title,item.artist), kind:type }, index, 2026);
    }).join("");
  }

  async function hydrateArtwork(root) {
    const targets = [...root.querySelectorAll("[data-archive-art], [data-archive-placeholder]")];
    await Promise.all(targets.map(async target => {
      const cacheKey = `afri-art:${target.dataset.kind}:${target.dataset.title}:${target.dataset.artist}`;
      let image = sessionStorage.getItem(cacheKey);
      if (!image) {
        try {
          const entity = target.dataset.kind === "album" ? "album" : "song";
          const query = encodeURIComponent(`${target.dataset.title} ${cleanArtist(target.dataset.artist)}`);
          const response = await fetch(`https://itunes.apple.com/search?term=${query}&entity=${entity}&limit=1&country=NG`);
          const result = (await response.json()).results?.[0];
          image = (result?.artworkUrl100 || "").replace(/100x100bb/, "300x300bb");
          if (image) sessionStorage.setItem(cacheKey, image);
        } catch (_) {}
      }
      if (!image) return;
      if (target instanceof HTMLImageElement) target.src = image;
      else {
        const img = document.createElement("img");
        img.className = "yearly-art";
        img.src = image;
        img.alt = `${target.dataset.title} artwork`;
        img.loading = "lazy";
        target.replaceWith(img);
      }
    }));
  }

  function init() {
    const section = document.getElementById("yearly");
    const select = document.getElementById("yearly-year-select");
    const songsRoot = document.getElementById("yearly-songs-list");
    const albumsRoot = document.getElementById("yearly-albums-list");
    if (!section || !select || !songsRoot || !albumsRoot) return;

    const head = section.querySelector(".yearly-streams-head");
    const rail = document.createElement("div");
    rail.className = "year-rail";
    rail.setAttribute("role", "tablist");
    rail.setAttribute("aria-label", "Streaming archive year");
    rail.innerHTML = Array.from({length:17},(_,i)=>2026-i).map(year => `<button type="button" role="tab" class="year-chip" data-archive-year="${year}" aria-selected="${year===2026}">${year}</button>`).join("");
    head.insertAdjacentElement("afterend", rail);

    select.innerHTML = Array.from({length:17},(_,i)=>2026-i).map(year => `<option value="${year}">${year}</option>`).join("");
    const albumKicker = document.querySelector('[aria-labelledby="yearly-albums-title"] > p');
    const songKicker = document.querySelector('[aria-labelledby="yearly-songs-title"] > p');
    if (albumKicker) albumKicker.textContent = "Top 10 · release-year archive";
    if (songKicker) songKicker.textContent = "Top 15 · release-year archive";

    const paint = (year) => {
      const current = year === 2026;
      const data = archive[year];
      document.querySelectorAll("[data-yearly-label]").forEach(node => { node.textContent = year; });
      document.querySelectorAll(".year-chip").forEach(button => {
        const active = Number(button.dataset.archiveYear) === year;
        button.classList.toggle("is-active", active);
        button.setAttribute("aria-selected", String(active));
        if (active) button.scrollIntoView({behavior:"smooth",block:"nearest",inline:"center"});
      });
      select.value = String(year);
      const updated = document.querySelector("[data-yearly-updated]");
      if (updated) updated.textContent = current ? "26 Aug 2026" : `Archive checked · ${checkedAt}`;
      if (current) {
        songsRoot.innerHTML = currentRows(window.AFRI_YEARLY_STREAMS?.songs || [], "song");
        albumsRoot.innerHTML = currentRows(window.AFRI_YEARLY_STREAMS?.albums || [], "album");
      } else if (data) {
        songsRoot.innerHTML = data.songs.slice(0,15).map((item,index)=>row({...item,kind:"song"},index,year)).join("");
        albumsRoot.innerHTML = data.albums.slice(0,10).map((item,index)=>row({...item,kind:"album"},index,year)).join("");
      }
      hydrateArtwork(section);
      const method = section.querySelector(".yearly-method");
      if (method) method.innerHTML = current
        ? `<strong>Reading 2026.</strong> These are the live year-to-date Spotify figures in the current data snapshot.`
        : `<strong>Reading the archive.</strong> This is a release-year leaderboard: 15 songs and 10 albums issued in ${year}, ordered using cumulative Spotify catalogue evidence. Exact play counts appear only after a track-by-track source audit; unaudited rows show their archive rank instead of an invented number.`;
    };

    rail.addEventListener("click", event => {
      const button = event.target.closest("[data-archive-year]");
      if (button) paint(Number(button.dataset.archiveYear));
    });
    select.addEventListener("change", () => paint(Number(select.value)));
    paint(2026);
    window.AFRI_YEAR_ARCHIVE = archive;
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, {once:true});
  else init();
})();
