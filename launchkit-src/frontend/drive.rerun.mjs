// Re-run one stage action for an evaluated app from its saved store: seed
// docs/eval-10/<slug>/appstate.json, open the stage, press the button, wait,
// then save the store back so the extract picks up the new rows.
//   SLUG=cal-com STAGE=Signals BUTTON="Search for demand|Search again" node drive.rerun.mjs
//   SLUG=excalidraw STAGE="Social Launch" BUTTON="Draft for Reddit" node drive.rerun.mjs
import { chromium } from 'playwright';
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const SLUG = process.env.SLUG;
const STAGE = process.env.STAGE || 'Signals';
const BUTTON = new RegExp(process.env.BUTTON || 'Search for demand|Search again');
const MAX = Number(process.env.MAX_MS) || 1200000;
if (!SLUG) { console.error('SLUG is required'); process.exit(2); }
const DIR = path.join('/Users/shashidharbabu/rocketride-apps-gtm/docs/eval-10', SLUG);
const b = await chromium.launch();
const page = await b.newPage({ viewport: { width: 1600, height: 1100 } });
const text = async () => page.evaluate(() => document.querySelector('#lk-root')?.textContent || '');
const busy = async () => page.evaluate(() => document.querySelectorAll('#lk-root main .text-shimmer, #lk-root main button[aria-busy="true"]').length);
// what the page itself complained about while the run was in flight: a thrown error, a failed request, a reload
const pageErrors = [];
page.on('pageerror', (e) => pageErrors.push(`pageerror: ${String(e.message || e).slice(0, 300)}`));
page.on('console', (m) => { if (m.type() === 'error') pageErrors.push(`console: ${m.text().slice(0, 300)}`); });
page.on('load', () => pageErrors.push(`load: ${page.url()}`));

await page.goto('http://localhost:3400', { waitUntil: 'networkidle' });
// a run the original drive abandoned mid-flight is still "running" in the saved store and would disable the stage
const seed = JSON.parse(readFileSync(path.join(DIR, 'appstate.json'), 'utf8'));
const tables = seed.launchkit ?? seed;
let stale = 0;
for (const r of tables.runs ?? []) if (r.status === 'running' || r.status === 'queued') { r.status = 'error'; r.error = 'interrupted in the saved store'; stale += 1; }
if (stale) console.log('STALE_RUNS_CLEARED', stale);
await page.evaluate((raw) => { localStorage.setItem('lk-preview-appstate', raw); localStorage.removeItem('lk-nav'); }, JSON.stringify(seed));
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(3000);
await page.locator('#lk-root nav a', { hasText: 'Launches' }).first().click();
await page.waitForTimeout(1500);
await page.locator('#lk-root table tbody a').first().click();
await page.waitForTimeout(1500);
await page.locator('#lk-root nav[aria-label="Stages"] a:visible', { hasText: new RegExp(STAGE) }).first().click({ timeout: 10000 });
await page.waitForTimeout(1500);
let btn = page.locator('#lk-root main button', { hasText: BUTTON }).first();
if (!(await btn.count())) {
  // a platform that already has a draft shows Redraft instead of Draft for; the label names the platform
  const platform = (String(process.env.BUTTON || '').match(/^Draft for (.+)$/) || [])[1];
  if (platform) btn = page.locator(`#lk-root main button[aria-label="Redraft the ${platform} post"]`).first();
}
if (!(await btn.count())) { console.log('NO_BUTTON', JSON.stringify({ slug: SLUG, stage: STAGE, wanted: String(BUTTON) })); await b.close(); process.exit(1); }
const t0 = Date.now();
await btn.click();
await page.waitForTimeout(5000);
let idle = false;
while (Date.now() - t0 < MAX) {
  if ((await busy()) === 0) { idle = true; break; }
  await page.waitForTimeout(4000);
}
const t = await text();
const failed = (t.match(/[A-Za-z ,:-]{0,40}failed:[^.]{0,220}\./) || [''])[0].slice(0, 260);
// the original run's store stays as the record; the re-run lands beside it
const raw = await page.evaluate(() => localStorage.getItem('lk-preview-appstate') || '');
if (raw) writeFileSync(path.join(DIR, 'appstate.rerun.json'), raw);
await page.screenshot({ path: path.join(DIR, `rerun-${STAGE.toLowerCase().replace(/[^a-z]+/g, '-')}.png`), fullPage: true }).catch(() => null);
console.log('RERUN', JSON.stringify({ slug: SLUG, stage: STAGE, secs: Math.round((Date.now() - t0) / 1000), idle, failed, saved: raw.length, page_errors: pageErrors.slice(-12) }));
await b.close();
console.log(idle && !failed ? 'RERUN_OK' : 'RERUN_BAD');
