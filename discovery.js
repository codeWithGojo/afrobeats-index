(() => {
  let configuration;
  function config() {
    return configuration ||= fetch('/api/newsletter?action=status', { cache: 'no-store' })
      .then(r => { if (!r.ok) throw Error(); return r.json(); });
  }
  async function initSignup(section) {
    if (section.dataset.bound) return;
    section.dataset.bound = 'true';
    const form = section.querySelector('form'), status = section.querySelector('.signup-status');
    const email = form.elements.email, consent = form.elements.consent, button = form.querySelector('button');
    const show = (message, error = false) => { status.textContent = message; status.dataset.error = String(error); };
    try {
      const settings = await config();
      if (!settings.signupConfigured) {
        show('Email signup opens soon. You can read the latest brief now.');
        return;
      }
      email.disabled = consent.disabled = button.disabled = false;
      show('One email on Sunday. Confirm your address to join.');
    } catch { show('Signup could not load. Refresh to try again, or read the latest brief.', true); return; }
    form.addEventListener('submit', async event => {
      event.preventDefault();
      if (!form.reportValidity()) return;
      button.disabled = true; email.removeAttribute('aria-invalid');
      show('Sending your confirmation request…');
      try {
        const r = await fetch('/api/newsletter?action=subscribe', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({email: email.value, consent: consent.checked, website: form.elements.website.value, source: section.dataset.source}),
          signal: AbortSignal.timeout(15000)
        });
        const result = await r.json();
        if (!r.ok) {
          if (r.status === 400) email.setAttribute('aria-invalid','true');
          throw Error(result.error || 'Could not subscribe. Please retry.');
        }
        show(result.message); form.reset();
      } catch (error) { show(error.name === 'TimeoutError' ? 'The request timed out. Check your inbox before trying again.' : error.message, true); }
      finally { button.disabled = false; }
    });
  }
  document.querySelectorAll('[data-newsletter-signup]').forEach(initSignup);
  document.addEventListener('click', async event => {
    const button = event.target.closest('[data-share-underground]');
    if (!button) return;
    const url = `${location.origin}/underground#underground-${button.dataset.shareUnderground}`;
    const text = `Put ${button.dataset.artist} on your radar. Afri Index Underground — get the Sunday brief: ${location.origin}/newsletter#signup`;
    let status = document.querySelector('.discovery-share-status');
    if (!status) { status = document.createElement('p'); status.className = 'discovery-share-status'; status.setAttribute('role','status'); button.parentElement.append(status); }
    try {
      if (navigator.share) await navigator.share({title:'Afri Index Underground', text, url});
      else { await navigator.clipboard.writeText(`${text}\n${url}`); status.textContent = 'Artist link copied. Put a friend on.'; }
    } catch (error) { if (error.name !== 'AbortError') status.textContent = `Share this artist: ${url}`; }
  });
})();
