// The Assets stage on the preview (:3400) against the studio forge (:3500):
// seed an approved launch, open Assets, read the site, make the cards, write
// the script (real pipeline), render the reel (real forge), approve it.
//   node drive.studio.mjs            # uses public/dev/flow-appstate-approved.json
//   SEED=path.json node drive.studio.mjs
//   RESUME=1 node drive.studio.mjs   # seed the finished state (public/dev/flow-appstate-studio.json) and only shoot
import { chromium } from 'playwright';
import { readFileSync, writeFileSync } from 'node:fs';
const OUT = '/Users/shashidharbabu/rocketride-apps-gtm/docs/visual-baseline';
const DONE = '/Users/shashidharbabu/rocketride-apps-gtm/apps/launchkit/public/dev/flow-appstate-studio.json';
const RESUME = Boolean(process.env.RESUME);
const SEED = process.env.SEED || (RESUME ? DONE : '/Users/shashidharbabu/rocketride-apps-gtm/apps/launchkit/public/dev/flow-appstate-approved.json');
const b = await chromium.launch();
const page = await b.newPage({ viewport: { width: 1600, height: 1100 } });
const errs = [];
page.on('pageerror', (e) => errs.push(String(e).slice(0, 160)));
page.on('console', (m) => { if (m.type() === 'error') errs.push('console: ' + m.text().slice(0, 160)); });
const text = async () => page.evaluate(() => document.querySelector('#lk-root')?.textContent || '');
// busy = a run is live: the shimmer step line is showing, or a button is in its loading state
const disabled = async () => page.evaluate(() => {
  const shimmer = document.querySelectorAll('#lk-root main .text-shimmer').length;
  const loading = [...document.querySelectorAll('#lk-root main button')].filter((x) => x.disabled && !/Save edits|Approve reel/.test(x.textContent || '')).length;
  return shimmer + loading;
});
const log = (k, v) => console.log(k, JSON.stringify(v));
async function waitIdle(label, maxMs) {
  const t0 = Date.now();
  await page.waitForTimeout(4000);
  while (Date.now() - t0 < maxMs) {
    if ((await disabled()) === 0) { console.log('IDLE', label, Math.round((Date.now() - t0) / 1000) + 's'); return true; }
    await page.waitForTimeout(2500);
  }
  console.log('TIMEOUT', label);
  return false;
}
const main = (re) => page.locator('#lk-root main button', { hasText: re }).first();

await page.goto('http://localhost:3400', { waitUntil: 'networkidle' });
await page.evaluate((raw) => { localStorage.setItem('lk-preview-appstate', raw); localStorage.removeItem('lk-nav'); }, readFileSync(SEED, 'utf8'));
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(3000);
await page.locator('#lk-root nav a', { hasText: 'Launches' }).first().click();
await page.waitForTimeout(1500);
await page.locator('#lk-root table tbody a').first().click();
await page.waitForTimeout(1500);
const rail = await page.evaluate(() => [...document.querySelectorAll('#lk-root nav[aria-label="Stages"] li')].filter((li) => li.offsetParent !== null).map((li) => li.textContent.trim().replace(/\s+/g, ' ')).filter(Boolean));
log('RAIL', rail.slice(0, 9));
await page.locator('#lk-root nav[aria-label="Stages"] a:visible', { hasText: /Assets/ }).first().click();
await page.waitForTimeout(1500);
let t = await text();
log('STAGE', { title: (t.match(/Assets/) || [''])[0], serviceBanner: /Studio service is not running/.test(t), readButton: await main(/Read the site/).count() });
if (RESUME) {
  // screenshots only: desktop, phone, and dark at desktop
  await page.screenshot({ path: `${OUT}/studio-2-reel.png`, fullPage: true });
  await page.evaluate(() => document.querySelector('#lk-root')?.classList.add('dark'));
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${OUT}/studio-4-dark.png`, fullPage: true });
  await page.evaluate(() => document.querySelector('#lk-root')?.classList.remove('dark'));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${OUT}/studio-3-phone.png`, fullPage: true });
  const sideways = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  log('SHOTS', { sideways, errors: errs.slice(0, 5) });
  console.log(errs.length === 0 && !sideways ? 'STUDIO_SHOTS_OK' : 'STUDIO_SHOTS_BAD');
  await b.close();
  process.exit(0);
}
await page.screenshot({ path: `${OUT}/studio-0-empty.png`, fullPage: true });

const t0 = Date.now();
await main(/Read the site/).click();
await waitIdle('probe', 180000);
t = await text();
log('PROBE', { secs: Math.round((Date.now() - t0) / 1000), read: /Read from /.test(t), roles: (t.match(/#[0-9a-f]{6}/g) || []).slice(0, 5), logoFound: !/No logo found/.test(t), error: (t.match(/site read failed[^.]*\./) || [''])[0] });

const t1 = Date.now();
await main(/Make the cards/).click();
await waitIdle('kit', 180000);
const cardImgs = await page.evaluate(() => [...document.querySelectorAll('#lk-root main figure img')].map((i) => ({ w: i.naturalWidth, alt: i.alt.slice(0, 30) })));
log('KIT', { secs: Math.round((Date.now() - t1) / 1000), cards: cardImgs.length, loaded: cardImgs.filter((c) => c.w > 0).length });
await page.screenshot({ path: `${OUT}/studio-1-kit.png`, fullPage: true });

const t2 = Date.now();
await main(/Write the script/).click();
await waitIdle('script', 420000);
const inputs = await page.evaluate(() => [...document.querySelectorAll('#lk-root main input')].map((i) => i.value));
t = await text();
log('SCRIPT', { secs: Math.round((Date.now() - t2) / 1000), slots: inputs.length, sample: inputs.slice(0, 6), trimmed: (t.match(/Trimmed to fit/g) || []).length, error: (t.match(/reel script failed[^.]*\./) || [''])[0] });

// the cards prefer the script's tagline once one exists: remake them
await main(/^Remake$/).click();
await waitIdle('kit-remake', 180000);
const remade = await page.evaluate(() => [...document.querySelectorAll('#lk-root main figure img')].filter((i) => i.naturalWidth > 0).length);
log('KIT_REMAKE', { cards: remade });

const t3 = Date.now();
await main(/Render the reel/).click();
await waitIdle('reel', 600000);
const video = await page.evaluate(() => { const v = document.querySelector('#lk-root main video'); return v ? { src: v.currentSrc || v.src, poster: v.poster, ready: v.readyState } : null; });
t = await text();
log('REEL', { secs: Math.round((Date.now() - t3) / 1000), video, approveButton: await main(/Approve reel/).count(), error: (t.match(/reel render failed[^.]*\./) || [''])[0] });
await page.screenshot({ path: `${OUT}/studio-2-reel.png`, fullPage: true });

if (await main(/Approve reel/).count()) {
  await main(/Approve reel/).click();
  await page.waitForTimeout(2000);
  t = await text();
  const dot = await page.evaluate(() => [...document.querySelectorAll('#lk-root nav[aria-label="Stages"] a')].filter((a) => a.offsetParent !== null).map((a) => a.getAttribute('aria-label')).find((l) => /^Assets:/.test(l || '')));
  log('APPROVE', { approved: /Approved/.test(t), railLabel: dot, nextHint: (t.match(/Reel approved[^.]*\./) || [''])[0] });
}
// keep the finished state so RESUME=1 can re-shoot the stage without re-running the jobs
try {
  const raw = await page.evaluate(() => localStorage.getItem('lk-preview-appstate') || '');
  if (raw) { writeFileSync(DONE, raw); log('DUMP', { file: DONE, bytes: raw.length }); }
} catch (e) { log('DUMP_FAILED', String(e).slice(0, 120)); }
await page.setViewportSize({ width: 390, height: 844 });
await page.waitForTimeout(800);
await page.screenshot({ path: `${OUT}/studio-3-phone.png`, fullPage: true });
log('ERRORS', errs.slice(0, 8));
console.log(errs.length === 0 && video?.src ? 'STUDIO_DONE' : 'STUDIO_INCOMPLETE');
await b.close();
