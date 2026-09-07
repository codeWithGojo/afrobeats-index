import { createClient } from '@supabase/supabase-js';
const config = await fetch('/community-config.json').then(r => { if (!r.ok) throw Error('Account configuration could not load.'); return r.json(); });
const client = createClient(config.url, config.key, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: 'implicit', storageKey: 'afri-auth' } });
const errors = {
  email_address_not_authorized: 'Email delivery is restricted by the sign-in provider. The site administrator must enable a production email sender.',
  over_email_send_rate_limit: 'Too many emails requested. Wait a few minutes before trying again.',
  otp_expired: 'This sign-in link or code has expired or was already used. Request a fresh link.',
  over_request_rate_limit: 'Too many requests. Please wait and try again.',
  invalid_credentials: 'The email or sign-in code is incorrect.',
};
const describe = error => errors[error?.code] || error?.message || 'Sign-in failed. Check your connection and retry.';
let callbackError = null;
const fragment = new URLSearchParams(location.hash.slice(1));
if (fragment.has('error')) { callbackError = fragment.get('error_description') || fragment.get('error'); history.replaceState({}, '', location.pathname + location.search); }
client.auth.onAuthStateChange((event, session) => window.dispatchEvent(new CustomEvent('afri:account', {detail: {event, signedIn: !!session}})));
window.AfriAccount = {
  client, config, describe,
  get callbackError() { return callbackError; },
  async session() { const {data, error} = await client.auth.getSession(); if (error) throw error; return data.session; },
  async user() { const {data, error} = await client.auth.getUser(); if (error || !data.user) throw Error('Sign in to My board to use this feature.'); return data.user; },
  async signIn(email) {
    const {error} = await client.auth.signInWithOtp({email, options: {emailRedirectTo: location.origin + '/account'}});
    if (error) throw Error(describe(error));
  },
  async verify(email, token) { const {error} = await client.auth.verifyOtp({email, token, type: 'email'}); if (error) throw Error(describe(error)); },
  async signOut() { const {error} = await client.auth.signOut(); if (error) throw Error(describe(error)); sessionStorage.removeItem('afri-account'); },
};
// Migrate the old short-lived session once; newly issued sessions include refresh tokens.
sessionStorage.removeItem('afri-account');
await window.AfriAccount.session();
window.dispatchEvent(new Event('afri:account-ready'));
