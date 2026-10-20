// Desktop mega menu / dropdown behaviour (PLAN 3.12). State lives in aria-expanded on the trigger;
// CSS shows the panel from it. Hover (mouse only) and click/Enter/Space open it, Escape and outside click close it.
const items = [...document.querySelectorAll<HTMLElement>('[data-menu]')];
const trigger = (item: HTMLElement) => item.querySelector<HTMLButtonElement>('button[aria-expanded]')!;
const isOpen = (item: HTMLElement) => trigger(item).getAttribute('aria-expanded') === 'true';

function set(item: HTMLElement, open: boolean, via = 'click') {
  trigger(item).setAttribute('aria-expanded', String(open));
  if (open) item.dataset.via = via;
  else delete item.dataset.via;
}
function closeAll(except?: HTMLElement) {
  for (const item of items) if (item !== except && isOpen(item)) set(item, false);
}

for (const item of items) {
  const btn = trigger(item);
  item.addEventListener('pointerenter', (e) => {
    if (e.pointerType !== 'mouse') return;
    closeAll(item);
    if (!isOpen(item)) set(item, true, 'hover');
  });
  item.addEventListener('pointerleave', (e) => {
    if (e.pointerType === 'mouse' && item.dataset.via === 'hover') set(item, false);
  });
  btn.addEventListener('click', () => {
    if (isOpen(item) && item.dataset.via === 'hover') {
      item.dataset.via = 'click'; // opened by hover, now pinned open by the click
      return;
    }
    closeAll(item);
    set(item, !isOpen(item));
  });
  item.addEventListener('focusout', (e) => {
    const to = (e as FocusEvent).relatedTarget as Node | null;
    if (to && !item.contains(to)) set(item, false);
  });
}

document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  const open = items.find(isOpen);
  if (!open) return;
  set(open, false);
  trigger(open).focus();
});

document.addEventListener('pointerdown', (e) => {
  const t = e.target as Node;
  for (const item of items) if (isOpen(item) && !item.contains(t)) set(item, false);
});
