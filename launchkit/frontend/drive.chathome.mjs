import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';
const OUT='/Users/shashidharbabu/rocketride-apps-gtm/docs/visual-baseline';
const b=await chromium.launch(); const page=await b.newPage({viewport:{width:1600,height:1000}});
const errs=[]; page.on('pageerror',e=>errs.push(String(e).slice(0,140)));
await page.goto('http://localhost:3400',{waitUntil:'networkidle'});
await page.evaluate((raw)=>{localStorage.setItem('lk-preview-appstate',raw);localStorage.removeItem('lk-nav');},readFileSync(`${OUT}/1b-appstate-p5.json`,'utf8'));
await page.reload({waitUntil:'networkidle'}); await page.waitForTimeout(4000);
const empty=await page.evaluate(()=>{const t=document.querySelector('#lk-root')?.textContent||'';const ta=document.querySelector('#lk-root textarea[aria-label="Message the navigator"]');const chips=[...document.querySelectorAll('#lk-root button')].filter(b=>/Where is my|Start my first|What should I do next|What is Gate 2|Show me my runs/.test(b.textContent||''));const r=ta?ta.getBoundingClientRect():null;
  return {headline:/What are you launching\?/.test(t), composer:!!ta, composerCenteredY:r?Math.round(r.top/window.innerHeight*100):null, starters:chips.map(c=>c.textContent.trim()).slice(0,4), landingBelow:/Read the procedure|Questions, answered/.test(t), rail:!!document.querySelector('#lk-root aside nav')};});
console.log('EMPTY',JSON.stringify(empty)); await page.screenshot({path:`${OUT}/v11-home-empty.png`});
await page.click('#lk-root button:has-text("What is Gate 2")');
let replied=false; for(let i=0;i<40&&!replied;i++){await page.waitForTimeout(1000);replied=await page.evaluate(()=>!!document.querySelector('#lk-root [data-sender="bot"]'));}
await page.waitForTimeout(800);
const active=await page.evaluate(()=>{const ta=document.querySelector('#lk-root textarea[aria-label="Message the navigator"]');const r=ta?ta.getBoundingClientRect():null;const thread=document.querySelector('#lk-root [data-stub="messagelist"]');
  return {thread:!!thread, userMsgs:document.querySelectorAll('#lk-root [data-sender="user"]').length, botMsgs:document.querySelectorAll('#lk-root [data-sender="bot"]').length, composerDockedY:r?Math.round(r.top/window.innerHeight*100):null, headlineGone:!/What are you launching\?/.test(document.querySelector('#lk-root')?.textContent||''), reply:(document.querySelector('#lk-root [data-sender="bot"]')?.textContent||'').slice(0,90)};});
console.log('ACTIVE',JSON.stringify(active)); console.log('pageerrors',errs.length,errs[0]||'');
await page.screenshot({path:`${OUT}/v11-home-active.png`}); await b.close();
process.exit(empty.headline&&empty.composer&&empty.starters.length===4&&active.thread&&active.botMsgs>0&&active.headlineGone&&errs.length===0?0:1);
