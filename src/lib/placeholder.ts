/**
 * False for null, undefined, empty string, empty array, or any string containing
 * "[PLACEHOLDER". Arrays and objects are checked recursively: a value that holds
 * a placeholder anywhere inside it is not considered set.
 */
export function isSet(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim() !== '' && !value.includes('[PLACEHOLDER');
  if (Array.isArray(value)) return value.length > 0 && value.every(isSet);
  if (typeof value === 'object') {
    const values = Object.values(value as Record<string, unknown>);
    return values.length > 0 && values.every(isSet);
  }
  return true;
}

/** True when an image / review / before-after entry is flagged as a placeholder. */
export function isPlaceholderImage(entry: { placeholder?: boolean } | null | undefined): boolean {
  return entry?.placeholder === true;
}

/**
 * Optional facts (hours, email, license, GBP, social) render when set. In `astro dev` they also render
 * while still a placeholder (wrapped in <mark class="ph"> by renderInline) so gaps are easy to spot.
 * Production builds hide unset rows entirely (PLAN 5.6).
 */
export function showOptional(value: unknown): boolean {
  return isSet(value) || (import.meta.env.DEV && value !== null && value !== undefined && value !== '');
}
