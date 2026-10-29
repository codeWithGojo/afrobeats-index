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
  try {
    await import('/assets/account.js');
    render(Boolean(await window.AfriAccount.session()));
  } catch { /* Public pages stay usable when the account service is unavailable. */ }
})();
