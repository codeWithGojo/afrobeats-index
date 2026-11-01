# Artist share cards — 1 November 2026

All 50 Current artists use an embedded portrait from the existing site assets. The PNG export contains the image bytes; Story, Open Graph, profile preview and Receipt Wrapped use the same renderer. Davido uses the existing face portrait instead of the catalogue logo.

The six cells now show reported Spotify lifetime streams, the latest daily observation, tracked song and project counts, the stream index normalized to 0–99, and the published editorial contribution out of 83. These have different units, displayed under each value. Project counts include the singles, EPs and albums present in the source ledger; they are not a claimed studio-album count.

The missing IMP, REA, AWD, LIV and CUL component ratings have not been reconstructed or invented. The new metric labels describe the values actually available. Rank, overall score, movement and the underlying source records remain unchanged.

The build refreshes `data/player-card-coverage.json` from the current snapshot and rejects incomplete portraits or missing card metrics. Invalid observations stay unknown in the model. The PNG endpoint accepts only a known artist slug and embedded local raster images, with no remote image fetch.
