// Run drive.full.mjs over a list of apps in a few lanes, one app at a time
// per lane, and collect every summary into docs/eval-10/index.json.
//   node run-eval.mjs                  # the ten apps below, two lanes
//   LANES=1 ONLY=cal-com,dub node run-eval.mjs
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const ROOT = '/Users/shashidharbabu/rocketride-apps-gtm';
const OUT = path.join(ROOT, 'docs', 'eval-10');
const LANES = Math.max(1, Number(process.env.LANES) || 2);
const ONLY = new Set((process.env.ONLY || '').split(',').map((s) => s.trim()).filter(Boolean));
const SKIP = process.env.SKIP || '';
const APPS = [
  { slug: 'hack-judge', name: 'hack-judge', site: 'https://hackathon-judge-aid.onrender.com', repo: '' },
  { slug: 'excalidraw', name: 'Excalidraw', site: 'https://excalidraw.com', repo: 'https://github.com/excalidraw/excalidraw' },
  { slug: 'cal-com', name: 'Cal.com', site: 'https://cal.com', repo: 'https://github.com/calcom/cal.com' },
  { slug: 'plausible', name: 'Plausible', site: 'https://plausible.io', repo: 'https://github.com/plausible/analytics' },
  { slug: 'formbricks', name: 'Formbricks', site: 'https://formbricks.com', repo: 'https://github.com/formbricks/formbricks' },
  { slug: 'documenso', name: 'Documenso', site: 'https://documenso.com', repo: 'https://github.com/documenso/documenso' },
  { slug: 'dub', name: 'Dub', site: 'https://dub.co', repo: 'https://github.com/dubinc/dub' },
  { slug: 'hoppscotch', name: 'Hoppscotch', site: 'https://hoppscotch.io', repo: 'https://github.com/hoppscotch/hoppscotch' },
  { slug: 'continue', name: 'Continue', site: 'https://continue.dev', repo: 'https://github.com/continuedev/continue' },
  { slug: 'khoj', name: 'Khoj', site: 'https://khoj.dev', repo: 'https://github.com/khoj-ai/khoj' },
].filter((a) => ONLY.size === 0 || ONLY.has(a.slug));

mkdirSync(OUT, { recursive: true });
const queue = [...APPS];
const results = [];

function runOne(app) {
  return new Promise((resolve) => {
    const dir = path.join(OUT, app.slug);
    mkdirSync(dir, { recursive: true });
    const logFile = path.join(dir, 'drive.log');
    const t0 = Date.now();
    console.log(`[${new Date().toISOString().slice(11, 19)}] start ${app.slug}`);
    const child = spawn('node', ['drive.full.mjs'], {
      cwd: path.join(ROOT, 'launchkit-src', 'frontend'),
      env: { ...process.env, NAME: app.name, SITE: app.site, REPO: app.repo, OUTDIR: dir, SKIP },
    });
    let out = '';
    child.stdout.on('data', (d) => { out += d; });
    child.stderr.on('data', (d) => { out += d; });
    const timer = setTimeout(() => { out += '\nRUNNER: killed after 75 minutes\n'; child.kill('SIGKILL'); }, 75 * 60 * 1000);
    child.on('close', (code) => {
      clearTimeout(timer);
      writeFileSync(logFile, out);
      const sumFile = path.join(dir, 'summary.json');
      const summary = existsSync(sumFile) ? JSON.parse(readFileSync(sumFile, 'utf8')) : null;
      const r = { slug: app.slug, name: app.name, code, minutes: Math.round((Date.now() - t0) / 6000) / 10, done: /FULL_DONE/.test(out), stages: summary ? Object.fromEntries(Object.entries(summary.stages).map(([k, v]) => [k, v.skipped ? 'skip' : v.ok ? 'ok' : 'FAIL'])) : null, errors: summary?.errors ?? [String(code)] };
      results.push(r);
      console.log(`[${new Date().toISOString().slice(11, 19)}] done  ${app.slug} in ${r.minutes} min: ${JSON.stringify(r.stages)}`);
      writeFileSync(path.join(OUT, 'index.json'), JSON.stringify({ updated: new Date().toISOString(), results }, null, 2));
      resolve(r);
    });
  });
}

async function lane(id) {
  while (queue.length) {
    const app = queue.shift();
    await runOne(app);
    // a breath between apps so the Studio service finishes its last render before the next probe
    await new Promise((r) => setTimeout(r, 5000));
  }
}
await Promise.all(Array.from({ length: LANES }, (_, i) => lane(i)));
console.log('EVAL_RUN_DONE', JSON.stringify(results.map((r) => `${r.slug}:${r.done ? 'ok' : 'partial'}`)));
