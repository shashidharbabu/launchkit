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
    // networkidle first, then load, then the DOM alone: a marketing site that keeps a
    // socket or an analytics beacon open never goes idle, and a heavy one (cal.com,
    // 2026-09-18) never reaches load inside 45 s either. The copy and the screenshot
    // only need the DOM; images that are still loading are given the wait below.
    let nav = 'networkidle';
    try {
      await page.goto(siteUrl, { waitUntil: 'networkidle', timeout: 45_000 });
    } catch {
      try {
        nav = 'load';
        await page.goto(siteUrl, { waitUntil: 'load', timeout: 45_000 });
      } catch {
        nav = 'domcontentloaded';
        await page.goto(siteUrl, { waitUntil: 'domcontentloaded', timeout: 45_000 });
        await page.waitForTimeout(5000);
      }
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

    onStep?.('reading the copy');
    // the site's own words: what the reel and the cards may quote
    const copy = await page.evaluate(() => {
      const out = [];
      const seen = new Set();
      for (const el of document.querySelectorAll('h1,h2,h3,h4,label,button,p,li,th,td,legend,summary,[role=tab],[class*=chip],[class*=badge],[class*=tag],small,span,a')) {
        if (el.closest('script,style,noscript')) continue;
        if (el.children.length > 2 && !/^(P|LI|H[1-4]|LABEL|BUTTON|A)$/.test(el.tagName)) continue;
        const t = (el.innerText || '').replace(/\s+/g, ' ').trim();
        if (!t || t.length < 2 || t.length > 300 || seen.has(t)) continue;
        seen.add(t);
        out.push(`${el.tagName.toLowerCase()}: ${t}`);
        if (out.length >= 80) break;
      }
      const inputs = [...document.querySelectorAll('input,textarea,select')].map((i) => `${i.tagName.toLowerCase()}: ${i.placeholder || i.getAttribute('aria-label') || i.name || ''}`).filter((s) => !s.endsWith(': ')).slice(0, 12);
      return { lines: out, inputs };
    });

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
      // a header also carries things that are not the mark: status pills, award badges, sponsor logos, avatars, flags
      const notAMark = /status|operational|uptime|badge|shield|sponsor|avatar|flag|award|partner|trusted|backed|g2crowd|producthunt|github-?star|stargazer|\bstars?\b|\bsoc ?2\b|\bhipaa\b|\bgdpr\b|\biso\b/i;
      const headerImgs = [...document.querySelectorAll('header img, nav img, [class*="logo"] img, img[class*="logo"], img[alt*="logo" i], a[href="/"] img')]
        // the footer's brand link is an a[href="/"] too, so it used to pass as the site's header mark
        // and outrank it: formbricks picked footerlogo.svg over the logo in its own header
        .slice(0, 8).map((img) => ({ kind: 'site-logo', url: abs(img.currentSrc || img.src), alt: img.alt || '', w: img.naturalWidth, h: img.naturalHeight, href: img.closest('a')?.getAttribute('href') || '', header: Boolean(img.closest('header, nav')) || (Boolean(img.closest('a[href="/"]')) && !img.closest('footer, [class*="footer"]')) }))
        // a customer or partner logo wall matches [class*="logo"] too: only a mark inside the header, the nav or the home link is the site's own
        .filter((i) => i.url && !/data:image\/gif/.test(i.url) && !notAMark.test(`${i.alt} ${i.url} ${i.href}`) && (i.header || !/compan|customer|client|partner|testimonial|brands?\/|logos?\//i.test(i.url)))
        .sort((x, y) => Number(y.header) - Number(x.header)).slice(0, 6);
      const headerSvg = [...document.querySelectorAll('header svg, nav svg, a[href="/"] svg, [class*="logo"] svg')]
        .filter((s) => !s.closest('footer, [class*="footer"]')).slice(0, 5)
        .map((s) => { const r = s.getBoundingClientRect(); return { kind: 'site-logo-svg', svg: s.outerHTML, w: Math.round(r.width), h: Math.round(r.height), text: (s.closest('a')?.textContent || s.getAttribute('aria-label') || '') + ' ' + (s.closest('a')?.getAttribute('href') || '') }; })
        .filter((s) => s.w >= 24 && s.svg.length < 60_000 && !notAMark.test(s.text) && !notAMark.test(s.svg.slice(0, 400))).slice(0, 3);

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
    for (const img of dom.headerImgs) { await save(`logo-${++n}`, img.url, img.header ? 'site-logo' : 'site-logo-loose', { w: img.w, h: img.h, alt: img.alt }); if (n >= 2) break; }
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
    // a logo-classed image outside the header (a customer wall, a footer badge) ranks after the site's own icons
    const rank = { 'site-logo': 0, 'site-logo-svg': 1, 'apple-touch-icon': 2, icon: 3, 'site-logo-loose': 4, 'og-image': 5 };
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
    // HSL saturation runs high on near-white greys (#e2e8f0 reads 0.32), so a colour also needs real chroma to count as a brand colour
    const chroma = (c) => (Math.max(c[0], c[1], c[2]) - Math.min(c[0], c[1], c[2])) / 255;
    const distinct = (v) => { const c = parseColor(v); return c && saturation(c) >= 0.3 && chroma(c) >= 0.12 && Math.abs(luminance(c) - luminance(surfaceRgb)) > 0.05; };
    for (const b of dom.buttons) if (distinct(b.bg)) { setObs('primary', b.bg, 'most common button background'); break; }
    if (!observed.primary && dom.theme_color && distinct(dom.theme_color)) setObs('primary', dom.theme_color, 'meta theme-color');
    if (!observed.primary) {
      const varHit = Object.entries(dom.vars).find(([k, v]) => /primary|brand|accent/i.test(k) && distinct(v));
      if (varHit) setObs('primary', varHit[1], `css variable ${varHit[0]}`);
    }
    if (!observed.primary && logoColors[0]) setObs('primary', logoColors[0], `the ${picked.kind.replace(/-/g, ' ')}'s own colour`);
    // A colour that covers almost none of the page is not the brand: on a monochrome site the one
    // saturated thing in the screenshot is usually a status pill, a badge or a sponsor logo, and
    // taking it made cal.com's primary the green of "all systems operational".
    const BRAND_MIN_AREA = 0.005;
    const bigEnough = (c) => (c.area ?? c.share ?? 0) >= BRAND_MIN_AREA;
    if (!observed.primary) { const s = shot.saturated.find(bigEnough); if (s) setObs('primary', s.hex, 'screenshot, strongest saturated colour'); }
    // A brand can simply have no colour in it (black buttons on a white page). Its primary is then
    // the button, not the only coloured pixel on the page. Skip see-through overlays: a
    // half-transparent black scrim is not a brand colour.
    if (!observed.primary) {
      const opaque = (bg) => { const m = String(bg).match(/^rgba\([^)]*[,/]\s*([\d.]+%?)\s*\)$/); if (!m) return true; const a = m[1].endsWith('%') ? parseFloat(m[1]) / 100 : parseFloat(m[1]); return a >= 0.9; };
      const solid = dom.buttons.find((b) => { const c = parseColor(b.bg); return c && opaque(b.bg) && Math.abs(luminance(c) - luminance(surfaceRgb)) > 0.25; });
      if (solid) setObs('primary', solid.bg, 'most common button background (the brand carries no colour)');
    }
    // Last resort. Every chromatic source has failed and the buttons were all see-through, so the
    // page genuinely carries no brand colour; its ink is the closest true answer. documenso lands
    // here: before the area floor it was handed a green that covered none of the page.
    if (!observed.primary && dom.body_fg && parseColor(dom.body_fg)) {
      setObs('primary', dom.body_fg, 'body text colour (no brand colour anywhere on the page)');
    }
    const notPrimary = (hex) => !observed.primary || hex !== observed.primary.value;
    // rgb(0,0,238) is the user agent's default for an unstyled link, not a decision anyone made
    const UA_LINK_BLUE = '#0000ee';
    for (const l of dom.links) { const c = parseColor(l.color); if (c && distinct(l.color) && toHex(c) !== UA_LINK_BLUE && notPrimary(toHex(c))) { setObs('accent', l.color, 'most common link colour'); break; } }
    if (!observed.accent) { const second = logoColors.find(notPrimary); if (second) setObs('accent', second, `the ${picked.kind.replace(/-/g, ' ')}'s second colour`); }
    if (!observed.accent) { const second = shot.saturated.filter(bigEnough).map((c) => c.hex).find(notPrimary); if (second) setObs('accent', second, 'screenshot, second saturated colour'); }
    const palette = buildPalette(observed);

    const clean = (f) => f.split(',')[0].replace(/["']/g, '').trim();
    return {
      site_url: siteUrl, navigation: nav, title: dom.title, description: dom.description, theme_color: dom.theme_color,
      screenshot_url: `${fileUrl}/site.png`,
      copy: { lines: copy.lines, inputs: copy.inputs, text: [...copy.lines, ...copy.inputs].join('\n').slice(0, 2400) },
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
