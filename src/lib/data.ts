import { getCollection, getEntry } from 'astro:content';
import type { CollectionEntry } from 'astro:content';

export type Service = CollectionEntry<'services'>['data'];
export type Area = CollectionEntry<'areas'>['data'];
export type Site = CollectionEntry<'site'>['data'];

export const GROUPS = ['Carpet & Upholstery', 'Tile & Water', 'Exterior & Garage'] as const;

/** All services sorted by `order`. */
export async function getServices(): Promise<Service[]> {
  return (await getCollection('services')).map((e) => e.data).sort((a, b) => a.order - b.order);
}

export async function getService(slug: string): Promise<Service | undefined> {
  return (await getEntry('services', slug))?.data;
}

/** All areas sorted by `order`. */
export async function getAreas(): Promise<Area[]> {
  return (await getCollection('areas')).map((e) => e.data).sort((a, b) => a.order - b.order);
}

export async function getArea(slug: string): Promise<Area | undefined> {
  return (await getEntry('areas', slug))?.data;
}

/** Services grouped by menu group, in display order. */
export async function getServicesByGroup(): Promise<{ group: (typeof GROUPS)[number]; services: Service[] }[]> {
  const services = await getServices();
  return GROUPS.map((group) => ({ group, services: services.filter((s) => s.group === group) }));
}

export async function getSite(): Promise<Site> {
  const entry = await getEntry('site', 'site');
  if (!entry) throw new Error('site.json missing from the site collection');
  return entry.data;
}
