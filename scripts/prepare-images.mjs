import sharp from 'sharp';
import { readdir, mkdir, writeFile } from 'node:fs/promises';
const base = 'site/assets/images';
await mkdir(`${base}/responsive`, { recursive: true });
const manifest = {};
for (const file of (await readdir(base)).sort()) {
  if (!/\.(jpg|webp)$/.test(file) && file !== 'trecalici-logo-provisional.png') continue;
  const input = `${base}/${file}`;
  const metadata = await sharp(input).metadata();
  if (metadata.width < 800) continue;
  const widths = [...new Set([480, 800, Math.min(1200, metadata.width)].filter(w => w <= metadata.width))];
  const stem = file.replace(/\.[^.]+$/, '');
  const candidates = [];
  for (const width of widths) {
    const path = `/assets/images/responsive/${stem}-${width}.webp`;
    await sharp(input).resize({ width }).webp({ quality: 82 }).toFile(`site${path}`);
    candidates.push(`${path} ${width}w`);
  }
  manifest[`/assets/images/${file}`] = candidates.join(', ');
}
await writeFile('content/responsive-images.json', JSON.stringify(manifest, null, 2) + '\n');
const social = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630"><rect width="1200" height="630" fill="#151515"/><path d="M100 100H1100M100 530H1100" stroke="#47433e"/><text x="600" y="273" text-anchor="middle" fill="#f5efe8" font-family="Georgia,serif" font-size="90">Trecalici Norge</text><text x="600" y="369" text-anchor="middle" fill="#b6aea3" font-family="Georgia,serif" font-size="47">Vin. Glass. Kaviar.</text><text x="600" y="466" text-anchor="middle" fill="#b6aea3" font-family="Arial,sans-serif" font-size="24" letter-spacing="3">TRECALICI.NO</text></svg>`;
await writeFile(`${base}/social-card.svg`, social + '\n');
await sharp(Buffer.from(social)).png().toFile(`${base}/social-card.png`);
console.log(`Prepared responsive images for ${Object.keys(manifest).length} originals and a 1200×630 social card.`);
