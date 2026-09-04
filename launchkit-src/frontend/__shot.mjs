import { chromium } from 'playwright';
const OUT = '/private/tmp/claude-501/-Users-shashidharbabu-rocketride-apps-gtm/ea7c31cc-8914-470b-b3d7-bdf99b6d84ce/scratchpad';
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1280, height: 1400 } });
const errs = [];
p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
p.on('pageerror', e => errs.push('PAGEERROR: ' + e.message));

await p.goto('http://localhost:3200/p/dc35c8c21299/profile', { waitUntil: 'networkidle' });
await p.waitForTimeout(2500);
await p.screenshot({ path: `${OUT}/profile-draft.png`, fullPage: true });
console.log('H1/labels visible:', await p.locator('text=/What your app is/').count());
console.log('step markers:', await p.locator('text=/\\d\\/4/').allTextContents());
console.log('sections:', await p.locator('button[aria-expanded]').allTextContents());
console.log('primary cta:', await p.locator('button:has-text("approve")').allTextContents());
// expand "More detail"
await p.locator('button[aria-expanded]').first().click();
await p.waitForTimeout(600);
await p.screenshot({ path: `${OUT}/profile-expanded.png`, fullPage: true });
// try an inline edit
await p.locator('button[aria-label="Edit What your app is"]').click();
await p.waitForTimeout(400);
console.log('textarea after Edit:', await p.locator('textarea').count());
await p.screenshot({ path: `${OUT}/profile-editing.png`, fullPage: true });

// landing logo click
await p.goto('http://localhost:3200/dashboard', { waitUntil: 'networkidle' });
await p.goto('http://localhost:3200/', { waitUntil: 'networkidle' });
await p.locator('a[aria-label="Launch Kit home"]').click();
await p.waitForTimeout(800);
console.log('landing logo href ->', p.url());
console.log('ERRORS:', errs.length ? errs.slice(0,6) : 'none');
await b.close();
