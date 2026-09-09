// Colour maths for the kit and the reel: parsing, contrast, a 50 to 950 scale,
// and the mapping from a brand palette onto the reel template's variables.
// Pure functions, no I/O.

export function parseColor(input) {
  if (!input) return null;
  const s = String(input).trim().toLowerCase();
  let m = s.match(/^#([0-9a-f]{3})$/);
  if (m) return m[1].split('').map((c) => parseInt(c + c, 16));
  m = s.match(/^#([0-9a-f]{6})([0-9a-f]{2})?$/);
  if (m) return [0, 2, 4].map((i) => parseInt(m[1].slice(i, i + 2), 16));
  m = s.match(/^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:[,\s/]+([\d.]+%?))?\s*\)$/);
  if (m) {
    const a = m[4] === undefined ? 1 : m[4].endsWith('%') ? parseFloat(m[4]) / 100 : parseFloat(m[4]);
    if (a === 0) return null;
    return [m[1], m[2], m[3]].map((v) => Math.max(0, Math.min(255, Math.round(parseFloat(v)))));
  }
  m = s.match(/^hsla?\(\s*([\d.]+)(?:deg)?[,\s]+([\d.]+)%[,\s]+([\d.]+)%/);
  if (m) return hslToRgb([parseFloat(m[1]) / 360, parseFloat(m[2]) / 100, parseFloat(m[3]) / 100]);
  if (s === 'transparent') return null;
  return null;
}

export function toHex([r, g, b]) {
  return '#' + [r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
}

export function rgbToHsl([r, g, b]) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h;
  switch (max) {
    case r: h = (g - b) / d + (g < b ? 6 : 0); break;
    case g: h = (b - r) / d + 2; break;
    default: h = (r - g) / d + 4;
  }
  return [h / 6, s, l];
}

export function hslToRgb([h, s, l]) {
  if (s === 0) return [l * 255, l * 255, l * 255].map(Math.round);
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const f = (t) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  return [f(h + 1 / 3), f(h), f(h - 1 / 3)].map((v) => Math.round(v * 255));
}

export function luminance([r, g, b]) {
  const c = [r, g, b].map((v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}

export function contrast(a, b) {
  const la = luminance(a), lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

export function mix(a, b, t) {
  return [0, 1, 2].map((i) => Math.round(a[i] * (1 - t) + b[i] * t));
}

export const isDark = (rgb) => luminance(rgb) < 0.18;
export const saturation = (rgb) => rgbToHsl(rgb)[1];

/** Move a colour's lightness toward `dir` (+1 lighter, -1 darker) until it clears `target` against `bg`. */
export function ensureContrast(rgb, bg, target = 4.5, dir = null) {
  if (contrast(rgb, bg) >= target) return rgb;
  const [h, s] = rgbToHsl(rgb);
  const step = dir ?? (isDark(bg) ? 1 : -1);
  let [, , l] = rgbToHsl(rgb);
  for (let i = 0; i < 40; i++) {
    l = Math.max(0, Math.min(1, l + step * 0.025));
    const c = hslToRgb([h, s, l]);
    if (contrast(c, bg) >= target) return c;
  }
  return step > 0 ? [250, 250, 250] : [10, 10, 10];
}

const STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];
const LADDER = [0.97, 0.93, 0.86, 0.76, 0.65, 0.53, 0.44, 0.36, 0.28, 0.2, 0.12];

/** A Tailwind-shaped scale from one hex, keeping the input verbatim at the nearest step. */
export function scale(rgb) {
  const [h, s, l] = rgbToHsl(rgb);
  let nearest = 0;
  LADDER.forEach((L, i) => { if (Math.abs(L - l) < Math.abs(LADDER[nearest] - l)) nearest = i; });
  const out = {};
  STEPS.forEach((step, i) => {
    out[step] = i === nearest ? toHex(rgb) : toHex(hslToRgb([h, Math.min(1, s * (i > nearest ? 1.02 : 0.96)), LADDER[i]]));
  });
  return { steps: out, input_step: STEPS[nearest] };
}

/**
 * Roles from what the probe observed. Every role records where it came from,
 * so the UI can say "observed" or "derived" honestly.
 */
export function buildPalette(observed) {
  const pick = (k) => (observed[k] ? parseColor(observed[k].value) : null);
  let surface = pick('surface') ?? [255, 255, 255];
  let ink = pick('ink') ?? (isDark(surface) ? [245, 245, 245] : [17, 17, 17]);
  let primary = pick('primary');
  let accent = pick('accent');
  const notes = [];
  if (!primary) {
    primary = accent ?? (isDark(surface) ? [120, 170, 255] : [37, 99, 235]);
    notes.push(accent ? 'primary taken from the accent' : 'no brand colour observed, a neutral blue stands in');
  }
  if (!accent || toHex(accent) === toHex(primary)) {
    accent = primary;
    notes.push('accent equals primary; the site shows one colour');
  }
  if (contrast(ink, surface) < 4.5) {
    ink = ensureContrast(ink, surface, 4.5);
    notes.push('ink lightened or darkened to clear 4.5:1 on the surface');
  }
  const onPrimary = contrast([255, 255, 255], primary) >= contrast([17, 17, 17], primary) ? [255, 255, 255] : [17, 17, 17];
  const roles = {
    surface: { hex: toHex(surface), source: observed.surface?.source ?? 'default' },
    ink: { hex: toHex(ink), source: observed.ink?.source ?? 'default' },
    primary: { hex: toHex(primary), source: observed.primary?.source ?? (accent ? 'derived from accent' : 'default') },
    accent: { hex: toHex(accent), source: observed.accent?.source ?? 'derived from primary' },
    on_primary: { hex: toHex(onPrimary), source: 'derived: the better of white or ink on primary' },
  };
  const checks = {
    ink_on_surface: round(contrast(ink, surface)),
    primary_on_surface: round(contrast(primary, surface)),
    on_primary_on_primary: round(contrast(onPrimary, primary)),
    accent_on_surface: round(contrast(accent, surface)),
  };
  return { roles, scale: scale(primary), checks, notes, dark: isDark(surface) };
}

const round = (n) => Math.round(n * 100) / 100;

/** The reel template is a dark terminal; map the brand onto it. */
export function reelVars(palette) {
  const primary = parseColor(palette.roles.primary.hex);
  const accentIn = parseColor(palette.roles.accent.hex);
  const surfaceIn = parseColor(palette.roles.surface.hex);
  const [ph] = rgbToHsl(primary);
  const canvas = isDark(surfaceIn) && luminance(surfaceIn) < 0.02 ? surfaceIn : hslToRgb([ph, 0.35, 0.025]);
  const accent = ensureContrast(saturation(accentIn) < 0.15 ? primary : accentIn, canvas, 5.5, 1);
  const brand = ensureContrast(primary, canvas, 3.2, 1);
  const [ah] = rgbToHsl(accent);
  const ink = mix([255, 255, 255], hslToRgb([ah, 1, 0.9]), 0.35);
  const dim = mix(canvas, ink, 0.36);
  const panel = mix(canvas, accent, 0.09);
  const [r, g, b] = accent;
  return {
    canvas: toHex(canvas), ink: toHex(ink), accent: toHex(accent), dim: toHex(dim), panel: toHex(panel), brand: toHex(brand),
    accent_glow: `rgba(${r}, ${g}, ${b}, 0.8)`,
    ink_scan: `rgba(${ink[0]}, ${ink[1]}, ${ink[2]}, 0.022)`,
  };
}

/** Quantise raw RGB pixels into the few colours that matter (dominant, saturated). */
export function quantize(pixels, count) {
  const bins = new Map();
  for (let i = 0; i + 2 < pixels.length; i += 3) {
    const key = ((pixels[i] >> 4) << 8) | ((pixels[i + 1] >> 4) << 4) | (pixels[i + 2] >> 4);
    const cur = bins.get(key);
    if (cur) { cur.n++; cur.r += pixels[i]; cur.g += pixels[i + 1]; cur.b += pixels[i + 2]; }
    else bins.set(key, { n: 1, r: pixels[i], g: pixels[i + 1], b: pixels[i + 2] });
  }
  const all = [...bins.values()].map((v) => ({ rgb: [v.r / v.n, v.g / v.n, v.b / v.n].map(Math.round), share: v.n / count }))
    .sort((a, b) => b.share - a.share);
  const dominant = all.slice(0, 6).map((c) => ({ hex: toHex(c.rgb), share: round(c.share) }));
  // a brand colour is saturated and mid-toned; a photo's beige is neither, however much of it there is
  const saturated = all
    .filter((c) => { const [, s, l] = rgbToHsl(c.rgb); return s >= 0.45 && l >= 0.22 && l <= 0.72; })
    .map((c) => ({ ...c, score: rgbToHsl(c.rgb)[1] * Math.sqrt(c.share) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 6).map((c) => ({ hex: toHex(c.rgb), share: round(c.share) }));
  return { dominant, saturated };
}

/** Fill and stop colours declared in an SVG, most saturated first (a logo's own palette). */
export function svgColors(svg) {
  const found = new Map();
  const re = /(?:fill|stop-color|stroke)\s*[:=]\s*["']?\s*(#[0-9a-f]{3,8}|rgba?\([^)]*\))/gi;
  let m;
  while ((m = re.exec(svg))) {
    const rgb = parseColor(m[1].length === 9 ? m[1].slice(0, 7) : m[1]);
    if (!rgb) continue;
    const [, s, l] = rgbToHsl(rgb);
    if (s < 0.3 || l < 0.15 || l > 0.85) continue;
    const hex = toHex(rgb);
    found.set(hex, (found.get(hex) ?? 0) + 1);
  }
  // a mark usually carries one loud colour and one quiet one: the loud one is the brand
  return [...found.entries()].map(([hex, n]) => ({ hex, n, s: rgbToHsl(parseColor(hex))[1] }))
    .sort((a, b) => (b.s - a.s) || (b.n - a.n)).map((c) => c.hex);
}
