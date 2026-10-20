import site from '../data/site.json';
import type { Area, Service } from './data';
import { isSet } from './placeholder';
import { basePath } from './paths';

/**
 * JSON-LD builders (PLAN 2.6). Hard rules enforced here:
 * - A field is only emitted when `isSet(value)` is true; `prune()` strips anything unset or holding "[PLACEHOLDER".
 * - Never emitted: aggregateRating, review, priceRange, geo, streetAddress, postalCode, foundingDate, hasCredential.
 */

export type JsonLdNode = Record<string, unknown>;
export type Crumb = { name: string; path: string };

const FORBIDDEN_KEYS = new Set([
  'aggregateRating', 'review', 'priceRange', 'geo', 'streetAddress', 'postalCode', 'foundingDate', 'hasCredential'
]);

/** Origin plus base path, no trailing slash (e.g. "https://x.github.io/advanced-cleaning-services"). SITE comes from astro.config. */
export const siteUrl = `${(import.meta.env.SITE || site.url).replace(/\/+$/, '')}${basePath}`;
export const businessId = `${siteUrl}/#business`;
export const websiteId = `${siteUrl}/#website`;

/** Absolute URL from a site path. "/" gives "https://domain/", everything else has no trailing slash. */
export function absUrl(path = '/'): string {
  if (path === '/' || path === '') return `${siteUrl}/`;
  return `${siteUrl}/${path.replace(/^\/+|\/+$/g, '')}`;
}

/** Build date as YYYY-MM-DD, computed at build time. */
export const buildDate = (): string => new Date().toISOString().slice(0, 10);

/** Recursively drop unset values and forbidden keys. Returns undefined when nothing is left. */
export function prune<T>(value: T): T | undefined {
  if (Array.isArray(value)) {
    const items = value.map(prune).filter((v) => v !== undefined);
    return (items.length ? items : undefined) as T | undefined;
  }
  if (value && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([k]) => !FORBIDDEN_KEYS.has(k))
      .map(([k, v]) => [k, prune(v)] as const)
      .filter(([, v]) => v !== undefined);
    return (entries.length ? Object.fromEntries(entries) : undefined) as T | undefined;
  }
  return isSet(value) || typeof value === 'boolean' ? value : undefined;
}

const areaPlace = (a: Pick<Area, 'schemaType' | 'name'>) => ({ '@type': a.schemaType, name: `${a.name}, NV` });

function areaServedList(areas: Area[]) {
  return [{ '@type': 'AdministrativeArea', name: 'Las Vegas Valley, NV' }, ...areas.map(areaPlace)];
}

const DAY_NAMES: Record<string, string> = {
  mon: 'Monday', tue: 'Tuesday', wed: 'Wednesday', thu: 'Thursday', fri: 'Friday', sat: 'Saturday', sun: 'Sunday'
};

export function localBusiness(services: Service[], areas: Area[]): JsonLdNode {
  const sameAs = [site.googleBusinessProfileUrl, ...Object.values(site.social)].filter((u) => isSet(u));
  const hours = site.hours.schema.filter((h) => isSet(h.days) && isSet(h.opens) && isSet(h.closes));
  return prune({
    '@type': ['LocalBusiness', 'HomeAndConstructionBusiness'],
    '@id': businessId,
    name: site.name,
    url: absUrl('/'),
    telephone: site.phone.schema,
    image: `${siteUrl}/logo.png`,
    logo: `${siteUrl}/logo.png`,
    description:
      'Carpet, tile, upholstery and exterior cleaning for homes across the Las Vegas Valley, Nevada. Free estimates by call or text.',
    address: { '@type': 'PostalAddress', addressLocality: 'Las Vegas', addressRegion: 'NV', addressCountry: 'US' },
    areaServed: areaServedList(areas),
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: site.phone.schema,
      contactType: 'customer service',
      areaServed: 'US-NV',
      availableLanguage: site.languages
    },
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Cleaning services',
      itemListElement: services.map((s) => ({
        '@type': 'Offer',
        itemOffered: { '@type': 'Service', name: s.name, url: absUrl(`/services/${s.slug}`) }
      }))
    },
    ...(isSet(site.email) ? { email: site.email } : {}),
    ...(hours.length
      ? {
          openingHoursSpecification: hours.map((h) => ({
            '@type': 'OpeningHoursSpecification',
            dayOfWeek: h.days.map((d) => DAY_NAMES[d.toLowerCase().slice(0, 3)] ?? d),
            opens: h.opens,
            closes: h.closes
          }))
        }
      : {}),
    ...(sameAs.length ? { sameAs } : {})
  }) as JsonLdNode;
}

export function webSite(): JsonLdNode {
  return {
    '@type': 'WebSite',
    '@id': websiteId,
    url: absUrl('/'),
    name: site.name,
    publisher: { '@id': businessId },
    inLanguage: 'en-US'
  };
}

/** Service page node. */
export function serviceNode(service: Service, areas: Area[]): JsonLdNode {
  const url = absUrl(`/services/${service.slug}`);
  return prune({
    '@type': 'Service',
    '@id': `${url}#service`,
    name: `${service.name} in Las Vegas, NV`,
    serviceType: service.name,
    description: service.metaDescription,
    url,
    provider: { '@id': businessId },
    areaServed: areaServedList(areas),
    dateModified: buildDate(),
    ...(isSet(site.launchDate) ? { datePublished: site.launchDate } : {})
  }) as JsonLdNode;
}

/** Area page node (area-scoped Service). */
export function areaServiceNode(area: Area): JsonLdNode {
  const url = absUrl(`/service-areas/${area.slug}`);
  return prune({
    '@type': 'Service',
    '@id': `${url}#service`,
    name: `Carpet & Tile Cleaning in ${area.name}, NV`,
    serviceType: 'Carpet and tile cleaning',
    provider: { '@id': businessId },
    areaServed: [{ ...areaPlace(area), containedInPlace: { '@type': 'Place', name: area.containedIn } }],
    dateModified: buildDate(),
    ...(isSet(site.launchDate) ? { datePublished: site.launchDate } : {})
  }) as JsonLdNode;
}

/** FAQPage from the same items rendered on the page. Returns undefined if no real Q&A exists yet. */
export function faqPage(items: { q: string; a: string }[]): JsonLdNode | undefined {
  const real = items.filter((i) => isSet(i.q) && isSet(i.a));
  if (!real.length) return undefined;
  return {
    '@type': 'FAQPage',
    mainEntity: real.map((i) => ({
      '@type': 'Question',
      name: i.q,
      acceptedAnswer: { '@type': 'Answer', text: i.a }
    }))
  };
}

export function breadcrumbList(crumbs: Crumb[]): JsonLdNode {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.name,
      item: absUrl(c.path)
    }))
  };
}

/** Wrap nodes in the single @graph document printed by JsonLd.astro. */
export function graph(nodes: (JsonLdNode | undefined)[]): JsonLdNode {
  return { '@context': 'https://schema.org', '@graph': nodes.filter(Boolean) };
}
