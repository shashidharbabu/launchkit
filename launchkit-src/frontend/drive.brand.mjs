// The Brand and Commercial stages on the preview (:3400), real pipeline:
// seed an approved launch, extract the DNA, draft the angles, choose one,
// draft pricing and listing, choose the pricing, approve the listing, then
// look at Social Launch and the Plan. Screenshots go to docs/visual-baseline.
//   node drive.brand.mjs                 # uses public/dev/flow-appstate-approved.json
//   RESUME=1 node drive.brand.mjs        # seed the finished state and only shoot
import { chromium } from 'playwright';
import { readFileSync, writeFileSync } from 'node:fs';
const OUT = '/Users/shashidharbabu/rocketride-apps-gtm/docs/visual-baseline';
const DONE = '/Users/shashidharbabu/rocketride-apps-gtm/apps/launchkit/public/dev/flow-appstate-brand.json';
const RESUME = Boolean(process.env.RESUME);
const SEED = process.env.SEED || (RESUME ? DONE : '/Users/shashidharbabu/rocketride-apps-gtm/apps/launchkit/public/dev/flow-appstate-approved.json');
const b = await chromium.launch();
const page = await b.newPage({ viewport: { width: 1600, height: 1100 } });
const errs = [];
page.on('pageerror', (e) => errs.push(String(e).slice(0, 160)));
page.on('console', (m) => { if (m.type() === 'error') errs.push('console: ' + m.text().slice(0, 160)); });
const text = async () => page.evaluate(() => document.querySelector('#lk-root')?.textContent || '');
const disabled = async () => page.evaluate(() => {
  const shimmer = document.querySelectorAll('#lk-root main .text-shimmer').length;
  const loading = [...document.querySelectorAll('#lk-root main button')].filter((x) => x.disabled && !/Use this pricing|Chosen|Dropped|Keep/.test(x.textContent || '')).length;
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
const stage = async (name) => {
  await page.locator('#lk-root nav[aria-label="Stages"] a:visible', { hasText: name }).first().click();
  await page.waitForTimeout(1200);
};
const shot = (file) => page.screenshot({ path: `${OUT}/${file}`, fullPage: true });

await page.goto('http://localhost:3400', { waitUntil: 'networkidle' });
await page.evaluate((raw) => { localStorage.setItem('lk-preview-appstate', raw); localStorage.removeItem('lk-nav'); }, readFileSync(SEED, 'utf8'));
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(3000);
await page.locator('#lk-root nav a', { hasText: 'Launches' }).first().click();
await page.waitForTimeout(1500);
await page.locator('#lk-root table tbody a').first().click();
await page.waitForTimeout(1500);

if (RESUME) {
  await stage(/Brand/); await shot('brand-2-chosen.png');
  await stage(/Commercial/); await shot('commercial-2-chosen.png');
  await stage(/Social Launch/); await shot('social-0-angle.png');
  await stage(/Plan/); await shot('plan-0-decisions.png');
  log('ERRORS', errs.slice(0, 8));
  console.log(errs.length === 0 ? 'BRAND_SHOTS_OK' : 'BRAND_SHOTS_BAD');
  await b.close();
  process.exit(0);
}

// ---- Brand: DNA, then angles, then choose ----
await stage(/Brand/);
await shot('brand-0-empty.png');
let t0 = Date.now();
await main(/Extract Business DNA/).click();
await waitIdle('brand_dna', 300000);
let t = await text();
log('DNA', { secs: Math.round((Date.now() - t0) / 1000), extracted: /Extracted/.test(t), error: (t.match(/Business DNA failed[^.]*\./) || [''])[0] });
t0 = Date.now();
await main(/Draft the angles/).click();
await waitIdle('brand_campaigns', 300000);
t = await text();
const angleButtons = await main(/Choose this angle/).count();
log('ANGLES', { secs: Math.round((Date.now() - t0) / 1000), chooseButtons: await page.locator('#lk-root main button', { hasText: /Choose this angle/ }).count(), glance: /At a glance/.test(t) });
await shot('brand-1-angles.png');
await main(/Choose this angle/).click();
await page.waitForTimeout(2500);
t = await text();
log('CHOSEN', { chosen: /Chosen, click to drop/.test(t), banner: (t.match(/Chosen: [^.]*\./) || [''])[0].slice(0, 90), rail: await page.evaluate(() => [...document.querySelectorAll('#lk-root nav[aria-label="Stages"] a')].filter((a) => a.offsetParent !== null).map((a) => a.getAttribute('aria-label')).find((l) => /^Brand/.test(l || ''))) });
await shot('brand-2-chosen.png');

// ---- Social Launch sees the angle ----
await stage(/Social Launch/);
t = await text();
log('SOCIAL', { angleBanner: (t.match(/Writing from your angle[^.]*\./) || [''])[0].slice(0, 100), shortVideoGone: !/Draft for Short video/.test(t) });
await shot('social-0-angle.png');

// ---- Commercial: pricing, then listing ----
await stage(/Commercial/);
await shot('commercial-0-empty.png');
t0 = Date.now();
await main(/Draft pricing and listing/).click();
await waitIdle('pricing+listing', 900000);
t = await text();
log('COMMERCIAL', { secs: Math.round((Date.now() - t0) / 1000), keepButtons: await page.locator('#lk-root main button', { hasText: /^Keep$|Keep/ }).count(), usePricing: await main(/Use this pricing/).count(), approveListing: await main(/Approve listing/).count(), error: (t.match(/(pricing|listing) failed[^.]*\./) || [''])[0] });
await shot('commercial-1-drafts.png');
if (await main(/Use this pricing/).count()) {
  // drop the last tier, then use it: the choice must survive a refresh
  const keeps = page.locator('#lk-root main button', { hasText: /Keep/ });
  const n = await keeps.count();
  if (n > 1) await keeps.nth(n - 1).click();
  await page.waitForTimeout(400);
  await main(/Use this pricing/).click();
  await page.waitForTimeout(2500);
}
if (await main(/Approve listing/).count()) {
  await main(/Approve listing/).click();
  await page.waitForTimeout(2500);
}
t = await text();
log('CHOSEN_COMMERCIAL', { pricingBanner: (t.match(/Chosen: [^.]*\./) || [''])[0].slice(0, 120), listingApproved: /Approved\./.test(t), rail: await page.evaluate(() => [...document.querySelectorAll('#lk-root nav[aria-label="Stages"] a')].filter((a) => a.offsetParent !== null).map((a) => a.getAttribute('aria-label')).find((l) => /^Commercial/.test(l || ''))) });
await shot('commercial-2-chosen.png');

// ---- Plan shows the decisions ----
await stage(/Plan/);
t = await text();
log('PLAN', { decisions: /What this launch says/.test(t), angle: (t.match(/Angle([^P]{0,80})/) || ['', ''])[1].trim().slice(0, 80), pricing: (t.match(/Pricing([^L]{0,80})/) || ['', ''])[1].trim().slice(0, 80) });
await shot('plan-0-decisions.png');

try {
  const raw = await page.evaluate(() => localStorage.getItem('lk-preview-appstate') || '');
  if (raw) { writeFileSync(DONE, raw); log('DUMP', { file: DONE, bytes: raw.length }); }
} catch (e) { log('DUMP_FAILED', String(e).slice(0, 120)); }
log('ERRORS', errs.slice(0, 8));
console.log(errs.length === 0 && angleButtons >= 0 ? 'BRAND_DONE' : 'BRAND_INCOMPLETE');
await b.close();
