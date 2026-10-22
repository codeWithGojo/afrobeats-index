(() => {
  'use strict';
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  let paused = false;
  try { paused = localStorage.getItem('afri-motion') === 'off'; } catch { /* Optional. */ }
  const button = document.createElement('button');
  button.type = 'button'; button.className = 'afri-motion-toggle';
  const track = document.createElement('div'); track.className = 'afri-reading-progress'; track.setAttribute('aria-hidden', 'true');
  const bar = document.createElement('span'); track.append(bar); document.body.append(track, button);
  let teardown = () => {};
  function sync() {
    teardown();
    const off = paused || preference.matches;
    document.documentElement.dataset.motion = off ? 'off' : 'on';
    button.textContent = off ? '▷ Motion off' : 'Ⅱ Pause motion';
    button.setAttribute('aria-pressed', String(off)); button.disabled = preference.matches;
    button.title = preference.matches ? 'Reduced motion follows your device setting' : 'Control decorative animation';
    if (off || !('IntersectionObserver' in window) || !Element.prototype.animate) return;
    const running = new Set(); const seen = new WeakSet();
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const index = [...(el.parentElement?.children || [])].indexOf(el);
      const photo = el.matches('.hero-artist,.big-three-card');
      const row = el.matches('.current-row,.quiz-artist-card');
      const animation = el.animate([
        { opacity: .12, transform: photo ? 'translateY(28px) scale(.96)' : row ? 'translateX(-12px)' : 'translateY(20px)' },
        { opacity: 1, transform: 'none' }
      ], { duration: photo ? 900 : row ? 420 : 650, delay: Math.min(index % 5, 4) * 45, easing: 'cubic-bezier(.16,1,.3,1)' });
      running.add(animation); animation.onfinish = () => running.delete(animation);
      observer.unobserve(el);
    }), { threshold: .04 });
    const selector = '.index-hero-copy > *, .hero-artist, .index-shortcuts > a, .current-row, .big-three-card, .freshness-module, .tab-content > h2, .quiz-artist-card, .quiz-start, .question-panel, .result-panel, #studio > section, #studio > h1';
    const register = root => {
      const nodes = [...root.querySelectorAll(selector)]; if (root instanceof Element && root.matches(selector)) nodes.unshift(root);
      nodes.forEach(el => { if (!seen.has(el)) { seen.add(el); observer.observe(el); } });
    };
    register(document);
    const mutations = new MutationObserver(records => records.forEach(record => {
      record.addedNodes.forEach(node => { if (node instanceof Element) register(node); });
      record.removedNodes.forEach(node => { if (node instanceof Element) { observer.unobserve(node); node.querySelectorAll(selector).forEach(el => observer.unobserve(el)); } });
    }));
    mutations.observe(document.querySelector('main') || document.body, { childList: true, subtree: true });
    let frame = 0;
    const update = () => { frame = 0; const total = document.documentElement.scrollHeight - innerHeight; bar.style.transform = `scaleX(${total > 0 ? scrollY / total : 0})`; };
    const scroll = () => { if (!frame) frame = requestAnimationFrame(update); };
    addEventListener('scroll', scroll, { passive: true }); addEventListener('resize', scroll); update();
    const resize = new ResizeObserver(scroll); resize.observe(document.body);
    teardown = () => { observer.disconnect(); mutations.disconnect(); resize.disconnect(); running.forEach(a => a.cancel()); cancelAnimationFrame(frame); removeEventListener('scroll', scroll); removeEventListener('resize', scroll); };
  }
  button.addEventListener('click', () => { paused = !paused; try { localStorage.setItem('afri-motion', paused ? 'off' : 'on'); } catch { /* Optional. */ } sync(); });
  preference.addEventListener('change', sync); sync();
})();
