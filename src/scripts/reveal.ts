// Reveal on scroll + header scroll shadow (PLAN 4.2, 3.12). Transform and opacity only, CSS does the animating.
// Safety net: any error removes the `js` class from <html>, which makes every [data-reveal] element visible.
try {
  // Header shadow: observe a sentinel at the top of the page instead of listening to scroll.
  const sentinel = document.getElementById('top-sentinel');
  const header = document.getElementById('site-header');
  if (sentinel && header && 'IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => header.classList.toggle('is-scrolled', !entry.isIntersecting)).observe(sentinel);
  }

  const els = document.querySelectorAll<HTMLElement>('[data-reveal]');
  if (!('IntersectionObserver' in window)) {
    els.forEach((el) => el.classList.add('is-visible'));
  } else {
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const el = entry.target as HTMLElement;
          el.classList.add('is-visible');
          io.unobserve(el);
          // Once revealed, drop the attribute so the element's own hover transitions (cards, chips) take over.
          el.addEventListener(
            'transitionend',
            (e) => {
              if (e.target === el && e.propertyName === 'opacity') el.removeAttribute('data-reveal');
            },
            { once: false }
          );
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -8% 0px' }
    );
    els.forEach((el) => io.observe(el));
  }
} catch {
  document.documentElement.classList.remove('js');
}
