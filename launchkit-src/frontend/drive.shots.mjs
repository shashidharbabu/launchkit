// Screenshots of every view in both themes on the preview, from the seeded hack-judge state.
import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';
const OUT='/Users/shashidharbabu/rocketride-apps-gtm/docs/visual-baseline';
const SEED=process.env.SEED||`${OUT}/flow-appstate-final.json`;
const TAG=process.env.TAG||'ds';
const b=await chromium.launch(); const page=await b.newPage({viewport:{width:1600,height:1000}});
const errs=[]; page.on('pageerror',e=>errs.push(String(e).slice(0,140)));
await page.goto('http://localhost:3400',{waitUntil:'networkidle'});
await page.evaluate((raw)=>{localStorage.setItem('lk-preview-appstate',raw);localStorage.removeItem('lk-nav');},readFileSync(SEED,'utf8'));
await page.reload({waitUntil:'networkidle'}); await page.waitForTimeout(3500);
const nav=async(label)=>{ await page.locator('#lk-root nav a',{hasText:label}).first().click(); await page.waitForTimeout(1200); };
const stage=async(re)=>{ await page.locator('#lk-root nav[aria-label="Stages"] a',{hasText:re}).first().click(); await page.waitForTimeout(1200); };
const shot=async(name)=>{ await page.screenshot({path:`${OUT}/${TAG}-${name}.png`}); };
for (const theme of ['light','dark']) {
  if (theme==='dark') { await page.locator('#lk-root button[aria-label="Switch to dark theme"]').first().click(); await page.waitForTimeout(600); }
  await nav('Home'); await shot(`home-${theme}`);
  await nav('Dashboard'); await shot(`dashboard-${theme}`);
  await nav('Launches'); await shot(`launches-${theme}`);
  await page.getByText('hack-judge').first().click(); await page.waitForTimeout(1500);
  await stage(/Profile/); await shot(`ws-profile-${theme}`);
  await stage(/Brand/); await shot(`ws-brand-${theme}`);
  await stage(/Social Launch/); await shot(`ws-assets-${theme}`);
  await stage(/Targets/); await shot(`ws-targets-${theme}`);
  await stage(/Signals/); await shot(`ws-signals-${theme}`);
  await stage(/Plan/); await shot(`ws-plan-${theme}`);
  await nav('Runs'); await shot(`runs-${theme}`);
  await nav('Settings'); await shot(`settings-${theme}`);
  await nav('Launches'); await page.locator('#lk-root a, #lk-root button',{hasText:/New launch/i}).first().click(); await page.waitForTimeout(1200); await shot(`new-launch-${theme}`);
}
console.log('errs',JSON.stringify(errs.slice(0,4))); await b.close(); console.log('SHOTS_DONE');
