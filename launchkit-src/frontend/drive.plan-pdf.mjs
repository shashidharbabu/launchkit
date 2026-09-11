// The plan document on the preview (:3400): seed the brand launch the way
// drive.brand.mjs does, open the Plan stage, flip the subscription placeholder
// to Pro on Settings, build the PDF through the dialog, save it and report its
// size and page count.
//   node drive.plan-pdf.mjs            # brand seed: plan not ready; Pro on Settings, then "Build the document anyway"
//   FULL=1 node drive.plan-pdf.mjs     # composed seed (an approved post, three venues, studio rows): plan ready; "Subscribe to download (demo)"
//   OUT=/path/to/file.pdf              # where the PDF lands (default /tmp/launch-plan.pdf)
import { chromium } from 'playwright';
import { execFileSync } from 'node:child_process';
import { readFileSync, statSync } from 'node:fs';

const DEV = '/Users/shashidharbabu/rocketride-apps-gtm/apps/launchkit/public/dev';
const LK_SEED = '/Users/shashidharbabu/rocketride-apps-gtm/apps/launchkit/public/lk-seed.json';
const OUT = process.env.OUT || '/tmp/launch-plan.pdf';
const FULL = Boolean(process.env.FULL);
const log = (k, v) => console.log(k, JSON.stringify(v));

/** The brand seed as is, or with an approved post, selected venues and studio rows borrowed from the sibling seeds. */
function seedJson() {
  const brand = JSON.parse(readFileSync(`${DEV}/flow-appstate-brand.json`, 'utf8'));
  if (!FULL) return JSON.stringify(brand);
  const lk = brand.launchkit;
  const pid = lk.projects[0].id;
  const fin = JSON.parse(readFileSync(`${DEV}/flow-appstate-final.json`, 'utf8')).launchkit;
  const stu = JSON.parse(readFileSync(`${DEV}/flow-appstate-studio.json`, 'utf8')).launchkit;
  const seedRaw = JSON.parse(readFileSync(LK_SEED, 'utf8'));
  const seed = seedRaw.launchkit ?? seedRaw;
  lk.assets = (seed.assets ?? []).map((a, i) => ({ ...a, id: `pdfasset${i}`, project_id: pid, status: 'approved' }));
  lk.targets = (fin.targets ?? []).map((t, i) => ({ ...t, project_id: pid, selected: i < 3 }));
  lk.commercial_results = [
    ...lk.commercial_results,
    ...(fin.commercial_results ?? []).filter((r) => r.kind === 'targets_meta').map((r) => ({ ...r, project_id: pid })),
  ];
  lk.studio = (stu.studio ?? []).map((r) => ({ ...r, project_id: pid }));
  return JSON.stringify(brand);
}

const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1600, height: 1100 }, acceptDownloads: true });
const page = await ctx.newPage();
const errs = [];
page.on('pageerror', (e) => errs.push(String(e).slice(0, 200)));
page.on('console', (m) => { if (m.type() === 'error') errs.push('console: ' + m.text().slice(0, 200)); });
const text = async () => page.evaluate(() => document.querySelector('#lk-root')?.textContent || '');
const nav = async (label) => {
  await page.locator('#lk-root nav[aria-label="Main"] a', { hasText: label }).first().click();
  await page.waitForTimeout(1200);
};
const stage = async (name) => {
  await page.locator('#lk-root nav[aria-label="Stages"] a:visible', { hasText: name }).first().click();
  await page.waitForTimeout(1200);
};
const openPlan = async () => {
  await nav('Launches');
  await page.locator('#lk-root table tbody a').first().click();
  await page.waitForTimeout(1500);
  await stage(/Plan/);
};
const downloadButton = () => page.locator('#lk-root main button', { hasText: /Download the plan/ }).first();
const tierGroup = () => page.locator('#lk-root [role="radiogroup"][aria-label="Subscription tier"]');
const checkedTier = async () => (await tierGroup().locator('[aria-checked="true"]').textContent().catch(() => '')) || '';

// the stub connects to staging before the app renders; that can take most of a minute
const waitForApp = async () => {
  const t0 = Date.now();
  await page.locator('#lk-root nav[aria-label="Main"] a').first().waitFor({ state: 'attached', timeout: 150000 });
  await page.waitForTimeout(800);
  return Math.round((Date.now() - t0) / 1000);
};

await page.goto('http://localhost:3400', { waitUntil: 'networkidle' });
await page.evaluate((raw) => { localStorage.setItem('lk-preview-appstate', raw); localStorage.removeItem('lk-nav'); }, seedJson());
await page.reload({ waitUntil: 'networkidle' });
log('CONNECTED', { secs: await waitForApp(), full: FULL });

// ---- the Plan stage before anything is subscribed ----
await openPlan();
let t = await text();
log('PLAN_BEFORE', {
  ready: /Plan ready/.test(t),
  button: await downloadButton().count(),
  disabled: await downloadButton().isDisabled(),
  helper: /Approve a post and choose venues first/.test(t),
  copyPlan: await page.locator('#lk-root main button', { hasText: /Copy launch plan/ }).count(),
});

if (!FULL) {
  // ---- Settings: the placeholder starts on Free; flip it to Pro ----
  await nav('Settings');
  const before = await checkedTier();
  await tierGroup().locator('button', { hasText: /^Pro$/ }).click();
  await page.waitForTimeout(600);
  t = await text();
  log('SETTINGS', { before, after: await checkedTier(), card: /Subscription/.test(t), note: /Billing is not wired yet/.test(t) });
  await openPlan();
  log('PLAN_PRO', { disabled: await downloadButton().isDisabled(), helper: /Approve a post and choose venues first/.test(await text()) });
}

// ---- the dialog, then the download ----
await downloadButton().click();
await page.waitForTimeout(700);
const dialog = page.locator('[role="dialog"]');
const dialogText = (await dialog.textContent().catch(() => '')) || '';
log('DIALOG', {
  open: await dialog.count(),
  title: /The plan as a document/.test(dialogText),
  sections: (dialogText.match(/The app|Voice and angle|Pricing and listing|Posts by platform|Where to launch|Launch assets/g) || []).length,
  notReady: /Plan not ready/.test(dialogText),
  billingNote: /Billing is not wired yet/.test(dialogText),
  confirm: (dialogText.match(/Build the document anyway|Subscribe to download \(demo\)/) || [''])[0],
});
const confirm = dialog.locator('button', { hasText: FULL ? /Subscribe to download/ : /Build the document anyway/ });
const dlPromise = page.waitForEvent('download', { timeout: 180000 });
const t0 = Date.now();
await confirm.click();
await page.waitForTimeout(200);
const busy = (await page.locator('#lk-root main button[aria-busy="true"]').textContent().catch(() => '')) || '';
const download = await dlPromise;
await download.saveAs(OUT);
await page.waitForTimeout(800);
const toast = (await page.locator('[data-sonner-toast]').allTextContents().catch(() => [])).join(' | ');

let pages = null;
try {
  pages = Number(execFileSync('python3', ['-c', 'import pypdf,sys; print(len(pypdf.PdfReader(sys.argv[1]).pages))', OUT]).toString().trim());
} catch {
  pages = (readFileSync(OUT).toString('latin1').match(/\/Type\s*\/Page(?!s)/g) || []).length;
}
log('PDF', {
  file: OUT,
  name: download.suggestedFilename(),
  bytes: statSync(OUT).size,
  pages,
  secs: Math.round((Date.now() - t0) / 1000),
  busyLabel: busy.trim().slice(0, 60),
  toast: toast.slice(0, 80),
  buttonAfter: await downloadButton().isDisabled(),
});

if (FULL) {
  await nav('Settings');
  log('SETTINGS_AFTER', { tier: await checkedTier() });
}

log('ERRORS', errs.slice(0, 8));
console.log(errs.length === 0 && pages > 0 ? 'PLAN_PDF_OK' : 'PLAN_PDF_BAD');
await b.close();
