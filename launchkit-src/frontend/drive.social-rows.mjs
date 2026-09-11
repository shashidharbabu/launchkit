// Social Launch as rows: one platform per row, its draft in the box beside it,
// the tile coloured and worded by state. Seeds the older Excalidraw state that
// already holds drafts (docs/visual-baseline/1b-appstate-p5.json), checks the
// rows, then drafts one real X post on the pipeline and checks the row turns.
//   node drive.social-rows.mjs            # rows + one real draft (about a minute)
//   SHOTS=1 node drive.social-rows.mjs    # rows and screenshots only
import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';
const OUT = '/Users/shashidharbabu/rocketride-apps-gtm/docs/visual-baseline';
const SHOTS = Boolean(process.env.SHOTS);
const b = await chromium.launch();
const page = await b.newPage({ viewport: { width: 1600, height: 1100 } });
const errs = [];
page.on('pageerror', (e) => errs.push(String(e).slice(0, 160)));
page.on('console', (m) => { if (m.type() === 'error') errs.push('console: ' + m.text().slice(0, 160)); });
const text = async () => page.evaluate(() => document.querySelector('#lk-root')?.textContent || '');
const log = (k, v) => console.log(k, JSON.stringify(v));

await page.goto('http://localhost:3400', { waitUntil: 'networkidle' });
await page.evaluate((raw) => { localStorage.setItem('lk-preview-appstate', raw); localStorage.removeItem('lk-nav'); }, readFileSync(`${OUT}/1b-appstate-p5.json`, 'utf8'));
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(3000);
await page.locator('#lk-root nav a', { hasText: 'Launches' }).first().click();
await page.waitForTimeout(1200);
await page.getByText('Excalidraw').first().click({ timeout: 10000 });
await page.waitForTimeout(2000);
await page.locator('#lk-root nav[aria-label="Stages"] a:visible', { hasText: /Social Launch/i }).first().click({ timeout: 8000 });
await page.waitForTimeout(2500);

const rows = async () => page.evaluate(() => [...document.querySelectorAll('#lk-root main ul[aria-label="Platforms"] > li')].map((li) => {
  const t = li.textContent || '';
  const cols = li.children.length;
  return {
    name: (t.match(/^\s*(X|LinkedIn|Reddit|Product Hunt|Hacker News|Newsletter)/) || ['', '?'])[1],
    state: /Approved/.test(t) ? 'approved' : /Needs review|needs your review/.test(t) ? 'needs review' : /No draft yet/.test(t) ? 'none' : 'unknown',
    draftBeside: /Latest draft/.test(t),
    draftButton: /Draft for /.test(t),
    redraft: /Redraft/.test(t),
    cols,
  };
}));
const r0 = await rows();
const t1 = await text();
log('ROWS', { count: r0.length, states: r0.map((r) => `${r.name}: ${r.state}${r.draftBeside ? ', draft beside' : ''}${r.draftButton ? ', draft button' : ''}${r.redraft ? ', redraft' : ''}`), shortVideoGone: !/Short video/.test(t1), counts: (t1.match(/\d+ approved, \d+ need review/) || [''])[0] });
await page.screenshot({ path: `${OUT}/social-1-rows.png`, fullPage: true });
await page.setViewportSize({ width: 390, height: 844 });
await page.waitForTimeout(800);
const sideways = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
await page.screenshot({ path: `${OUT}/social-2-rows-phone.png`, fullPage: true });
await page.setViewportSize({ width: 1600, height: 1100 });
await page.waitForTimeout(500);
log('PHONE', { sideways });

let drafted = null;
if (!SHOTS) {
  // one real draft: the first platform without a draft, else X again through its Redraft
  const target = r0.find((r) => r.draftButton) ?? null;
  const btn = target
    ? page.locator('#lk-root main ul[aria-label="Platforms"] > li', { hasText: new RegExp(`^\\s*${target.name}`) }).locator('button', { hasText: /^Draft for / }).first()
    : page.locator('#lk-root main ul[aria-label="Platforms"] > li').first().locator('button', { hasText: /^Redraft$/ }).first();
  const name = target ? target.name : r0[0]?.name;
  const t0 = Date.now();
  await btn.click();
  let done = false;
  for (let i = 0; i < 72 && !done; i++) {
    await page.waitForTimeout(5000);
    const busy = await page.evaluate(() => document.querySelectorAll('#lk-root main .text-shimmer').length + [...document.querySelectorAll('#lk-root main button')].filter((x) => x.disabled && /Draft for|Redraft|Approve/.test(x.textContent || '')).length);
    if (i > 1 && busy === 0) done = true;
  }
  const r1 = await rows();
  const row = r1.find((r) => r.name === name) ?? null;
  drafted = { name, secs: Math.round((Date.now() - t0) / 1000), done, state: row?.state, draftBeside: row?.draftBeside, error: ((await text()).match(/Social Launch, [^.]*failed[^.]*\./) || [''])[0].slice(0, 160) };
  log('DRAFTED', drafted);
  await page.screenshot({ path: `${OUT}/social-3-drafted.png`, fullPage: true });
}
log('ERRORS', errs.slice(0, 6));
const ok = r0.length === 6 && r0.every((r) => r.state !== 'unknown') && !sideways && errs.length === 0 && (SHOTS || (drafted?.done && drafted?.draftBeside));
console.log(ok ? 'SOCIAL_ROWS_OK' : 'SOCIAL_ROWS_BAD');
await b.close();
process.exit(ok ? 0 : 1);
