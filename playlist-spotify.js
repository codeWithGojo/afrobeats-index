const storageKey = "afri-playlist-oauth";
const base64 = (bytes) =>
  btoa(String.fromCharCode(...bytes))
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
const redirect = () => location.origin + "/studio/playlists";
async function configuration() {
  await import("/music-receipt-config.js");
  const id = window.AFRI_MUSIC_CONFIG?.spotifyClientId;
  if (!id) throw Error("Spotify playlist connection is not configured.");
  return id;
}
export async function startPlaylist(board) {
  const client = await configuration(),
    verifier = base64(crypto.getRandomValues(new Uint8Array(64))),
    state = base64(crypto.getRandomValues(new Uint8Array(24))),
    challenge = base64(
      new Uint8Array(
        await crypto.subtle.digest(
          "SHA-256",
          new TextEncoder().encode(verifier),
        ),
      ),
    );
  sessionStorage.setItem(
    storageKey,
    JSON.stringify({ verifier, state, board, createdAt: Date.now() }),
  );
  const url = new URL("https://accounts.spotify.com/authorize");
  url.search = new URLSearchParams({
    client_id: client,
    response_type: "code",
    redirect_uri: redirect(),
    scope: "playlist-modify-private",
    code_challenge_method: "S256",
    code_challenge: challenge,
    state,
  }).toString();
  location.assign(url.href);
}
export async function finishPlaylist(request, report) {
  const query = new URLSearchParams(location.search);
  if (!query.has("code") && !query.has("error")) return;
  const saved = sessionStorage.getItem(storageKey);
  sessionStorage.removeItem(storageKey);
  history.replaceState({}, "", redirect());
  if (query.has("error")) {
    report(
      "Spotify permission was not granted. The tracklist is still available.",
    );
    return;
  }
  let draft;
  try {
    draft = JSON.parse(saved);
  } catch {}
  if (
    !draft ||
    draft.state !== query.get("state") ||
    Date.now() - draft.createdAt > 600000
  ) {
    report("The Spotify connection expired. Start again.");
    return;
  }
  try {
    report("Creating your private Spotify playlist…");
    const client = await configuration(),
      response = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: client,
          grant_type: "authorization_code",
          code: query.get("code"),
          redirect_uri: redirect(),
          code_verifier: draft.verifier,
        }),
      });
    const token = await response.json();
    if (!response.ok || !token.access_token)
      throw Error(
        "Spotify could not connect. The app redirect URI and allowed users may need configuration.",
      );
    const call = async (path, body) => {
      const r = await fetch("https://api.spotify.com/v1" + path, {
          method: "POST",
          headers: {
            Authorization: "Bearer " + token.access_token,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        }),
        d = await r.json();
      if (!r.ok) throw Error(d.error?.message || "Spotify request failed.");
      return d;
    };
    const d = await request("playlist", { board: draft.board });
    if (!d.tracks.length) throw Error("This board has no sourced track IDs.");
    const playlist = await call("/me/playlists", {
      name: "Afri Index · " + draft.board + " · " + d.edition.slice(0, 10),
      public: false,
      description:
        "One sourced recording per artist, in published board order. afrobeats-index.vercel.app",
    });
    // Preserve the created playlist URL if adding tracks fails. Retrying must not silently create duplicates.
    const url =
      playlist.external_urls?.spotify ||
      "https://open.spotify.com/playlist/" + playlist.id;
    try {
      await call("/playlists/" + playlist.id + "/items", {
        uris: d.tracks.map((t) => t.uri),
      });
    } catch (error) {
      report(
        `Your empty playlist was created: ${url}. Track insertion failed: ${error.message}. The board tracklist remains available.`,
      );
      return;
    }
    report("Playlist created: " + url);
    const link = document.createElement("a");
    link.href = url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = "Open your Spotify playlist →";
    document
      .getElementById("playlist-status")
      ?.append(document.createElement("br"), link);
  } catch (error) {
    report(error.message);
  }
}
