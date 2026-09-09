// Open the preview with ?seed=<name>, walk to the seeded launch's Assets stage,
// and report whether the reel and cards are there. node check.seed.mjs [studio]
import { chromium } from 'playwright';
const seed = process.argv[2] || 'studio';
const b = await chromium.launch();
const page = await b.newPage({ viewport: { width: 1600, height: 1000 } });
const errs = [];
page.on('pageerror', (e) => errs.push(String(e).slice(0, 120)));
await page.goto(`http://localhost:3400/?seed=${seed}`, { waitUntil: 'networkidle' });
await page.waitForTimeout(2500);
const url = page.url();
await page.locator('#lk-root nav a', { hasText: 'Launches' }).first().click();
await page.waitForTimeout(1200);
const launches = await page.locator('#lk-root table tbody tr').count();
await page.locator('#lk-root table tbody a').first().click();
await page.waitForTimeout(1200);
await page.locator('#lk-root nav[aria-label="Stages"] a:visible', { hasText: /Assets/ }).first().click();
await page.waitForTimeout(1500);
const state = await page.evaluate(() => ({
  video: Boolean(document.querySelector('#lk-root main video')),
  cards: [...document.querySelectorAll('#lk-root main figure img')].filter((i) => i.naturalWidth > 0).length,
  approved: /Approved/.test(document.querySelector('#lk-root main')?.textContent || ''),
  serviceBanner: /Studio service is not running/.test(document.querySelector('#lk-root main')?.textContent || ''),
}));
console.log(JSON.stringify({ seed, urlAfterSeed: url, launches, ...state, errors: errs.slice(0, 3) }));
console.log(state.video && state.cards >= 5 && !state.serviceBanner && errs.length === 0 ? 'SEED_OK' : 'SEED_BAD');
await b.close();
