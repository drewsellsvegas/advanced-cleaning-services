import { withBase } from './paths';
const escapeHtml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

// [anchor text](/internal/path). Only paths that start with a single "/" qualify.
const LINK = /\[([^\]]+)\]\((\/(?!\/)[^)\s]*)\)/g;
const PLACEHOLDER = /\[PLACEHOLDER[^\]]*\]/g;

/** Escape plain text; in `astro dev` also wrap placeholder tokens in <mark class="ph"> (PLAN 5.6). */
function plain(text: string): string {
  const escaped = escapeHtml(text);
  return import.meta.env.DEV
    ? escaped.replace(PLACEHOLDER, (m) => `<mark class="ph">${m}</mark>`)
    : escaped;
}

/**
 * Inline link helper (PLAN 5.3). Turns `[text](/path)` into `<a class="link" href="/path">text</a>`
 * for internal paths only. Everything else, including other Markdown and external links, renders as
 * escaped literal text. Output is HTML for `set:html`.
 */
export function renderInline(text: string): string {
  let out = '';
  let last = 0;
  for (const m of text.matchAll(LINK)) {
    out += plain(text.slice(last, m.index));
    out += `<a class="link" href="${escapeHtml(withBase(m[2]))}">${plain(m[1])}</a>`;
    last = m.index + m[0].length;
  }
  return out + plain(text.slice(last));
}

/** Internal link targets used in a string, for the content audit. */
export function inlineLinkTargets(text: string): string[] {
  return [...text.matchAll(LINK)].map((m) => m[2]);
}

/** Plain text with links reduced to their anchor text (for JSON-LD and llms files). */
export function stripInline(text: string): string {
  return text.replace(LINK, '$1');
}
