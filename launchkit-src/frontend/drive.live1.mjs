// Checklist B, items 6 and 9: create a launch from nothing and run Stage 1
// against the real pipeline, on an empty store. Everything else in the Phase 2
// pass runs on a seeded store, so this is the only check that proves the live
// path still works rather than that the UI renders.
import { chromium } from 'playwright';
import { writeFileSync } from 'node:fs';

const NAME = process.env.NAME || 'Excalidraw';
const SITE = process.env.SITE || 'https://excalidraw.com';
const REPO = process.env.REPO || 'https://github.com/excalidraw/excalidraw';
const MAX = Number(process.env.MAX_MS) || 420000;

const b = await chromium.launch();
const page = await b.newPage({ viewport: { width: 1600, height: 1100 } });
const errs = [];
page.on('pageerror', (e) => errs.push(String(e.message).slice(0, 200)));
const text = () => page.evaluate(() => document.querySelector('#lk-root')?.textContent || '');
const busy = () => page.evaluate(() => document.querySelectorAll('#lk-root main .text-shimmer, #lk-root main button[aria-busy="true"]').length);

await page.goto('http://localhost:3400', { waitUntil: 'networkidle' });
// an empty store: this is a first-run experience, not a seeded one
await page.evaluate(() => { localStorage.removeItem('lk-preview-appstate'); localStorage.removeItem('lk-nav'); });
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(3000);

const out = { name: NAME, site: SITE };
const t0 = Date.now();

await page.locator('#lk-root nav a', { hasText: /^Launches$/ }).first().click();
await page.waitForTimeout(1500);
const newBtn = page.locator('#lk-root button, #lk-root a', { hasText: /New launch|Create|Add launch/i }).first();
out.new_button = await newBtn.count();
if (!out.new_button) { console.log('NO_NEW_BUTTON', await text()); await b.close(); process.exit(1); }
await newBtn.click();
await page.waitForTimeout(1500);

// the dialog's fields carry ids, not names or placeholders: #nl-name, #nl-site, #nl-repo
const fill = async (id, value) => {
  const f = page.locator(`#lk-root input#${id}`).first();
  if (await f.count()) { await f.fill(value); return true; }
  return false;
};
out.filled_name = await fill('nl-name', NAME);
out.filled_site = await fill('nl-site', SITE);
out.filled_repo = await fill('nl-repo', REPO);

const submit = page.locator('#lk-root button', { hasText: /Analyze my app/i }).first();
out.submit_button = await submit.count();
if (out.submit_button) await submit.click();

let idle = false;
while (Date.now() - t0 < MAX) {
  if ((await busy()) === 0 && /confidence|Approve|GO|profile/i.test(await text())) { idle = true; break; }
  await page.waitForTimeout(5000);
}
out.secs = Math.round((Date.now() - t0) / 1000);
out.idle = idle;

const t = await text();
// the card does not always print the word "confidence"; a stored profile row plus a
// completed understand run is what actually proves stage 1 finished
out.has_profile = /confidence/i.test(t);
out.has_approve = /Approve/i.test(t);
out.failed = (t.match(/[A-Za-z ,:-]{0,40}failed:[^.]{0,200}\./) || [''])[0].slice(0, 220);
out.page_errors = errs.slice(0, 6);

// the store should now hold a project, a profile and a completed understand run
out.store = await page.evaluate(() => {
  try {
    const raw = JSON.parse(localStorage.getItem('lk-preview-appstate') || '{}');
    const t = raw.launchkit ?? raw;
    const runs = (t.runs || []).filter((r) => String(r.kind) === 'understand');
    return {
      projects: (t.projects || []).length,
      profiles: (t.profiles || []).length,
      understand_runs: runs.length,
      understand_status: runs.map((r) => r.status),
      owner_id_on_project: (t.projects || []).map((p) => (p.owner_id === undefined ? 'absent' : p.owner_id || 'empty')),
    };
  } catch (e) { return { error: String(e) }; }
});

await page.screenshot({ path: '/Users/shashidharbabu/rocketride-apps-gtm/docs/eval-10/live-stage1.png', fullPage: true }).catch(() => null);
const rawStore = await page.evaluate(() => localStorage.getItem('lk-preview-appstate') || '');
if (rawStore) writeFileSync('/Users/shashidharbabu/rocketride-apps-gtm/docs/eval-10/live-stage1-appstate.json', rawStore);
writeFileSync('/Users/shashidharbabu/rocketride-apps-gtm/docs/LIVE-STAGE1.json', JSON.stringify(out, null, 1));
console.log(JSON.stringify(out, null, 1));
await b.close();
const ok = out.idle && !out.failed && out.store.projects === 1 && out.store.profiles >= 1
  && out.store.understand_status?.includes('done') && out.has_approve && out.page_errors.length === 0;
console.log(ok ? 'LIVE1_OK' : 'LIVE1_BAD');
