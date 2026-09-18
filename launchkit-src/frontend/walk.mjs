// Read-only walk of the whole app on the seeded store: every stage, every page,
// the gates, the theme and the palette. Clicks nothing that starts a pipe run
// (staging is out of disk), so this proves the app renders and navigates end to
// end, not that the pipelines execute.
import { chromium } from 'playwright';

const b = await chromium.launch();
const page = await b.newPage({ viewport: { width: 1600, height: 1100 } });
const errs = [];
page.on('pageerror', (e) => errs.push('pageerror: ' + String(e).slice(0, 160)));
page.on('console', (m) => { if (m.type() === 'error' && !/CORS|ERR_FAILED|404|Failed to load resource/.test(m.text())) errs.push('console: ' + m.text().slice(0, 160)); });

const text = () => page.evaluate(() => document.querySelector('#lk-root')?.textContent || '');
const out = [];
const check = (name, ok, detail) => { out.push({ name, ok, detail }); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}  ${detail}`); };

await page.goto('http://localhost:3400/', { waitUntil: 'networkidle' });
await page.waitForTimeout(4000);

// ---- home: the navigator page renders (its send button needs a pipe, not clicked)
// the landing state is the greeting and the recent-launches list, not the chat view
let t = await text();
check('home renders', /What are you launching/.test(t) && /Recent launches/.test(t), `${t.length} chars, ${/Cal\.com/.test(t) ? 'seeded launch listed' : 'NO LAUNCH LISTED'}`);

// ---- launches list
await page.locator('#lk-root nav a', { hasText: 'Launches' }).first().click();
await page.waitForTimeout(1500);
const rows = await page.evaluate(() => document.querySelectorAll('#lk-root table tbody tr').length);
check('launches list', rows === 1, `${rows} launch`);

await page.locator('#lk-root table tbody a').first().click();
await page.waitForTimeout(2500);

// ---- every stage in the rail
const STAGES = [
  ['Profile', /Cal\.com is fully open-source scheduling/],
  ['Brand', /angle|Angle/],
  ['Commercial', /pricing|Pricing|listing|Listing/],
  ['Social Launch', /X|LinkedIn|Reddit/],
  ['Assets', /reel|Reel|image|Image/],
  ['Targets', /venue|Venue|rank|Rank/],
  ['Signals', /signal|Signal/],
  ['Plan', /Ready|ready/],
];
for (const [name, re] of STAGES) {
  try {
    await page.locator('#lk-root nav[aria-label="Stages"] a:visible', { hasText: new RegExp(`^\\d*\\s*${name}`) }).first().click({ timeout: 10000 });
    await page.waitForTimeout(2000);
    const st = await text();
    const heading = await page.evaluate(() => document.querySelector('#lk-root h1')?.textContent?.trim() || '');
    check(`stage ${name}`, re.test(st) && st.length > 400, `h1 "${heading}", ${st.length} chars`);
  } catch (e) {
    check(`stage ${name}`, false, String(e.message || e).slice(0, 90));
  }
}

// ---- the three gates show as approved on the rail
// stage-rail.tsx renders two: a compact scroller for narrow screens and the sidebar.
// Only the sidebar carries the gate labels, so read every one of them.
const rail = await page.evaluate(() => [...document.querySelectorAll('#lk-root nav[aria-label="Stages"]')].map((n) => n.textContent || '').join(' '));
check('gates on the rail', /Gate 1/.test(rail) && /Gate 2/.test(rail) && /Gate 3/.test(rail), rail.replace(/\s+/g, ' ').slice(0, 90));

// ---- run history
await page.locator('#lk-root nav a', { hasText: 'Runs' }).first().click();
await page.waitForTimeout(2000);
const runRows = await page.evaluate(() => document.querySelectorAll('#lk-root table tbody tr').length);
check('run history', runRows > 20, `${runRows} rows`);

// ---- settings
await page.locator('#lk-root nav a', { hasText: 'Settings' }).first().click();
await page.waitForTimeout(2000);
const set = await text();
check('settings', set.length > 300, `${set.length} chars`);

// ---- theme toggle survives a reload (the class lives on #lk-root, not <html>)
const before = await page.evaluate(() => document.querySelector('#lk-root')?.className || '');
await page.locator('#lk-root button[aria-label*="theme" i], #lk-root header button').last().click().catch(() => null);
await page.waitForTimeout(1200);
const after = await page.evaluate(() => document.querySelector('#lk-root')?.className || '');
check('theme toggle', before !== after, `${/dark/.test(after) ? 'dark' : 'light'} after click`);

// ---- command palette
// the app binds metaKey || ctrlKey; headless chromium does not carry Meta here
// lowercase k: 'Control+K' sends shift too, and the handler tests e.key === 'k'
await page.keyboard.press('Control+k');
await page.waitForTimeout(1200);
// radix portals the dialog to document.body, outside #lk-root: never scope this to the app root
const isOpen = () => page.evaluate(() => Boolean(document.querySelector('[role="dialog"][aria-label="Command palette"]')));
if (!(await isOpen())) { await page.keyboard.press('Meta+k'); await page.waitForTimeout(1200); }
const palette = await isOpen();
check('command palette', palette, palette ? 'opens on Cmd+K' : 'did not open');
await page.keyboard.press('Escape');

check('no page errors', errs.length === 0, errs.length ? errs.slice(0, 3).join(' | ') : 'clean');

await page.screenshot({ path: '/Users/shashidharbabu/rocketride-apps-gtm/docs/demo/walk-final.png' });
await b.close();

const failed = out.filter((o) => !o.ok);
console.log(`\nWALK ${out.length - failed.length}/${out.length} passed`);
if (failed.length) { console.log('FAILED: ' + failed.map((f) => f.name).join(', ')); process.exit(1); }
