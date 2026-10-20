import type { APIRoute } from 'astro';
import { getAreas, getServices } from '../lib/data';
import { absUrl } from '../lib/schema';
import { isSet } from '../lib/placeholder';
import { stripInline } from '../lib/text';
import site from '../data/site.json';

// llms.txt (PLAN 2.7, llmstxt.org format), generated from the data files so it never drifts.
// Every link is a Markdown link. A still-placeholder cardSummary falls back to the page's meta description.
const oneLine = (s: string) => stripInline(s).replace(/\s+/g, ' ').trim();
const pick = (summary: string, fallback: string) => oneLine(isSet(summary) ? summary : fallback);

export const GET: APIRoute = async () => {
  const [services, areas] = await Promise.all([getServices(), getAreas()]);
  const lines = [
    `# ${site.name}`,
    '',
    `> Carpet, tile, upholstery and exterior cleaning for homes across the Las Vegas Valley, NV. Free estimates: call or text ${site.phone.display}.`,
    '',
    'Estimates are given by text from photos of the area to be cleaned. No prices are published, because each job is quoted from your photos.',
    '',
    '## Services',
    '',
    ...services.map((s) => `- [${s.name}](${absUrl(`/services/${s.slug}`)}): ${pick(s.cardSummary, s.metaDescription)}`),
    '',
    '## Service Areas',
    '',
    ...areas.map((a) => `- [${a.name}](${absUrl(`/service-areas/${a.slug}`)}): ${pick(a.cardSummary, a.metaDescription)}`),
    '',
    '## Contact',
    '',
    `- [Free estimate by text](${absUrl('/free-estimate')}): Text a few photos to ${site.phone.display} and get a free estimate, or build your message with the estimate helper.`,
    `- [Contact](${absUrl('/contact')}): Call or text ${site.phone.display} for carpet, tile, upholstery and exterior cleaning anywhere in the Las Vegas Valley.`,
    ''
  ];
  return new Response(lines.join('\n'), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
