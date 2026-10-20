import type { APIRoute } from 'astro';
import { siteUrl } from '../lib/schema';
import { isPreview } from '../lib/paths';

// robots.txt (PLAN 2.7). Built from site.url so the domain swap stays a two-line change. AI crawlers are not blocked.
// PREVIEW=1 (client preview on GitHub Pages): disallow everything and leave the sitemap out.
export const GET: APIRoute = () =>
  new Response(
    (isPreview
      ? ['User-agent: *', 'Disallow: /', '']
      : ['User-agent: *', 'Allow: /', '', `Sitemap: ${siteUrl}/sitemap-index.xml`, '']
    ).join('\n'),
    { headers: { 'Content-Type': 'text/plain; charset=utf-8' } }
  );
