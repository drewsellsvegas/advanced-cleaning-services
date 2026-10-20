import type { APIRoute } from 'astro';
import { getAreas, getServices } from '../lib/data';
import { absUrl } from '../lib/schema';
import { isSet } from '../lib/placeholder';
import { stripInline } from '../lib/text';
import site from '../data/site.json';

// llms-full.txt (PLAN 2.7): plain prose dump of the business, services and areas. Anything still a placeholder is skipped.
const clean = (s: string) => stripInline(s).replace(/\s+/g, ' ').trim();

export const GET: APIRoute = async () => {
  const [services, areas] = await Promise.all([getServices(), getAreas()]);
  const out: string[] = [
    `# ${site.name}`,
    '',
    'Carpet, tile, upholstery and exterior cleaning for homes across the Las Vegas Valley, Nevada. Estimates are free and are given by text from photos. No prices are published.',
    '',
    `Phone (call or text): ${site.phone.display}`,
    `Website: ${absUrl('/')}`,
    `Service area: ${areas.map((a) => `${a.name}, NV`).join('; ')}.`,
    '',
    '## Services',
    ''
  ];
  for (const s of services) {
    out.push(`### ${s.name}`, `URL: ${absUrl(`/services/${s.slug}`)}`);
    if (isSet(s.heroIntro)) out.push('', clean(s.heroIntro));
    const faq = s.faq.filter((f) => isSet(f.q) && isSet(f.a));
    for (const f of faq) out.push('', `Q: ${clean(f.q)}`, `A: ${clean(f.a)}`);
    out.push('');
  }
  out.push('## Service Areas', '');
  for (const a of areas) {
    out.push(`### ${a.name}, NV`, `URL: ${absUrl(`/service-areas/${a.slug}`)}`);
    if (isSet(a.heroIntro)) out.push('', clean(a.heroIntro));
    out.push('');
  }
  return new Response(out.join('\n'), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
