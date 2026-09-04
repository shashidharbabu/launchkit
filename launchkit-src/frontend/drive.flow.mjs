// Full flow on the preview with a real site: create → understand → approve (auto-advance) →
// next-step footers → rank venues (gate) → scan signals (query strategy) → plan readiness.
// Checkpoints: docs/visual-baseline/flow-appstate-{approved,targets,final}.json.
// Resume: RESUME=<checkpoint.json> [RESUME_STAGE=targets|signals] node drive.flow.mjs
import { chromium } from 'playwright';
import { writeFileSync, readFileSync, existsSync } from 'node:fs';
const OUT='/Users/shashidharbabu/rocketride-apps-gtm/docs/visual-baseline';
const SITE='https://hackathon-judge-aid.onrender.com';
const RESUME=process.env.RESUME||''; const RESUME_STAGE=(process.env.RESUME_STAGE||'targets').toLowerCase();
const b=await chromium.launch(); const page=await b.newPage({viewport:{width:2000,height:1260}});
const errs=[]; page.on('pageerror',e=>errs.push(String(e).slice(0,160)));
const text=async()=>page.evaluate(()=>document.querySelector('#lk-root')?.textContent||'');
const disabled=async()=>page.evaluate(()=>[...document.querySelectorAll('#lk-root button')].filter(b=>b.disabled).length);
const log=(k,v)=>console.log(k,JSON.stringify(v));
const dump=async(name)=>{ try{ const raw=await page.evaluate(()=>localStorage.getItem('lk-preview-appstate')||''); if(raw) writeFileSync(`${OUT}/flow-appstate-${name}.json`, raw); console.log('CHECKPOINT',name,raw.length);}catch(e){console.log('WARN checkpoint',name,String(e).slice(0,80));} };
async function waitIdle(label,maxMs){ const t0=Date.now(); await page.waitForTimeout(6000);
  while(Date.now()-t0<maxMs){ const d=await disabled(); if(d===0){ console.log('IDLE',label,Math.round((Date.now()-t0)/1000)+'s'); return true; } await page.waitForTimeout(8000); }
  console.log('TIMEOUT',label); return false; }
let t='';
await page.goto('http://localhost:3400',{waitUntil:'networkidle'});
if(RESUME && existsSync(RESUME)){ await page.evaluate((raw)=>{localStorage.setItem('lk-preview-appstate',raw);localStorage.removeItem('lk-nav');}, readFileSync(RESUME,'utf8')); console.log('RESUMED from',RESUME,'into',RESUME_STAGE); }
else await page.evaluate(()=>{localStorage.removeItem('lk-preview-appstate');localStorage.removeItem('lk-nav');});
await page.reload({waitUntil:'networkidle'}); await page.waitForTimeout(4000);
if(RESUME){ await page.locator('#lk-root nav a',{hasText:'Launches'}).first().click(); await page.waitForTimeout(1500); await page.getByText('hack-judge').first().click(); await page.waitForTimeout(2000);
  await page.locator('#lk-root nav[aria-label="Stages"] a',{hasText:RESUME_STAGE==='signals'?/Signals/:/Targets/}).first().click(); await page.waitForTimeout(2000); }
else {
  await page.locator('#lk-root nav a',{hasText:'Launches'}).first().click(); await page.waitForTimeout(1500);
  await page.locator('#lk-root a, #lk-root button',{hasText:/New launch/i}).first().click(); await page.waitForTimeout(1500);
  const inputs=page.locator('#lk-root input'); log('FORM',{inputs:await inputs.count()});
  await inputs.nth(0).fill('hack-judge'); await inputs.nth(1).fill(SITE);
  await page.locator('#lk-root button[type="submit"], #lk-root button',{hasText:/Create|Start|Launch/i}).first().click(); await page.waitForTimeout(3000);
  log('CREATED',{head:(await text()).slice(0,80)});
  const approveBtn=page.locator('#lk-root button',{hasText:'This is right: approve'});
  const t0=Date.now(); await approveBtn.first().waitFor({state:'visible',timeout:360000}).catch(()=>console.log('WARN approve button not visible'));
  await page.waitForFunction(()=>{const b=[...document.querySelectorAll('#lk-root button')].find(x=>/This is right: approve/.test(x.textContent));return b&&!b.disabled;},{timeout:120000}).catch(()=>console.log('WARN approve disabled'));
  log('UNDERSTAND',{secs:Math.round((Date.now()-t0)/1000), partial:/Partial analysis/.test(await text())});
  await page.screenshot({path:`${OUT}/flow-1-profile.png`});
  await approveBtn.first().click(); await page.waitForTimeout(3500);
  t=await text(); const rail=await page.evaluate(()=>[...document.querySelectorAll('#lk-root nav[aria-label="Stages"] a')].map(a=>({t:a.textContent.trim().replace(/\s+/g,' ').slice(0,18),cur:a.getAttribute('aria-current')})));
  log('APPROVE',{autoAdvancedToBrand:/Business DNA|extracts the brand|Brand DNA/i.test(t), currentRail:rail.filter(r=>r.cur).map(r=>r.t), footer:(t.match(/Next: [A-Za-z ]+/)||[''])[0]});
  const walk=[];
  for(const expect of ['Next: Commercial','Next: Social Launch','Next: Targets']){ const btn=page.locator('#lk-root button',{hasText:expect}).first(); const seen=await btn.count()>0; walk.push({expect,seen}); if(seen){ await btn.click(); await page.waitForTimeout(1500);} }
  log('FOOTERS',walk); await page.screenshot({path:`${OUT}/flow-2-social-launch.png`}); await dump('approved');
}
if(RESUME_STAGE!=='signals'){
  t=await text(); let rankBtn=page.locator('#lk-root main button',{hasText:/Find launch venues|Re-rank venues/}).first();
  log('TARGETS_EMPTY',{rankLabel:(await rankBtn.textContent().catch(()=>''))?.trim().slice(0,40), footer:(t.match(/Next: [A-Za-z ]+/)||[''])[0]});
  const tr0=Date.now(); await rankBtn.click(); await waitIdle('targets',480000);
  const rows=await page.evaluate(()=>[...document.querySelectorAll('#lk-root table tbody tr')].map(tr=>{const c=[...tr.querySelectorAll('td')].map(x=>x.textContent.trim());const a=tr.querySelector('a[href^="http"]');return {cells:c.slice(0,6),href:a?a.getAttribute('href'):''};}));
  const kinds=rows.map(r=>r.cells.find(c=>/subreddit|launch_platform|directory|community|newsletter|awesome_list|forum/.test(c))||'?');
  log('TARGETS',{secs:Math.round((Date.now()-tr0)/1000), n:rows.length, top5kinds:kinds.slice(0,5), listingsInTop5:kinds.slice(0,5).filter(k=>/awesome|directory/.test(k)).length, repoFiles:rows.filter(r=>/github\.com\/[^/]+\/[^/]+\/(blob|tree)\//.test(r.href)).length, names:rows.slice(0,8).map(r=>r.cells.filter(c=>c&&!/^\d+$/.test(c))[0])});
  await page.screenshot({path:`${OUT}/flow-3-targets.png`}); await dump('targets');
  const cb=page.locator('#lk-root table tbody input[type="checkbox"]').first(); if(await cb.count()) await cb.check().catch(()=>null); await page.waitForTimeout(1200);
  t=await text(); log('TARGETS_FOOTER',{footer:(t.match(/Next: [A-Za-z ]+/)||[''])[0], selectedLine:(t.match(/\d+ selected of \d+ ranked/)||[''])[0]});
  await page.locator('#lk-root button',{hasText:'Next: Signals'}).first().click().catch(()=>null); await page.waitForTimeout(1500);
}
const scanBtn=page.locator('#lk-root main button',{hasText:'Scan for live demand'}).first();
log('SIGNALS_EMPTY',{scanButton:await scanBtn.count()>0});
const ts0=Date.now(); await scanBtn.click(); await waitIdle('signals',840000);
t=await text();
log('SIGNALS',{secs:Math.round((Date.now()-ts0)/1000), none:/No signals yet/.test(t), heading:(t.match(/\d+ signals?[^.]{0,60}/)||[''])[0], rejected:(t.match(/Rejected by relevance check \d+/)||[''])[0], report:(t.match(/Searched[^]{0,900}/)||[''])[0].replace(/\s+/g,' ').slice(0,900)});
await page.screenshot({path:`${OUT}/flow-4-signals.png`});
await page.locator('#lk-root button',{hasText:'Next: Plan'}).first().click().catch(()=>null); await page.waitForTimeout(1500);
t=await text(); log('PLAN',{ready:/plan ready/.test(t), notReady:/Plan not ready/.test(t), reason:(t.match(/Plan not ready\.[^]{0,160}/)||[''])[0].replace(/\s+/g,' ').slice(0,200)});
await page.screenshot({path:`${OUT}/flow-5-plan.png`}); await dump('final');
console.log('errs',JSON.stringify(errs.slice(0,3))); await b.close(); console.log('FLOW_DONE');
