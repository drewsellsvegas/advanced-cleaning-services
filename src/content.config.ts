import { defineCollection } from 'astro:content';
import { file } from 'astro/loaders';
import { z } from 'astro/zod';

// Data lives in src/data/*.json (PLAN.md section 5). The file() loader needs an `id`
// per entry, so the parsers below derive it from `slug` (or a fixed id for site.json).
// Task 30: prose fields are validated against the ranges in PLAN.md 5.2 / 5.4. Entries that still hold
// a "[PLACEHOLDER" token (content tasks not done yet) are exempt so the build keeps working; the
// content audit (npm run audit:content) reports them as failures and the launch audit rejects them.

const titleText = z.string().min(1).max(59); // < 60 characters
const metaText = z.string().min(1).max(154); // < 155 characters

const image = z.object({
  src: z.string(),
  alt: z.string(),
  placeholder: z.boolean()
});

const hasPlaceholder = (v: unknown) => JSON.stringify(v).includes('[PLACEHOLDER');
// Word count with inline links ([text](/path)) reduced to their anchor text.
const wc = (s: string) => {
  const t = s.replace(/\[([^\]]+)\]\(\/[^)\s]*\)/g, '$1').trim();
  return t ? t.split(/\s+/).length : 0;
};
const inRange = (n: number, min: number, max: number) => n >= min && n <= max;

/** A string whose word count must be in [min, max] (skipped while it is a placeholder). */
const words = (min: number, max: number) =>
  z.string().min(1).refine((v) => hasPlaceholder(v) || inRange(wc(v), min, max), `must be ${min}-${max} words`);
/** A string array whose item count is in [min, max] and whose total word count is in [wmin, wmax]. */
const paragraphs = (min: number, max: number, wmin: number, wmax: number) =>
  z.array(z.string().min(1)).refine(
    (a) => hasPlaceholder(a) || (inRange(a.length, min, max) && inRange(a.reduce((n, p) => n + wc(p), 0), wmin, wmax)),
    `must be ${min}-${max} paragraphs totalling ${wmin}-${wmax} words`
  );
/** { title, text } items: item count in [min, max], each text in [tmin, tmax] words. */
const titledList = (min: number, max: number, tmin: number, tmax: number) =>
  z.array(z.object({ title: z.string().min(1), text: z.string().min(1) })).refine(
    (a) => hasPlaceholder(a) || (inRange(a.length, min, max) && a.every((i) => inRange(wc(i.text), tmin, tmax))),
    `must be ${min}-${max} items with ${tmin}-${tmax} words of text each`
  );
/** { title, text } items with only a count range (skipped while placeholders). */
const titledCount = (min: number, max: number) =>
  z.array(z.object({ title: z.string().min(1), text: z.string().min(1) })).refine(
    (a) => hasPlaceholder(a) || inRange(a.length, min, max),
    `must be ${min}-${max} items`
  );
/** FAQ list: count in [min, max], each answer in [amin, amax] words. */
const faqList = (min: number, max: number, amin: number, amax: number) =>
  z.array(z.object({ q: z.string().min(1), a: z.string().min(1) })).refine(
    (a) => hasPlaceholder(a) || (inRange(a.length, min, max) && a.every((i) => inRange(wc(i.a), amin, amax))),
    `must be ${min}-${max} questions with ${amin}-${amax} word answers`
  );
const ctaText = z.string().min(1).refine((v) => hasPlaceholder(v) || wc(v) <= 8, 'must be 8 words or fewer');

const serviceSlugs = [
  'carpet-cleaning', 'steam-cleaning', 'stain-removal', 'pet-urine-odor-removal', 'rug-cleaning',
  'upholstery-cleaning', 'tile-cleaning', 'grout-cleaning', 'water-extraction', 'pressure-washing',
  'driveway-cleaning', 'garage-cleaning'
] as const;
const areaSlugs = [
  'las-vegas', 'henderson', 'summerlin', 'north-las-vegas', 'spring-valley', 'enterprise',
  'paradise', 'centennial-hills', 'anthem', 'boulder-city'
] as const;
const serviceSlug = z.enum(serviceSlugs);
const areaSlug = z.enum(areaSlugs);

const withIdFromSlug = (text: string) =>
  (JSON.parse(text) as { slug: string }[]).map((e) => ({ id: e.slug, ...e }));

const services = defineCollection({
  loader: file('src/data/services.json', { parser: withIdFromSlug }),
  schema: z.object({
    slug: serviceSlug,
    name: z.string().min(1),
    group: z.enum(['Carpet & Upholstery', 'Tile & Water', 'Exterior & Garage']),
    order: z.number().int().min(1).max(12),
    icon: z.string().min(1),
    mainKeyword: z.string().min(1),
    supportKeywords: z.array(z.string().min(1)).min(3).max(5),
    title: titleText,
    metaDescription: metaText,
    h1: z.string().refine((v) => v.includes('Las Vegas'), 'service H1 must contain "Las Vegas"'),
    cardSummary: words(12, 20),
    heroIntro: words(40, 60),
    smsMessage: z.string().min(1),
    image,
    overview: paragraphs(2, 3, 150, 220),
    included: titledList(5, 7, 15, 35),
    process: titledList(4, 6, 30, 50),
    benefitsHeading: z.string().min(1),
    benefits: paragraphs(2, 3, 150, 220),
    benefitPoints: titledCount(3, 4),
    whoForHeading: z.string().min(1),
    whoFor: z.object({
      intro: words(30, 50),
      items: titledCount(4, 5)
    }),
    faq: faqList(5, 7, 40, 90),
    related: z.array(serviceSlug).length(3),
    featuredAreas: z.array(areaSlug).length(6),
    ctaHeadline: ctaText
  })
});

const areas = defineCollection({
  loader: file('src/data/areas.json', { parser: withIdFromSlug }),
  schema: z.object({
    slug: areaSlug,
    name: z.string().min(1),
    schemaType: z.enum(['City', 'Place']),
    containedIn: z.string().min(1),
    isMain: z.boolean(),
    order: z.number().int().min(1).max(10),
    mainKeyword: z.string().min(1),
    supportKeywords: z.array(z.string().min(1)).min(3).max(5),
    title: titleText,
    metaDescription: metaText,
    h1: z.string().refine((v) => v.includes('NV'), 'area H1 must contain "NV"'),
    localHeading: z.string().min(1),
    cardSummary: words(12, 20),
    heroIntro: words(40, 60),
    smsMessage: z.string().min(1),
    image: image.optional(),
    servicesIntro: words(60, 90),
    local: paragraphs(3, 4, 250, 350),
    neighborhoods: z.array(z.string().min(1)).min(1),
    estimateCopy: words(60, 90),
    faq: faqList(4, 4, 40, 80),
    popularServices: z.array(serviceSlug).length(6),
    nearbyAreas: z.array(areaSlug).length(3),
    ctaHeadline: ctaText
  })
});

const site = defineCollection({
  loader: file('src/data/site.json', { parser: (text) => [{ id: 'site', ...JSON.parse(text) }] }),
  schema: z.object({
    name: z.string(),
    shortName: z.string(),
    owner: z.string(),
    url: z.string().url(),
    phone: z.object({ display: z.string(), e164: z.string(), schema: z.string() }),
    sms: z.object({ defaultMessage: z.string() }),
    email: z.string(),
    hours: z.object({
      display: z.string(),
      schema: z.array(z.object({ days: z.array(z.string()), opens: z.string(), closes: z.string() }))
    }),
    serviceAreaLabel: z.string(),
    licenseNumber: z.string(),
    insured: z.string(),
    googleBusinessProfileUrl: z.string(),
    social: z.record(z.string(), z.string()),
    languages: z.array(z.string()).min(1),
    aboutReady: z.boolean(),
    launchDate: z.string(),
    reviews: z.array(
      z.object({
        text: z.string(), name: z.string(), area: z.string(), source: z.string(),
        sourceUrl: z.string(), placeholder: z.boolean()
      })
    ),
    beforeAfter: z.array(
      z.object({
        service: serviceSlug, before: z.string(), after: z.string(), altBefore: z.string(),
        altAfter: z.string(), caption: z.string(), placeholder: z.boolean()
      })
    )
  })
});

export const collections = { services, areas, site };
