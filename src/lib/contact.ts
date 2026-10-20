import site from '../data/site.json';

/** Display form, "702-350-5775". */
export const phoneDisplay: string = site.phone.display;
/** E.164 form, "+17023505775". */
export const phoneE164: string = site.phone.e164;

/** tel: link for call buttons. */
export function telHref(): string {
  return `tel:${site.phone.e164}`;
}

/**
 * sms: link. The `?&body=` form works on both iOS and Android.
 * Falls back to the site default message when none is given.
 */
export function smsHref(message?: string): string {
  const body = message ?? site.sms.defaultMessage;
  return `sms:${site.phone.e164}?&body=${encodeURIComponent(body)}`;
}

export const callLabel = `Call ${site.name} at ${site.phone.display}`;
export const textLabel = `Text ${site.name} at ${site.phone.display}`;

/**
 * Accessible name that starts with the visible text (WCAG 2.5.3 label-in-name), e.g.
 * "Call Now - Advanced Cleaning Services at 702-350-5775". Icon-only controls (no visible text) keep callLabel / textLabel.
 */
function labelWith(visible: string | undefined, fallback: string): string {
  const v = visible?.trim();
  if (!v) return fallback;
  return `${v} - ${site.name}${v.includes(site.phone.display) ? '' : ` at ${site.phone.display}`}`;
}
export const callAria = (visible?: string) => labelWith(visible, callLabel);
export const textAria = (visible?: string) => labelWith(visible, textLabel);
