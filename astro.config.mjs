// @ts-check
import { readFileSync } from 'node:fs';
import { defineConfig, fontProviders } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// Until site.json exists / aboutReady is true, /about is noindex and stays out of the sitemap.
let aboutReady = false;
try {
  aboutReady = JSON.parse(readFileSync(new URL('./src/data/site.json', import.meta.url), 'utf8')).aboutReady === true;
} catch {}

// Deploy targets. Production: domain root, indexable (no env vars needed).
// GitHub Pages preview: SITE_URL=https://drewsellsvegas.github.io BASE_PATH=/advanced-cleaning-services PREVIEW=1
// [PLACEHOLDER: domain] - swap the SITE_URL default here and in src/data/site.json (Q1)
const SITE_URL = (process.env.SITE_URL || 'https://advancedcleaninglv.example').replace(/\/+$/, '');
const rawBase = (process.env.BASE_PATH || '/').trim();
const BASE_PATH = rawBase === '/' || rawBase === '' ? '/' : `/${rawBase.replace(/^\/+|\/+$/g, '')}`;
const PREVIEW = process.env.PREVIEW === '1' || process.env.PREVIEW === 'true';
// The base is stripped from sitemap page URLs so the filter below sees site paths ("/about").
const stripBase = (pathname) => (BASE_PATH !== '/' && pathname.startsWith(BASE_PATH) ? pathname.slice(BASE_PATH.length) || '/' : pathname);

// https://astro.build/config
export default defineConfig({
  site: SITE_URL,
  base: BASE_PATH,
  trailingSlash: 'never',
  build: {
    format: 'file'
  },
  integrations: [
    sitemap({
      filter: (page) => {
        const path = stripBase(new URL(page).pathname).replace(/\/$/, '');
        if (path === '/404') return false;
        if (path === '/about' && !aboutReady) return false;
        return true;
      }
    })
  ],
  fonts: [
    {
      provider: fontProviders.fontsource(),
      name: 'Plus Jakarta Sans',
      cssVariable: '--font-jakarta',
      weights: [400, 500, 600, 700, 800],
      styles: ['normal'],
      subsets: ['latin'],
      fallbacks: ['Arial', 'sans-serif'],
      optimizedFallbacks: true,
      display: 'swap'
    }
  ],
  vite: {
    plugins: [tailwindcss()],
    define: { 'import.meta.env.PREVIEW': JSON.stringify(PREVIEW ? '1' : '') }
  }
});
