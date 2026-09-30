// Eval kit judges: one fresh, independent `claude -p` judge per app that has evidence and no judged.json yet.
// Each judge reads only its own app folder, the brief (docs/loops/evals/JUDGE.md) and the rulebooks, and writes
// <app>/judged.json. A judge reads about 250k tokens, so the layer is opt-in and says how many it will start.
//   node tools/evalkit/judge.mjs <run dir> [--apps a,b] [--parallel 3] [--dry-run] [--force]
import { spawn } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');
const args = process.argv.slice(2);
const dir = args[0] ? path.resolve(args[0]) : '';
if (!dir || !existsSync(dir)) { console.error('usage: node tools/evalkit/judge.mjs <run dir> [--apps a,b] [--parallel 3] [--dry-run] [--force]'); process.exit(2); }
const opt = (k) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : null; };
const only = new Set((opt('--apps') ?? '').split(',').map((s) => s.trim()).filter(Boolean));
const parallel = Math.max(1, Number(opt('--parallel') ?? 3));
const dry = args.includes('--dry-run');
const force = args.includes('--force');
const template = readFileSync(path.join(ROOT, 'tools/evalkit/judge-prompt.md'), 'utf8');

const apps = readdirSync(dir).filter((s) => existsSync(path.join(dir, s, 'summary.json')))
  .filter((s) => only.size === 0 || only.has(s))
  .filter((s) => force || !existsSync(path.join(dir, s, 'judged.json')));

function how(slug) {
  const d = path.join(dir, slug);
  const s = JSON.parse(readFileSync(path.join(d, 'summary.json'), 'utf8'));
  const failed = Object.entries(s.stages ?? {}).filter(([, v]) => v && v.ok === false).map(([k]) => k);
  if (existsSync(path.join(d, 'appstate.rerun.json'))) {
    return `the full drive ran every stage${failed.length ? `; ${failed.join(', ')} failed from infrastructure and was re-run afterwards from the saved store` : ' and some stages were re-run afterwards from the saved store'}. A re-run ranks venues but does not tick them: do not score a missing venue selection as the app's fault. Screenshots of a failed first attempt may remain; trust the store and any rerun-*.png.`;
  }
  return failed.length ? `one full drive; these stages failed and were not re-run: ${failed.join(', ')}. Score them from what the store and the screenshots show.` : 'one full drive of all eight stages; nothing was re-run.';
}

const prompt = (slug) => template.replaceAll('{{ROOT}}', ROOT).replaceAll('{{DIR}}', path.join(dir, slug)).replaceAll('{{SLUG}}', slug).replaceAll('{{HOW}}', how(slug));

// the judge reads, fetches the live site, and writes exactly one file
const TOOLS = ['Read', 'Glob', 'Grep', 'WebFetch', 'WebSearch', `Write(${dir}/**/judged.json)`, 'Bash(python3:*)', 'Bash(curl:*)'];

/** The last JSON object in a judge's output that has the brief's shape (scores for all eight stages, issues). */
export function lastVerdict(text) {
  const blocks = [...text.matchAll(/```json\s*([\s\S]*?)```/g)].map((m) => m[1]);
  const i = text.lastIndexOf('{\n  "slug"');
  if (i >= 0) blocks.push(text.slice(i));
  for (const raw of blocks.reverse()) {
    try {
      const v = JSON.parse(raw.trim());
      const stages = ['profile', 'brand', 'commercial', 'social', 'assets', 'targets', 'signals', 'plan'];
      if (v && v.scores && stages.every((k) => Number.isFinite(v.scores[k])) && Array.isArray(v.issues)) return v;
    } catch { /* not this block */ }
  }
  return null;
}

function judge(slug) {
  return new Promise((resolve) => {
    const t0 = Date.now();
    const child = spawn('claude', ['-p', prompt(slug), '--allowedTools', TOOLS.join(','), '--output-format', 'text'], { cwd: ROOT, stdio: ['ignore', 'pipe', 'pipe'] });
    let out = '';
    child.stdout.on('data', (b) => { out += b; });
    child.stderr.on('data', (b) => { out += b; });
    child.on('close', (code) => {
      writeFileSync(path.join(dir, slug, 'judge.log'), out);
      // the judge returns its verdict as its final message; when its own write was refused, keep it from there
      const target = path.join(dir, slug, 'judged.json');
      if (!existsSync(target)) {
        const verdict = lastVerdict(out);
        if (verdict) writeFileSync(target, JSON.stringify(verdict, null, 2));
      }
      const ok = existsSync(target);
      console.log(`${ok ? 'JUDGED' : 'NO_VERDICT'} ${slug} in ${Math.round((Date.now() - t0) / 60000)} min (exit ${code})`);
      resolve(ok);
    });
  });
}

console.log(`${apps.length} judge(s) to run${apps.length ? `: ${apps.join(', ')}` : ''}; about 250k tokens each; ${parallel} at a time.`);
if (dry) { if (apps[0]) console.log(`\n--- prompt for ${apps[0]} ---\n${prompt(apps[0])}\n--- tools: ${TOOLS.join(', ')}`); process.exit(0); }
const queue = [...apps];
const results = [];
await Promise.all(Array.from({ length: Math.min(parallel, queue.length) }, async () => {
  while (queue.length) { const s = queue.shift(); results.push([s, await judge(s)]); }
}));
const missing = results.filter(([, ok]) => !ok).map(([s]) => s);
console.log(`JUDGES_DONE ${results.length - missing.length}/${results.length}${missing.length ? `; no verdict: ${missing.join(', ')}` : ''}`);
process.exit(missing.length ? 1 : 0);
