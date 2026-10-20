// Mobile menu sheet (PLAN 3.13). Opens from #menu-toggle, locks page scroll, traps focus in header + sheet,
// closes on Escape / resize to lg, and restores focus to the toggle.
const toggle = document.getElementById('menu-toggle') as HTMLButtonElement | null;
const sheet = document.getElementById('mobile-menu');
const header = document.getElementById('site-header');
if (toggle && sheet && header) {
  const html = document.documentElement;
  const inertTargets = [...document.querySelectorAll<HTMLElement>('[data-menu-inert]')];
  const FOCUSABLE = 'a[href], button:not([disabled]), summary, [tabindex]:not([tabindex="-1"])';
  const desktop = window.matchMedia('(min-width: 64rem)');
  let open = false;

  const visibleFocusables = () =>
    [...header.querySelectorAll<HTMLElement>(FOCUSABLE), ...sheet.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
      (el) => el.getClientRects().length > 0 && !el.closest('details:not([open]) > :not(summary)')
    );

  function set(next: boolean) {
    open = next;
    if (next) sheet!.style.top = `${header!.getBoundingClientRect().bottom}px`;
    sheet!.classList.toggle('is-open', next);
    toggle!.setAttribute('aria-expanded', String(next));
    toggle!.setAttribute('aria-label', next ? 'Close menu' : 'Open menu');
    html.style.overflow = next ? 'hidden' : '';
    for (const el of inertTargets) el.toggleAttribute('inert', next);
    if (next) (sheet!.querySelector<HTMLElement>(FOCUSABLE))?.focus({ preventScroll: true });
    else toggle!.focus({ preventScroll: true });
  }

  toggle.addEventListener('click', () => set(!open));
  desktop.addEventListener('change', () => {
    if (open && desktop.matches) set(false);
  });

  document.addEventListener('keydown', (e) => {
    if (!open) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      set(false);
      return;
    }
    if (e.key !== 'Tab') return;
    const list = visibleFocusables();
    if (!list.length) return;
    const first = list[0];
    const last = list[list.length - 1];
    const active = document.activeElement as HTMLElement | null;
    if (!active || !list.includes(active)) {
      e.preventDefault();
      first.focus();
    } else if (e.shiftKey && active === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && active === last) {
      e.preventDefault();
      first.focus();
    }
  });
}
