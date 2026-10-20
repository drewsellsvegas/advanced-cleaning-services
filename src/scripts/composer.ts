// SMS composer for /free-estimate (PLAN task 27). Builds a pre-filled text message in the browser and hands it to the
// phone's messaging app with an sms: link. Nothing is sent to a server: no fetch, no form submission.
const form = document.getElementById('composer-form') as HTMLFormElement | null;

if (form) {
  const phone = form.dataset.phone ?? '';
  const field = (name: string) => form.elements.namedItem(name) as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
  const service = field('service') as HTMLSelectElement;
  const area = field('area') as HTMLSelectElement;
  const size = field('size');
  const notes = field('notes');
  const preview = document.getElementById('composer-preview')!;
  const status = document.getElementById('composer-status')!;

  const selected = (s: HTMLSelectElement) => (s.value ? s.selectedOptions[0].text : '');

  // Message format from PLAN task 27; empty lines are left out.
  const message = () =>
    [
      "Hi Miguel, I'd like a free estimate.",
      selected(service) && `Service: ${selected(service)}`,
      selected(area) && `Area: ${selected(area)}`,
      size.value.trim() && `Size: ${size.value.trim()}`,
      notes.value.trim() && `Notes: ${notes.value.trim()}`,
      "I'll attach photos."
    ]
      .filter(Boolean)
      .join('\n');

  const render = () => {
    preview.textContent = message();
  };

  // ?service={slug} (added by the service pages' estimate panel) pre-selects the service.
  const preset = new URLSearchParams(location.search).get('service');
  if (preset && [...service.options].some((o) => o.value === preset)) service.value = preset;

  form.addEventListener('input', render);
  form.addEventListener('change', render);
  form.addEventListener('submit', (e) => e.preventDefault());

  document.getElementById('composer-open')?.addEventListener('click', () => {
    location.href = `sms:${phone}?&body=${encodeURIComponent(message())}`;
  });

  let timer: number | undefined;
  const say = (text: string) => {
    status.textContent = text;
    clearTimeout(timer);
    timer = window.setTimeout(() => (status.textContent = ''), 4000);
  };
  document.getElementById('composer-copy')?.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(message());
      say('Copied');
    } catch {
      // Older browsers / blocked clipboard permission: select the preview text and use the legacy copy command.
      const range = document.createRange();
      range.selectNodeContents(preview);
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(range);
      let ok = false;
      try {
        ok = document.execCommand('copy');
      } catch {}
      say(ok ? 'Copied' : "Couldn't copy. Select the message above and copy it.");
    }
  });

  render();
}
