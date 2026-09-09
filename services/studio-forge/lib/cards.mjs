// Launch cards from the kit: one HTML template per size, screenshotted by the
// same Chromium that renders the reel. Fonts are the kit's own (Space Grotesk
// for text, Anton for the monogram); the site's observed families are
// recorded on the kit but not embedded, since we do not have their files.
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { contrast, parseColor, toHex, isDark, mix, ensureContrast } from './palette.mjs';

const FONTS_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'templates', 'cards', 'fonts');

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export const CARD_SIZES = [
  { name: 'og', w: 1200, h: 630, label: 'Open Graph card', use: 'link previews' },
  { name: 'square', w: 1080, h: 1080, label: 'Square card', use: 'feed posts' },
  { name: 'story', w: 1080, h: 1920, label: 'Story card', use: 'stories and the reel poster' },
  { name: 'banner', w: 1280, h: 640, label: 'README banner', use: 'the repo top of page' },
  { name: 'icon', w: 512, h: 512, label: 'App icon', use: 'avatars and app listings' },
];

function tokens(kit) {
  const p = kit.palette.roles;
  const surface = parseColor(p.surface.hex), ink = parseColor(p.ink.hex), primary = parseColor(p.primary.hex), accent = parseColor(p.accent.hex);
  const dark = isDark(surface);
  const muted = mix(ink, surface, 0.45);
  const rule = mix(ink, surface, 0.82);
  const primaryText = ensureContrast(primary, surface, 3);
  const onPrimary = parseColor(p.on_primary.hex);
  return {
    surface: toHex(surface), ink: toHex(ink), primary: toHex(primary), primaryText: toHex(primaryText), accent: toHex(accent),
    onPrimary: toHex(onPrimary), muted: toHex(muted), rule: toHex(rule), dark,
    wash: toHex(mix(surface, primary, dark ? 0.12 : 0.06)),
  };
}

function css(t) {
  return `
    @font-face { font-family: "Space Grotesk"; src: url("file://${FONTS_DIR}/SpaceGrotesk.ttf") format("truetype-variations"); font-weight: 300 700; }
    @font-face { font-family: "Anton"; src: url("file://${FONTS_DIR}/Anton.ttf") format("truetype"); }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { background: ${t.surface}; color: ${t.ink}; font-family: "Space Grotesk", system-ui, sans-serif; -webkit-font-smoothing: antialiased; }
    .card { position: relative; overflow: hidden; width: 100%; height: 100%; background: linear-gradient(135deg, ${t.surface} 0%, ${t.surface} 55%, ${t.wash} 100%); display: flex; flex-direction: column; }
    .stripe { position: absolute; left: 0; top: 0; width: 100%; height: 14px; background: ${t.primary}; }
    .brand { display: flex; align-items: center; gap: 22px; }
    .mark { display: inline-flex; align-items: center; justify-content: center; flex: none; border-radius: 18%; overflow: hidden; background: ${t.primary}; color: ${t.onPrimary}; font-family: "Anton", sans-serif; }
    .mark img { width: 100%; height: 100%; object-fit: contain; display: block; background: transparent; }
    .name { font-weight: 600; letter-spacing: -0.01em; }
    h1 { font-weight: 700; letter-spacing: -0.03em; line-height: 1.02; text-wrap: balance; }
    p { color: ${t.muted}; line-height: 1.35; font-weight: 400; text-wrap: pretty; }
    .foot { margin-top: auto; display: flex; align-items: center; justify-content: space-between; border-top: 2px solid ${t.rule}; padding-top: 22px; }
    .host { font-weight: 500; color: ${t.primaryText}; letter-spacing: 0.02em; }
    .chip { display: inline-block; padding: 8px 16px; border-radius: 999px; background: ${t.primary}; color: ${t.onPrimary}; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; }
  `;
}

function markHtml(kit, size, useLogo) {
  const logo = (kit.logos || []).find((l) => l.picked);
  if (useLogo && logo && logo.kind !== 'og-image' && logo.file_path) {
    return `<span class="mark" style="width:${size}px;height:${size}px;background:transparent"><img id="logo" src="file://${esc(logo.file_path)}" alt=""></span>`;
  }
  const letter = (kit.name || '?').trim().charAt(0).toUpperCase();
  return `<span class="mark" style="width:${size}px;height:${size}px;font-size:${Math.round(size * 0.66)}px">${esc(letter)}</span>`;
}

/** Trim to a sentence boundary under `max` characters, or to a word with an ellipsis. */
function trimTo(text, max) {
  const s = String(text ?? '').replace(/\s+/g, ' ').trim();
  if (s.length <= max) return s;
  const head = s.slice(0, max);
  const stop = Math.max(head.lastIndexOf('. '), head.lastIndexOf('! '), head.lastIndexOf('? '));
  if (stop > max * 0.45) return head.slice(0, stop + 1);
  const sp = head.lastIndexOf(' ');
  return (sp > max * 0.6 ? head.slice(0, sp) : head).replace(/[,;:]$/, '') + '…';
}

/** A headline size that shrinks with length so three lines is the ceiling. */
function fitHead(text, base) {
  const n = text.length;
  if (n <= 36) return base;
  if (n <= 60) return Math.round(base * 0.82);
  if (n <= 90) return Math.round(base * 0.66);
  return Math.round(base * 0.56);
}

function page(kit, spec, useLogo) {
  const t = tokens(kit);
  const name = esc(kit.name);
  const rawTag = trimTo(kit.tagline || kit.one_liner || '', spec.name === 'banner' ? 90 : 110);
  const tagline = esc(rawTag);
  const line = esc(trimTo(kit.one_liner && kit.tagline && kit.one_liner !== kit.tagline ? kit.one_liner : kit.description || '', spec.name === 'story' ? 150 : 130));
  const host = esc(kit.host);
  const status = esc(kit.status || 'Now live');
  const h = (base) => fitHead(rawTag, base);
  let body;
  if (spec.name === 'icon') {
    body = `<div class="card" style="align-items:center;justify-content:center;background:${t.surface}">${markHtml(kit, 400, useLogo)}</div>`;
  } else if (spec.name === 'story') {
    body = `<div class="card" style="padding:120px 96px 110px"><div class="stripe"></div>
      <div class="brand">${markHtml(kit, 96, useLogo)}<span class="name" style="font-size:44px">${name}</span></div>
      <div style="margin:auto 0;padding:80px 0"><h1 style="font-size:${h(112)}px">${tagline}</h1>
      <p style="font-size:40px;margin-top:44px;max-width:820px">${line}</p></div>
      <div class="foot"><span class="host" style="font-size:40px">${host}</span><span class="chip" style="font-size:26px">${status}</span></div></div>`;
  } else if (spec.name === 'square') {
    body = `<div class="card" style="padding:88px 84px 80px"><div class="stripe"></div>
      <div class="brand">${markHtml(kit, 84, useLogo)}<span class="name" style="font-size:40px">${name}</span></div>
      <div style="margin:auto 0;padding:48px 0"><h1 style="font-size:${h(88)}px">${tagline}</h1>
      <p style="font-size:34px;margin-top:36px;max-width:860px">${line}</p></div>
      <div class="foot"><span class="host" style="font-size:34px">${host}</span><span class="chip" style="font-size:22px">${status}</span></div></div>`;
  } else if (spec.name === 'banner') {
    body = `<div class="card" style="padding:64px 80px 56px"><div class="stripe"></div>
      <div class="brand">${markHtml(kit, 72, useLogo)}<span class="name" style="font-size:36px">${name}</span></div>
      <h1 style="font-size:${h(76)}px;margin-top:52px;max-width:1040px">${tagline}</h1>
      <div class="foot"><span class="host" style="font-size:30px">${host}</span><span class="chip" style="font-size:20px">${status}</span></div></div>`;
  } else {
    body = `<div class="card" style="padding:64px 76px 56px"><div class="stripe"></div>
      <div class="brand">${markHtml(kit, 72, useLogo)}<span class="name" style="font-size:36px">${name}</span></div>
      <h1 style="font-size:${h(72)}px;margin-top:48px;max-width:1000px">${tagline}</h1>
      <p style="font-size:28px;margin-top:22px;max-width:900px">${line}</p>
      <div class="foot"><span class="host" style="font-size:28px">${host}</span><span class="chip" style="font-size:19px">${status}</span></div></div>`;
  }
  return `<!doctype html><html><head><meta charset="utf-8"><style>${css(t)}</style></head><body style="width:${spec.w}px;height:${spec.h}px">${body}</body></html>`;
}

export async function renderCards({ kit, outDir, fileUrl, onStep }) {
  await mkdir(outDir, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const out = [];
  let logoUsed = false;
  try {
    const ctx = await browser.newContext({ deviceScaleFactor: 1 });
    const pg = await ctx.newPage();
    // pages are opened from a file so the fonts and the logo (both file://) may load;
    // a setContent page has no file origin and Chromium refuses them there
    const show = async (spec, useLogo) => {
      const htmlPath = path.join(outDir, `${spec.name}.html`);
      await writeFile(htmlPath, page(kit, spec, useLogo));
      await pg.setViewportSize({ width: spec.w, height: spec.h });
      await pg.goto(`file://${htmlPath}`, { waitUntil: 'load' });
      await pg.evaluate(() => document.fonts.ready);
      await pg.waitForTimeout(120);
      return pg.evaluate(() => { const i = document.getElementById('logo'); return !i || (i.complete && i.naturalWidth > 0); });
    };
    for (const spec of CARD_SIZES) {
      onStep?.(`rendering the ${spec.label.toLowerCase()}`);
      let ok = await show(spec, true);
      if (!ok) ok = await show(spec, false); // the site's logo would not load: monogram instead
      else logoUsed = logoUsed || Boolean((kit.logos || []).find((l) => l.picked && l.kind !== 'og-image'));
      const file = `${spec.name}.png`;
      await pg.screenshot({ path: path.join(outDir, file), type: 'png' });
      out.push({ name: spec.name, label: spec.label, use: spec.use, w: spec.w, h: spec.h, url: `${fileUrl}/${file}` });
    }
  } finally {
    await browser.close();
  }
  const t = tokens(kit);
  return { cards: out, logo_used: logoUsed, contrast: { ink_on_surface: Math.round(contrast(parseColor(t.ink), parseColor(t.surface)) * 100) / 100 } };
}
