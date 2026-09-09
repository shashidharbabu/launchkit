// Render one reel from a concept plus a script (the slot values).
//
// Two kinds of concept live in templates/<name>/:
//  - a tokenised template (index.html + slots.json), filled by substitution;
//  - a module (concept.mjs exporting `spec` and `build`) that generates the
//    whole composition from the values, so it can draw scenes, not just words.
// Both then go through HyperFrames, loudness mastering, a poster and a filmstrip.
import { cp, mkdir, readFile, readdir, stat, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { reelVars } from './palette.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TEMPLATES = path.join(ROOT, 'templates');
export const HYPERFRAMES = 'hyperframes@0.8.3';

export async function loadConcept(concept) {
  if (!/^[a-z0-9-]+$/.test(concept)) throw new Error(`unknown concept: ${concept}`);
  const dir = path.join(TEMPLATES, concept);
  const modPath = path.join(dir, 'concept.mjs');
  if (existsSync(modPath)) {
    // the mtime in the URL lets an edited concept load without restarting the forge
    const { mtimeMs } = await stat(modPath);
    const mod = await import(`${pathToFileURL(modPath).href}?v=${Math.round(mtimeMs)}`);
    return { dir, spec: mod.spec, build: mod.build };
  }
  if (!existsSync(path.join(dir, 'slots.json'))) throw new Error(`unknown concept: ${concept}`);
  return { dir, spec: JSON.parse(await readFile(path.join(dir, 'slots.json'), 'utf8')), build: null };
}

export async function listConcepts() {
  const out = [];
  for (const e of await readdir(TEMPLATES, { withFileTypes: true })) {
    if (!e.isDirectory() || e.name === 'cards') continue;
    try {
      const { spec } = await loadConcept(e.name);
      out.push({ id: spec.concept, title: spec.title, tagline: spec.tagline, duration: spec.duration, slots: spec.slots.length, music: spec.music ?? null });
    } catch { /* not a concept */ }
  }
  return out;
}

const escHtml = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const DANGLING = /\s(A|AN|THE|BY|OF|TO|IN|ON|AT|FOR|WITH|AND|OR|FROM|AS|IS|ARE|PER)[.,:;]?$/;

/**
 * Cut a value to its limit the way an editor would: at a sentence end when one
 * leaves at least half the room, else at a word, dropping a dangling function
 * word; a cut line keeps the original's own end mark (a question stays a
 * question). Mirrored in the app's domain/studio.ts.
 */
export function clampText(v, max, end) {
  const cut = v.slice(0, max);
  const sentence = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('! '), cut.lastIndexOf('? '));
  if (sentence >= max * 0.45) return cut.slice(0, sentence + 1);
  const sp = cut.lastIndexOf(' ');
  const out = (sp > max * 0.5 ? cut.slice(0, sp) : cut).trim().replace(DANGLING, '').replace(/[,:;-]$/, '');
  return end && !/[.!?…:]$/.test(out) ? out + end : out;
}

/** Uppercase, one line, no em or en dash (owner rule), clamped to the slot's limit. */
export function normalizeSlot(spec, value) {
  let v = String(value ?? spec.default).replace(/[—–]/g, '-').replace(/\s+/g, ' ').trim().toUpperCase();
  if (!v && !spec.optional) v = spec.default;
  let clamped = false;
  if (v.length > spec.max) {
    v = clampText(v, spec.max, String(value ?? '').trim().match(/[.!?…:]$/)?.[0] ?? '');
    clamped = true;
  }
  return { value: v, clamped };
}

/** Fitted font size: the face's average advance times the character count against the column. */
function fitSize(text, base, ratio, column) {
  const width = text.length * base * ratio;
  if (width <= column) return base;
  return Math.max(Math.round(base * (column / width)), Math.round(base * 0.4));
}

export function fitCss(spec, values) {
  const groups = new Map();
  for (const s of spec.slots) {
    if (!s.selector || !s.size) continue;
    const text = `${s.prefix ?? ''}${values[s.id]}${s.suffix ?? ''}`;
    const key = s.group ? `g:${s.group}` : s.selector;
    const ratio = spec.faces[s.face] ?? 0.5;
    // a slot that may wrap gets that many rows of width before it has to shrink
    const budget = spec.column * (s.lines ?? 1);
    const size = s.group
      ? fitSize(spec.slots.filter((x) => x.group === s.group).map((x) => values[x.id]).join(' '), s.size, ratio, budget)
      : fitSize(text, s.size, ratio, budget);
    const cur = groups.get(key);
    if (!cur || size < cur.size) groups.set(key, { selector: s.selector, base: s.size, size });
  }
  return [...groups.values()].filter((g) => g.size < g.base).map((g) => `${g.selector} { font-size: ${g.size}px !important; }`).join('\n      ');
}

function fill(html, spec, values, vars, extras) {
  let out = html;
  for (const s of spec.slots) {
    const v = values[s.id];
    out = out.replace(new RegExp(`\\{\\{${s.id.toUpperCase()}\\}\\}`, 'g'), escHtml(v));
    if (s.js) {
      out = out.replace(new RegExp(`\\{\\{${s.id.toUpperCase()}_JS\\}\\}`, 'g'), JSON.stringify(v));
      const colon = v.indexOf(':');
      out = out.replace(new RegExp(`\\{\\{${s.id.toUpperCase()}_ACC\\}\\}`, 'g'), String(colon > 0 && colon <= 8 ? colon + 1 : 0));
    }
  }
  for (const [k, v] of Object.entries(vars)) out = out.replace(new RegExp(`\\{\\{${k.toUpperCase()}\\}\\}`, 'g'), v);
  for (const [k, v] of Object.entries(extras)) out = out.replace(new RegExp(`\\{\\{${k}\\}\\}`, 'g'), v);
  const left = out.match(/\{\{[A-Z0-9_]+\}\}/g);
  if (left) throw new Error(`template tokens left unfilled: ${[...new Set(left)].join(', ')}`);
  return out;
}

function run(cmd, args, { cwd, onLine }) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { cwd, env: { ...process.env, CI: '1', NO_COLOR: '1' } });
    let out = '';
    const take = (buf) => { const s = buf.toString(); out += s; for (const line of s.split(/\r?\n/)) if (line.trim()) onLine?.(line); };
    child.stdout.on('data', take); child.stderr.on('data', take);
    child.on('error', reject);
    child.on('close', (code) => (code === 0 ? resolve(out) : reject(new Error(`${cmd} ${args[0] ?? ''} exited ${code}: ${out.slice(-600)}`))));
  });
}

async function newestMp4(dir) {
  if (!existsSync(dir)) return null;
  const files = (await readdir(dir)).filter((f) => f.endsWith('.mp4'));
  let best = null;
  for (const f of files) { const s = await stat(path.join(dir, f)); if (!best || s.mtimeMs > best.m) best = { f, m: s.mtimeMs }; }
  return best ? path.join(dir, best.f) : null;
}

/**
 * Build the composition only (no render): returns { html, values, clamped, vars }.
 * The smoke test and the preview use it; renderReel calls it too.
 */
export async function composeReel({ concept, slots, palette, logo, screenshot, plates, jobDir, compositionId }) {
  const { dir, spec, build } = await loadConcept(concept);
  await mkdir(jobDir, { recursive: true });
  await cp(path.join(dir, 'assets'), path.join(jobDir, 'assets'), { recursive: true });
  await cp(path.join(dir, 'hyperframes.json'), path.join(jobDir, 'hyperframes.json'));
  await writeFile(path.join(jobDir, 'package.json'), JSON.stringify({ name: compositionId, private: true, type: 'module' }, null, 2));
  await writeFile(path.join(jobDir, 'meta.json'), JSON.stringify({ id: compositionId, name: compositionId, createdAt: '2026-01-01T00:00:00.000Z' }, null, 2));

  const values = {}; const clamped = [];
  for (const s of spec.slots) { const r = normalizeSlot(s, slots?.[s.id]); values[s.id] = r.value; if (r.clamped) clamped.push(s.id); }
  const vars = reelVars(palette);
  let logoImg = '';
  if (logo?.file_path && existsSync(logo.file_path) && !/\.ico$/.test(logo.file_path)) {
    const ext = path.extname(logo.file_path);
    await cp(logo.file_path, path.join(jobDir, 'assets', `logo${ext}`));
    logoImg = `<img id="s14-logo" src="assets/logo${ext}" alt="">`;
  }
  let shot = null;
  if (screenshot && existsSync(screenshot)) {
    await cp(screenshot, path.join(jobDir, 'assets', 'site.png'));
    shot = 'assets/site.png';
  }
  // the photographs behind the film (made by /images), copied in as assets
  const plateSrc = {};
  for (const [k, p] of Object.entries(plates ?? {})) {
    if (!p || !/^[a-z]+$/.test(k) || !existsSync(p)) continue;
    await cp(p, path.join(jobDir, 'assets', `plate-${k}.jpg`));
    plateSrc[k] = `assets/plate-${k}.jpg`;
  }
  const extras = { FIT_CSS: fitCss(spec, values), COMPOSITION_ID: compositionId, LOGO_IMG: logoImg };
  const html = build
    ? build({ values, vars, extras: { compositionId, logoImg, screenshot: shot, fitCss: extras.FIT_CSS, plates: plateSrc } })
    : fill(await readFile(path.join(dir, 'index.html'), 'utf8'), spec, values, vars, extras);
  await writeFile(path.join(jobDir, 'index.html'), html);
  return { spec, values, clamped, vars, logoImg, shot, plates: plateSrc };
}

export async function renderReel({ concept, slots, palette, logo, screenshot, plates, jobDir, fileUrl, compositionId, resolution, onStep }) {
  onStep?.('preparing the composition');
  const { spec, values, clamped, vars, logoImg, shot, plates: plateSrc } = await composeReel({ concept, slots, palette, logo, screenshot, plates, jobDir, compositionId });

  onStep?.('rendering frames (this takes about a minute)');
  const args = ['--yes', HYPERFRAMES, 'render'];
  if (resolution === 'portrait-4k') args.push('--resolution=portrait-4k');
  let lastPct = -1;
  await run('npx', args, { cwd: jobDir, onLine: (line) => {
    const m = line.match(/(\d{1,3})%\s+(.*)$/);
    if (m && Number(m[1]) !== lastPct) { lastPct = Number(m[1]); onStep?.(`rendering ${m[1]}%: ${m[2].replace(/\(\d+ workers\)/, '').trim().toLowerCase()}`); }
  } });
  const rendered = await newestMp4(path.join(jobDir, 'renders'));
  if (!rendered) throw new Error('render produced no mp4');

  onStep?.('mastering to -14 LUFS');
  const master = path.join(jobDir, 'reel.mp4');
  await run('ffmpeg', ['-y', '-v', 'error', '-i', rendered, '-af', 'loudnorm=I=-14:TP=-1:LRA=11', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', master], { cwd: jobDir });

  onStep?.('cutting the poster and filmstrip');
  const dur = spec.duration;
  await run('ffmpeg', ['-y', '-v', 'error', '-ss', String(dur - 0.5), '-i', master, '-frames:v', '1', '-q:v', '2', path.join(jobDir, 'poster.jpg')], { cwd: jobDir });
  await run('ffmpeg', ['-y', '-v', 'error', '-i', master, '-vf', `fps=8/${dur},scale=-2:480,tile=8x1:padding=4:color=black`, '-frames:v', '1', '-q:v', '3', path.join(jobDir, 'strip.jpg')], { cwd: jobDir });
  const size = (await stat(master)).size;
  const probe = await run('ffprobe', ['-v', 'error', '-show_entries', 'format=duration:stream=width,height', '-of', 'json', master], { cwd: jobDir });
  const meta = JSON.parse(probe);
  const v = (meta.streams || []).find((s) => s.width);
  return {
    concept, concept_title: spec.title, composition_id: compositionId, resolution: resolution ?? '1080p',
    video_url: `${fileUrl}/reel.mp4`, poster_url: `${fileUrl}/poster.jpg`, strip_url: `${fileUrl}/strip.jpg`,
    duration: Math.round(Number(meta.format?.duration ?? dur) * 100) / 100, width: v?.width ?? 1080, height: v?.height ?? 1920, bytes: size,
    slots: values, clamped, vars, logo_used: Boolean(logoImg), screenshot_used: Boolean(shot), plates_used: Object.keys(plateSrc),
  };
}
