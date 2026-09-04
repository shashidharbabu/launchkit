import { chromium } from 'playwright';
import { writeFileSync } from 'node:fs';
const OUT='/Users/shashidharbabu/rocketride-apps-gtm/docs/visual-baseline';
const log=(...a)=>console.log(new Date().toISOString().slice(11,19),...a);
const b=await chromium.launch(); const page=await b.newPage({viewport:{width:2000,height:1260}});
const errs=[]; page.on('pageerror',e=>errs.push(String(e).slice(0,140)));
const appState=()=>page.evaluate(()=>{try{return JSON.parse(localStorage.getItem('lk-preview-appstate')||'{}').launchkit||{};}catch{return {};}});
const latestRun=async()=>{const a=await appState();const r=(a.runs||[]).slice().sort((x,y)=>String(y.created_at).localeCompare(String(x.created_at)))[0];return r?{id:r.id,kind:r.kind,status:r.status,error:(r.error||'').slice(0,120)}:null;};
const waitRun=async(label,before,maxSec=300)=>{let r=null,started=false;for(let i=0;i<maxSec;i++){await page.waitForTimeout(1000);r=await latestRun();if(r&&r.id!==before){started=true;if(r.status==='done'||r.status==='error')break;}else if(!started&&i>=25)break;}log('RUN',JSON.stringify({step:label,started,run:started?r:null}));return r;};
const inventory=async(stage,tag)=>{const inv=await page.evaluate(()=>{const seen=new Set();const out=[];for(const el of document.querySelectorAll('#lk-root button, #lk-root [role="button"], #lk-root a[href], #lk-root input[type="checkbox"], #lk-root select')){if(el.closest('aside')||el.closest('[data-stub="chatview"]'))continue;const t=(el.getAttribute('aria-label')||el.innerText||el.textContent||'').trim().replace(/\s+/g,' ').slice(0,50);const k=el.tagName.toLowerCase()+':'+t;if(!t||seen.has(k))continue;seen.add(k);out.push((el.disabled?'[off] ':'')+el.tagName.toLowerCase()+(el.getAttribute('type')?'/'+el.getAttribute('type'):'')+' "'+t+'"');}return out.slice(0,40);});log('INV',stage,tag,JSON.stringify(inv));};
const goStage=async(rx,slug)=>{try{await page.getByText(rx).first().click({timeout:8000});await page.waitForTimeout(1500);log('open',slug);return true;}catch{log('open',slug,'FAILED');return false;}};
const clickKnown=async(stage,label)=>{const b0=(await latestRun())?.id;try{await page.getByRole('button',{name:label}).first().click({timeout:8000});}catch{log(stage,'known button not found:',label);return;}await waitRun(`${stage}:${label}`,b0);};
try{
  await page.goto('http://localhost:3400',{waitUntil:'networkidle'});
  await page.evaluate(()=>{localStorage.removeItem('lk-preview-appstate');localStorage.removeItem('lk-nav');});
  await page.reload({waitUntil:'networkidle'}); await page.waitForTimeout(4000);
  await page.click('#lk-root aside nav a:has-text("Dashboard")'); await page.waitForTimeout(800);
  await page.getByRole('button',{name:/new launch/i}).first().click(); await page.waitForTimeout(1500);
  const inputs=page.locator('#lk-root input:not([aria-label="chat-input"])'); await inputs.nth(0).fill('Excalidraw'); await inputs.nth(1).fill('excalidraw.com'); await inputs.nth(2).fill('github.com/excalidraw/excalidraw');
  const b0=(await latestRun())?.id; await page.click('button:has-text("Analyze my app")'); await waitRun('understand',b0,360);
  await inventory('profile','after-run'); await page.getByRole('button',{name:/approve/i}).first().click({timeout:25000}); await page.waitForTimeout(1500); log('approved profile');
  if(await goStage(/02\s*BRAND/i,'brand')){await inventory('brand','before');await clickKnown('brand','Extract Business DNA');await page.waitForTimeout(2000);await inventory('brand','after-dna');await page.screenshot({path:`${OUT}/inv-brand.png`});}
  if(await goStage(/03\s*COMMERCIAL/i,'commercial')){await inventory('commercial','before');await clickKnown('commercial','Draft pricing & listing');await page.waitForTimeout(2000);await inventory('commercial','after-pricing');log('RUNS_SO_FAR',JSON.stringify(((await appState()).runs||[]).map(r=>r.kind+':'+r.status)));await page.screenshot({path:`${OUT}/inv-commercial.png`});}
  if(await goStage(/04\s*ASSETS/i,'assets')){await inventory('assets','before');await page.screenshot({path:`${OUT}/inv-assets.png`});}
  if(await goStage(/05\s*TARGETS/i,'targets')){await inventory('targets','before');await clickKnown('targets','Find launch venues');await page.waitForTimeout(2000);await inventory('targets','after-run');await page.screenshot({path:`${OUT}/inv-targets.png`});}
  if(await goStage(/06\s*SIGNALS/i,'signals')){await inventory('signals','before');await page.screenshot({path:`${OUT}/inv-signals.png`});}
  if(await goStage(/07\s*PLAN/i,'plan')){await inventory('plan','before');await page.screenshot({path:`${OUT}/inv-plan.png`});}
  const raw=await page.evaluate(()=>localStorage.getItem('lk-preview-appstate')||'{}'); writeFileSync(`${OUT}/1b-appstate.json`,raw); log('APPSTATE saved',raw.length,'bytes; runs:',JSON.stringify(((await appState()).runs||[]).map(r=>r.kind+':'+r.status)));
}catch(e){log('DRIVE ERROR',String(e).slice(0,200));}
log('pageerrors',errs.length,errs[0]||''); log('1B_INV_DONE'); await b.close(); process.exit(0);
