import { chromium } from 'playwright';
import { readFileSync, writeFileSync } from 'node:fs';
const OUT='/Users/shashidharbabu/rocketride-apps-gtm/docs/visual-baseline';
const log=(...a)=>console.log(new Date().toISOString().slice(11,19),...a);
const b=await chromium.launch(); const ctx=await b.newContext({viewport:{width:2000,height:1260},permissions:['clipboard-read','clipboard-write']}); const page=await ctx.newPage();
const errs=[]; page.on('pageerror',e=>errs.push(String(e).slice(0,140)));
const appState=()=>page.evaluate(()=>{try{return JSON.parse(localStorage.getItem('lk-preview-appstate')||'{}').launchkit||{};}catch{return {};}});
const runs=async()=>((await appState()).runs||[]).slice().sort((x,y)=>String(y.created_at).localeCompare(String(x.created_at)));
const latestRun=async()=>{const r=(await runs())[0];if(!r)return null;const t=((await appState()).traces||[]).find(t=>t.run_id===r.id);return {id:r.id,kind:r.kind,status:r.status,error:(r.error||'').slice(0,120),steps:t?(t.entries||[]).length:null,tok:t?t.ok:null};};
const waitRun=async(label,before,maxSec=300)=>{let r=null,started=false;for(let i=0;i<maxSec;i++){await page.waitForTimeout(1000);r=await latestRun();if(r&&r.id!==before){started=true;if(r.status==='done'||r.status==='error')break;}else if(!started&&i>=25)break;}log('RUN',JSON.stringify({step:label,started,run:started?r:null}));return r;};
const waitIdle=async(maxSec=400)=>{for(let i=0;i<maxSec;i++){const rs=await runs();if(!rs.some(r=>r.status==='running'||r.status==='queued')){log('IDLE after',i,'s');return true;}await page.waitForTimeout(1000);}log('IDLE timeout');return false;};
const inventory=async(stage,tag)=>{const inv=await page.evaluate(()=>{const seen=new Set();const out=[];for(const el of document.querySelectorAll('#lk-root button, #lk-root [role="button"], #lk-root input[type="checkbox"], #lk-root [aria-pressed]')){if(el.closest('aside')||el.closest('[data-stub="chatview"]'))continue;const t=(el.getAttribute('aria-label')||el.innerText||el.textContent||'').trim().replace(/\s+/g,' ').slice(0,50);const k=el.tagName.toLowerCase()+':'+t;if(!t||seen.has(k))continue;seen.add(k);out.push((el.disabled?'[off] ':'')+el.tagName.toLowerCase()+' "'+t+'"');}return out.filter(x=>!/^a? ?"0[1-7] |Launch Kit dashboard|^button "(Open command|Switch to|Run history)/.test(x)).slice(0,30);});log('INV',stage,tag,JSON.stringify(inv));return inv;};
const goStage=async(rx,slug)=>{try{await page.getByText(rx).first().click({timeout:8000});await page.waitForTimeout(1500);log('open',slug);return true;}catch{log('open',slug,'FAILED');return false;}};
const clickBtn=async(stage,rx,label,timeout=10000)=>{try{await page.getByRole('button',{name:rx}).first().click({timeout});await page.waitForTimeout(1200);log(stage,label,'clicked');return true;}catch{log(stage,label,'NOT FOUND');return false;}};
const runAction=async(stage,rx,label,maxSec=300)=>{await waitIdle();const b0=(await latestRun())?.id;if(!(await clickBtn(stage,rx,label)))return null;return waitRun(`${stage}:${label}`,b0,maxSec);};
try{
  await page.goto('http://localhost:3400',{waitUntil:'networkidle'});
  const raw=readFileSync(`${OUT}/1b-appstate.json`,'utf8');
  await page.evaluate((raw)=>{const st=JSON.parse(raw);for(const r of (st.launchkit?.runs||[])){if(r.status==='running'||r.status==='queued'){r.status='error';r.error='seed: interrupted run (re-run in pass 3)';}}localStorage.setItem('lk-preview-appstate',JSON.stringify(st));localStorage.removeItem('lk-nav');},raw);
  await page.reload({waitUntil:'networkidle'}); await page.waitForTimeout(4000);
  await page.click('#lk-root aside nav a:has-text("Launches")'); await page.waitForTimeout(1200);
  await page.getByText('Excalidraw').first().click({timeout:10000}); await page.waitForTimeout(2000); log('workspace opened');
  // commercial: re-land listing
  if(await goStage(/03\s*COMMERCIAL/i,'commercial')){await runAction('commercial',/Draft pricing|Regenerate/i,'pricing+listing');await waitIdle();log('RUNS',JSON.stringify((await runs()).map(r=>r.kind+':'+r.status)));}
  // assets: draft one, find gate, approve
  if(await goStage(/04\s*ASSETS/i,'assets')){await runAction('assets',/draft x post/i,'DRAFT X POST');await page.waitForTimeout(3000);await inventory('assets','after-draft');await clickBtn('assets',/approve/i,'approve',25000);await page.screenshot({path:`${OUT}/p3-assets.png`});}
  // targets: find venues, select one
  if(await goStage(/05\s*TARGETS/i,'targets')){await runAction('targets',/find launch venues/i,'Find launch venues');await page.waitForTimeout(3000);await inventory('targets','after-run');let sel=false;for(const [rx,how] of [[/select/i,'button:select'],[/use this venue|use venue|add/i,'button:use'],[null,'checkbox']]){try{if(how==='checkbox'){await page.getByRole('checkbox').first().click({timeout:4000});}else{await page.getByRole('button',{name:rx}).first().click({timeout:4000});}sel=how;break;}catch{}}await page.waitForTimeout(1200);const selected=((await appState()).targets||[]).filter(t=>t.selected).length;log('SELECT',JSON.stringify({how:sel,selectedTargets:selected,totalTargets:((await appState()).targets||[]).length}));await page.screenshot({path:`${OUT}/p3-targets.png`});}
  // signals: scan, keep one
  if(await goStage(/06\s*SIGNALS/i,'signals')){await runAction('signals',/scan for live demand/i,'Scan for live demand',420);await page.waitForTimeout(3000);await inventory('signals','after-scan');await clickBtn('signals',/keep/i,'keep');const sg=(await appState()).signals||[];log('SIGNALS',JSON.stringify({count:sg.length,statuses:[...new Set(sg.map(s=>s.status))]}));await page.screenshot({path:`${OUT}/p3-signals.png`});}
  // plan: copies
  if(await goStage(/07\s*PLAN/i,'plan')){await waitIdle();await inventory('plan','before');const ok1=await clickBtn('plan',/copy launch plan/i,'copy-json');let clip1='';try{clip1=await page.evaluate(()=>navigator.clipboard.readText());}catch{}const ok2=await clickBtn('plan',/copy markdown/i,'copy-md');let clip2='';try{clip2=await page.evaluate(()=>navigator.clipboard.readText());}catch{}log('PLAN',JSON.stringify({copyJson:ok1,jsonLen:clip1.length,jsonStartsWithBrace:clip1.trim().startsWith('{'),copyMd:ok2,mdLen:clip2.length,mdHasHeading:/^#/m.test(clip2)}));await page.screenshot({path:`${OUT}/p3-plan.png`});}
  writeFileSync(`${OUT}/1b-appstate-final.json`,await page.evaluate(()=>localStorage.getItem('lk-preview-appstate')||'{}'));
  log('RUNS_FINAL',JSON.stringify((await runs()).map(r=>r.kind+':'+r.status+(r.error?'('+r.error.slice(0,40)+')':''))));
}catch(e){log('DRIVE ERROR',String(e).slice(0,220));}
log('pageerrors',errs.length,errs[0]||''); log('1B_P3_DONE'); await b.close(); process.exit(0);
