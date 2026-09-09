// Read a live site the way the Brand stage reads its words: only what is
// there. Colours from computed styles and a screenshot, the logo the site
// already serves, the font families it actually renders with.
import { chromium } from 'playwright';
import sharp from 'sharp';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { buildPalette, parseColor, quantize, toHex, saturation, luminance, svgColors } from './palette.mjs';

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128 Safari/537.36 LaunchKitStudio/1.0';

export async function probeSite({ siteUrl, outDir, fileUrl, onStep }) {
  await mkdir(outDir, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  try {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, userAgent: UA, deviceScaleFactor: 1 });
    const page = await ctx.newPage();
    onStep?.('opening the site');
    let nav = 'networkidle';
    try {
      await page.goto(siteUrl, { waitUntil: 'networkidle', timeout: 45_000 });
    } catch {
      nav = 'load';
      await page.goto(siteUrl, { waitUntil: 'load', timeout: 45_000 });
    }
    await page.waitForTimeout(800);
    // free-tier hosts serve a "waking up" page first; wait for the real app
    for (let i = 0; i < 6; i++) {
      const asleep = await page.evaluate(() => /application loading|starting|waking|spinning up|please wait/i.test(document.title) || /Render - Application loading/i.test(document.body?.innerText ?? ''));
      if (!asleep) break;
      onStep?.(`the site is waking up (${i + 1} of 6)`);
      await page.waitForTimeout(9000);
      try { await page.reload({ waitUntil: 'networkidle', timeout: 45_000 }); } catch { /* try again */ }
    }

    onStep?.('reading colours, logo and type');
    const dom = await page.evaluate(() => {
      const abs = (u) => { try { return new URL(u, location.href).href; } catch { return ''; } };
      const q = (s) => document.querySelector(s);
      const cs = (el) => (el ? getComputedStyle(el) : null);
      const bodyCs = cs(document.body), htmlCs = cs(document.documentElement);
      const h1 = q('h1') || q('h2');
      const transparent = (c) => !c || c === 'transparent' || /rgba\(\s*\d+,\s*\d+,\s*\d+,\s*0\)/.test(c);

      const bg = !transparent(bodyCs?.backgroundColor) ? bodyCs.backgroundColor : !transparent(htmlCs?.backgroundColor) ? htmlCs.backgroundColor : '';
      const buttons = [...document.querySelectorAll('button, a[class*="btn"], a[class*="button"], [role="button"], a[class*="cta"]')]
        .map((el) => cs(el)).filter((c) => c && !transparent(c.backgroundColor)).map((c) => ({ bg: c.backgroundColor, fg: c.color }));
      const buttonCounts = {};
      for (const b of buttons) buttonCounts[b.bg] = (buttonCounts[b.bg] || 0) + 1;
      const links = [...document.querySelectorAll('a')].slice(0, 200).map((a) => cs(a)?.color).filter(Boolean);
      const linkCounts = {};
      for (const c of links) linkCounts[c] = (linkCounts[c] || 0) + 1;

      const vars = {};
      for (const sheet of document.styleSheets) {
        let rules; try { rules = sheet.cssRules; } catch { continue; }
        for (const r of rules) {
          if (!r.style || !r.selectorText) continue;
          if (!/(^|,)\s*(:root|html|body)\s*($|,)/.test(r.selectorText)) continue;
          for (const p of r.style) if (p.startsWith('--')) vars[p] = r.style.getPropertyValue(p).trim();
        }
      }

      const icons = [...document.querySelectorAll('link[rel~="icon"], link[rel="apple-touch-icon"], link[rel="apple-touch-icon-precomposed"]')]
        .map((l) => ({ kind: /apple/.test(l.rel) ? 'apple-touch-icon' : 'icon', url: abs(l.href), sizes: l.getAttribute('sizes') || '' }));
      const og = q('meta[property="og:image"]')?.content;
      const headerImgs = [...document.querySelectorAll('header img, nav img, [class*="logo"] img, img[class*="logo"], img[alt*="logo" i], a[href="/"] img')]
        .slice(0, 6).map((img) => ({ kind: 'site-logo', url: abs(img.currentSrc || img.src), alt: img.alt || '', w: img.naturalWidth, h: img.naturalHeight }))
        .filter((i) => i.url && !/data:image\/gif/.test(i.url));
      const headerSvg = [...document.querySelectorAll('header svg, nav svg, a[href="/"] svg, [class*="logo"] svg')].slice(0, 3)
        .map((s) => { const r = s.getBoundingClientRect(); return { kind: 'site-logo-svg', svg: s.outerHTML, w: Math.round(r.width), h: Math.round(r.height) }; })
        .filter((s) => s.w >= 24 && s.svg.length < 60_000);

      return {
        title: document.title || '',
        description: q('meta[name="description"]')?.content || q('meta[property="og:description"]')?.content || '',
        theme_color: q('meta[name="theme-color"]')?.content || '',
        body_bg: bg, body_fg: bodyCs?.color || '', body_font: bodyCs?.fontFamily || '',
        heading_font: cs(h1)?.fontFamily || '', heading_color: cs(h1)?.color || '',
        buttons: Object.entries(buttonCounts).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([bg, n]) => ({ bg, n, fg: buttons.find((b) => b.bg === bg)?.fg })),
        links: Object.entries(linkCounts).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([c, n]) => ({ color: c, n })),
        vars, icons, og: og ? abs(og) : '', headerImgs, headerSvg,
      };
    });

    onStep?.('taking the screenshot');
    const shotPath = path.join(outDir, 'site.png');
    await page.screenshot({ path: shotPath, fullPage: false });
    const small = await sharp(shotPath).resize(96, 60, { fit: 'fill' }).removeAlpha().raw().toBuffer();
    const shot = quantize(small, 96 * 60);

    onStep?.('fetching the logo');
    const logos = [];
    const save = async (name, url, kind, extra = {}) => {
      try {
        const res = await page.request.get(url, { timeout: 15_000 });
        if (!res.ok()) return;
        const ct = res.headers()['content-type'] || '';
        const ext = /svg/.test(ct) || /\.svg(\?|$)/.test(url) ? 'svg' : /png/.test(ct) ? 'png' : /jpe?g/.test(ct) ? 'jpg' : /webp/.test(ct) ? 'webp' : /ico/.test(ct) || /\.ico(\?|$)/.test(url) ? 'ico' : 'bin';
        if (ext === 'bin') return;
        const body = await res.body();
        if (body.length < 200) return;
        const file = `${name}.${ext}`;
        await writeFile(path.join(outDir, file), body);
        let w = extra.w || 0, h = extra.h || 0;
        if (ext !== 'svg' && ext !== 'ico') { try { const m = await sharp(body).metadata(); w = m.width || w; h = m.height || h; } catch { /* keep zeros */ } }
        logos.push({ kind, file, url: `${fileUrl}/${file}`, source: url, w, h, ...(extra.alt ? { alt: extra.alt } : {}) });
      } catch { /* a missing candidate is not an error */ }
    };
    let n = 0;
    for (const img of dom.headerImgs) { await save(`logo-${++n}`, img.url, 'site-logo', { w: img.w, h: img.h, alt: img.alt }); if (n >= 2) break; }
    for (const s of dom.headerSvg) {
      const file = `logo-${++n}.svg`;
      await writeFile(path.join(outDir, file), s.svg);
      logos.push({ kind: 'site-logo-svg', file, url: `${fileUrl}/${file}`, source: 'inline svg in the header', w: s.w, h: s.h });
      if (n >= 3) break;
    }
    const bySize = (a, b) => (parseInt(b.sizes) || 0) - (parseInt(a.sizes) || 0);
    const apple = dom.icons.filter((i) => i.kind === 'apple-touch-icon').sort(bySize)[0];
    if (apple) await save(`logo-${++n}`, apple.url, 'apple-touch-icon');
    const icon = dom.icons.filter((i) => i.kind === 'icon').sort(bySize)[0];
    if (icon) await save(`logo-${++n}`, icon.url, 'icon');
    if (dom.og) await save(`logo-${++n}`, dom.og, 'og-image');
    const rank = { 'site-logo': 0, 'site-logo-svg': 1, 'apple-touch-icon': 2, icon: 3, 'og-image': 4 };
    logos.sort((a, b) => rank[a.kind] - rank[b.kind]);
    // an og image is a picture, not a mark: only picked when nothing else exists
    const picked = logos.find((l) => l.kind !== 'og-image') ?? logos[0] ?? null;
    if (picked) picked.picked = true;

    // the logo's own colours: the strongest brand evidence a page carries
    let logoColors = [];
    if (picked && picked.kind !== 'og-image') {
      try {
        const buf = await readFile(path.join(outDir, picked.file));
        if (picked.file.endsWith('.svg')) logoColors = svgColors(buf.toString('utf8'));
        else if (!picked.file.endsWith('.ico')) {
          const raw = await sharp(buf).resize(48, 48, { fit: 'inside' }).removeAlpha().raw().toBuffer({ resolveWithObject: true });
          logoColors = quantize(raw.data, raw.info.width * raw.info.height).saturated.map((c) => c.hex);
        }
      } catch { logoColors = []; }
    }

    onStep?.('choosing the palette');
    // observed colours, best evidence first
    const observed = {};
    const setObs = (k, value, source) => { const rgb = parseColor(value); if (rgb && !observed[k]) observed[k] = { value: toHex(rgb), source }; };
    setObs('surface', dom.body_bg, 'computed body background');
    if (!observed.surface && shot.dominant[0]) setObs('surface', shot.dominant[0].hex, 'screenshot dominant colour');
    setObs('ink', dom.body_fg, 'computed body text colour');
    const surfaceRgb = observed.surface ? parseColor(observed.surface.value) : [255, 255, 255];
    const distinct = (v) => { const c = parseColor(v); return c && saturation(c) >= 0.3 && Math.abs(luminance(c) - luminance(surfaceRgb)) > 0.05; };
    for (const b of dom.buttons) if (distinct(b.bg)) { setObs('primary', b.bg, 'most common button background'); break; }
    if (!observed.primary && dom.theme_color && distinct(dom.theme_color)) setObs('primary', dom.theme_color, 'meta theme-color');
    if (!observed.primary) {
      const varHit = Object.entries(dom.vars).find(([k, v]) => /primary|brand|accent/i.test(k) && distinct(v));
      if (varHit) setObs('primary', varHit[1], `css variable ${varHit[0]}`);
    }
    if (!observed.primary && logoColors[0]) setObs('primary', logoColors[0], `the ${picked.kind.replace(/-/g, ' ')}'s own colour`);
    if (!observed.primary && shot.saturated[0]) setObs('primary', shot.saturated[0].hex, 'screenshot, strongest saturated colour');
    const notPrimary = (hex) => !observed.primary || hex !== observed.primary.value;
    for (const l of dom.links) { const c = parseColor(l.color); if (c && distinct(l.color) && notPrimary(toHex(c))) { setObs('accent', l.color, 'most common link colour'); break; } }
    if (!observed.accent) { const second = logoColors.find(notPrimary); if (second) setObs('accent', second, `the ${picked.kind.replace(/-/g, ' ')}'s second colour`); }
    if (!observed.accent) { const second = shot.saturated.map((c) => c.hex).find(notPrimary); if (second) setObs('accent', second, 'screenshot, second saturated colour'); }
    const palette = buildPalette(observed);

    const clean = (f) => f.split(',')[0].replace(/["']/g, '').trim();
    return {
      site_url: siteUrl, navigation: nav, title: dom.title, description: dom.description, theme_color: dom.theme_color,
      screenshot_url: `${fileUrl}/site.png`,
      observed, palette,
      fonts: { heading: clean(dom.heading_font), body: clean(dom.body_font) },
      logos,
      evidence: {
        logo_colors: logoColors.slice(0, 6),
        buttons: dom.buttons, links: dom.links, screenshot: shot,
        css_variables: Object.fromEntries(Object.entries(dom.vars).filter(([k]) => /color|primary|accent|brand|bg|background|ink|fg|foreground/i.test(k)).slice(0, 24)),
      },
    };
  } finally {
    await browser.close();
  }
}
