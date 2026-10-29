import { createClient } from '@supabase/supabase-js';
const config = await fetch('/community-config.json').then(r => { if (!r.ok) throw Error('Account configuration could not load.'); return r.json(); });
// Only the account route owns Supabase callbacks; Spotify returns its own code elsewhere.
const isAccountCallback = /^\/account\/?$/.test(location.pathname);
const client = createClient(config.url, config.key, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false, flowType: 'implicit', storageKey: 'afri-auth' } });
const errors = {
  email_address_not_authorized: 'Email delivery is restricted by the sign-in provider. The site administrator must enable a production email sender.',
  over_email_send_rate_limit: 'Too many emails requested. Wait a few minutes before trying again.',
  otp_expired: 'This sign-in link or code has expired or was already used. Request a fresh link.',
  over_request_rate_limit: 'Too many requests. Please wait and try again.',
  invalid_credentials: 'The email or sign-in code is incorrect.',
};
const describe = error => errors[error?.code] || error?.message || 'Sign-in failed. Check your connection and retry.';
let callbackError = null;
const fragment = new URLSearchParams(isAccountCallback ? location.hash.slice(1) : '');
const callback = new URLSearchParams(isAccountCallback ? location.search : '');
if (fragment.has('error')) { callbackError = fragment.get('error_description') || fragment.get('error'); history.replaceState({}, '', location.pathname + location.search); }
// One explicit callback handler avoids automatic and manual exchanges racing.
if (fragment.has('access_token') && fragment.has('refresh_token')) {
  const {error} = await client.auth.setSession({
    access_token: fragment.get('access_token'),
    refresh_token: fragment.get('refresh_token'),
  });
  if (error) callbackError = describe(error);
  history.replaceState({}, '', '/account');
}
// Support both the default ConfirmationURL and custom token-hash templates.
if (callback.has('token_hash')) {
  const type = callback.get('type') || 'email';
  if (['email', 'signup', 'magiclink'].includes(type)) {
    const {error} = await client.auth.verifyOtp({token_hash: callback.get('token_hash'), type});
    if (error) callbackError = describe(error);
  } else callbackError = 'This link is not an email sign-in link.';
  history.replaceState({}, '', '/account');
} else if (callback.has('code')) {
  const {error} = await client.auth.exchangeCodeForSession(callback.get('code'));
  if (error) callbackError = describe(error);
  history.replaceState({}, '', '/account');
}
if (callback.has('error_description')) {callbackError = callback.get('error_description');history.replaceState({}, '', '/account');}
client.auth.onAuthStateChange((event, session) => window.dispatchEvent(new CustomEvent('afri:account', {detail: {event, signedIn: !!session}})));
window.AfriAccount = {
  client, config, describe,
  get callbackError() { return callbackError; },
  async session() { const {data, error} = await client.auth.getSession(); if (error) throw error; return data.session; },
  async user() { const {data, error} = await client.auth.getUser(); if (error || !data.user) throw Error('Sign in to My board to use this feature.'); return data.user; },
  async signIn(email) {
    const {error} = await client.auth.signInWithOtp({email, options: {emailRedirectTo: (location.hostname === 'localhost' || location.hostname === '127.0.0.1' ? location.origin : 'https://afrobeats-index.vercel.app') + '/account'}});
    if (error) throw Error(describe(error));
  },
  async verify(email, token) { const {error} = await client.auth.verifyOtp({email, token, type: 'email'}); if (error) throw Error(describe(error)); },
  async signOut() { const {error} = await client.auth.signOut(); if (error) throw Error(describe(error)); sessionStorage.removeItem('afri-account'); },
};
// Migrate the old short-lived session once; newly issued sessions include refresh tokens.
sessionStorage.removeItem('afri-account');
await window.AfriAccount.session();
window.dispatchEvent(new Event('afri:account-ready'));
