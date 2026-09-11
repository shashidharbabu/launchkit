// The Commercial stage's pricing choice on the preview (:3400).
//   node drive.pricing.mjs          # seed flow-appstate-brand.json (no pipeline runs), walk the choice, shoot
//   FULL=1 node drive.pricing.mjs   # seed flow-appstate-approved.json, run "Draft pricing and listing" for real,
//                                   # then report whether three plan options came back
// Screenshots go to docs/visual-baseline.
import { chromium } from 'playwright';
import { readFileSync, writeFileSync } from 'node:fs';
const OUT = '/Users/shashidharbabu/rocketride-apps-gtm/docs/visual-baseline';
const APP = '/Users/shashidharbabu/rocketride-apps-gtm/apps/launchkit/public/dev';
const FULL = Boolean(process.env.FULL);
const SEED = process.env.SEED || (FULL ? `${APP}/flow-appstate-approved.json` : `${APP}/flow-appstate-brand.json`);
const DUMP = process.env.DUMP || `${APP}/flow-appstate-pricing.json`;
const b = await chromium.launch();
const page = await b.newPage({ viewport: { width: 1600, height: 1100 } });
const errs = [];
page.on('pageerror', (e) => errs.push(String(e).slice(0, 160)));
page.on('console', (m) => { if (m.type() === 'error') errs.push('console: ' + m.text().slice(0, 160)); });
const text = async () => page.evaluate(() => document.querySelector('#lk-root')?.textContent || '');
const disabled = async () => page.evaluate(() => {
  const shimmer = document.querySelectorAll('#lk-root main .text-shimmer').length;
  const loading = [...document.querySelectorAll('#lk-root main button')]
    .filter((x) => x.disabled && !/Use this pricing|Clear the choice|Select|Approve listing/.test(x.textContent || '')).length;
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
// the stub gates the app on the server's auth reply; staging answers in seconds normally, in a minute when slow
const waitConnected = async () => {
  const t0 = Date.now();
  await page.locator('#lk-root nav a', { hasText: 'Launches' }).first().waitFor({ state: 'visible', timeout: 240000 });
  console.log('CONNECTED', Math.round((Date.now() - t0) / 1000) + 's');
};
const openLaunch = async () => {
  await waitConnected();
  await page.locator('#lk-root nav a', { hasText: 'Launches' }).first().click();
  await page.waitForTimeout(1500);
  await page.locator('#lk-root table tbody a').first().click();
  await page.waitForTimeout(1500);
};
// the store row's pricing result, read straight from the preview's storage
const storedPricing = async () => page.evaluate(() => {
  try {
    const s = JSON.parse(localStorage.getItem('lk-preview-appstate') || '{}').launchkit || {};
    const rows = (s.commercial_results || []).filter((r) => r.kind === 'pricing');
    const row = rows[rows.length - 1];
    const project = (s.projects || [])[0] || {};
    if (!row) return { rows: 0 };
    const d = row.data || {};
    return {
      rows: rows.length,
      options: Array.isArray(d.options) ? d.options.length : null,
      optionNames: Array.isArray(d.options) ? d.options.map((o) => `${o.name} [${o.billing}]`) : [],
      models: Array.isArray(d.models_considered) ? d.models_considered.map((m) => `${m.model}: ${m.fit}`) : [],
      marketRate: typeof d.market_rate === 'string' ? d.market_rate.slice(0, 160) : null,
      revenueAt: Array.isArray(d.options) ? d.options.map((o) => o.revenue_at) : [],
      selected: project.selected_pricing ? { option: project.selected_pricing.option, billing: project.selected_pricing.billing, tiers: project.selected_pricing.tiers.map((t) => `${t.name} ${t.price_usd_month} ${t.included ? 'in' : 'out'}`) } : null,
    };
  } catch (e) { return { error: String(e).slice(0, 120) }; }
});
const pageState = async () => ({
  segmented: await page.locator('#lk-root main [role="radiogroup"][aria-label="Billing model"]').count(),
  billingOptions: await page.locator('#lk-root main [role="radiogroup"][aria-label="Billing model"] [role="radio"]').allTextContents(),
  planCards: await page.locator('#lk-root main [role="radiogroup"][aria-label="Plans"] [role="radio"]').count(),
  planNames: await page.locator('#lk-root main [role="radiogroup"][aria-label="Plans"] [role="radio"]').evaluateAll((els) => els.map((e) => `${e.getAttribute('aria-label')}${e.getAttribute('aria-checked') === 'true' ? ' (selected)' : ''}`)),
  recommended: await page.locator('#lk-root main [role="radiogroup"][aria-label="Plans"]', { hasText: 'Recommended' }).count(),
  includedBoxes: await page.locator('#lk-root main input[id^="tier-included-"]').count(),
  checked: await page.locator('#lk-root main input[id^="tier-included-"]').evaluateAll((els) => els.map((e) => e.checked)),
  usePricing: await main(/Use this pricing/).count(),
  usePricingEnabled: await main(/Use this pricing/).isEnabled().catch(() => false),
  chosenStamp: /Chosen/.test(await page.locator('#lk-root main').textContent().catch(() => '')),
});

await page.goto('http://localhost:3400', { waitUntil: 'networkidle' });
await page.evaluate((raw) => { localStorage.setItem('lk-preview-appstate', raw); localStorage.removeItem('lk-nav'); }, readFileSync(SEED, 'utf8'));
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(3000);
await openLaunch();
await stage(/Commercial/);

if (FULL) {
  // ---- the real stage: research, options, listing ----
  await shot('commercial-3-options-full-0-empty.png');
  const t0 = Date.now();
  await main(/Draft pricing and listing/).click();
  await waitIdle('pricing+listing', 900000);
  const t = await text();
  const st = await pageState();
  const stored = await storedPricing();
  log('FULL_RUN', { secs: Math.round((Date.now() - t0) / 1000), error: (t.match(/(pricing|listing) failed[^.]*\./) || [''])[0], ...st });
  log('FULL_STORED', stored);
  await shot('commercial-3-options-full.png');
  try {
    const raw = await page.evaluate(() => localStorage.getItem('lk-preview-appstate') || '');
    if (raw) { writeFileSync(DUMP, raw); log('DUMP', { file: DUMP, bytes: raw.length }); }
  } catch (e) { log('DUMP_FAILED', String(e).slice(0, 120)); }
  log('ERRORS', errs.slice(0, 8));
  console.log(stored.options === 3 ? 'PRICING_FULL_THREE_OPTIONS' : `PRICING_FULL_OPTIONS_${stored.options}`);
  await b.close();
  process.exit(0);
}

// ---- seeded: the choice without any pipeline run ----
const before = await pageState();
log('BEFORE', before);
const t = await text();
log('TEXT', {
  researched: (t.match(/How this was researched[^.]*\./) || [''])[0].slice(0, 160),
  chosenBanner: (t.match(/Chosen: [^.]*\. The plan carries it\./) || [''])[0].slice(0, 160),
  revenue: (t.match(/At that size[^.]*\./) || [''])[0].slice(0, 160),
});

// flip one Included box (the last tier), set customers to 100, then use the pricing
const boxes = page.locator('#lk-root main input[id^="tier-included-"]');
const n = await boxes.count();
if (n > 0) await page.locator(`#lk-root main label[for="tier-included-${n - 1}"]`).click();
await page.waitForTimeout(300);
const customers = page.locator('#lk-root main #pricing-customers');
await customers.fill('100');
await page.waitForTimeout(300);
const mid = await pageState();
const t2 = await text();
log('AFTER_EDIT', {
  checked: mid.checked,
  usePricingEnabled: mid.usePricingEnabled,
  changedBanner: /Changed since you chose/.test(t2),
  revenue: (t2.match(/At that size[^.]*\./) || [''])[0].slice(0, 160),
  customers: await customers.inputValue(),
});
await shot('commercial-3-options-edit.png');
if (mid.usePricingEnabled) {
  await main(/Use this pricing/).click();
  await page.waitForTimeout(2500);
}
const t3 = await text();
log('AFTER_USE', { chosenBanner: (t3.match(/Chosen: [^.]*\. The plan carries it\./) || [''])[0].slice(0, 200), stored: (await storedPricing()).selected });

// the choice must survive a reload
await page.reload({ waitUntil: 'networkidle' });
await waitConnected();
await page.waitForTimeout(1500);
if ((await page.locator('#lk-root nav[aria-label="Stages"] a:visible').count()) === 0) await openLaunch();
await stage(/Commercial/);
const t4 = await text();
const after = await pageState();
log('AFTER_RELOAD', {
  chosenBanner: (t4.match(/Chosen: [^.]*\. The plan carries it\./) || [''])[0].slice(0, 200),
  changedBanner: /Changed since you chose/.test(t4),
  checked: after.checked,
  planNames: after.planNames,
});
await shot('commercial-3-options.png');

// the plan carries it
await stage(/Plan/);
const t5 = await text();
log('PLAN', { pricing: (t5.match(/Pricing([^L]{0,120})/) || ['', ''])[1].trim().slice(0, 120) });

log('ERRORS', errs.slice(0, 8));
const ok = errs.length === 0 && before.segmented === 1 && (before.planCards === 3 || before.planCards === 1) && before.recommended === 1
  && after.chosenStamp && /Chosen: .*The plan carries it\./.test(t4) && !/Changed since you chose/.test(t4);
console.log(ok ? 'PRICING_SEEDED_OK' : 'PRICING_SEEDED_BAD');
await b.close();
