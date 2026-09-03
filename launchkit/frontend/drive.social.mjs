// Social Launch verification: seeded state → stage 04 → picker + share intent +
// visible regenerate → one REAL LinkedIn draft on the rotated lk_assets pipe →
// stored draft has no em/en dash → Runs label → Settings rulebook editor.
import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';
const OUT='/Users/shashidharbabu/rocketride-apps-gtm/docs/visual-baseline';
const b=await chromium.launch(); const ctx=await b.newContext({viewport:{width:2000,height:1260}}); const page=await ctx.newPage();
await page.addInitScript(()=>{window.__opened=[]; window.open=(u)=>{window.__opened.push(String(u)); return null;};});
const errs=[]; page.on('pageerror',e=>errs.push(String(e).slice(0,160)));
const text=async()=>page.evaluate(()=>document.querySelector('#lk-root')?.textContent||'');
await page.goto('http://localhost:3400',{waitUntil:'networkidle'});
await page.evaluate((raw)=>{localStorage.setItem('lk-preview-appstate',raw);localStorage.removeItem('lk-nav');},readFileSync(`${OUT}/1b-appstate-p5.json`,'utf8'));
await page.reload({waitUntil:'networkidle'}); await page.waitForTimeout(4000);
await page.locator('#lk-root nav a', {hasText:'Launches'}).first().click(); await page.waitForTimeout(1200);
await page.getByText('Excalidraw').first().click({timeout:10000}); await page.waitForTimeout(2000);
await page.locator('#lk-root nav[aria-label="Stages"] a', {hasText:/Social Launch/i}).first().click({timeout:8000}); await page.waitForTimeout(2500);
const t1=await text();
const picker=await page.locator('#lk-root button', {hasText:/^(Draft|Redraft) for /}).count();
const r={railSocial:/Social Launch/.test(t1), picker, regenVisible:/Regenerate with feedback/.test(t1)&&await page.locator('#lk-root textarea[id^="fb-"]').count()>0, shareX:await page.locator('#lk-root button',{hasText:'Share on X'}).count()>0, noAssetsWord:!/\bAssets\b/.test(t1)};
if(r.shareX){ await page.locator('#lk-root button',{hasText:'Share on X'}).first().click(); await page.waitForTimeout(300);
  const opened=await page.evaluate(()=>window.__opened); r.intent=opened[0]?.slice(0,60); r.intentOk=/^https:\/\/x\.com\/intent\/post\?text=/.test(opened[0]||''); }
await page.screenshot({path:`${OUT}/v15-social-launch.png`});
console.log('STAGE',JSON.stringify(r)); if(!r.railSocial||r.picker!==7){console.log('RAIL>>>',await page.evaluate(()=>[...document.querySelectorAll('#lk-root nav[aria-label="Stages"] a')].map(a=>a.textContent.trim()).join(' | ')));console.log('BTNS>>>',await page.evaluate(()=>[...document.querySelectorAll('#lk-root button')].map(b=>b.textContent.trim()).filter(t=>/Draft/.test(t)).join(' | ')));}
// real draft: LinkedIn on the rotated pipe (fresh instructions)
const btn=page.locator('#lk-root button',{hasText:/(Draft|Redraft) for LinkedIn/}).first();
const before=await page.evaluate(()=>{try{const root=JSON.parse(localStorage.getItem('lk-preview-appstate')||'{}');const s=Object.values(root).find(v=>v&&Array.isArray(v.assets))||root;return (s.assets||[]).length;}catch{return -1;}});
const draftBtns=()=>page.evaluate(()=>[...document.querySelectorAll('#lk-root button')].filter(b=>/Draft for|Redraft for/.test(b.textContent)).map(b=>b.disabled));
console.log('PRE', JSON.stringify({drafting:(await text()).match(/Drafting…/g)?.length||0, disabled:(await draftBtns()).filter(Boolean).length}));
await btn.click(); const t0=Date.now();
let started=false, done=false;
for(let i=0;i<60 && !done;i++){ await page.waitForTimeout(5000);
  const dis=(await draftBtns()).filter(Boolean).length; const t=await text(); const err=(t.match(/(failed|error)[^.]{0,120}/i)||[''])[0];
  if(dis>0) started=true; if(started && dis===0) done=true;
  if(i%6===0||done) console.log('POLL', JSON.stringify({s:Math.round((Date.now()-t0)/1000), disabled:dis, started, done, err:err.slice(0,120)})); }
if(!done) console.log('WARN run not finished within 300s');
await page.waitForTimeout(2500);
const secs=Math.round((Date.now()-t0)/1000);
const st=await page.evaluate(()=>{try{const root=JSON.parse(localStorage.getItem('lk-preview-appstate')||'{}');const s=Object.values(root).find(v=>v&&Array.isArray(v.assets))||root;const a=(s.assets||[]).filter(x=>x.asset_type==='linkedin_post');a.sort((x,y)=>(y.version||0)-(x.version||0));const n=a[0];return n?{count:a.length,version:n.version,post:String(n.data?.post||'').slice(0,600),fixed:n.data?.punctuation_fixed||0,warnings:n.data?.warnings||[],keys:Object.keys(n.data||{})}:null;}catch(e){return {err:String(e)};}});
const dom=await text();
const d={secs,before,stored:!!st,version:st?.version,fixed:st?.fixed,warnings:st?.warnings,dashInStored:/[—–]/.test(st?.post||''),dashInDom:/[—–]/.test(dom),runLabel:/Social Launch — LinkedIn/.test(dom),errs:errs.length};
console.log('DRAFT',JSON.stringify(d)); console.log('POST>>>',(st?.post||'(none)').replace(/\n/g,' / ').slice(0,500));
await page.screenshot({path:`${OUT}/v15-linkedin-draft.png`});
await page.locator('#lk-root nav a',{hasText:'Runs'}).first().click(); await page.waitForTimeout(1500);
const runs=await text(); d.runsPage=/Social Launch — LinkedIn/.test(runs);
await page.locator('#lk-root nav a',{hasText:'Settings'}).first().click(); await page.waitForTimeout(1500);
const s=await text(); d.settingsEditor=/Platform rulebooks/.test(s)&&/Save LinkedIn rulebook|Save X rulebook/.test(s);
await page.screenshot({path:`${OUT}/v15-settings-rulebooks.png`});
console.log('AFTER',JSON.stringify({runsPage:d.runsPage,settingsEditor:d.settingsEditor,errs}));
await b.close();
const ok=r.railSocial&&r.picker===7&&r.regenVisible&&r.shareX&&r.intentOk&&d.stored&&!d.dashInStored&&d.runsPage&&d.settingsEditor&&errs.length===0;
console.log(ok?'SOCIAL_OK':'SOCIAL_FAIL'); process.exit(ok?0:1);
