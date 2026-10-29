const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const {webcrypto} = require('node:crypto');

const read = path => fs.readFileSync(path, 'utf8');
const accountSource = read('account-client.js').replace(/^import .*?;\n/, '');

function fixture(path, session = null) {
  const url = new URL(path, 'https://afrobeats-index.vercel.app');
  const navigations = [], exchanges = [], requests = [], listeners = new Map();
  const storage = new Map([
    ['afri_spotify_verifier', 'fixture-verifier'],
    ['afri_spotify_state', 'fixture-state'],
  ]);
  const window = {
    AFRI_MUSIC_CONFIG: {spotifyClientId: 'fixture-client'},
    addEventListener(type, callback) {
      if (!listeners.has(type)) listeners.set(type, []);
      listeners.get(type).push(callback);
    },
    dispatchEvent(event) { for (const fn of listeners.get(event.type) || []) fn(event); },
  };
  let authOptions;
  const context = vm.createContext({
    window, URL, URLSearchParams, crypto: webcrypto, TextEncoder,
    btoa: value => Buffer.from(value, 'binary').toString('base64'),
    document: {documentElement: {dataset: {}}, readyState: 'loading', addEventListener() {}},
    localStorage: {getItem: () => null},
    sessionStorage: {
      getItem: key => storage.get(key) || null,
      setItem: (key, value) => storage.set(key, value),
      removeItem: key => storage.delete(key),
    },
    location: {
      origin: url.origin, pathname: url.pathname, search: url.search, hash: url.hash,
      replace: value => navigations.push(value), assign: value => navigations.push(value),
    },
    history: {replaceState: (...args) => navigations.push(args[2])},
    Event: class {constructor(type) { this.type = type; }},
    CustomEvent: class {constructor(type, options) { this.type = type; this.detail = options.detail; }},
    createClient: (url, key, options) => {
      authOptions = options.auth;
      return {auth: {
        getSession: async () => ({data: {session}}),
        onAuthStateChange() {},
        exchangeCodeForSession: async () => { exchanges.push('supabase-code'); return {}; },
        verifyOtp: async () => { exchanges.push('supabase-token'); return {}; },
        setSession: async () => { exchanges.push('supabase-session'); return {}; },
      }};
    },
    fetch: async (url, options) => {
      requests.push({url, options});
      if (url === '/community-config.json') return {ok: true, json: async () => ({url: 'https://fixture.supabase.co', key: 'public-fixture'})};
      if (url === 'https://accounts.spotify.com/api/token') return {ok: true, json: async () => ({access_token: 'fixture-spotify-access'})};
      if (url.includes('/me/top/tracks')) return {ok: true, json: async () => ({items: [{name: 'Fixture song', artists: [{name: 'Tems'}]}]})};
      if (url.includes('/me/top/artists')) return {ok: true, json: async () => ({items: [{name: 'Tems'}]})};
      throw Error('Unexpected request');
    },
  });
  return {context, window, navigations, exchanges, requests, storage, authOptions: () => authOptions};
}

test('early theme routing preserves Spotify receipt and playlist callbacks before the account client runs', async () => {
  for (const path of ['/music-receipt', '/studio/playlists']) {
    const f = fixture(path + '?code=fixture-code&state=fixture-state');
    vm.runInContext(read('theme-init.js'), f.context);
    await vm.runInContext('(async () => {' + accountSource + '})()', f.context);
    assert.deepEqual(f.navigations, [], path);
    assert.deepEqual(f.exchanges, [], path);
    assert.equal(f.authOptions().detectSessionInUrl, false);
    assert.equal(new URLSearchParams(f.context.location.search).get('code'), 'fixture-code');
  }
});

test('receipt callback exchanges only with Spotify and loads tracks and artists while Afri Index is signed in', async () => {
  const f = fixture('/music-receipt?code=fixture-code&state=fixture-state', {user: {id: 'fixture-user'}});
  vm.runInContext(read('theme-init.js'), f.context);
  await vm.runInContext('(async () => {' + accountSource + '})()', f.context);
  vm.runInContext(read('music-receipt.js'), f.context);
  const spotify = f.window.AFRI_MUSIC_SOURCES.spotify;
  await spotify.finishConnection('fixture-code', 'fixture-state');
  const [tracks, artists] = await Promise.all([spotify.getTopTracks('short_term'), spotify.getTopArtists('short_term')]);
  assert.equal(tracks[0].title, 'Fixture song');
  assert.equal(artists[0].name, 'Tems');
  assert.deepEqual(f.navigations, []);
  assert.deepEqual(f.exchanges, []);
  const tokenRequest = f.requests.find(r => r.url.endsWith('/api/token'));
  assert.equal(tokenRequest.options.body.get('redirect_uri'), 'https://afrobeats-index.vercel.app/music-receipt');
  assert.equal(f.storage.has('afri_spotify_verifier'), false);
  assert.equal(f.storage.has('afri_spotify_state'), false);
});

test('Spotify connection always uses the registered receipt callback and rejects mismatched state', async () => {
  const f = fixture('/releases');
  vm.runInContext(read('music-receipt.js'), f.context);
  const spotify = f.window.AFRI_MUSIC_SOURCES.spotify;
  await spotify.connect();
  const authorize = new URL(f.navigations[0]);
  assert.equal(authorize.origin, 'https://accounts.spotify.com');
  assert.equal(authorize.searchParams.get('redirect_uri'), 'https://afrobeats-index.vercel.app/music-receipt');
  assert.equal(authorize.searchParams.get('code_challenge_method'), 'S256');
  await assert.rejects(spotify.finishConnection('fixture-code', 'wrong-state'), /could not be verified/);
  assert.equal(f.requests.length, 0);
});

test('Spotify failures distinguish expired sessions, denied accounts and request limits', async () => {
  for (const [status, message] of [[401, /expired/], [403, /approved testers/], [429, /request limit/]]) {
    const f = fixture('/music-receipt');
    f.context.fetch = async () => ({ok: false, status});
    vm.runInContext(read('music-receipt.js'), f.context);
    const spotify = f.window.AFRI_MUSIC_SOURCES.spotify;
    spotify.accessToken = 'fixture-access';
    await assert.rejects(spotify.getTopTracks('short_term'), message);
    if (status === 401) assert.equal(spotify.accessToken, null);
  }
});

test('legacy email callbacks still reach account while Spotify homepage state is left alone', () => {
  for (const query of ['?code=fixture-email', '?token_hash=fixture-email&type=email', '#access_token=fixture&refresh_token=fixture']) {
    const f = fixture('/' + query);
    vm.runInContext(read('theme-init.js'), f.context);
    assert.equal(f.navigations[0], '/account' + query);
  }
  const f = fixture('/?code=fixture-spotify&state=fixture-state');
  vm.runInContext(read('theme-init.js'), f.context);
  assert.deepEqual(f.navigations, []);
});

test('email callbacks are processed exactly once and still support code, token-hash and session links', async () => {
  for (const [query, expected] of [
    ['?code=fixture-email', 'supabase-code'],
    ['?token_hash=fixture-email&type=email', 'supabase-token'],
    ['#access_token=fixture&refresh_token=fixture', 'supabase-session'],
  ]) {
    const f = fixture('/account' + query);
    await vm.runInContext('(async () => {' + accountSource + '})()', f.context);
    assert.equal(f.authOptions().detectSessionInUrl, false);
    assert.deepEqual(f.exchanges, [expected]);
  }
});

test('header and saved-receipt links reflect the current session and later sign-out', async () => {
  const f = fixture('/current', {user: {id: 'fixture-user'}});
  const makeLink = dataset => ({dataset, attributes: {}, setAttribute(name, value) { this.attributes[name] = value; }});
  const links = [makeLink({}), makeLink({accountLabel: 'My saved receipts', signedOutLabel: 'Sign in / My saved receipts'})];
  f.context.document.querySelectorAll = () => links;
  f.window.AfriAccount = {session: async () => ({user: {id: 'fixture-user'}})};
  const source = read('account-nav.js').replace("await import('/assets/account.js');", '');
  await vm.runInContext(source, f.context);
  assert.equal(links[0].textContent, 'My board');
  assert.equal(links[1].textContent, 'My saved receipts');
  f.window.dispatchEvent({type: 'afri:account', detail: {signedIn: false}});
  assert.equal(links[0].textContent, 'Sign in');
  assert.equal(links[1].textContent, 'Sign in / My saved receipts');
});

test('signed-in My board hides email verification and offers a direct Spotify receipt action', async () => {
  const source = read('studio.js').split('async function board(){')[1].split('async function comparison(')[0];
  const nodes = new Map(), details = {hidden: false}, root = {
    innerHTML: '', insertAdjacentHTML(position, html) { this.innerHTML += html; },
  };
  const $ = selector => {
    if (!nodes.has(selector)) nodes.set(selector, {textContent: '', hidden: false, closest: () => details});
    return nodes.get(selector);
  };
  let lede;
  const context = vm.createContext({
    $, root, session: {user: {email: 'fixture@example.test'}}, artists: [], e: String,
    window: {addEventListener() {}}, document: {querySelectorAll: () => []},
    intro(title, text) { lede = text; }, bind() {}, account: {},
    requireUser: async () => ({id: 'fixture-user'}), db: async () => [],
  });
  await vm.runInContext('(async function board(){' + source + ')()', context);
  assert.doesNotMatch(lede, /Sign in/);
  assert.equal($('#account-heading').textContent, 'Signed in');
  assert.equal($('#send-link').hidden, true);
  assert.equal(details.hidden, true);
  assert.equal($('#sign-out').hidden, false);
  assert.doesNotMatch($('#digest').textContent, /Sign in/);
  assert.match(root.innerHTML, /href="\/music-receipt\?source=spotify"/);
});
