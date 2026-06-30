// Render a NATIVE 1080x1350 carousel (.slide divs) to IG JPEGs.
// For the blue-asterisk / orange-machine templates (NOT clay-Joe — that uses export.mjs).
//
//   node render.mjs <template> [--no-avatar] [out-dir]
//
//   <template>   blue | orange   (or a path/URL to any native .slide carousel)
//   --no-avatar  hide the host avatar (the "without" variant)
//   out-dir      default /tmp/carousel-export
//
// Examples:
//   node render.mjs blue                 -> with avatar
//   node render.mjs blue --no-avatar     -> without avatar
//   node render.mjs orange --no-avatar /tmp/out
//
// Output: <out-dir>/slide-01.jpg ... slide-NN.jpg

import { mkdirSync } from 'node:fs';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { resolve, dirname, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const NAMES = { blue: 'carousel-blue.html', orange: 'carousel-orange.html' };

const args = process.argv.slice(2);
const noAvatar = args.includes('--no-avatar');
const positional = args.filter(a => !a.startsWith('--'));
const name = positional[0];
const outDir = positional[1] || '/tmp/carousel-export';

if (!name) {
  console.error('Usage: node render.mjs <blue|orange|path|url> [--no-avatar] [out-dir]');
  process.exit(1);
}

// resolve template name -> file in the skill folder; else treat as path/url
let url;
if (NAMES[name]) url = pathToFileURL(join(HERE, NAMES[name])).href;
else if (/^https?:\/\//.test(name)) url = name;
else url = pathToFileURL(resolve(name)).href;

const candidates = [
  'playwright',
  pathToFileURL(`${process.env.HOME}/claudeclaw/node_modules/playwright/index.js`).href,
  pathToFileURL(`${process.env.HOME}/claudeclaw/agency/carousel-system/node_modules/playwright/index.js`).href,
  pathToFileURL(`${process.cwd()}/node_modules/playwright/index.js`).href,
];
let chromium;
for (const c of candidates) {
  try { const m = await import(c); chromium = m.chromium || (m.default && m.default.chromium); if (chromium) break; } catch {}
}
if (!chromium) { console.error('playwright not found (try: npx playwright install chromium-headless-shell)'); process.exit(1); }

mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 1 });
await page.goto(url, { waitUntil: 'networkidle' });
if (noAvatar) await page.evaluate(() => document.body.classList.add('no-avatar'));
await page.evaluate(() => document.fonts && document.fonts.ready);
await page.waitForTimeout(1200);

const count = await page.evaluate(() => document.querySelectorAll('.slide').length);
const files = [];
for (let i = 0; i < count; i++) {
  const file = `${outDir}/slide-${String(i + 1).padStart(2, '0')}.jpg`;
  await page.locator('.slide').nth(i).screenshot({ path: file, type: 'jpeg', quality: 95 });
  files.push(file);
}
await browser.close();
console.log(JSON.stringify({ template: name, avatar: !noAvatar, count, outDir, files }, null, 2));
