// Render any ig-carousel template to Instagram-ready 1080x1350 JPEGs.
//
//   node render.mjs <template> [clean] [out-dir]
//
//   templates:  blue   orange   terminal   (terminal = clay-Joe, aliases: joe, clay)
//   clean:      hide the avatar (blue/orange only; terminal always has Joe)
//   out-dir:    default /tmp/carousel-export
//
//   node render.mjs blue            blue, with you
//   node render.mjs blue clean      blue, no avatar
//   node render.mjs orange          orange, with you
//   node render.mjs terminal        clay-Joe terminal deck
//   node render.mjs list            show templates
//
// Output: <out-dir>/slide-01.jpg ... slide-NN.jpg

import { mkdirSync, readFileSync, existsSync } from 'node:fs';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { resolve, dirname, join, extname } from 'node:path';
import http from 'node:http';

const HERE = dirname(fileURLToPath(import.meta.url));
const NAMES = {
  blue: 'carousel-blue.html', orange: 'carousel-orange.html',
  terminal: 'template.html', joe: 'template.html', clay: 'template.html',
};
// these are the 432x540 "track + goTo" decks (clay-Joe) — http-served, scaled x2.5, always have Joe
const CAROUSEL = new Set(['terminal', 'joe', 'clay']);

const args = process.argv.slice(2);
const CLEAN = new Set(['clean', 'plain', 'no-avatar', '--no-avatar']);
const noAvatar = args.some(a => CLEAN.has(a));
const positional = args.filter(a => !a.startsWith('--') && !CLEAN.has(a));
const name = positional[0];
const outDir = positional[1] || '/tmp/carousel-export';

if (!name || name === 'list') {
  console.log('Templates:  blue   orange   terminal');
  console.log('Usage:      node render.mjs <blue|orange|terminal> [clean] [out-dir]');
  console.log('  blue            blue design, with you');
  console.log('  blue clean      blue design, no avatar');
  console.log('  orange          orange design, with you');
  console.log('  orange clean    orange design, no avatar');
  console.log('  terminal        clay-Joe terminal deck (always has Joe)');
  process.exit(name === 'list' ? 0 : 1);
}

const file = NAMES[name];
const isCarousel = CAROUSEL.has(name);
if (!file && !/^https?:\/\//.test(name)) {
  if (!existsSync(resolve(name))) { console.error(`unknown template "${name}". Run: node render.mjs list`); process.exit(1); }
}

// ---- resolve playwright ----
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
const MIME = { '.html':'text/html', '.png':'image/png', '.jpg':'image/jpeg', '.jpeg':'image/jpeg', '.woff2':'font/woff2', '.otf':'font/otf', '.css':'text/css', '.js':'text/javascript' };

let server, files = [];

if (isCarousel) {
  // ---- clay-Joe: serve the skill folder over http (template.html loads carousel-assets/* over http),
  //      alias carousel-assets/ -> assets/, capture each slide via goTo + a fixed 432x540 clip at 2.5x ----
  server = http.createServer((req, res) => {
    let p = decodeURIComponent(req.url.split('?')[0]);
    if (p === '/') p = '/' + file;
    p = p.replace('/carousel-assets/', '/assets/');
    try { res.setHeader('content-type', MIME[extname(p)] || 'application/octet-stream'); res.end(readFileSync(join(HERE, p))); }
    catch { res.statusCode = 404; res.end(); }
  });
  const port = await new Promise(r => server.listen(0, () => r(server.address().port)));
  const url = `http://localhost:${port}/${file}`;

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 600, height: 700 }, deviceScaleFactor: 2.5 });
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts && document.fonts.ready);
  await page.waitForTimeout(1500);
  await page.evaluate(() => { const t = document.querySelector('.track'); if (t) t.style.transition = 'none'; });
  const count = await page.evaluate(() => document.querySelectorAll('.slide').length);
  for (let i = 0; i < count; i++) {
    await page.evaluate((n) => typeof goTo === 'function' && goTo(n), i);
    await page.waitForTimeout(250);
    const box = await page.locator('.slide').nth(i).boundingBox();
    const f = `${outDir}/slide-${String(i + 1).padStart(2, '0')}.jpg`;
    await page.screenshot({ path: f, type: 'jpeg', quality: 95, clip: { x: Math.round(box.x), y: Math.round(box.y), width: 432, height: 540 } });
    files.push(f);
  }
  await browser.close();
  server.close();
  console.log(JSON.stringify({ template: name, count, outDir, files }, null, 2));
} else {
  // ---- blue / orange (and any native 1080x1350 .slide deck): file://, element screenshots ----
  const url = file ? pathToFileURL(join(HERE, file)).href
            : /^https?:\/\//.test(name) ? name : pathToFileURL(resolve(name)).href;
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 1 });
  await page.goto(url, { waitUntil: 'networkidle' });
  if (noAvatar) await page.evaluate(() => document.body.classList.add('no-avatar'));
  await page.evaluate(() => document.fonts && document.fonts.ready);
  await page.waitForTimeout(1200);
  const count = await page.evaluate(() => document.querySelectorAll('.slide').length);
  for (let i = 0; i < count; i++) {
    const f = `${outDir}/slide-${String(i + 1).padStart(2, '0')}.jpg`;
    await page.locator('.slide').nth(i).screenshot({ path: f, type: 'jpeg', quality: 95 });
    files.push(f);
  }
  await browser.close();
  console.log(JSON.stringify({ template: name, avatar: !noAvatar, count, outDir, files }, null, 2));
}
