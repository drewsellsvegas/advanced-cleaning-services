// Base-path helpers. Production lives at a domain root (base "/"); the GitHub Pages preview is served from a
// sub-path (BASE_PATH=/advanced-cleaning-services). Every root-absolute internal URL goes through withBase().

const rawBase: string = import.meta.env.BASE_URL ?? '/';

/** Base without a trailing slash: "" at the domain root, "/advanced-cleaning-services" for the preview. */
export const basePath: string = rawBase === '/' ? '' : rawBase.replace(/\/+$/, '');

/** True when a preview build (PREVIEW=1): noindex everywhere, robots.txt disallows all, no sitemap link. */
export const isPreview: boolean = import.meta.env.PREVIEW === '1' || import.meta.env.PREVIEW === 'true';

/**
 * Prefix a root-absolute internal path ("/services/x?y=1#z") with the site base.
 * "/" becomes "<base>/". Fragments, query-only strings, protocol-relative URLs, absolute URLs and
 * tel:/sms:/mailto: values are returned untouched.
 */
export function withBase(path: string): string {
  if (typeof path !== 'string' || !path.startsWith('/') || path.startsWith('//')) return path;
  return `${basePath}${path}`;
}
