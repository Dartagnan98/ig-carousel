// Export an ig-carousel HTML file to Instagram-ready JPEGs.
//
//   node export.mjs <carousel-url> [out-dir]
//
// <carousel-url> must be an http(s) URL (the carousel loads its assets
// over http, file:// will not work). Serve /tmp on a local port first.
// Each .slide is captured at 1080x1350 (4:5), JPEG quality 95.
//
// Output: <out-dir>/slide-01.jpg ... slide-NN.jpg  (default /tmp/carousel-export)

import { mkdirSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const url = process.argv[2];
const outDir = process.argv[3] || '/tmp/carousel-export';
if (!url || !/^https?:\/\//.test(url)) {
  console.error('Usage: node export.mjs <http-carousel-url> [out-dir]');
  process.exit(1);
}

// Resolve playwright from common locations (skill folder has no deps of its own).
const candidates = [
  'playwright',
  pathToFileURL(`${process.env.HOME}/claudeclaw/node_modules/playwright/index.js`).href,
  pathToFileURL(`${process.cwd()}/node_modules/playwright/index.js`).href,
];
let chromium;
for (const c of candidates) {
  try {
    const mod = await import(c);
    chromium = mod.chromium || (mod.default && mod.default.chromium);
    if (chromium) break;
  } catch {}
}
if (!chromium) {
  console.error('playwright not found. Install it or run from a project that has it.');
  process.exit(1);
}

mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 600, height: 700 },
  deviceScaleFactor: 2.5, // 432x540 logical -> 1080x1350 export
});
await page.goto(url, { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts && document.fonts.ready);
await page.waitForTimeout(1500); // let layout() settle
await page.evaluate(() => {
  const t = document.querySelector('.track');
  if (t) t.style.transition = 'none';
});

const count = await page.evaluate(() => document.querySelectorAll('.slide').length);
const files = [];
for (let i = 0; i < count; i++) {
  await page.evaluate((n) => typeof goTo === 'function' && goTo(n), i);
  await page.waitForTimeout(250);
  const file = `${outDir}/slide-${String(i + 1).padStart(2, '0')}.jpg`;
  // Clip to an exact 432x540 box -> 1080x1350 (4:5) at deviceScaleFactor 2.5.
  // Element screenshots can come out a few sub-pixels off and break IG's
  // strict 0.8 aspect-ratio check, so force the clip dimensions.
  const box = await page.locator('.slide').nth(i).boundingBox();
  await page.screenshot({
    path: file, type: 'jpeg', quality: 95,
    clip: { x: Math.round(box.x), y: Math.round(box.y), width: 432, height: 540 },
  });
  files.push(file);
}

await browser.close();
console.log(JSON.stringify({ count, outDir, files }, null, 2));
