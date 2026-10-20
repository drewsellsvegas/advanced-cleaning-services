// Content audit (PLAN.md Task 30). Usage: npm run audit:content [-- --only=slug,slug]
// Reads src/data/*.json and, when present, the built dist/ HTML. Exits 1 when any page fails.
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const readJson = (p) => JSON.parse(readFileSync(join(root, p), 'utf8'));
const services = readJson('src/data/services.json');
const areas = readJson('src/data/areas.json');
const only = (process.argv.find((a) => a.startsWith('--only=')) ?? '').slice(7).split(',').filter(Boolean);

const LINK = /\[([^\]]+)\]\((\/(?!\/)[^)\s]*)\)/g;
const PH_UNWRITTEN = '[PLACEHOLDER: content task]';
const strip = (t) => t.replace(LINK, '$1');
const wc = (t) => { const s = strip(t).trim(); return s ? s.split(/\s+/).length : 0; };
const norm = (t) => strip(t).toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, ' ').split(/\s+/).filter(Boolean);
const inRange = (n, a, b) => n >= a && n <= b;

const FORBIDDEN = [
  'best', '#1', 'top-rated', 'top rated', 'unbeatable', 'guaranteed', 'guarantee', '100%', 'state-of-the-art',
  'eco-friendly', 'non-toxic', 'certified', 'iicrc', 'truck-mounted', 'truck mounted', '24/7', 'pet-safe', 'same-day', 'same day'
];

/** Prose "units": each is checked separately for 8-word runs so runs never span fields. */
function proseUnits(page, isService) {
  const u = [];
  const add = (t) => { if (typeof t === 'string') u.push(t); };
  add(page.cardSummary); add(page.heroIntro); add(page.ctaHeadline);
  if (isService) {
    page.overview?.forEach(add);
    page.included?.forEach((i) => { add(i.title); add(i.text); });
    page.process?.forEach((i) => { add(i.title); add(i.text); });
    page.benefits?.forEach(add);
    page.benefitPoints?.forEach((i) => { add(i.title); add(i.text); });
    add(page.whoFor?.intro);
    page.whoFor?.items?.forEach((i) => { add(i.title); add(i.text); });
  } else {
    add(page.servicesIntro); page.local?.forEach(add); add(page.estimateCopy);
  }
  page.faq?.forEach((f) => add(f.a));
  return u;
}

/** Words counted toward the 900 / 600 minimum (PLAN 5.2 / 5.4). Titles are not counted: conservative. */
function countedWords(page, isService) {
  const t = [page.heroIntro];
  if (isService) {
    t.push(...(page.overview ?? []), ...(page.included ?? []).map((i) => i.text), ...(page.process ?? []).map((i) => i.text),
      ...(page.benefits ?? []), ...(page.benefitPoints ?? []).map((i) => i.text), page.whoFor?.intro,
      ...(page.whoFor?.items ?? []).map((i) => i.text));
  } else {
    t.push(page.servicesIntro, ...(page.local ?? []), page.estimateCopy);
  }
  t.push(...(page.faq ?? []).map((f) => f.a));
  return t.filter((x) => typeof x === 'string').reduce((n, x) => n + wc(x), 0);
}

const pages = [
  ...services.map((s) => ({ kind: 'service', path: `/services/${s.slug}`, data: s })),
  ...areas.map((a) => ({ kind: 'area', path: `/service-areas/${a.slug}`, data: a }))
];
const knownPaths = new Set([
  '/', '/services', '/service-areas', '/free-estimate', '/contact', '/about', '/privacy', ...pages.map((p) => p.path)
]);

// 8-gram index across pages
const gramOwners = new Map();
for (const p of pages) {
  p.grams = new Set();
  for (const unit of proseUnits(p.data, p.kind === 'service')) {
    const w = norm(unit);
    for (let i = 0; i + 8 <= w.length; i++) p.grams.add(w.slice(i, i + 8).join(' '));
  }
  for (const g of p.grams) {
    if (!gramOwners.has(g)) gramOwners.set(g, new Set());
    gramOwners.get(g).add(p.path);
  }
}

// dist HTML (optional)
const dist = join(root, 'dist');
const distHtml = new Map(); // page path -> html
function walk(dir) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const f = join(dir, e.name);
    if (e.isDirectory()) { if (e.name !== '_astro') walk(f); } else if (e.name.endsWith('.html')) {
      let path = '/' + f.slice(dist.length + 1).replace(/\.html$/, '');
      if (path === '/index') path = '/';
      distHtml.set(path, readFileSync(f, 'utf8'));
    }
  }
}
const haveDist = existsSync(dist);
if (haveDist) walk(dist);
const inbound = new Map();
for (const [src, html] of distHtml) {
  for (const m of html.matchAll(/href="(\/[^"#?]*)"/g)) {
    const t = m[1].replace(/\/$/, '') || '/';
    if (t === src) continue;
    if (!inbound.has(t)) inbound.set(t, new Set());
    inbound.get(t).add(src);
  }
}

const rows = [];
let failedPages = 0;
const warnAll = [];
for (const p of pages) {
  const d = p.data;
  const slug = p.path.split('/').pop();
  if (only.length && !only.includes(slug)) continue;
  const isService = p.kind === 'service';
  const fails = [];
  const warns = [];
  const allText = JSON.stringify(proseUnits(d, isService));
  const units = proseUnits(d, isService);

  if (units.some((t) => t.includes(PH_UNWRITTEN))) {
    fails.push('content not written (still "[PLACEHOLDER: content task]")');
  } else if (units.some((t) => t.includes('[PLACEHOLDER'))) {
    warns.push('prose contains a [PLACEHOLDER: ...] token (launch audit will fail)');
  }
  if (d.title.length >= 60) fails.push(`title is ${d.title.length} chars (max 59)`);
  if (d.metaDescription.length >= 155) fails.push(`meta is ${d.metaDescription.length} chars (max 154)`);
  if (isService && !d.h1.includes('Las Vegas')) fails.push('H1 lacks "Las Vegas"');
  if (!isService && !d.h1.includes('NV')) fails.push('H1 lacks "NV"');
  if (!d.h1?.trim()) fails.push('H1 missing');

  const unwritten = fails.some((f) => f.startsWith('content not written'));
  const words = countedWords(d, isService);
  const min = isService ? 900 : 600;
  if (!unwritten && words < min) fails.push(`only ${words} counted words (min ${min})`);

  if (!unwritten) {
    const fc = d.faq?.length ?? 0;
    if (isService ? !inRange(fc, 5, 7) : fc !== 4) fails.push(`FAQ count ${fc} out of range`);
    for (const f of d.faq ?? []) {
      const n = wc(f.a);
      const [a, b] = isService ? [40, 90] : [40, 80];
      if (!inRange(n, a, b)) fails.push(`FAQ "${f.q}" answer is ${n} words (${a}-${b})`);
    }
    const chk = (label, n, a, b) => { if (!inRange(n, a, b)) fails.push(`${label} is ${n} (${a}-${b})`); };
    chk('cardSummary words', wc(d.cardSummary), 12, 20);
    chk('heroIntro words', wc(d.heroIntro), 40, 60);
    chk('ctaHeadline words', wc(d.ctaHeadline), 1, 8);
    if (isService) {
      chk('overview paragraphs', d.overview.length, 2, 3);
      chk('overview words', d.overview.reduce((n, x) => n + wc(x), 0), 150, 220);
      chk('included items', d.included.length, 5, 7);
      d.included.forEach((i, k) => chk(`included[${k}] words`, wc(i.text), 15, 35));
      chk('process steps', d.process.length, 4, 6);
      d.process.forEach((i, k) => chk(`process[${k}] words`, wc(i.text), 30, 50));
      chk('benefits paragraphs', d.benefits.length, 2, 3);
      chk('benefits words', d.benefits.reduce((n, x) => n + wc(x), 0), 150, 220);
      chk('benefitPoints', d.benefitPoints.length, 3, 4);
      chk('whoFor.intro words', wc(d.whoFor.intro), 30, 50);
      chk('whoFor.items', d.whoFor.items.length, 4, 5);
    } else {
      chk('servicesIntro words', wc(d.servicesIntro), 60, 90);
      chk('local paragraphs', d.local.length, 3, 4);
      chk('local words', d.local.reduce((n, x) => n + wc(x), 0), 250, 350);
      chk('estimateCopy words', wc(d.estimateCopy), 60, 90);
    }

    // inline links
    const targets = [...allText.matchAll(/\[[^\]]+\]\((\/(?!\/)[^)\s]*)\)/g)].map((m) => m[1]);
    for (const t of new Set(targets)) if (!knownPaths.has(t)) fails.push(`inline link target does not exist: ${t}`);
    const svcLinks = new Set(targets.filter((t) => t.startsWith('/services/') && t !== p.path));
    if (svcLinks.size < 2) fails.push(`only ${svcLinks.size} inline links to other services (min 2)`);

    // voice rules
    const flat = units.concat((d.faq ?? []).map((f) => f.q)).map(strip).join(' \n ').toLowerCase();
    for (const w of FORBIDDEN) {
      const re = /^[a-z]+$/.test(w) ? new RegExp(`\\b${w}\\b`) : null;
      if (re ? re.test(flat) : flat.includes(w)) fails.push(`forbidden word/claim: "${w}"`);
    }
    if ((flat.match(/free estimate/g) ?? []).length < 2) fails.push('"free estimate" appears fewer than 2 times');
    if ((flat.match(/call or text/g) ?? []).length < 2) fails.push('"call or text" appears fewer than 2 times');
    const digitSrc = flat.replace(/702-350-5775/g, '');
    const nums = new Set((digitSrc.match(/\d+/g) ?? []).filter((n) => n !== '12' && n !== '10'));
    if (nums.size) warns.push(`digits in prose, review: ${[...nums].join(', ')}`);

    // 8-word runs shared with other pages
    const shared = new Map();
    for (const g of p.grams) {
      const owners = [...gramOwners.get(g)].filter((o) => o !== p.path);
      for (const o of owners) shared.set(o, [...(shared.get(o) ?? []), g]);
    }
    for (const [o, g] of shared) fails.push(`${g.length} shared 8-word run(s) with ${o}, e.g. "${g[0]}"`);
  }

  // built HTML
  if (haveDist) {
    const html = distHtml.get(p.path);
    if (!html) warns.push('no built HTML in dist (run npm run build)');
    else {
      const h1s = (html.match(/<h1[\s>]/g) ?? []).length;
      if (h1s !== 1) fails.push(`built page has ${h1s} <h1> elements`);
      const n = inbound.get(p.path)?.size ?? 0;
      if (n < 2) fails.push(`linked from only ${n} other pages (min 2)`);
    }
  } else warns.push('dist/ missing: H1 and inbound-link checks skipped');

  if (fails.length) failedPages++;
  rows.push({ page: p.path, title: d.title.length, meta: d.metaDescription.length, words: unwritten ? 0 : words, faq: d.faq?.length ?? 0, status: unwritten ? 'EMPTY' : fails.length ? 'FAIL' : 'PASS' });
  if (fails.length || warns.length) warnAll.push({ page: p.path, fails: unwritten ? fails.slice(0, 1).concat(fails.filter((f) => !f.startsWith('content not written') && (f.includes('title') || f.includes('meta') || f.includes('H1')))) : fails, warns: unwritten ? [] : warns });
}

console.table(rows);
for (const w of warnAll) {
  for (const f of w.fails) console.log(`FAIL  ${w.page}: ${f}`);
  for (const f of w.warns) console.log(`warn  ${w.page}: ${f}`);
}
console.log(`\n${rows.length - failedPages} of ${rows.length} pages pass.`);
process.exit(failedPages ? 1 : 0);
