// The whole launch, start to finish, for one app on the preview (:3400) with
// the real pipelines and the local Studio service (:3500): create, approve
// the profile, Brand (DNA, angles, choose one), Commercial (pricing and
// listing, choose, approve), Social Launch (draft every platform, approve
// all), Assets (site, images, cards, script, voice-over, reel, approve),
// Targets (rank, pick three), Signals (search), Plan. Every stage is timed,
// screenshotted and summarised; the store is dumped at the end so the
// evaluation can read every row.
//   NAME="Cal.com" SITE=https://cal.com REPO=https://github.com/calcom/cal.com OUTDIR=docs/eval-10/cal-com node drive.full.mjs
//   SKIP=assets,signals node drive.full.mjs     # skip stages by slug
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const NAME = process.env.NAME || 'hack-judge';
const SITE = process.env.SITE || 'https://hackathon-judge-aid.onrender.com';
const REPO = process.env.REPO || '';
const OUTDIR = path.resolve(process.env.OUTDIR || `docs/eval-10/${NAME.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`);
const SKIP = new Set((process.env.SKIP || '').split(',').map((s) => s.trim()).filter(Boolean));
mkdirSync(OUTDIR, { recursive: true });

const b = await chromium.launch();
const page = await b.newPage({ viewport: { width: 1600, height: 1100 } });
const errs = [];
page.on('pageerror', (e) => errs.push(String(e).slice(0, 200)));
page.on('console', (m) => { if (m.type() === 'error') errs.push('console: ' + m.text().slice(0, 200)); });
const text = async () => page.evaluate(() => document.querySelector('#lk-root')?.textContent || '');
const summary = { name: NAME, site: SITE, repo: REPO, started: new Date().toISOString(), stages: {}, errors: [] };
const log = (k, v) => console.log(k, JSON.stringify(v));
const shot = (file) => page.screenshot({ path: path.join(OUTDIR, file), fullPage: true }).catch(() => null);

// busy = a run is live: the shimmer step line, a button in its loading state, or a disabled action button
const ALLOW = /Save edits|Save and speak again|Approve reel|Use this pricing|Clear the choice|Included|Download|Open in a tab|Copy|Subscribe|Next:|Mark replied|Dismiss|Choose this angle|Chosen, click to drop|Select|Regenerate|Rewrite|Redraft|Render again|Make again|Read again|Rank again|Search again|Re-extract|Remake|Another take/;
const busy = async () => page.evaluate((allow) => {
  const re = new RegExp(allow);
  const shimmer = document.querySelectorAll('#lk-root main .text-shimmer').length;
  const spinning = document.querySelectorAll('#lk-root main button[aria-busy="true"]').length;
  const loading = [...document.querySelectorAll('#lk-root main button')].filter((x) => x.disabled && !re.test(x.textContent || '')).length;
  return shimmer + spinning + loading;
}, ALLOW.source);
async function waitIdle(label, maxMs) {
  const t0 = Date.now();
  await page.waitForTimeout(4000);
  while (Date.now() - t0 < maxMs) {
    if ((await busy()) === 0) return { idle: true, secs: Math.round((Date.now() - t0) / 1000) };
    await page.waitForTimeout(3000);
  }
  return { idle: false, secs: Math.round((Date.now() - t0) / 1000) };
}
const main = (re) => page.locator('#lk-root main button', { hasText: re }).first();
const failedLine = async () => ((await text()).match(/[A-Za-z ,:-]{0,40}failed:[^.]{0,220}\./) || [''])[0].slice(0, 260);
async function stage(name) {
  await page.locator('#lk-root nav[aria-label="Stages"] a:visible', { hasText: name }).first().click({ timeout: 10000 });
  await page.waitForTimeout(1500);
}
async function step(slug, fn) {
  if (SKIP.has(slug)) { summary.stages[slug] = { skipped: true }; log('SKIP', slug); return; }
  const t0 = Date.now();
  try {
    const r = await fn();
    summary.stages[slug] = { ok: true, secs: Math.round((Date.now() - t0) / 1000), ...(r || {}) };
  } catch (e) {
    summary.stages[slug] = { ok: false, secs: Math.round((Date.now() - t0) / 1000), error: String(e?.message ?? e).slice(0, 300) };
    summary.errors.push(`${slug}: ${String(e?.message ?? e).slice(0, 200)}`);
  }
  log(slug.toUpperCase(), summary.stages[slug]);
}
const rail = async () => page.evaluate(() => [...document.querySelectorAll('#lk-root nav[aria-label="Stages"] a')].filter((a) => a.offsetParent !== null).map((a) => a.getAttribute('aria-label')).filter(Boolean));

await page.goto('http://localhost:3400', { waitUntil: 'networkidle' });
await page.evaluate(() => { localStorage.removeItem('lk-preview-appstate'); localStorage.removeItem('lk-nav'); });
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(3000);

// ---- create and understand ----
await step('profile', async () => {
  await page.locator('#lk-root nav a', { hasText: 'Launches' }).first().click();
  await page.waitForTimeout(1200);
  await page.locator('#lk-root a, #lk-root button', { hasText: /New launch/i }).first().click();
  await page.waitForTimeout(1500);
  await page.locator('#nl-name').fill(NAME);
  await page.locator('#nl-site').fill(SITE);
  if (REPO) await page.locator('#nl-repo').fill(REPO);
  await page.locator('#lk-root button', { hasText: /Analyze my app/i }).first().click();
  await page.waitForTimeout(3000);
  const t0 = Date.now();
  // poll rather than waitForFunction: the workspace re-mounts after creation and would abort a single wait
  let enabled = false;
  while (Date.now() - t0 < 600000 && !enabled) {
    await page.waitForTimeout(4000);
    enabled = await page.evaluate(() => {
      const b = [...document.querySelectorAll('#lk-root button')].find((x) => /Approve profile/.test(x.textContent || ''));
      return Boolean(b && !b.disabled);
    }).catch(() => false);
    if (!enabled && /analysis failed|understand failed|could not analy/i.test(await text().catch(() => ''))) break;
  }
  const t = await text();
  const partial = /Partial analysis|could not be reached|unreachable/i.test(t);
  await shot('1-profile.png');
  if (!enabled) throw new Error(`profile never became approvable: ${(t.match(/(failed|error)[^.]{0,160}/i) || [''])[0]}`);
  await page.locator('#lk-root button', { hasText: 'Approve profile' }).first().click();
  await page.waitForTimeout(3000);
  return { understandSecs: Math.round((Date.now() - t0) / 1000), partial, rail: (await rail()).slice(0, 2) };
});

// ---- Brand ----
await step('brand', async () => {
  await stage(/Brand/);
  await main(/Extract Business DNA/).click();
  const w1 = await waitIdle('dna', 420000);
  await main(/Draft the angles/).waitFor({ state: 'visible', timeout: 15000 });
  await main(/Draft the angles/).click();
  const w2 = await waitIdle('angles', 420000);
  const angles = await page.locator('#lk-root main button', { hasText: /Choose this angle/ }).count();
  if (angles > 0) { await main(/Choose this angle/).click(); await page.waitForTimeout(2500); }
  const t = await text();
  await shot('2-brand.png');
  return { dnaSecs: w1.secs, anglesSecs: w2.secs, angles, chosen: /Chosen, click to drop/.test(t), dnaEmpty: /All DNA fields are empty|No tone words were observed/.test(t), failed: await failedLine() };
});

// ---- Commercial ----
await step('commercial', async () => {
  await stage(/Commercial/);
  await main(/Draft pricing and listing/).click();
  const w = await waitIdle('pricing+listing', 1200000);
  const t = await text();
  const plans = await page.locator('#lk-root main [role="radio"], #lk-root main button', { hasText: /^Select$/ }).count();
  const use = await main(/Use this pricing/).count();
  if (use) { await main(/Use this pricing/).click(); await page.waitForTimeout(2500); }
  const approve = await main(/Approve listing/).count();
  if (approve) { await main(/Approve listing/).click(); await page.waitForTimeout(2500); }
  const t2 = await text();
  await shot('3-commercial.png');
  return { secs: w.secs, idle: w.idle, plans, established: (t.match(/(\d+) competitors read, (\d+) established/) || ['', '?', '?']).slice(1), chosen: /Chosen: /.test(t2), listingApproved: /Approved\./.test(t2), failed: await failedLine() };
});

// ---- Social Launch ----
await step('social', async () => {
  await stage(/Social Launch/);
  const platforms = ['X', 'LinkedIn', 'Reddit', 'Product Hunt', 'Hacker News', 'Newsletter'];
  const per = {};
  for (const p of platforms) {
    const btn = page.locator('#lk-root main button', { hasText: new RegExp(`^Draft for ${p}$`) }).first();
    if (!(await btn.count())) { per[p] = { drafted: false, reason: 'no button' }; continue; }
    const t0 = Date.now();
    await btn.click();
    const w = await waitIdle(p, 300000);
    const t = await text();
    per[p] = { drafted: true, secs: Math.round((Date.now() - t0) / 1000), idle: w.idle, failed: (t.match(new RegExp(`Social Launch, ${p}[^.]*failed[^.]*\\.`)) || [''])[0].slice(0, 160) };
  }
  // approve every draft that exists
  let approved = 0;
  for (let i = 0; i < 8; i++) {
    const btn = page.locator('#lk-root main button[aria-label^="Approve the "]').first();
    if (!(await btn.count())) break;
    await btn.click();
    await page.waitForTimeout(1800);
    approved += 1;
  }
  const t = await text();
  await shot('4-social.png');
  return { per, approved, counts: (t.match(/\d+ approved, \d+ needs? review/) || [''])[0], warnings: (t.match(/\d+ warnings? from the draft check/g) || []).length };
});

// ---- Assets ----
await step('assets', async () => {
  await stage(/Assets/);
  const out = {};
  const run = async (label, key, maxMs) => {
    const btn = main(label);
    if (!(await btn.count())) { out[key] = { skipped: 'no button' }; return; }
    const t0 = Date.now();
    await btn.click();
    const w = await waitIdle(key, maxMs);
    out[key] = { secs: Math.round((Date.now() - t0) / 1000), idle: w.idle, failed: await failedLine() };
  };
  await run(/Read the site$/, 'probe', 300000);
  await run(/Make the images$/, 'images', 600000);
  await run(/Make the cards$/, 'cards', 300000);
  await run(/Write the script$/, 'script', 600000);
  await run(/Write the voice-over$/, 'voice', 1200000);
  await run(/Render the reel$/, 'reel', 900000);
  if (await main(/Approve reel/).count()) { await main(/Approve reel/).click(); await page.waitForTimeout(2500); out.approved = true; }
  const t = await text();
  const media = await page.evaluate(() => ({
    figures: [...document.querySelectorAll('#lk-root main figure img')].filter((i) => i.naturalWidth > 0).length,
    video: Boolean(document.querySelector('#lk-root main video')),
    audio: Boolean(document.querySelector('#lk-root main audio')),
  }));
  await shot('5-assets.png');
  return { ...out, ...media, world: (t.match(/The world these pictures live in:[^.]{0,200}/) || [''])[0].slice(0, 200), fits: (t.match(/fits its window/g) || []).length, over: (t.match(/still over its window/gi) || []).length };
});

// ---- Targets ----
await step('targets', async () => {
  await stage(/Targets/);
  await main(/Rank venues/).click();
  const w = await waitIdle('targets', 600000);
  const rows = await page.evaluate(() => [...document.querySelectorAll('#lk-root table tbody tr')].map((tr) => [...tr.querySelectorAll('td')].map((x) => x.textContent.trim()).slice(0, 4)));
  const boxes = page.locator('#lk-root table tbody input[type="checkbox"]');
  const n = Math.min(3, await boxes.count());
  for (let i = 0; i < n; i++) await boxes.nth(i).check().catch(() => null);
  await page.waitForTimeout(1500);
  await shot('6-targets.png');
  return { secs: w.secs, ranked: rows.length, top5: rows.slice(0, 5).map((r) => r.find((c, i) => i > 0 && c && !/^\d+$/.test(c)) || r[0]).map((s) => String(s).slice(0, 40)), selected: n, failed: await failedLine() };
});

// ---- Signals ----
await step('signals', async () => {
  await stage(/Signals/);
  const btn = main(/Search for demand/);
  if (!(await btn.count())) throw new Error('no Search for demand button');
  await btn.click();
  const w = await waitIdle('signals', 900000);
  const t = await text();
  await shot('7-signals.png');
  return { secs: w.secs, idle: w.idle, heading: (t.match(/\d+ signals?[^.]{0,80}/) || [''])[0].slice(0, 100), none: /No signals yet/.test(t), failed: await failedLine() };
});

// ---- Plan ----
await step('plan', async () => {
  await stage(/Plan/);
  await page.waitForTimeout(2000);
  const t = await text();
  await shot('8-plan.png');
  return { ready: /Plan ready/.test(t), notReady: /Plan not ready/.test(t), decisions: /What this launch says/.test(t), angle: (t.match(/Angle([^P]{0,60})/) || ['', ''])[1].trim().slice(0, 60), pricing: (t.match(/Pricing([^L]{0,80})/) || ['', ''])[1].trim().slice(0, 80) };
});

// ---- dump ----
try {
  const raw = await page.evaluate(() => localStorage.getItem('lk-preview-appstate') || '');
  writeFileSync(path.join(OUTDIR, 'appstate.json'), raw);
  summary.appstate_bytes = raw.length;
} catch (e) { summary.errors.push('dump: ' + String(e).slice(0, 120)); }
summary.finished = new Date().toISOString();
summary.page_errors = errs.slice(0, 10);
writeFileSync(path.join(OUTDIR, 'summary.json'), JSON.stringify(summary, null, 2));
log('SUMMARY', { ok: Object.entries(summary.stages).filter(([, s]) => s.ok).map(([k]) => k), failed: Object.entries(summary.stages).filter(([, s]) => s.ok === false).map(([k]) => k), errors: summary.errors.length });
await b.close();
console.log(summary.errors.length === 0 ? 'FULL_DONE' : 'FULL_PARTIAL');
