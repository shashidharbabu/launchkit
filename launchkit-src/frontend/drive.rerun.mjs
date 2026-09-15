// Re-run one or more stage actions for an evaluated app from its saved store:
// seed docs/eval-10/<slug>/appstate.json into the preview, open the stage,
// press each button in turn, wait for the run, then save the store beside the
// original as appstate.rerun.json so the extract picks up the new rows.
//   SLUG=cal-com STAGE=Signals BUTTON="Search for demand|Search again" node drive.rerun.mjs
//   SLUG=excalidraw STAGE="Social Launch" BUTTONS="Draft for X;Draft for LinkedIn;Draft for Reddit" node drive.rerun.mjs
// A platform that already has a draft shows Redraft instead of "Draft for": the
// "Draft for <Platform>" name falls back to that platform's Redraft button.
import { chromium } from 'playwright';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';

const SLUG = process.env.SLUG;
const STAGE = process.env.STAGE || 'Signals';
const BUTTONS = (process.env.BUTTONS || process.env.BUTTON || 'Search for demand|Search again').split(';').map((s) => s.trim()).filter(Boolean);
const MAX = Number(process.env.MAX_MS) || 1200000;
// SEED=rerun continues from the previous re-run's store instead of the original
const SEED_FILE = process.env.SEED === 'rerun' ? 'appstate.rerun.json' : 'appstate.json';
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
const seedPath = path.join(DIR, existsSync(path.join(DIR, SEED_FILE)) ? SEED_FILE : 'appstate.json');
const seed = JSON.parse(readFileSync(seedPath, 'utf8'));
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

const findButton = async (wanted) => {
  let btn = page.locator('#lk-root main button', { hasText: new RegExp(wanted) }).first();
  if (await btn.count()) return btn;
  const platform = (wanted.match(/^Draft for (.+)$/) || [])[1];
  if (platform) {
    btn = page.locator(`#lk-root main button[aria-label="Redraft the ${platform} post"]`).first();
    if (await btn.count()) return btn;
  }
  return null;
};

// a button stays disabled while any run is in flight, and the disabled state outlives the shimmer;
// waiting for it to be enabled is what keeps the next step from racing the last one
const waitEnabled = async (btn, ms = Number(process.env.WAIT_ENABLED_MS) || 600000) => {
  const t = Date.now();
  while (Date.now() - t < ms) {
    if (await btn.isEnabled().catch(() => false)) return true;
    await page.waitForTimeout(2000);
  }
  return false;
};

const results = [];
const T0 = Date.now();
// whatever goes wrong in one step, the drafts already produced are saved: a thrown locator error
// used to lose every draft of that app
try {
for (const wanted of BUTTONS) {
  const btn = await findButton(wanted);
  if (!btn) { results.push({ button: wanted, missing: true }); console.log('NO_BUTTON', JSON.stringify({ slug: SLUG, stage: STAGE, wanted })); continue; }
  if (!(await waitEnabled(btn))) { results.push({ button: wanted, disabled: true }); console.log('STILL_DISABLED', JSON.stringify({ slug: SLUG, wanted })); continue; }
  const t0 = Date.now();
  await btn.click({ timeout: 60000 });
  await page.waitForTimeout(5000);
  let idle = false;
  while (Date.now() - t0 < MAX) {
    if ((await busy()) === 0) { idle = true; break; }
    await page.waitForTimeout(4000);
  }
  const t = await text();
  const failed = (t.match(/[A-Za-z ,:-]{0,40}failed:[^.]{0,220}\./) || [''])[0].slice(0, 260);
  results.push({ button: wanted, secs: Math.round((Date.now() - t0) / 1000), idle, failed });
  console.log('STEP', JSON.stringify(results[results.length - 1]));
  // let the stage settle: the run's own writes land, then the next row's button comes back
  await page.waitForTimeout(6000);
}
} catch (e) {
  console.log('STEP_ERROR', JSON.stringify({ slug: SLUG, error: String(e?.message ?? e).slice(0, 300) }));
  results.push({ button: 'unknown', error: true });
}

// the original run's store stays as the record; the re-run lands beside it
const raw = await page.evaluate(() => localStorage.getItem('lk-preview-appstate') || '');
if (raw) writeFileSync(path.join(DIR, 'appstate.rerun.json'), raw);
await page.screenshot({ path: path.join(DIR, `rerun-${STAGE.toLowerCase().replace(/[^a-z]+/g, '-')}.png`), fullPage: true }).catch(() => null);
const idle = results.every((r) => r.idle);
const failed = results.map((r) => r.failed).filter(Boolean).join(' | ');
console.log('RERUN', JSON.stringify({ slug: SLUG, stage: STAGE, secs: Math.round((Date.now() - T0) / 1000), idle, failed, steps: results.length, saved: raw.length, page_errors: pageErrors.slice(-12) }));
await b.close();
console.log(idle && !failed && !results.some((r) => r.missing || r.disabled || r.error) ? 'RERUN_OK' : 'RERUN_BAD');
