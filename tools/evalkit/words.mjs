// Eval kit: how much reading each screen asks for. The owner's standing feedback is that Launch Kit is too
// verbose and should explain itself with pictures; this puts a number on it, per screen, so every redesign turn
// has to lower it. Read-only on the seeded preview store (?seed=cal-com), like walk.mjs: nothing starts a pipe.
//   node tools/evalkit/words.mjs [--out dir] [--seed cal-com]
// Per screen: visible words in the main area, words above the fold (1440x900), paragraphs of 25+ words, visual
// elements (svg, img, canvas, progress, meters, charts), and screenshots at 1440 and 390 wide.
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const OUT = path.resolve(opt('--out', `docs/evals/words/${new Date().toISOString().slice(0, 10)}`));
const SEED = opt('--seed', 'cal-com');
const URL = opt('--url', 'http://localhost:3400');
mkdirSync(OUT, { recursive: true });

const FOLD = 900;
const b = await chromium.launch();
const page = await b.newPage({ viewport: { width: 1440, height: FOLD } });

const measure = () => page.evaluate((fold) => {
  const main = document.querySelector('#lk-root main') ?? document.querySelector('#lk-root');
  if (!main) return null;
  const words = (s) => (s.match(/[\p{L}\p{N}][\p{L}\p{N}'’.,-]*/gu) ?? []).length;
  let total = 0; let above = 0;
  const walker = document.createTreeWalker(main, NodeFilter.SHOW_TEXT);
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    const el = n.parentElement;
    if (!el || !n.textContent?.trim()) continue;
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden' || el.closest('[aria-hidden="true"],.sr-only')) continue;
    const r = document.createRange(); r.selectNodeContents(n);
    const rect = r.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) continue;
    const w = words(n.textContent);
    total += w;
    if (rect.top + window.scrollY < fold) above += w;
  }
  const longParas = [...main.querySelectorAll('p, li, dd')].filter((p) => words(p.innerText || '') >= 25 && p.offsetParent !== null).length;
  const visuals = [...main.querySelectorAll('svg, img, canvas, progress, meter, [role="img"], [role="progressbar"], [role="meter"], [data-chart]')]
    .filter((v) => { const r = v.getBoundingClientRect(); return r.width >= 24 && r.height >= 24; }).length; // icons under 24px are not pictures
  const height = document.documentElement.scrollHeight;
  return { total, above, longParas, visuals, screens: Math.round((height / fold) * 10) / 10 };
}, FOLD);

const shots = async (name) => {
  await page.screenshot({ path: path.join(OUT, `${name}-1440.png`), fullPage: true }).catch(() => null);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(OUT, `${name}-390.png`), fullPage: true }).catch(() => null);
  await page.setViewportSize({ width: 1440, height: FOLD });
  await page.waitForTimeout(400);
};

const rows = [];
async function screen(name, go) {
  try {
    await go();
    await page.waitForTimeout(2200);
    await page.evaluate(() => window.scrollTo(0, 0));
    const m = await measure();
    await shots(name);
    rows.push({ screen: name, ...m });
    console.log(`${name.padEnd(12)} ${JSON.stringify(m)}`);
  } catch (e) {
    rows.push({ screen: name, error: String(e?.message ?? e).slice(0, 120) });
    console.log(`${name.padEnd(12)} ERROR ${String(e?.message ?? e).slice(0, 120)}`);
  }
}

await page.goto(`${URL}/?seed=${SEED}`, { waitUntil: 'networkidle' });
await page.waitForTimeout(4000);
await screen('home', async () => {});
await screen('launches', async () => { await page.locator('#lk-root nav a', { hasText: 'Launches' }).first().click(); });
await page.locator('#lk-root table tbody a').first().click();
await page.waitForTimeout(2500);
for (const name of ['Profile', 'Brand', 'Commercial', 'Social Launch', 'Assets', 'Targets', 'Signals', 'Plan']) {
  await screen(name.toLowerCase().replace(/\s+/g, '-'), async () => {
    await page.locator('#lk-root nav[aria-label="Stages"] a:visible', { hasText: new RegExp(`^\\d*\\s*${name}`) }).first().click({ timeout: 10000 });
  });
}
await b.close();

const ok = rows.filter((r) => !r.error);
const sum = (k) => ok.reduce((a, r) => a + (r[k] ?? 0), 0);
const report = { url: URL, seed: SEED, fold: FOLD, at: new Date().toISOString(), rows, totals: { words: sum('total'), aboveFold: sum('above'), longParas: sum('longParas'), visuals: sum('visuals') } };
writeFileSync(path.join(OUT, 'words.json'), JSON.stringify(report, null, 2));
const md = ['| Screen | Words | Above the fold | Paragraphs of 25+ words | Visuals | Screens tall |', '|---|---|---|---|---|---|',
  ...rows.map((r) => r.error ? `| ${r.screen} | error | | | | |` : `| ${r.screen} | ${r.total} | ${r.above} | ${r.longParas} | ${r.visuals} | ${r.screens} |`),
  `| **total** | **${report.totals.words}** | **${report.totals.aboveFold}** | **${report.totals.longParas}** | **${report.totals.visuals}** | |`].join('\n');
writeFileSync(path.join(OUT, 'words.md'), md + '\n');
console.log('\n' + md);
