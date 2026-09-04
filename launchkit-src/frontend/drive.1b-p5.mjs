import { chromium } from 'playwright';
import { readFileSync, writeFileSync } from 'node:fs';
const OUT='/Users/shashidharbabu/rocketride-apps-gtm/docs/visual-baseline';
const log=(...a)=>console.log(new Date().toISOString().slice(11,19),...a);
const b=await chromium.launch(); const ctx=await b.newContext({viewport:{width:2000,height:1260},permissions:['clipboard-read','clipboard-write']}); const page=await ctx.newPage();
const errs=[]; page.on('pageerror',e=>errs.push(String(e).slice(0,140)));
const appState=()=>page.evaluate(()=>{try{return JSON.parse(localStorage.getItem('lk-preview-appstate')||'{}').launchkit||{};}catch{return {};}});
const runs=async()=>((await appState()).runs||[]).slice().sort((x,y)=>String(y.created_at).localeCompare(String(x.created_at)));
const latestRun=async()=>{const r=(await runs())[0];if(!r)return null;const t=((await appState()).traces||[]).find(t=>t.run_id===r.id);return {id:r.id,kind:r.kind,status:r.status,error:(r.error||'').slice(0,120),steps:t?(t.entries||[]).length:null,stepErrs:t?(t.entries||[]).filter(e=>e.error).map(e=>(e.component||'')+': '+e.error.slice(0,60)).slice(0,3):null};};
const waitRun=async(label,before,maxSec=300)=>{let r=null,started=false;for(let i=0;i<maxSec;i++){await page.waitForTimeout(1000);r=await latestRun();if(r&&r.id!==before){started=true;if(r.status==='done'||r.status==='error')break;}else if(!started&&i>=25)break;}log('RUN',JSON.stringify({step:label,started,run:started?r:null}));return r;};
const waitIdle=async(maxSec=420)=>{for(let i=0;i<maxSec;i++){const rs=await runs();if(!rs.some(r=>r.status==='running'||r.status==='queued')){log('IDLE after',i,'s');return true;}await page.waitForTimeout(1000);}log('IDLE timeout');return false;};
const goStage=async(rx,slug)=>{try{await page.getByText(rx).first().click({timeout:8000});await page.waitForTimeout(2000);log('open',slug);return true;}catch{log('open',slug,'FAILED');return false;}};
const clickBtn=async(stage,rx,label,timeout=15000)=>{try{await page.getByRole('button',{name:rx}).first().click({timeout});await page.waitForTimeout(1200);log(stage,label,'clicked');return true;}catch{log(stage,label,'NOT FOUND');return false;}};
const runAction=async(stage,rx,label,maxSec=300)=>{await waitIdle();const b0=(await latestRun())?.id;if(!(await clickBtn(stage,rx,label)))return null;return waitRun(`${stage}:${label}`,b0,maxSec);};
const kinds=async()=>{const a=await appState();return {runs:(await runs()).map(r=>r.kind+':'+r.status),results:(a.commercial_results||[]).map(c=>c.kind),signals:(a.signals||[]).length};};
try{
  await page.goto('http://localhost:3400',{waitUntil:'networkidle'});
  const raw=readFileSync(`${OUT}/1b-appstate-final.json`,'utf8');
  await page.evaluate((raw)=>{const st=JSON.parse(raw);const lk=st.launchkit;lk.runs=(lk.runs||[]).filter(r=>!['pricing','listing','brand_campaigns','signals'].includes(r.kind));lk.commercial_results=(lk.commercial_results||[]).filter(c=>!['pricing','listing','brand_campaigns','signals_meta'].includes(c.kind));lk.signals=[];for(const r of lk.runs){if(r.status==='running'||r.status==='queued'){r.status='error';r.error='seed: interrupted';}}localStorage.setItem('lk-preview-appstate',JSON.stringify(st));localStorage.removeItem('lk-nav');},raw);
  await page.reload({waitUntil:'networkidle'}); await page.waitForTimeout(4000);
  await page.click('#lk-root aside nav a:has-text("Launches")'); await page.waitForTimeout(1200);
  await page.getByText('Excalidraw').first().click({timeout:10000}); await page.waitForTimeout(2000); log('workspace opened', JSON.stringify(await kinds()));
  if(await goStage(/02\s*BRAND/i,'brand')){await runAction('brand',/draft campaigns/i,'Draft campaigns');log('RESULTS',JSON.stringify(await kinds()));}
  if(await goStage(/03\s*COMMERCIAL/i,'commercial')){await runAction('commercial',/draft pricing/i,'Draft pricing & listing');await waitIdle();log('RESULTS',JSON.stringify(await kinds()));await page.screenshot({path:`${OUT}/p5-commercial.png`});}
  if(await goStage(/06\s*SIGNALS/i,'signals')){await runAction('signals',/scan for live demand/i,'Scan for live demand',420);await page.waitForTimeout(3000);const a=await appState();const sg=a.signals||[];log('SIGNALS',JSON.stringify({count:sg.length,platforms:[...new Set(sg.map(s=>(s.data?.platform)||s.platform))].slice(0,5)}));await clickBtn('signals',/keep/i,'keep',8000);log('SIGNALS_AFTER_KEEP',JSON.stringify({statuses:[...new Set(((await appState()).signals||[]).map(s=>s.status))]}));await page.screenshot({path:`${OUT}/p5-signals.png`});}
  if(await goStage(/07\s*PLAN/i,'plan')){await waitIdle();const cp=async(rx,label)=>{await page.evaluate(()=>navigator.clipboard.writeText(''));const ok=await clickBtn('plan',rx,label);let t='';try{t=await page.evaluate(()=>navigator.clipboard.readText());}catch{}return {ok,len:t.length,head:t.trim().slice(0,40)};};log('PLAN',JSON.stringify({json:await cp(/copy launch plan/i,'copy-json'),md:await cp(/copy markdown/i,'copy-md')}));}
  writeFileSync(`${OUT}/1b-appstate-p5.json`,await page.evaluate(()=>localStorage.getItem('lk-preview-appstate')||'{}'));
  log('RUNS_FINAL',JSON.stringify(await kinds()));
}catch(e){log('DRIVE ERROR',String(e).slice(0,220));}
log('pageerrors',errs.length,errs[0]||''); log('1B_P5_DONE'); await b.close(); process.exit(0);
