import { chromium } from 'playwright';
const OUT='/Users/shashidharbabu/rocketride-apps-gtm/docs/visual-baseline';
const log=(...a)=>console.log(new Date().toISOString().slice(11,19),...a);
const b=await chromium.launch(); const page=await b.newPage({viewport:{width:1600,height:1000}});
const errs=[]; page.on('pageerror',e=>errs.push(String(e).slice(0,140)));
const st=()=>page.evaluate(()=>{try{return JSON.parse(localStorage.getItem('lk-preview-appstate')||'{}').launchkit||{};}catch{return {};}});
const runs=async()=>((await st()).runs||[]).slice().sort((x,y)=>String(y.created_at).localeCompare(String(x.created_at)));
const latest=async()=>{const r=(await runs())[0];if(!r)return null;const t=((await st()).traces||[]).find(t=>t.run_id===r.id);return {id:r.id,kind:r.kind,status:r.status,error:(r.error||'').slice(0,200),steps:t?(t.entries||[]).length:null,stepErrs:t?(t.entries||[]).filter(e=>e.error).map(e=>(e.component||'')+': '+e.error.slice(0,70)).slice(0,3):null};};
const waitRun=async(label,before,maxSec=480)=>{let r=null,started=false;for(let i=0;i<maxSec;i++){await page.waitForTimeout(1000);r=await latest();if(r&&r.id!==before){started=true;if(r.status==='done'||r.status==='error')break;}else if(!started&&i>=30)break;}log('RUN',JSON.stringify({step:label,started,run:started?r:null}));return r;};
try{
  await page.goto('http://localhost:3400',{waitUntil:'networkidle'});
  await page.evaluate(()=>{localStorage.removeItem('lk-preview-appstate');localStorage.removeItem('lk-nav');});
  await page.reload({waitUntil:'networkidle'}); await page.waitForTimeout(4000);
  await page.click('#lk-root aside nav a:has-text("Dashboard")'); await page.waitForTimeout(800);
  await page.getByRole('button',{name:/new launch/i}).first().click(); await page.waitForTimeout(1500);
  const inp=page.locator('#lk-root input:not([aria-label="chat-input"])');
  await inp.nth(0).fill('Excalidraw'); await inp.nth(1).fill('excalidraw.com'); await inp.nth(2).fill('github.com/excalidraw/excalidraw');
  const b0=(await latest())?.id; await page.click('button:has-text("Analyze my app")'); await waitRun('understand(Claude)',b0,480);
  await page.waitForTimeout(2500);
  const prof=await page.evaluate(()=>{const t=document.querySelector('#lk-root')?.textContent||'';const a=JSON.parse(localStorage.getItem('lk-preview-appstate')||'{}').launchkit||{};const p=(a.profiles||[])[0];const d=p?(typeof p.data==='string'?{}:p.data||{}):{};
    return {gate:/GATE 01/.test(t), nothingFound:/Nothing found/.test(t), oneLiner:String(d.one_liner||'').slice(0,90), icp:String(d.icp||d.who_its_for||'').slice(0,60), diffs:Array.isArray(d.differentiators)?d.differentiators.length:0, confidence:d.confidence??null, keys:Object.keys(d).length};});
  log('PROFILE',JSON.stringify(prof)); await page.screenshot({path:`${OUT}/claude-understand.png`});
}catch(e){log('DRIVE ERROR',String(e).slice(0,200));}
log('pageerrors',errs.length,errs[0]||''); log('SWAP_TEST_DONE'); await b.close(); process.exit(0);
