import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';
const OUT='/Users/shashidharbabu/rocketride-apps-gtm/docs/visual-baseline';
const log=(...a)=>console.log(new Date().toISOString().slice(11,19),...a);
const b=await chromium.launch(); const page=await b.newPage({viewport:{width:2000,height:1260}});
const errs=[]; page.on('pageerror',e=>errs.push(String(e).slice(0,140)));
const appState=()=>page.evaluate(()=>{try{return JSON.parse(localStorage.getItem('lk-preview-appstate')||'{}').launchkit||{};}catch{return {};}});
const runs=async()=>((await appState()).runs||[]).slice().sort((x,y)=>String(y.created_at).localeCompare(String(x.created_at)));
const latestRun=async()=>{const r=(await runs())[0];if(!r)return null;const t=((await appState()).traces||[]).find(t=>t.run_id===r.id);return {id:r.id,kind:r.kind,status:r.status,error:(r.error||'').slice(0,120),steps:t?(t.entries||[]).length:null,stepErrs:t?(t.entries||[]).filter(e=>e.error).map(e=>(e.component||'')+': '+e.error.slice(0,50)).slice(0,3):null};};
const waitRun=async(label,before,maxSec=420)=>{let r=null,started=false;for(let i=0;i<maxSec;i++){await page.waitForTimeout(1000);r=await latestRun();if(r&&r.id!==before){started=true;if(r.status==='done'||r.status==='error')break;}else if(!started&&i>=25)break;}log('RUN',JSON.stringify({step:label,started,run:started?r:null}));return r;};
try{
  await page.goto('http://localhost:3400',{waitUntil:'networkidle'});
  const raw=readFileSync(`${OUT}/1b-appstate-p5.json`,'utf8');
  await page.evaluate((raw)=>{const st=JSON.parse(raw);const lk=st.launchkit;lk.runs=(lk.runs||[]).filter(r=>r.kind!=='signals');lk.commercial_results=(lk.commercial_results||[]).filter(c=>c.kind!=='signals_meta');lk.signals=[];for(const r of lk.runs){if(r.status==='running'||r.status==='queued'){r.status='error';r.error='seed: interrupted';}}localStorage.setItem('lk-preview-appstate',JSON.stringify(st));localStorage.removeItem('lk-nav');},raw);
  await page.reload({waitUntil:'networkidle'}); await page.waitForTimeout(4000);
  await page.click('#lk-root aside nav a:has-text("Launches")'); await page.waitForTimeout(1200);
  await page.getByText('Excalidraw').first().click({timeout:10000}); await page.waitForTimeout(2000);
  await page.getByText(/06\s*SIGNALS/i).first().click({timeout:8000}); await page.waitForTimeout(2000); log('signals stage opened');
  const b0=(await latestRun())?.id; await page.getByRole('button',{name:/scan for live demand/i}).first().click({timeout:15000}); log('scan clicked');
  await waitRun('signals',b0,720); await page.waitForTimeout(3500);
  const a=await appState(); const meta=((a.commercial_results||[]).filter(c=>c.kind==='signals_meta').pop()||{}).data||{};
  const dropped=Array.isArray(meta.dropped_by_gate)?meta.dropped_by_gate:[]; const ownUnrelated=dropped.filter(d=>/own content/i.test(d.reason||'')&&!/excalidraw/i.test(d.url||''));
  log('GATE',JSON.stringify({signalsStored:(a.signals||[]).length,dropped:dropped.length,ownContentDropsOnUnrelatedUrls:ownUnrelated.length,dropReasons:[...new Set(dropped.map(d=>d.reason))],rejectedByRescore:Array.isArray(meta.rejected_by_rescore)?meta.rejected_by_rescore.length:null,queries:meta.queries,coverage:String(meta.coverage_notes||'').slice(0,160)}));
  const ui=await page.evaluate(()=>{const t=document.querySelector('#lk-root')?.textContent||'';return {scanReport:/Scan report/i.test(t),searched:/Searched/.test(t),droppedShown:/Dropped by gate/.test(t),keepButtons:[...document.querySelectorAll('#lk-root button')].filter(b=>/keep/i.test(b.textContent||'')).length};});
  log('UI',JSON.stringify(ui)); await page.screenshot({path:`${OUT}/v10-signals.png`,fullPage:true});
}catch(e){log('DRIVE ERROR',String(e).slice(0,220));}
log('pageerrors',errs.length,errs[0]||''); log('SIGFIX_DONE'); await b.close(); process.exit(0);
