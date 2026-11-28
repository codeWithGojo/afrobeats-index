(async function accountNavigation() {
  function render(signedIn) {
    document.querySelectorAll('.account-link, [data-account-link]').forEach(link => {
      link.textContent = signedIn ? (link.dataset.accountLabel || 'My board') : (link.dataset.signedOutLabel || 'Sign in');
      link.setAttribute('aria-label', signedIn ? (link.dataset.accountLabel || 'My board') : 'Sign in to Afri Index');
    });
  }
  window.addEventListener('afri:account', event => render(Boolean(event.detail?.signedIn)));
  window.addEventListener('afri:account-link-added', async () => {
    try { render(Boolean(await window.AfriAccount?.session())); } catch { /* Keep the default sign-in link available. */ }
  });
  // Phase 10: visitors with no saved session never download the account bundle (about 50 KB).
  // If storage is unavailable we cannot tell, so load it as before.
  const mayHaveSession = (() => { try { return localStorage.getItem('afri-auth') !== null; } catch { return true; } })();
  if (!mayHaveSession) { render(false); return; }
  try {
    await import('/assets/account.js');
    render(Boolean(await window.AfriAccount.session()));
  } catch { /* Public pages stay usable when the account service is unavailable. */ }
})();
