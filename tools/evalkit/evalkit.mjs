// Launch Kit eval kit: one command for the checks that decide whether a build is good.
//
//   node tools/evalkit/evalkit.mjs --layers deterministic                    # minutes, free
//   node tools/evalkit/evalkit.mjs --layers deterministic,e2e --apps dub,khoj # plus real launches on staging
//   node tools/evalkit/evalkit.mjs --layers judged,scorecard --out docs/evals/staging/2026-09-30 --compare <dir>
//
// Layers, in order (each one can run alone):
//   deterministic  domain tests, typecheck, every live pipe validated on the target, the read-only UI walk
//   e2e            the full eight-stage drive of each app, one lane (staging drops a second session on the key),
//                  then evidence (extract.json, plates, poster); a stage that failed from infrastructure is re-run
//                  once from the saved store
//   judged         one fresh `claude -p` judge per app (docs/loops/evals/JUDGE.md); about 250k tokens each
//   scorecard      scorecard.md and scorecard.json: the bar, stage means, per-app scores, timings, the comparison
//
// Target: staging only, the preview on :3400 with the dev pair in .env. Production runs from the IDE that holds
// the production environment (see tools/evalkit/README.md); this kit never deploys or publishes.
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync, renameSync } from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');
const FRONT = path.join(ROOT, 'launchkit-src/frontend');
const APPS = ['hack-judge', 'excalidraw', 'cal-com', 'plausible', 'formbricks', 'documenso', 'dub', 'hoppscotch', 'continue', 'khoj'];

const args = process.argv.slice(2);
const opt = (k, d = null) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const target = opt('--target', 'staging');
if (target !== 'staging') {
  console.error('The kit runs against staging here. Production runs from the production IDE: see tools/evalkit/README.md.');
  process.exit(2);
}
const layers = new Set(opt('--layers', 'deterministic').split(',').map((s) => s.trim()));
const apps = (opt('--apps') ?? APPS.join(',')).split(',').map((s) => s.trim()).filter(Boolean);
const stamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-');
const OUT = path.resolve(ROOT, opt('--out', `docs/evals/staging/${stamp}`));
const maxMin = opt('--max-min', '120');
mkdirSync(OUT, { recursive: true });

const report = { target, started: new Date().toISOString(), out: path.relative(ROOT, OUT), layers: [...layers], results: {} };
const say = (k, v) => console.log(`${k} ${typeof v === 'string' ? v : JSON.stringify(v)}`);
const run = (label, cmd, argv, opts = {}) => {
  const t0 = Date.now();
  const r = spawnSync(cmd, argv, { cwd: opts.cwd ?? ROOT, env: { ...process.env, ...(opts.env ?? {}) }, encoding: 'utf8', maxBuffer: 256 * 1024 * 1024, timeout: opts.timeout });
  const out = `${r.stdout ?? ''}${r.stderr ?? ''}`;
  const res = { ok: r.status === 0, secs: Math.round((Date.now() - t0) / 1000), tail: out.trim().split('\n').slice(-(opts.tail ?? 3)).join(' | ').slice(0, 400) };
  say(res.ok ? 'PASS' : 'FAIL', `${label} (${res.secs} s) ${res.ok ? '' : res.tail}`);
  return { ...res, out };
};
const previewUp = () => spawnSync('curl', ['-s', '-o', '/dev/null', '-w', '%{http_code}', 'http://localhost:3400/'], { encoding: 'utf8' }).stdout === '200';

// ---- deterministic ----
if (layers.has('deterministic')) {
  const d = {};
  const tests = run('domain tests', 'npm', ['run', '-s', 'test:domain']);
  const m = tests.out.match(/ℹ pass (\d+)[\s\S]*?ℹ fail (\d+)/);
  d.tests = { ok: tests.ok, pass: m ? Number(m[1]) : null, fail: m ? Number(m[2]) : null };
  d.typecheck = run('typecheck', 'npx', ['tsc', '--noEmit', '-p', '.'], { cwd: path.join(ROOT, 'apps/launchkit') });
  const pipes = run('pipes validated on staging', 'node', ['tools/validate-pipes.mjs'], { env: { PIPE_DIR: 'apps/launchkit/pipelines', ENV_FILE: '.env' }, tail: 20 });
  d.pipes = { ok: pipes.ok, lines: pipes.out.split('\n').filter((l) => /^(OK|FAIL|ERR)/.test(l)) };
  if (previewUp()) {
    const walk = run('read-only UI walk', 'node', ['walk.mjs'], { cwd: FRONT });
    const w = walk.out.match(/WALK (\d+)\/(\d+)/);
    d.walk = { ok: walk.ok && Boolean(w) && w[1] === w[2], passed: w ? `${w[1]}/${w[2]}` : null };
  } else {
    d.walk = { ok: false, passed: null, note: 'the preview is not up on :3400 (npx rsbuild dev -c rsbuild.preview.mts in apps/launchkit)' };
    say('FAIL', `read-only UI walk: ${d.walk.note}`);
  }
  for (const k of ['typecheck']) d[k] = { ok: d[k].ok, secs: d[k].secs };
  d.ok = d.tests.ok && d.typecheck.ok && d.pipes.ok && d.walk.ok;
  report.results.deterministic = d;
}

// ---- e2e ----
if (layers.has('e2e')) {
  if (report.results.deterministic && !report.results.deterministic.ok) {
    say('STOP', 'the deterministic layer failed: fix it before spending a launch run');
    writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(report, null, 2));
    process.exit(1);
  }
  if (!previewUp()) { say('STOP', 'the preview is not up on :3400'); process.exit(1); }
  // a folder left by an earlier attempt would mix two runs' evidence
  for (const a of apps) {
    const d = path.join(OUT, a);
    if (existsSync(d)) renameSync(d, `${d}.previous-${Date.now()}`);
  }
  const e2e = run(`launch drive of ${apps.length} app(s), one lane`, 'node', ['run-eval.mjs'], {
    cwd: FRONT, env: { EVAL_OUT: OUT, LANES: '1', ONLY: apps.join(','), RUN_EVAL_MAX_MIN: maxMin }, tail: 2,
  });
  // one re-run of a stage that failed from the connection, from the saved store
  const RERUN = { targets: ['Targets', 'Rank venues|Rank again'], signals: ['Signals', 'Search for demand|Search again'] };
  const reruns = [];
  for (const a of apps) {
    const s = (() => { try { return JSON.parse(readFileSync(path.join(OUT, a, 'summary.json'), 'utf8')); } catch { return null; } })();
    for (const [stage, [label, buttons]] of Object.entries(RERUN)) {
      const st = s?.stages?.[stage];
      if (st && st.ok === false && /connect|closed|timed out|no venues ranked|did not finish/i.test(st.error ?? '')) {
        const r = run(`re-run ${a} ${stage}`, 'node', ['drive.rerun.mjs'], { cwd: FRONT, env: { EVAL_OUT: OUT, SLUG: a, STAGE: label, BUTTONS: buttons, SEED: 'original', MAX_MS: '1500000' } });
        reruns.push({ app: a, stage, ok: r.ok && /RERUN_OK/.test(r.out) });
      }
    }
  }
  const evidence = [
    run('evidence: extract', 'python3', ['eval-extract.py'], { cwd: FRONT, env: { EVAL_OUT: OUT } }),
    run('evidence: plates and poster', 'python3', ['eval-sheets.py'], { cwd: FRONT, env: { EVAL_OUT: OUT } }),
  ];
  const done = e2e.out.match(/EVAL_RUN_DONE (\[.*\])/);
  // the runner exits 0 even when it killed an app at its time limit (hoppscotch speed3, 09-30): an app counts only
  // when its drive finished every stage, or a stage it failed was re-run cleanly
  const statuses = done ? JSON.parse(done[1]) : [];
  const unfinished = apps.filter((a) => !statuses.includes(`${a}:ok`) && !reruns.some((r) => r.app === a && r.ok));
  report.results.e2e = { ok: e2e.ok && Boolean(done) && unfinished.length === 0, apps: statuses, unfinished, reruns, evidence: evidence.every((x) => x.ok) };
  if (unfinished.length) say('FAIL', `launch drive: ${unfinished.join(', ')} did not finish`);
}

// ---- judged ----
if (layers.has('judged')) {
  const j = run('independent judges', 'node', ['tools/evalkit/judge.mjs', OUT, '--apps', apps.join(','), '--parallel', opt('--parallel', '3')], { tail: 12 });
  report.results.judged = { ok: j.ok, tail: j.tail };
}

// ---- scorecard ----
if (layers.has('scorecard')) {
  const cmp = opt('--compare');
  const s = run('scorecard', 'node', ['tools/evalkit/scorecard.mjs', OUT, ...(cmp ? ['--compare', cmp] : [])], { tail: 6 });
  report.results.scorecard = { ok: s.ok, file: path.relative(ROOT, path.join(OUT, 'scorecard.md')) };
  if (s.ok) {
    const sc = JSON.parse(readFileSync(path.join(OUT, 'scorecard.json'), 'utf8'));
    report.results.scorecard.barMet = sc.current.barMet;
    report.results.scorecard.overall = sc.current.overall;
  }
}

report.finished = new Date().toISOString();
writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(report, null, 2));
say('KIT_DONE', { out: report.out, ...Object.fromEntries(Object.entries(report.results).map(([k, v]) => [k, v.ok])) });
process.exit(Object.values(report.results).every((v) => v.ok) ? 0 : 1);
