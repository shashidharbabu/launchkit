import { chromium } from 'playwright';
import { writeFileSync } from 'node:fs';
const OUT='/Users/shashidharbabu/rocketride-apps-gtm/docs/visual-baseline';
const log=(...a)=>console.log(new Date().toISOString().slice(11,19),...a);
const results=[]; const save=()=>writeFileSync(`${OUT}/1b-results.json`,JSON.stringify(results,null,1));
const b=await chromium.launch(); const page=await b.newPage({viewport:{width:2000,height:1260}});
const errs=[]; page.on('pageerror',e=>errs.push(String(e).slice(0,140)));
const appState=()=>page.evaluate(()=>{try{return JSON.parse(localStorage.getItem('lk-preview-appstate')||'{}').launchkit||{};}catch{return {};}});
const latestRun=async()=>{const a=await appState();const r=(a.runs||[]).slice().sort((x,y)=>String(y.created_at).localeCompare(String(x.created_at)))[0];if(!r)return null;const t=(a.traces||[]).find(t=>t.run_id===r.id);return {id:r.id,kind:r.kind,status:r.status,error:(r.error||'').slice(0,160),trace:t?{ok:t.ok,ms:t.ms,steps:(t.entries||[]).length,err:(t.error||'').slice(0,120),stepErr:((t.entries||[]).find(e=>e.error)||{}).error||null}:null};};
const banner=()=>page.evaluate(()=>{const m=document.body.innerText.match(/Couldn.t reach[^\n]{0,160}/);return m?m[0]:null;});
const waitRun=async(label,before,maxSec=300)=>{let r=null,started=false;for(let i=0;i<maxSec;i++){await page.waitForTimeout(1000);r=await latestRun();if(r&&r.id!==before){started=true;if(r.status==='done'||r.status==='error')break;}else if(!started&&i>=25){break;}}const rec={step:label,started,run:started?r:null,banner:await banner()};log('RUN',JSON.stringify(rec));results.push(rec);save();return rec;};
const shot=(n)=>page.screenshot({path:`${OUT}/1b-${n}.png`});
const RUN_RX=/run|generate|draft|find|analy|write|score|rank|create|build|extract|research/i, SKIP_RX=/history|new launch|first launch|search|show all|collapse|hide|approve|^select|keep|reject|export|download|redo|edit|cancel|close|retry|delete|remove|disable|add venue/i;
const candidates=()=>page.evaluate(([rr,sk])=>{const R=new RegExp(rr,'i'),S=new RegExp(sk,'i');return [...document.querySelectorAll('#lk-root button')].map((b,i)=>({i,t:(b.innerText||'').trim().replace(/\s+/g,' ').slice(0,48),ok:!b.disabled&&!b.closest('aside')&&!b.closest('[data-stub="chatview"]')})).filter(x=>x.ok&&R.test(x.t)&&!S.test(x.t));},[RUN_RX.source,SKIP_RX.source]);
const clickRuns=async(stage,max=4)=>{const done=new Set();for(let k=0;k<max;k++){const c=(await candidates()).filter(x=>!done.has(x.t));if(!c.length){log('stage',stage,'no more run buttons; clicked',[...done]);break;}const x=c[0];done.add(x.t);log('stage',stage,'click:',x.t);const b0=(await latestRun())?.id;try{await page.locator('#lk-root button').nth(x.i).click({timeout:5000});}catch(e){log('  click failed',x.t);results.push({step:`${stage}:${x.t}`,clickFailed:true});save();continue;}await waitRun(`${stage}:${x.t}`,b0);}};
const goStage=async(rx,slug)=>{try{await page.getByText(rx).first().click({timeout:5000});await page.waitForTimeout(1500);log('open',slug);results.push({step:`open:${slug}`,ok:true});save();return true;}catch{log('open',slug,'FAILED (locked?)');results.push({step:`open:${slug}`,ok:false});save();return false;}};
const approve=async(stage)=>{try{await page.getByRole('button',{name:/approve/i}).first().click({timeout:25000});await page.waitForTimeout(1500);log('approved',stage);results.push({step:`approve:${stage}`,ok:true});}catch{log('no approve button for',stage);results.push({step:`approve:${stage}`,ok:false});}save();};
const clickFirst=async(stage,rx,label)=>{try{await page.getByRole('button',{name:rx}).first().click({timeout:10000});await page.waitForTimeout(1200);log(stage,label,'ok');results.push({step:`${stage}:${label}`,ok:true});}catch{log(stage,label,'not found');results.push({step:`${stage}:${label}`,ok:false});}save();};
try{
  await page.goto('http://localhost:3400',{waitUntil:'networkidle'});
  await page.evaluate(()=>{localStorage.removeItem('lk-preview-appstate');localStorage.removeItem('lk-nav');});
  await page.reload({waitUntil:'networkidle'}); await page.waitForTimeout(4000);
  // v9 always opens on Home: navigate like a user (rail → Dashboard → New launch)
  await page.click('#lk-root aside nav a:has-text("Dashboard")'); await page.waitForTimeout(800);
  await page.getByRole('button',{name:/new launch/i}).first().click(); await page.waitForTimeout(1500); log('new-launch form opened');
  const inputs=page.locator('#lk-root input:not([aria-label="chat-input"])'); await inputs.nth(0).fill('Excalidraw'); await inputs.nth(1).fill('excalidraw.com'); await inputs.nth(2).fill('github.com/excalidraw/excalidraw');
  const b0=(await latestRun())?.id; await page.click('button:has-text("Analyze my app")'); await waitRun('understand',b0,360); await shot('01-profile'); await approve('profile'); await shot('01-approved');
  if(await goStage(/02\s*BRAND/i,'brand')){await clickRuns('brand');await shot('02-brand');}
  if(await goStage(/03\s*COMMERCIAL/i,'commercial')){await clickRuns('commercial');await approve('commercial');await shot('03-commercial');}
  if(await goStage(/04\s*ASSETS/i,'assets')){await clickRuns('assets',2);await approve('assets');await shot('04-assets');}
  if(await goStage(/05\s*TARGETS/i,'targets')){await clickRuns('targets',1);await clickFirst('targets',/^select/i,'select');await shot('05-targets');}
  if(await goStage(/06\s*SIGNALS/i,'signals')){await clickRuns('signals',1);await clickFirst('signals',/keep/i,'keep');await shot('06-signals');}
  if(await goStage(/07\s*PLAN/i,'plan')){await clickFirst('plan',/json/i,'export-json');await clickFirst('plan',/markdown/i,'export-md');const len=await page.evaluate(()=>document.querySelector('#lk-root')?.textContent?.length||0);results.push({step:'plan:content-length',len});save();await shot('07-plan');}
}catch(e){log('DRIVE ERROR',String(e).slice(0,200));results.push({step:'drive-error',error:String(e).slice(0,200)});save();}
results.push({step:'summary',pageerrors:errs.length,firstError:errs[0]||null,banner:await banner()}); save();
log('1B_DONE', JSON.stringify(results.filter(r=>r.run).map(r=>({s:r.step,st:r.run.status,ok:r.run.trace?.ok,steps:r.run.trace?.steps,err:r.run.error||r.run.trace?.err||null}))));
await b.close(); process.exit(0);
