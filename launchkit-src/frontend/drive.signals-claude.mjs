import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';
const OUT='/Users/shashidharbabu/rocketride-apps-gtm/docs/visual-baseline';
const log=(...a)=>console.log(new Date().toISOString().slice(11,19),...a);
const b=await chromium.launch(); const page=await b.newPage({viewport:{width:1600,height:1000}});
const errs=[]; page.on('pageerror',e=>errs.push(String(e).slice(0,140)));
const st=()=>page.evaluate(()=>{try{return JSON.parse(localStorage.getItem('lk-preview-appstate')||'{}').launchkit||{};}catch{return {};}});
const runs=async()=>((await st()).runs||[]).slice().sort((x,y)=>String(y.created_at).localeCompare(String(x.created_at)));
const latest=async()=>{const r=(await runs())[0];if(!r)return null;const t=((await st()).traces||[]).find(t=>t.run_id===r.id);return {id:r.id,kind:r.kind,status:r.status,error:(r.error||'').slice(0,160),steps:t?(t.entries||[]).length:null,stepErrs:t?(t.entries||[]).filter(e=>e.error).map(e=>(e.component||'')+': '+e.error.slice(0,60)).slice(0,3):null};};
try{
  await page.goto('http://localhost:3400',{waitUntil:'networkidle'});
  await page.evaluate((raw)=>{const s=JSON.parse(raw);const lk=s.launchkit;lk.runs=(lk.runs||[]).filter(r=>r.kind!=='signals');lk.commercial_results=(lk.commercial_results||[]).filter(c=>c.kind!=='signals_meta');lk.signals=[];localStorage.setItem('lk-preview-appstate',JSON.stringify(s));localStorage.removeItem('lk-nav');},readFileSync(`${OUT}/1b-appstate-p5.json`,'utf8'));
  await page.reload({waitUntil:'networkidle'}); await page.waitForTimeout(4000);
  await page.click('#lk-root aside nav a:has-text("Launches")'); await page.waitForTimeout(1200);
  await page.getByText('Excalidraw').first().click({timeout:10000}); await page.waitForTimeout(2000);
  await page.getByText(/06\s*SIGNALS/i).first().click({timeout:8000}); await page.waitForTimeout(2000);
  const b0=(await latest())?.id;
  await page.getByRole('button',{name:/scan for live demand/i}).first().click({timeout:15000}); log('scan clicked (Claude)');
  let r=null,started=false; for(let i=0;i<600;i++){await page.waitForTimeout(1000);r=await latest();if(r&&r.id!==b0){started=true;if(r.status==='done'||r.status==='error')break;}else if(!started&&i>=30)break;}
  log('RUN',JSON.stringify({started,run:started?r:null}));
  await page.waitForTimeout(3000);
  const a=await st(); const meta=((a.commercial_results||[]).filter(c=>c.kind==='signals_meta').pop()||{}).data||{};
  const sg=a.signals||[];
  log('SIGNALS',JSON.stringify({stored:sg.length, platforms:[...new Set(sg.map(s=>(s.data?.platform)||s.platform))].slice(0,5), dropped:(meta.dropped_by_gate||[]).length, rejected:(meta.rejected_by_rescore||[]).length, queries:(meta.queries||[]).length, coverage:String(meta.coverage_notes||'').slice(0,140)}));
  await page.screenshot({path:`${OUT}/claude-signals.png`,fullPage:true});
}catch(e){log('DRIVE ERROR',String(e).slice(0,200));}
log('pageerrors',errs.length,errs[0]||''); log('SIGNALS_CLAUDE_DONE'); await b.close(); process.exit(0);
