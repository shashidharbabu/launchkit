// gen-styles: compiles the Flight Paperwork design system (Tailwind v4 +
// launchkit-src/frontend/app/globals.css) into ONE scoped, self-contained CSS
// string, emitted as a generated TS module the app injects at mount.
//
// Why this shape (doc 03 §8.1 "codegen instead of loaders"):
//  - the server build's canonical bundler has no Tailwind pass and CSS-file
//    support is undocumented — a generated .ts module needs neither;
//  - the platform styles doctrine forbids separate stylesheet files;
//  - the app is a Module Federation remote inside the shell's page, so every
//    rule is scoped under .lk-root to make leakage into shell chrome
//    impossible (html/body/:root rules are rewritten onto .lk-root).
//
// Fonts: IBM Plex woff2 (latin) are embedded as data: URIs so the bundle is
// self-contained — no runtime font fetch, no bundler asset handling needed.
//
// Run: node tools/gen-styles.mjs        (rerun whenever globals.css or any
// class name in the scanned sources changes; CI-safe, deterministic)
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import postcss from 'postcss';

const ROOT = new URL('..', import.meta.url).pathname;
const ENTRY = join(ROOT, 'tools', 'styles-entry.css');
const RAW_OUT = join(ROOT, 'tools', '.styles-raw.css');
const TS_OUT = join(ROOT, 'apps', 'launchkit', 'src', 'styles.generated.ts');
const FONT_DIR = join(ROOT, 'tools', 'fonts');
const SCOPE = '.lk-root';

// ---------------------------------------------------------------- fonts
// Downloaded once and committed; re-fetched only if missing.
const FONTS = [
  { family: 'IBM Plex Sans', weight: 400, file: 'plex-sans-400.woff2' },
  { family: 'IBM Plex Sans', weight: 500, file: 'plex-sans-500.woff2' },
  { family: 'IBM Plex Sans', weight: 600, file: 'plex-sans-600.woff2' },
  { family: 'IBM Plex Mono', weight: 400, file: 'plex-mono-400.woff2' },
  { family: 'IBM Plex Mono', weight: 500, file: 'plex-mono-500.woff2' },
];

async function ensureFonts() {
  mkdirSync(FONT_DIR, { recursive: true });
  const missing = FONTS.filter((f) => !existsSync(join(FONT_DIR, f.file)));
  if (missing.length === 0) return;
  const fam = (name) => name.replaceAll(' ', '+');
  for (const family of ['IBM Plex Sans', 'IBM Plex Mono']) {
    const weights = FONTS.filter((f) => f.family === family).map((f) => f.weight);
    const url = `https://fonts.googleapis.com/css2?family=${fam(family)}:wght@${weights.join(';')}&display=swap`;
    const css = await (await fetch(url, {
      // a modern UA gets woff2 sources
      headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120 Safari/537.36' },
    })).text();
    for (const f of FONTS.filter((x) => x.family === family)) {
      // take the LATIN block for this weight
      const re = new RegExp(
        `/\\* latin \\*/\\s*@font-face \\{[^}]*font-family: '${family}';[^}]*font-weight: ${f.weight};[^}]*url\\((https://[^)]+\\.woff2)\\)[^}]*\\}`,
        's');
      const m = css.match(re);
      if (!m) throw new Error(`no latin woff2 for ${family} ${f.weight}`);
      const buf = Buffer.from(await (await fetch(m[1])).arrayBuffer());
      writeFileSync(join(FONT_DIR, f.file), buf);
      console.log(`fetched ${f.file} (${(buf.length / 1024).toFixed(0)}KB)`);
    }
  }
}

function fontFaces() {
  return FONTS.map((f) => {
    const b64 = readFileSync(join(FONT_DIR, f.file)).toString('base64');
    return `@font-face{font-family:'${f.family}';font-style:normal;font-weight:${f.weight};font-display:swap;` +
      `src:url(data:font/woff2;base64,${b64}) format('woff2');` +
      `unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD;}`;
  }).join('\n');
}

// ---------------------------------------------------------------- scoping
function scopeSelector(sel) {
  const s = sel.trim();
  if (s.startsWith(SCOPE)) return s;
  // token roots and page elements collapse onto the app root
  if (s === ':root' || s === 'html' || s === 'body') return SCOPE;
  if (s.startsWith(':root')) return SCOPE + s.slice(5);
  if (s === '*') return `${SCOPE}, ${SCOPE} *`;
  if (s === '::before, ::after' || s === '::before' || s === '::after') {
    return s.split(',').map((p) => `${SCOPE} ${p.trim()}`).join(', ');
  }
  // dark-mode class lives on the app root, not <html>
  if (s.startsWith('.dark')) return SCOPE + s.replace(/^\.dark/, '.dark');
  return `${SCOPE} ${s}`;
}

function flattenLayers(root) {
  // Cascade layers lose to ANY unlayered stylesheet (the shell's). Flatten
  // every @layer into plain rules, preserving order — with .lk-root scoping,
  // specificity then wins where it should.
  let found = true;
  while (found) {
    found = false;
    root.walkAtRules('layer', (at) => {
      found = true;
      if (at.nodes && at.nodes.length) at.replaceWith(at.nodes);
      else at.remove();
    });
  }
}

function scopeCss(css) {
  const root = postcss.parse(css);
  flattenLayers(root);
  root.walkRules((rule) => {
    // skip rules inside @keyframes / @font-face / @property
    let p = rule.parent;
    while (p && p.type === 'atrule') {
      if (/^(keyframes|font-face|property|counter-style|page)/.test(p.name)) return;
      p = p.parent;
    }
    if (rule.parent?.type === 'atrule' && /^(keyframes|font-face|property)/.test(rule.parent.name)) return;
    rule.selectors = rule.selectors.map(scopeSelector);
  });
  return root.toString();
}

// ---------------------------------------------------------------- main
await ensureFonts();

// entry css: the design system verbatim + content sources. Scanning the
// ORIGINAL frontend keeps the utility set complete and identical — ported
// components copy their className strings verbatim.
writeFileSync(ENTRY, [
  `@import '../launchkit-src/frontend/app/globals.css';`,
  `@source '../launchkit-src/frontend/app';`,
  `@source '../launchkit-src/frontend/components';`,
  `@source '../launchkit-src/frontend/lib';`,
  `@source '../apps/launchkit/src';`,
  // the port sets the font vars the design system's tokens chain to
  `:root{--font-plex-sans:'IBM Plex Sans';--font-plex-mono:'IBM Plex Mono';}`,
].join('\n'));

execFileSync('npx', ['@tailwindcss/cli', '-i', ENTRY, '-o', RAW_OUT, '--minify'],
  { cwd: ROOT, stdio: ['ignore', 'inherit', 'inherit'] });

const raw = readFileSync(RAW_OUT, 'utf8');
const scoped = scopeCss(raw);
const rootFill =
  `${SCOPE}{min-height:100vh;background:var(--background);color:var(--foreground);}`;
const finalCss = fontFaces() + '\n' + scoped + '\n' + rootFill;

const banner =
  '// GENERATED by tools/gen-styles.mjs — DO NOT EDIT.\n' +
  '// Flight Paperwork design system, compiled + scoped under .lk-root,\n' +
  '// fonts embedded. Regenerate: node tools/gen-styles.mjs\n';
writeFileSync(TS_OUT, `${banner}export const LK_CSS: string = ${JSON.stringify(finalCss)};\n`);

console.log(`raw ${(raw.length / 1024).toFixed(0)}KB -> scoped+fonts ${(finalCss.length / 1024).toFixed(0)}KB -> ${TS_OUT}`);
