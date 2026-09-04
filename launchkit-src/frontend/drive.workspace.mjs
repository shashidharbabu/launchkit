// Team workspaces on the preview (API key): directory works, store check must fail cleanly, team switch falls back.
import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';
const OUT='/Users/shashidharbabu/rocketride-apps-gtm/docs/visual-baseline';
const b=await chromium.launch(); const page=await b.newPage({viewport:{width:2000,height:1260}});
const errs=[]; page.on('pageerror',e=>errs.push(String(e).slice(0,160)));
const text=async()=>page.evaluate(()=>document.querySelector('#lk-root')?.textContent||'');
await page.goto('http://localhost:3400',{waitUntil:'networkidle'});
await page.evaluate((raw)=>{localStorage.setItem('lk-preview-appstate',raw);localStorage.removeItem('lk-nav');},readFileSync(`${OUT}/1b-appstate-p5.json`,'utf8'));
await page.reload({waitUntil:'networkidle'}); await page.waitForTimeout(5000);
const sw=page.locator('#lk-root select[aria-label="Workspace"]');
const r={switcher:await sw.count()>0, options:await sw.locator('option').allTextContents().catch(()=>[])};
await page.locator('#lk-root nav a',{hasText:'Settings'}).first().click(); await page.waitForTimeout(2500);
let t=await text();
r.card=/Workspace/.test(t)&&/Open workspace/.test(t); r.org=(t.match(/Workspace([^·]{0,80})·/)||[])[1]?.trim(); r.teams=/No teams in this organisation yet/.test(t)?'none':'listed'; r.dirError=(t.match(/Workspace directory unavailable[^.]{0,160}/)||[''])[0];
const t0=Date.now(); await page.locator('#lk-root button',{hasText:'Check store'}).first().click(); 
await page.waitForFunction(()=>/ok · |failed after/.test(document.querySelector('#lk-root')?.textContent||''),{timeout:150000}).catch(()=>null); r.storeSecs=Math.round((Date.now()-t0)/1000);
t=await text(); r.store=(t.match(/(ok · [^K]{0,60}ms|failed after [^\n]{0,220})/)||[''])[0].slice(0,240);
await page.screenshot({path:`${OUT}/v17-settings-workspace.png`});
// try a team switch if any team exists
const teamOpt=(r.options||[]).filter(o=>o!=='Personal');
if(teamOpt.length){ const t1=Date.now(); await sw.selectOption({label:teamOpt[0]}); await page.waitForFunction(()=>{const s=document.querySelector('#lk-root select[aria-label="Workspace"]'); return s && !s.disabled;},{timeout:120000}).catch(()=>null); await page.waitForTimeout(1500); t=await text(); r.switchSecs=Math.round((Date.now()-t1)/1000);
  r.switch={tried:teamOpt[0], active:await sw.inputValue(), error:(t.match(/Couldn't open [^.]{0,200}/)||[''])[0].slice(0,220)}; }
await page.locator('#lk-root nav a',{hasText:'Launches'}).first().click(); await page.waitForTimeout(2000); t=await text(); r.launchesOk=/Excalidraw/.test(t);
await page.screenshot({path:`${OUT}/v17-topbar-switcher.png`});
console.log('WS',JSON.stringify(r)); console.log('errs',errs.slice(0,3)); await b.close();
const ok=r.switcher&&r.card&&r.launchesOk&&errs.length===0; console.log(ok?'WS_OK':'WS_FAIL'); process.exit(ok?0:1);
