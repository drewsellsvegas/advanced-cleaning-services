// Launch audit (PLAN.md Task 54). Usage: npm run build && npm run audit:launch
// Fails (exit 1) while anything blocks launch, and lists exactly what remains:
//   1. "[PLACEHOLDER" or ".example" in any built HTML (incl. JSON-LD), llms file, robots, manifest or sitemap
//   2. placeholder images (placeholder: true) that are actually rendered in the built HTML
//   3. site.url / astro.config site still on the .example domain
// It also prints (informational, not a failure) data entries still flagged placeholder: true
// and the open [PLACEHOLDER] tokens that live in source but are hidden from the build.
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join, resolve, dirname, relative, basename, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');
const rel = (p) => relative(root, p);
const read = (p) => readFileSync(p, 'utf8');
const readJson = (p) => JSON.parse(read(join(root, p)));

if (!existsSync(dist)) {
  console.error('dist/ not found. Run `npm run build` first.');
  process.exit(2);
}

const failures = []; // { group, where, detail }
const fail = (group, where, detail) => failures.push({ group, where, detail });

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    if (name === '_astro') continue; // hashed assets, no copy
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else out.push(p);
  }
  return out;
}

const TEXT_EXT = new Set(['.html', '.txt', '.xml', '.json', '.webmanifest']);
const files = walk(dist).filter((f) => TEXT_EXT.has(extname(f)) || basename(f) === '_headers' || basename(f) === '_redirects');
const htmlFiles = files.filter((f) => extname(f) === '.html');

function kind(f) {
  const b = basename(f);
  if (extname(f) === '.html') return 'HTML';
  if (b.startsWith('llms')) return 'llms';
  if (b.startsWith('sitemap')) return 'sitemap';
  if (b === 'robots.txt') return 'robots';
  return b;
}

// Pull the JSON-LD text out of an HTML file so it is reported on its own line.
function jsonLd(html) {
  return [...html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
}

// 1. Tokens and .example in built output
const phTally = new Map(); // token -> Set(files)
const exampleFiles = new Map(); // kind -> count
for (const f of files) {
  const text = read(f);
  const inLd = new Set(jsonLd(text).filter((j) => /\[PLACEHOLDER/.test(j)));
  for (const m of text.matchAll(/\[PLACEHOLDER[^\]<"]*\]?/g)) {
    const tok = m[0];
    if (!phTally.has(tok)) phTally.set(tok, new Set());
    phTally.get(tok).add(rel(f));
  }
  if (/\.example\b/.test(text)) {
    const k = kind(f);
    exampleFiles.set(k, (exampleFiles.get(k) ?? 0) + 1);
  }
  if (inLd.size) fail('JSON-LD', rel(f), 'JSON-LD contains a [PLACEHOLDER value');
}
for (const [tok, set] of phTally) fail('Placeholder text in build', [...set].join(', '), tok);
for (const [k, n] of exampleFiles) fail('.example domain in build', `${n} file(s) of type ${k}`, 'rebuild after setting the real domain');

// 2. Placeholder images that are rendered
const site = readJson('src/data/site.json');
const services = readJson('src/data/services.json');
const areas = readJson('src/data/areas.json');

const imageEntries = [];
for (const s of services) if (s.image) imageEntries.push({ where: `services.json:${s.slug}`, src: s.image.src, placeholder: s.image.placeholder });
for (const a of areas) if (a.image) imageEntries.push({ where: `areas.json:${a.slug}`, src: a.image.src, placeholder: a.image.placeholder });
for (const [i, b] of (site.beforeAfter ?? []).entries()) {
  imageEntries.push({ where: `site.json:beforeAfter[${i}] before`, src: b.before, placeholder: b.placeholder });
  imageEntries.push({ where: `site.json:beforeAfter[${i}] after`, src: b.after, placeholder: b.placeholder });
}
// Photos wired up in code rather than data
imageEntries.push({ where: 'src/pages/about.astro (portrait)', src: 'src/assets/photos/about/miguel.jpg', placeholder: /placeholder:\s*true/.test(read(join(root, 'src/pages/about.astro'))) });
imageEntries.push({ where: 'src/components/home/Hero.astro (hero photo)', src: 'src/assets/photos/hero.jpg', placeholder: !/hero\.jpg/.test(read(join(root, 'src/components/home/Hero.astro'))) || /placeholder:\s*true/.test(read(join(root, 'src/components/home/Hero.astro'))) });

const allHtml = htmlFiles.map(read).join('\n');
const stillPlaceholder = imageEntries.filter((e) => e.placeholder);
for (const e of stillPlaceholder) {
  const stem = basename(e.src, extname(e.src));
  const rendered = new RegExp(`/_astro/${stem.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\.`).test(allHtml);
  if (rendered) fail('Placeholder image rendered', e.where, `${e.src} appears in built HTML`);
}

// 3. Domain
if (/\.example\b/.test(site.url ?? '')) fail('Domain', 'src/data/site.json', `url is still ${site.url}`);
const cfg = read(join(root, 'astro.config.mjs'));
const siteLine = cfg.match(/site:\s*'([^']+)'/);
if (siteLine && /\.example\b/.test(siteLine[1])) fail('Domain', 'astro.config.mjs', `site is still ${siteLine[1]}`);

// Informational: what is still flagged in data/source (hidden from production, but not final)
const info = [];
for (const e of stillPlaceholder) info.push(`image flagged placeholder: ${e.where} -> ${e.src}`);
for (const [i, r] of (site.reviews ?? []).entries()) if (r.placeholder) info.push(`review flagged placeholder: site.json:reviews[${i}]`);
const siteTokens = new Set([...read(join(root, 'src/data/site.json')).matchAll(/\[PLACEHOLDER: [^\]]*\]/g)].map((m) => m[0]));
for (const t of siteTokens) info.push(`open token in site.json: ${t}`);
const exCard = read(join(root, 'src/components/ui/ExampleTextCard.astro')).match(/\[PLACEHOLDER: [^\]]*\]/);
if (exCard) info.push(`open token in ExampleTextCard.astro: ${exCard[0]}`);

// Report
const groups = new Map();
for (const f of failures) {
  if (!groups.has(f.group)) groups.set(f.group, []);
  groups.get(f.group).push(f);
}
console.log(`Launch audit: ${htmlFiles.length} HTML pages and ${files.length - htmlFiles.length} other text files scanned in dist/\n`);
for (const [g, items] of groups) {
  console.log(`FAIL  ${g} (${items.length})`);
  for (const it of items) console.log(`      - ${it.where}: ${it.detail}`);
  console.log('');
}
if (info.length) {
  console.log(`Still open in source (hidden from the production build, resolve before launch):`);
  for (const l of [...new Set(info)]) console.log(`      - ${l}`);
  console.log('');
}
if (failures.length) {
  console.log(`RESULT: NOT READY. ${failures.length} blocker(s) in ${groups.size} group(s).`);
  process.exit(1);
}
console.log('RESULT: READY. No placeholders, no .example domain, no placeholder images rendered.');
