(function () {
  "use strict";

  // Counts are complete Spotify release totals, not 2018 chart-period streams.
  // Each item is kept with its source so a later refresh can be checked track by track.
  const verifiedAt = "18–28 Aug 2026";
  const source = "https://kworb.net/spotify/";
  const yearbooks = {
    2018: {
      songs: [
        ["On the Low", "Burna Boy", 423316009, "https://kworb.net/spotify/artist/3wcj11K77LjEY1PkEazffa_songs.html"],
        ["Ye", "Burna Boy", 333431528, "https://kworb.net/spotify/artist/3wcj11K77LjEY1PkEazffa_songs.html"],
        ["Gbona", "Burna Boy", 284909918, "https://kworb.net/spotify/artist/3wcj11K77LjEY1PkEazffa_songs.html"],
        ["Drogba (Joanna)", "Afro B", 157269944, "https://kworb.net/spotify/artist/7oMRcCu0OYSCtCyS3P37iC_songs.html"],
        ["Soco", "Starboy feat. Wizkid, Terri, Spotless & Ceeza Milli", 122702965, "https://kworb.net/spotify/artist/3tVQdUvClmAT7URs9V3rsp_songs.html"],
        ["Fever", "Wizkid", 54274099, "https://kworb.net/spotify/artist/3tVQdUvClmAT7URs9V3rsp_songs.html"],
        ["Kana", "Olamide feat. Wizkid", 39144916, "https://kworb.net/spotify/artist/4ovtyvs7j1jSmwhkBGHqSr_songs.html"],
        ["Case", "Teni", 31006566, "https://kworb.net/spotify/artist/3ukrG1BmfEiuo0KDj8YTTS_songs.html"],
        ["Assurance", "Davido", 29731421, "https://kworb.net/spotify/artist/0Y3agQaa6g2r0YmHPOO9rh_songs.html"],
        ["Fake Love", "Duncan Mighty feat. Wizkid", 26364719, "https://kworb.net/spotify/artist/3tVQdUvClmAT7URs9V3rsp_songs.html"],
        ["SMA", "Nasty C feat. Rowlene", 24818510, "https://kworb.net/spotify/artist/2gzWmhOZhDN6gXL49JW9qj_songs.html"],
        ["Askamaya", "Teni", 24366961, "https://kworb.net/spotify/artist/3ukrG1BmfEiuo0KDj8YTTS_songs.html"],
        ["Madu", "Kizz Daniel", 17905470, "https://kworb.net/spotify/artist/1X6cBGnXpEpN7CmflLKmLV_songs.html"],
        ["Jogodo", "Tekno", 16618833, "https://kworb.net/spotify/artist/6IhG3Yxm3UW98jhyBvrIut_songs.html"],
        ["One Ticket", "Kizz Daniel feat. Davido", 15704637, "https://kworb.net/spotify/artist/1X6cBGnXpEpN7CmflLKmLV_songs.html"]
      ],
      albums: [
        ["Outside", "Burna Boy", 500738475, "https://kworb.net/spotify/artist/3wcj11K77LjEY1PkEazffa_albums.html"],
        ["No Bad Songz", "Kizz Daniel", 206619843, "https://kworb.net/spotify/artist/1X6cBGnXpEpN7CmflLKmLV_albums.html"],
        ["Life Is Eazi, Vol. 2 — Lagos to London", "Mr Eazi", 154627430, "https://kworb.net/spotify/artist/4TAoP0f9OuWZUesao43xUW_albums.html"],
        ["Strings and Bling", "Nasty C", 103029832, "https://kworb.net/spotify/artist/2gzWmhOZhDN6gXL49JW9qj_albums.html"],
        ["Afrikan Sauce", "Sauti Sol", 62981718, "https://kworb.net/spotify/artist/4Rj9lQm9oSiMlirgpsM6eo_albums.html"],
        ["A Boy From Tandale", "Diamond Platnumz", 62335761, "https://kworb.net/spotify/artist/3cAisWS37sGCCtRgWfvrod_albums.html"],
        ["The Mayor of Lagos", "Mayorkun", 48826640, "https://kworb.net/spotify/artist/3DNCUaKdMZcMVJIS7yTskd_albums.html"],
        ["Touch My Blood", "AKA", 29155817, "https://kworb.net/spotify/artist/1QIghPIrXQQ22G1yNtAKFX_albums.html"],
        ["Iyanu", "SPINALL", 25656257, "https://kworb.net/spotify/artist/2NtQA3PY9chI8l65ejZLTP_albums.html"],
        ["About 30", "Adekunle Gold", 23334092, "https://kworb.net/spotify/artist/2IK173RXLiCSQ8fhDlAb3s_albums.html"],
        ["Greatness", "DJ Neptune", 24369282, "https://kworb.net/spotify/artist/3L4ZO0ZaSe1qeucpQK8tBR_albums.html"],
        ["Heartwork", "Peruzzi", 14475659, "https://kworb.net/spotify/artist/5ywjxFhmhHGQBsK3DundNf_albums.html"],
        ["Sweet and Short", "Cassper Nyovest", 11018634, "https://kworb.net/spotify/artist/18CJ8k3h2Rggioow01dlwP_albums.html"],
        ["Mr Love", "Skales", 7228463, "https://kworb.net/spotify/artist/1ixqGowpDM21RwyJmJ7hpv_albums.html"],
        ["Testimony 1990", "Khaligraph Jones", 3360238, "https://kworb.net/spotify/artist/1xxXRVpuEm3X3p1QEm61Az_albums.html"]
      ]
    }
  };

  const format = (value) => new Intl.NumberFormat("en-GB").format(value);
  const row = (entry, index) => `<a class="yearbook-row" href="${entry[3]}" target="_blank" rel="noopener noreferrer" aria-label="Open source for ${entry[0]}"><span class="yearbook-rank">${String(index + 1).padStart(2, "0")}</span><span class="yearbook-copy"><strong>${entry[0]}</strong><span>${entry[1]}</span></span><span class="yearbook-value">${format(entry[2])}<small>Spotify plays</small></span></a>`;
  const list = (title, entries) => `<section><h4 class="yearbook-list-title">${title}<small>15 releases</small></h4><div class="yearbook-list">${entries.map(row).join("")}</div></section>`;
  const render = (year) => {
    const target = document.getElementById("yearbook-archive");
    const data = yearbooks[year];
    if (!target || !data) return;
    target.innerHTML = `<section class="yearbook-panel"><div class="yearbook-head"><div><p>Release-year archive</p><h3>2018 — the records that travelled</h3></div><small>Totals are current lifetime Spotify plays for releases first issued in 2018. They are not streams earned during 2018.</small></div><div class="yearbook-tabs"><button class="yearbook-tab" type="button" aria-selected="true">2018</button></div><div class="yearbook-grid">${list("Top 15 songs", data.songs)}${list("Top 15 albums", data.albums)}</div><p class="yearbook-footnote"><strong>Reading the numbers.</strong> Every number is an exact saved Spotify total from the linked Kworb artist/track source, checked ${verifiedAt}. Click any row to inspect it. Reissues, duplicate editions and compilations are not combined, so one release is counted once.</p></section>`;
  };
  document.addEventListener("DOMContentLoaded", () => render(2018));
})();
