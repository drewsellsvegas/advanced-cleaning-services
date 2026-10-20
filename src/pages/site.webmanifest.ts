import type { APIRoute } from 'astro';
import { withBase } from '../lib/paths';

// Web app manifest as an endpoint so start_url and icon paths follow the base path (GitHub Pages preview).
export const GET: APIRoute = () =>
  new Response(
    JSON.stringify(
      {
        name: 'Advanced Cleaning Services',
        short_name: 'Advanced Cleaning',
        start_url: withBase('/'),
        display: 'browser',
        background_color: '#FFFFFF',
        theme_color: '#FFFFFF',
        icons: [
          { src: withBase('/icon-192.png'), sizes: '192x192', type: 'image/png' },
          { src: withBase('/icon-512.png'), sizes: '512x512', type: 'image/png' },
          { src: withBase('/icon-maskable-512.png'), sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      },
      null,
      2
    ),
    { headers: { 'Content-Type': 'application/manifest+json; charset=utf-8' } }
  );
