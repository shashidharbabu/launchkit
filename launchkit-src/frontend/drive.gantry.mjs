// Gantry finish-line verification on the preview: every screen in both themes at
// desktop and phone width, plus the Home checks the audit asks for (one canvas on
// the empty state, none once a conversation starts, a repaint on theme switch).
//
//   SEED=docs/visual-baseline/flow-appstate-final.json TAG=g node drive.gantry.mjs
//
// Prints GANTRY_DONE at the end. Any page error fails the run.
import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';

const OUT = '/Users/shashidharbabu/rocketride-apps-gtm/docs/visual-baseline';
const SEED = process.env.SEED || `${OUT}/flow-appstate-final.json`;
const TAG = process.env.TAG || 'g';
const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });

const errs = [];
const open = async (width, height) => {
  const page = await b.newPage({ viewport: { width, height } });
  page.on('pageerror', (e) => errs.push(`${width}px: ${String(e).slice(0, 160)}`));
  await page.goto('http://localhost:3400', { waitUntil: 'domcontentloaded' });
  await page.evaluate((raw) => {
    localStorage.setItem('lk-preview-appstate', raw);
    localStorage.removeItem('lk-nav');
  }, readFileSync(SEED, 'utf8'));
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(6000);
  return page;
};
const setTheme = async (page, dark) => {
  await page.evaluate((d) => {
    const root = document.getElementById('lk-root');
    root?.classList.toggle('dark', d);
  }, dark);
  await page.waitForTimeout(700);
};
const shot = (page, name) => page.screenshot({ path: `${OUT}/${TAG}-${name}.png`, fullPage: false });
// below lg the destinations sit in a sheet behind the menu button; the sheet is
// portalled, so the link is searched in the whole document once it is open
const nav = async (page, label) => {
  const menu = page.locator('button[aria-label="Open the menu"]:visible');
  if (await menu.count()) { await menu.first().click(); await page.waitForTimeout(600); }
  await page.locator('nav[aria-label="Main"] a:visible', { hasText: label }).first().click();
  await page.waitForTimeout(1800);
};

for (const [w, h, tagW] of [[1440, 900, 'desktop'], [390, 844, 'phone']]) {
  const page = await open(w, h);

  // Home, empty: the field is present and disappears once the conversation starts
  const canvases = await page.locator('#lk-root canvas').count();
  const glOk = await page.evaluate(() => {
    const c = document.querySelector('#lk-root canvas');
    return c ? Boolean(c.getContext('webgl')) : false;
  });
  const brightness = async () => {
    const c = page.locator('#lk-root canvas').first();
    if (!(await c.count())) return null;
    const buf = await c.screenshot({ type: 'png' });
    // mean of the first 4000 bytes of PNG payload is a crude but stable fingerprint
    return Math.round(Array.from(buf.subarray(200, 4200)).reduce((a, v) => a + v, 0) / 4000);
  };
  const before = await brightness();
  const geometry = await page.evaluate(() => {
    const q = (s) => document.querySelector(s)?.getBoundingClientRect();
    const sec = q('#lk-root section[aria-label="Navigator"]');
    const composer = q('#lk-root textarea[aria-label="Message the navigator"]');
    const greeting = q('#lk-root section[aria-label="Navigator"] p');
    return {
      sectionH: sec ? Math.round(sec.height) : null,
      greetingTop: greeting ? Math.round(greeting.top) : null,
      composerCentreRatio: sec && composer ? Math.round(((composer.top + composer.height / 2 - sec.top) / sec.height) * 100) : null,
    };
  });
  console.log(`HOME_EMPTY ${tagW}`, JSON.stringify({ canvases, glOk, geometry }));
  await shot(page, `home-empty-${tagW}-light`);
  await setTheme(page, true);
  const after = await brightness();
  const tokenAfter = await page.evaluate(() => getComputedStyle(document.querySelector('#lk-root canvas')).getPropertyValue('--field-sky-top').trim());
  console.log(`HOME_REPAINT ${tagW}`, JSON.stringify({ before, after, repainted: before !== after, tokenAfter }));
  await shot(page, `home-empty-${tagW}-dark`);
  await setTheme(page, false);

  // Home, active: send a starter, expect the thread with the mark and no canvas
  await page.locator('#lk-root button', { hasText: 'What is Gate 2?' }).first().click();
  await page.waitForTimeout(1200);
  const pending = await page.locator('#lk-root li[aria-label="The navigator is replying"]').count();
  await page.waitForFunction(() => !document.querySelector('#lk-root li[aria-label="The navigator is replying"]'), null, { timeout: 90000 }).catch(() => {});
  await page.waitForTimeout(1800);
  const active = await page.evaluate(() => ({
    canvases: document.querySelectorAll('#lk-root canvas').length,
    marks: document.querySelectorAll('#lk-root section[aria-label="Navigator"] ul svg[viewBox="0 0 32 32"]').length,
    turns: document.querySelectorAll('#lk-root section[aria-label="Navigator"] ul > li').length,
    bar: Boolean([...document.querySelectorAll('#lk-root section[aria-label="Navigator"] span')].find((s) => s.textContent === 'Navigator')),
  }));
  console.log(`HOME_ACTIVE ${tagW}`, JSON.stringify({ pendingSeen: pending, ...active }));
  await shot(page, `home-active-${tagW}-light`);
  await setTheme(page, true);
  await shot(page, `home-active-${tagW}-dark`);
  await setTheme(page, false);

  // every other screen, both themes
  for (const label of ['Dashboard', 'Launches', 'Runs', 'Settings']) {
    await nav(page, label);
    await shot(page, `${label.toLowerCase()}-${tagW}-light`);
    await setTheme(page, true);
    await shot(page, `${label.toLowerCase()}-${tagW}-dark`);
    await setTheme(page, false);
  }
  await nav(page, 'Launches');
  await page.getByText('hack-judge').first().click();
  await page.waitForTimeout(2500);
  for (const stage of ['Profile', 'Brand', 'Commercial', 'Social Launch', 'Targets', 'Signals', 'Plan']) {
    const link = page.locator('#lk-root nav[aria-label="Stages"] a:visible', { hasText: stage }).first();
    if (await link.count()) { await link.click(); await page.waitForTimeout(1500); }
    const slug = stage.toLowerCase().replace(' ', '-');
    await shot(page, `ws-${slug}-${tagW}-light`);
    await setTheme(page, true);
    await shot(page, `ws-${slug}-${tagW}-dark`);
    await setTheme(page, false);
  }
  const sideways = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
  console.log(`SIDEWAYS_SCROLL ${tagW}`, sideways);
  await page.close();
}

console.log('ERRS', JSON.stringify(errs));
console.log(errs.length ? 'GANTRY_FAILED' : 'GANTRY_DONE');
await b.close();
