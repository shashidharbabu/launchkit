#!/usr/bin/env node
// Dump the visible copy of a site (headings, labels, paragraphs): node site-copy.mjs https://…
// Waits out a free-tier "waking up" page the way the probe does.
import { chromium } from 'playwright';
const url = process.argv[2];
const b = await chromium.launch();
const page = await b.newPage({ viewport: { width: 1280, height: 900 } });
await page.goto(url, { waitUntil: 'networkidle', timeout: 60_000 }).catch(() => {});
for (let i = 0; i < 8; i++) {
  const asleep = await page.evaluate(() => /application loading|starting|waking|spinning up|please wait/i.test(document.title) || /SERVICE WAKING UP|Application loading/i.test(document.body?.innerText ?? ''));
  if (!asleep) break;
  console.error(`waking (${i + 1})`);
  await page.waitForTimeout(9000);
  await page.reload({ waitUntil: 'networkidle', timeout: 60_000 }).catch(() => {});
}
await page.waitForTimeout(1500);
const copy = await page.evaluate(() => {
  const out = [];
  const seen = new Set();
  for (const el of document.querySelectorAll('h1,h2,h3,h4,label,button,p,li,th,td,legend,summary,[role=tab],[class*=chip],[class*=badge],[class*=tag],small,span,a')) {
    if (el.closest('script,style,noscript')) continue;
    if (el.children.length > 2 && !/^(P|LI|H[1-4]|LABEL|BUTTON|A)$/.test(el.tagName)) continue;
    const t = (el.innerText || '').replace(/\s+/g, ' ').trim();
    if (!t || t.length < 2 || t.length > 400 || seen.has(t)) continue;
    seen.add(t);
    out.push(`${el.tagName.toLowerCase()}: ${t}`);
  }
  const inputs = [...document.querySelectorAll('input,textarea,select')].map((i) => `${i.tagName.toLowerCase()}[${i.type || ''}]: ${i.placeholder || i.getAttribute('aria-label') || i.name || ''}`).filter((s) => !s.endsWith(': '));
  return { title: document.title, lines: out.slice(0, 140), inputs: inputs.slice(0, 20) };
});
console.log(JSON.stringify(copy, null, 1));
await b.close();
