# Advanced Cleaning Services

Marketing site for Advanced Cleaning Services (Miguel), Las Vegas Valley carpet, tile, upholstery and exterior cleaning. Static Astro 7 site with Tailwind 4, hosted on Cloudflare Pages. No GSAP, Lenis or other animation library: motion is CSS transitions plus one small IntersectionObserver script. No form posts to a server; the estimate page builds a pre-filled `sms:` link on the visitor's phone.

PLAN.md is the source of truth for design, SEO and copy rules. Section 0 of PLAN.md overrides CLAUDE.md where they differ.

## Commands

| Command | What it does |
| :-- | :-- |
| `npm install` | Install dependencies (Node 22.12 or newer) |
| `npm run dev` | Dev server at `localhost:4321`. Placeholder text is highlighted yellow, placeholder-only sections still render |
| `npm run build` | Production build into `dist/` |
| `npm run preview` | Serve `dist/` locally to test the production output |
| `npm run assets:brand` | Rebuild logo, favicons, icons, manifest icons and OG image from `brand/logo-original.webp` |
| `npm run assets:placeholders` | Regenerate neutral placeholder photos in `src/assets/photos/` (overwrites them, do not run after real photos are in) |
| `npm run audit:content` | Content rules: title/meta length, H1, word counts, repeated 8-word runs, FAQ counts, links, forbidden words |
| `npm run audit:launch` | Launch gate: fails while any placeholder, `.example` domain or placeholder image remains. Run `npm run build` first |

## Where things live

- `src/data/site.json`: business facts (phone, hours, email, license, URLs, reviews, before/after entries, `aboutReady`).
- `src/data/services.json` (12 services) and `src/data/areas.json` (10 areas): all page copy, titles, metas, FAQs.
- `src/lib/`: helpers (`contact.ts` for tel/sms links, `schema.ts` for JSON-LD, `placeholder.ts`, `text.ts`, `data.ts`).
- `src/components/`, `src/layouts/BaseLayout.astro`, `src/styles/global.css` (design tokens), `src/scripts/` (menus, reveal, composer).
- `src/pages/`: routes, plus `robots.txt`, `llms.txt` and `llms-full.txt` generated from the data files.
- `public/`: favicons, manifest, `_headers`, `_redirects`, `og-default.jpg`, `logo.png`.
- `scripts/`: asset generators and the two audits.

## Swapping in real photos

1. Copy the real image over the placeholder file with the same name (for example `src/assets/photos/services/carpet-cleaning.jpg`). Keep the aspect ratio: hero 4:5 (at least 1600x2000), service heroes 4:3 (at least 1600x1200), About portrait 4:5.
2. In the matching data entry set `"placeholder": false` (the `image` object in `services.json` / `areas.json`). The home hero photo and the About portrait are currently marked as placeholders in `src/components/home/Hero.astro` and `src/pages/about.astro`; flip them there when the real files arrive.
3. Write real alt text that describes what the photo shows.
4. Rebuild. In production, placeholder images are never rendered; the gold panel fallback is used until `placeholder` is `false`.

Never run `npm run assets:placeholders` after real photos are in place, it overwrites them.

## Adding reviews and before/after pairs

Both live in `src/data/site.json`. Remove the sample entry (it has `"placeholder": true`) or leave it; samples only render in dev.

Review entry (real reviews only, with the customer's permission; no star ratings or counts are shown):

```json
{ "text": "...", "name": "First name L.", "area": "Henderson", "source": "Google", "sourceUrl": "https://...", "placeholder": false }
```

Before/after entry (same angle, same framing, both 4:3 at least 1600x1200, files in `src/assets/photos/before-after/`):

```json
{ "service": "carpet-cleaning", "before": "src/assets/photos/before-after/job1-before.jpg", "after": "src/assets/photos/before-after/job1-after.jpg", "altBefore": "...", "altAfter": "...", "caption": "Carpet cleaning, Henderson", "placeholder": false }
```

The Reviews and Before/After home sections appear automatically once at least one entry has `placeholder: false`.

## Deploy (Cloudflare Pages)

1. Create a Pages project connected to the repo.
2. Build command `npm run build`, output directory `dist`, environment variable `NODE_VERSION=22`.
3. Set the real domain in exactly two places: `site` in `astro.config.mjs` and `url` in `src/data/site.json`.
4. Add the custom domain (apex) and a dashboard redirect from `www` to the apex with a 301.
5. Run `npm run build && npm run audit:launch` and fix everything it lists before going live.
6. When the About page story and photo are ready, set `aboutReady` to `true` in `site.json` (removes noindex and adds it to the sitemap).
7. Submit `https://{domain}/sitemap-index.xml` in Search Console.

## Placeholders and open questions (PLAN.md section 11)

Status key: **Open** = waiting on the client, **Hedged** = the copy avoids the claim and says "ask Miguel" until the client answers, **Done** = resolved.

| # | Token / item | Where it is used | Needed from client | Status |
| :-- | :-- | :-- | :-- | :-- |
| Q1 | `[PLACEHOLDER: domain]` | `astro.config.mjs`, `site.json`, canonical, OG, schema, sitemap, llms files | The live domain (apex) | Open. Site uses `advancedcleaninglv.example` |
| Q2 | Vector logo | Header, favicons (section 9) | SVG/AI/PDF logo if one exists | Open. Raster logo in use |
| Q3 | `[PLACEHOLDER: business hours]` | Utility strip, footer, contact, schema | Days and hours; are texts answered outside hours | Open. Hours rows hidden in production |
| Q4 | `[PLACEHOLDER: Nevada business license number]`, `[PLACEHOLDER: licensed and insured? yes/no]` | Trust bar, footer legal row, schema | License number(s), insurance status | Open. Hidden in production, no claim made |
| Q5 | Owner-answers claim; `[PLACEHOLDER: typical reply time]`; `[PLACEHOLDER: Miguel's typical reply]` | Hero, why-us card 1, estimate step 3, hero example card | Does Miguel personally answer and do the work? Typical reply time? Example reply | Open. Reply bubble in the hero example card and step-3 reply time are omitted in production |
| Q6 | `[PLACEHOLDER: about Miguel]`, portrait photo | About page | Short story, photo, whether years in the trade may be stated | Open. About is noindex and out of the sitemap |
| Q7 | `[PLACEHOLDER: pricing / minimums / trip fees]` | Price factors, Boulder City FAQ | Minimum charge, trip fee, any published ranges (default: none) | Hedged. Boulder City FAQ says to ask |
| Q8 | Languages | Schema `availableLanguage`, utility strip | Is service offered in Spanish? | Open. English only in schema |
| Q9 | `[PLACEHOLDER: dry time]`, methods and equipment per service | Service process steps and FAQs | Cleaning method per service, typical dry time, products | Hedged. No hour counts or equipment claims; see method list below |
| Q10 | `[PLACEHOLDER: garage cleaning scope]` | Garage page | Floor cleaning only, or clean-outs/hauling too | Hedged. Copy says floor only, no hauling |
| Q11 | `[PLACEHOLDER: grout sealing offered?]` | Grout and tile pages | Sealing / color sealing? Shower tile? Natural stone? | Hedged. "Miguel will confirm" |
| Q12 | `[PLACEHOLDER: exterior scope]` | Pressure washing, driveway pages | Walls/stucco, roofs, paver sealing, own water supply | Hedged. "Miguel will confirm" |
| Q13 | Analytics | Privacy page, head | Any analytics (default none; Cloudflare Web Analytics only) | Done. None installed |
| Q14 | `[PLACEHOLDER: email]` | Footer, contact, schema | Business email, if any | Open. Hidden in production |
| Q15 | `[PLACEHOLDER: Google Business Profile URL]`, social URLs | Footer, schema `sameAs` | GBP link, Facebook/Instagram/Yelp | Open. Hidden in production |
| Q16 | `[PLACEHOLDER: reviews]` | Reviews section | Real reviews with name, area, source, permission | Open. Section omitted in production |
| Q17 | `[PLACEHOLDER: photos]` | Hero, 12 service heroes, before/after, About | Real job photos (matched before/after pairs), portrait of Miguel | Open. Gold panel fallback shown, before/after omitted |
| Q18 | `[PLACEHOLDER: water extraction availability and scope]` | Water extraction page | Emergency/after-hours availability; structural drying or refer out | Hedged. FAQ makes no response-time promise |
| Q19 | `[PLACEHOLDER: rug details]` | Rug page | On-site or off-site cleaning; silk and wool accepted? | Hedged. "Miguel will confirm" |
| Q20 | `[PLACEHOLDER: leather / upholstery scope]` | Upholstery page | Is leather cleaning offered? | Hedged. FAQ says to ask Miguel |
| Q21 | `[PLACEHOLDER: pet treatment details]` | Pet urine page | UV detection, enzyme products, pad replacement or referral, pet-safe statement | Hedged. No pet-safe claim made |
| Q22 | `[PLACEHOLDER: furniture moving]` | Home FAQ, carpet FAQ | Does Miguel move furniture, any limits | Hedged. See method list below |
| Q23 | `[PLACEHOLDER: commercial work]` | Copy scope | Residential only, or commercial/rentals/property managers | Hedged. Copy says Miguel "can quote" |
| Q24 | `[PLACEHOLDER: payment methods]` | Footer, schema `paymentAccepted` | Cash, card, Zelle, etc. | Open. Not shown |
| Q25 | `[PLACEHOLDER: launch date]` | Schema `datePublished` | Set at launch | Open. Field omitted until set |
| Q26 | `[PLACEHOLDER: how Miguel stores customer texts and photos]` | Privacy page | One sentence on retention | Open. Appears on the Privacy page |

`npm run audit:launch` lists every one of these that is still present in the build.

## Sentences the client must confirm before launch

The service and area copy was written to avoid unconfirmed claims, but it still describes how the work is done. Miguel (or the client) should read each page and confirm or correct these, then record the answer here. The audit cannot catch these because they are plain sentences, not tokens.

1. **Miguel's methods (all service pages, Q9).** Process steps for carpet, steam, stain, pet, rug, upholstery, tile and grout describe a general professional sequence: inspection, pre-vacuum, pre-treatment, agitation, rinse and extraction, grooming, drying guidance. Confirm this matches how Miguel works. `steam-cleaning` states that steam cleaning means hot water extraction and compares it neutrally with low-moisture cleaning: confirm he uses hot water extraction. Confirm no drying time is implied (the copy gives none).
2. **Rug scope (`rug-cleaning`, anthem FAQ, Q19).** Copy says fiber, dye and fringe checks, cleaning of front and back, flat drying. Confirm wool, synthetic and cotton are accepted, whether silk is, and whether rugs are cleaned in the home or taken away.
3. **Stone scope (`tile-cleaning`, `grout-cleaning`, Q11).** Copy says stone-safe handling for travertine, marble and similar. Confirm natural stone is accepted.
4. **Shower scope (`tile-cleaning` FAQ, `grout-cleaning` whoFor, Q11).** Copy says "ask Miguel whether shower tile is a fit". Confirm shower tile and shower walls are or are not offered.
5. **Sealing (`grout-cleaning` FAQ, `driveway-cleaning` FAQ, Q11/Q12).** Copy says sealing is a separate step Miguel will confirm. State whether grout sealing, color sealing and paver sealing are offered.
6. **Pool-deck scope (`pressure-washing`, Q12).** Copy says pool decks are cleaned "with care taken around the pool and nearby plants" and lists concrete patios, walkways, block walls and entryways. Confirm pool-deck cleaning and each surface. Confirm stucco, siding and roofs are or are not washed, and the water setup (own water or customer hose).
7. **Garage scope (`garage-cleaning`, Q10).** Copy says the service is floor cleaning and degreasing, not clearing out, hauling or organizing. Confirm, and confirm whether epoxy-coated floors are accepted.
8. **Driveway and concrete (`driveway-cleaning`).** Copy says old oil stains may only lighten and pavers can be cleaned including joints. Confirm.
9. **Pet treatment (`pet-urine-odor-removal`, Q21).** Copy describes treating the source, the pad limit, and says Miguel will explain what is used and when animals can return. Confirm what treatment is used, whether pad work is done or referred, and what he will say about pet safety.
10. **Water extraction scope and availability (`water-extraction`, Q18).** Copy says it removes standing water, advises on airflow, refers mold and structural drying to specialists, and promises no response time. Confirm scope and the referral line.
11. **Leather (`upholstery-cleaning`, Q20).** Copy says to ask Miguel whether leather is taken on. Confirm yes or no.
12. **Furniture moving (carpet FAQ, home FAQ, Q22).** Copy asks customers to clear small items and says furniture moving is covered in the estimate. Confirm whether Miguel moves furniture and any limits.
13. **Rentals and property managers (north-las-vegas, spring-valley, paradise pages, Q23).** Copy says Miguel can quote vacant rentals, move-out cleaning and cleaning between tenants or guests, including short-term rentals. Confirm he takes this work and whether commercial work is excluded.
14. **Gated communities (`paradise` FAQ).** Copy says yes with access arrangements. Confirm.
15. **Trip fees and travel (`boulder-city` FAQ and local copy, Q7).** Copy says to ask about a trip charge and that Miguel will answer before the customer commits. Confirm whether a trip fee exists and whether it should be stated.
16. **Reply time and who replies (hero, estimate steps, area `estimateCopy`, Q5).** Many pages say Miguel reviews the photos and replies by text. Confirm that Miguel personally replies, and supply a typical reply time and the example reply for the hero card, or approve leaving the time out.
17. **Emergency wording (`paradise` services intro).** The copy calls water extraction "emergency water extraction". Confirm that is acceptable given Q18.
