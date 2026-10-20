// Neutral placeholder photos (PLAN.md Task 3). Real photos replace these by file copy.
// Run: npm run assets:placeholders
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const services = ['carpet-cleaning','steam-cleaning','stain-removal','pet-urine-odor-removal','rug-cleaning','upholstery-cleaning','tile-cleaning','grout-cleaning','water-extraction','pressure-washing','driveway-cleaning','garage-cleaning'];

// 4-point sparkle, 64px, gold-600
const sparkle = (cx, cy, s = 64) => {
  const h = s / 2, k = s * 0.14;
  return `<path fill="#B5862A" d="M${cx} ${cy - h} C${cx + k} ${cy - k} ${cx + k} ${cy - k} ${cx + h} ${cy} C${cx + k} ${cy + k} ${cx + k} ${cy + k} ${cx} ${cy + h} C${cx - k} ${cy + k} ${cx - k} ${cy + k} ${cx - h} ${cy} C${cx - k} ${cy - k} ${cx - k} ${cy - k} ${cx} ${cy - h}Z"/>`;
};

async function make(file, w, h, name, bg = '#EFEBE4') {
  const label = `PHOTO PLACEHOLDER — ${name}`.replace(/&/g, '&amp;');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
    <rect width="100%" height="100%" fill="${bg}"/>
    ${sparkle(w / 2, h / 2 - 40)}
    <text x="${w / 2}" y="${h / 2 + 30}" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="28" fill="#52525B">${label}</text>
  </svg>`;
  const dest = path.join(ROOT, file);
  await mkdir(path.dirname(dest), { recursive: true });
  await sharp(Buffer.from(svg)).jpeg({ quality: 82 }).toFile(dest);
}

await make('src/assets/photos/hero.jpg', 1600, 2000, 'hero');
for (const s of services) await make(`src/assets/photos/services/${s}.jpg`, 1600, 1200, s);
await make('src/assets/photos/before-after/sample-before.jpg', 1600, 1200, 'sample before');
await make('src/assets/photos/before-after/sample-after.jpg', 1600, 1200, 'sample after', '#F6F3EE');
await make('src/assets/photos/about/miguel.jpg', 1200, 1500, 'Miguel portrait');
console.log('placeholders written');
