// Generates brand assets from brand/logo-original.webp (PLAN.md section 9).
// Run: npm run assets:brand
import sharp from 'sharp';
import { writeFile, mkdir, rm } from 'node:fs/promises';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const SRC = path.join(ROOT, 'brand/logo-original.webp');
const CLAMP = Number(process.env.CLAMP ?? 245); // raise-to-white threshold; lower to 240 if a halo shows
const out = (p) => path.join(ROOT, p);

await mkdir(out('src/assets/brand'), { recursive: true });
await mkdir(out('public'), { recursive: true });

// ---- color-to-alpha from white ------------------------------------------
async function toTransparent(input) {
  const { data, info } = await sharp(input).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height } = info;
  const rgba = Buffer.alloc(width * height * 4);
  for (let i = 0, j = 0; i < data.length; i += 3, j += 4) {
    let r = data[i], g = data[i + 1], b = data[i + 2];
    if (r >= CLAMP && g >= CLAMP && b >= CLAMP) { r = g = b = 255; }
    const a = Math.max(255 - r, 255 - g, 255 - b) / 255;
    if (a === 0) { rgba[j] = rgba[j + 1] = rgba[j + 2] = 0; rgba[j + 3] = 0; continue; }
    rgba[j] = Math.round(255 - (255 - r) / a);
    rgba[j + 1] = Math.round(255 - (255 - g) / a);
    rgba[j + 2] = Math.round(255 - (255 - b) / a);
    rgba[j + 3] = Math.round(a * 255);
  }
  return { rgba, width, height };
}

function bbox({ rgba, width, height }, minAlpha = 8) {
  let x0 = width, y0 = height, x1 = -1, y1 = -1;
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    if (rgba[(y * width + x) * 4 + 3] > minAlpha) {
      if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
    }
  }
  return { left: x0, top: y0, width: x1 - x0 + 1, height: y1 - y0 + 1 };
}

const full = await toTransparent(SRC);
const raw = { raw: { width: full.width, height: full.height, channels: 4 } };

// ---- logo-horizontal.png --------------------------------------------------
const fb = bbox(full);
const trimmed = await sharp(full.rgba, raw).extract(fb).png().toBuffer();
const horizontal = await sharp(trimmed)
  .resize({ width: 1600 - 16 })
  .extend({ top: 8, bottom: 8, left: 8, right: 8, background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .png({ compressionLevel: 9 })
  .toBuffer();
await writeFile(out('src/assets/brand/logo-horizontal.png'), horizontal);
const hMeta = await sharp(horizontal).metadata();

// ---- logo-mark.png --------------------------------------------------------
// Mark is roughly x 165-645, y 240-555. The wordmark "A" starts near x 628 at the
// bottom, so clear anything right of x 625 below y 425 after cropping.
const MX0 = 150, MY0 = 225, MX1 = 646, MY1 = 570;
const markBuf = Buffer.from(full.rgba);
for (let y = 0; y < full.height; y++) for (let x = 0; x < full.width; x++) {
  const inCrop = x >= MX0 && x < MX1 && y >= MY0 && y < MY1;
  const isWordmark = x >= 626 && y >= 425;
  if (!inCrop || isWordmark) markBuf[(y * full.width + x) * 4 + 3] = 0;
}
const mb = bbox({ rgba: markBuf, width: full.width, height: full.height });
const markTrim = await sharp(markBuf, raw).extract(mb).png().toBuffer();
const side = Math.max(mb.width, mb.height);
const pad = Math.round(side * 0.06);
const sq = side + pad * 2;
const markSquare = await sharp(markTrim)
  .extend({
    top: pad + Math.floor((side - mb.height) / 2), bottom: pad + Math.ceil((side - mb.height) / 2),
    left: pad + Math.floor((side - mb.width) / 2), right: pad + Math.ceil((side - mb.width) / 2),
    background: { r: 0, g: 0, b: 0, alpha: 0 }
  })
  .png({ compressionLevel: 9 })
  .toBuffer();
await writeFile(out('src/assets/brand/logo-mark.png'), markSquare);

// helpers
const WHITE = { r: 255, g: 255, b: 255, alpha: 1 };
const CLEAR = { r: 0, g: 0, b: 0, alpha: 0 };
async function markOn(size, padPct, bg) {
  const inner = Math.round(size * (1 - 2 * padPct));
  const m = await sharp(markSquare).resize(inner, inner, { fit: 'contain', background: CLEAR }).toBuffer();
  const p = Math.floor((size - inner) / 2);
  return sharp({ create: { width: size, height: size, channels: 4, background: bg } })
    .composite([{ input: m, left: p, top: p }]).png().toBuffer();
}

// ---- public/logo.png (full logo on white, 1200 wide, 48px padding) ---------
const logoInner = await sharp(trimmed).resize({ width: 1200 - 96 }).toBuffer();
const li = await sharp(logoInner).metadata();
await writeFile(out('public/logo.png'),
  await sharp({ create: { width: 1200, height: li.height + 96, channels: 4, background: WHITE } })
    .composite([{ input: logoInner, left: 48, top: 48 }]).png({ compressionLevel: 9 }).toBuffer());

// ---- favicons -------------------------------------------------------------
await rm(out('public/favicon.svg'), { force: true });
await rm(out('public/favicon.ico'), { force: true });
const fav = async (n) => markOn(n, 0.04, CLEAR);
const f32 = await fav(32), f16 = await fav(16);
await writeFile(out('public/favicon-32.png'), f32);
await writeFile(out('public/favicon-16.png'), f16);

// Hand-written ICO container: 6-byte header + 16-byte entry per image + PNG data.
function ico(images) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); header.writeUInt16LE(1, 2); header.writeUInt16LE(images.length, 4);
  let offset = 6 + 16 * images.length;
  const entries = images.map(({ size, data }) => {
    const e = Buffer.alloc(16);
    e.writeUInt8(size >= 256 ? 0 : size, 0); e.writeUInt8(size >= 256 ? 0 : size, 1);
    e.writeUInt8(0, 2); e.writeUInt8(0, 3);
    e.writeUInt16LE(1, 4); e.writeUInt16LE(32, 6);
    e.writeUInt32LE(data.length, 8); e.writeUInt32LE(offset, 12);
    offset += data.length;
    return e;
  });
  return Buffer.concat([header, ...entries, ...images.map((i) => i.data)]);
}
await writeFile(out('public/favicon.ico'), ico([{ size: 32, data: f32 }, { size: 16, data: f16 }]));

await writeFile(out('public/apple-touch-icon.png'), await markOn(180, 0.14, WHITE));
await writeFile(out('public/icon-192.png'), await markOn(192, 0.12, WHITE));
await writeFile(out('public/icon-512.png'), await markOn(512, 0.12, WHITE));
await writeFile(out('public/icon-maskable-512.png'), await markOn(512, 0.22, WHITE));

// The web manifest is now an Astro endpoint (src/pages/site.webmanifest.ts) so its paths follow the base path.

// ---- og-default.jpg (1200x630) --------------------------------------------
const ogLogoW = Math.round(1200 * 0.62);
const ogLogo = await sharp(trimmed).resize({ width: ogLogoW }).toBuffer();
const ogLogoH = (await sharp(ogLogo).metadata()).height;
const logoTop = 150, lineTop = logoTop + ogLogoH + 28;
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
  <rect x="560" y="${lineTop}" width="80" height="2" fill="#CB9A36"/>
  <text x="600" y="${lineTop + 62}" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="30" font-weight="700" fill="#111111">Carpet, Tile, Upholstery &amp; Exterior Cleaning</text>
  <text x="600" y="${lineTop + 108}" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="26" font-weight="600" fill="#8A6516">Las Vegas Valley · Call or text 702-350-5775</text>
</svg>`;
await writeFile(out('public/og-default.jpg'),
  await sharp({ create: { width: 1200, height: 630, channels: 3, background: '#ffffff' } })
    .composite([{ input: ogLogo, left: Math.round((1200 - ogLogoW) / 2), top: logoTop }, { input: Buffer.from(svg), left: 0, top: 0 }])
    .jpeg({ quality: 85 }).toBuffer());

console.log('logo-horizontal', hMeta.width, 'x', hMeta.height, '| mark square', sq, '| logo.png', 1200, 'x', li.height + 96);
