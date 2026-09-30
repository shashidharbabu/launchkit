// Eval kit scorecard: one run folder of judged apps -> scorecard.json + scorecard.md.
// Reads each <app>/judged.json (the JUDGE.md shape), <app>/summary.json (drive stage times) and the app's store
// (appstate.rerun.json when present, else appstate.json) for pipeline run times. With --compare it adds a column
// for an earlier run folder, over the apps both runs judged.
//   node tools/evalkit/scorecard.mjs docs/eval-10-0929-t3 [--compare docs/eval-10-0929-t2] [--bar 3.5]
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

export const STAGES = ['profile', 'brand', 'commercial', 'social', 'assets', 'targets', 'signals', 'plan'];
export const POSTS = ['x_post', 'linkedin_post', 'reddit_post', 'producthunt', 'show_hn', 'newsletter_pitch'];

const readJson = (p) => { try { return JSON.parse(readFileSync(p, 'utf8')); } catch { return null; } };
const mean = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);
const median = (xs) => {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};
const r2 = (x) => (x == null ? null : Math.round(x * 100) / 100);

/** Every app folder in a run, with what the kit knows about it. */
export function loadRun(dir) {
  const apps = {};
  for (const slug of readdirSync(dir).sort()) {
    const d = path.join(dir, slug);
    if (!existsSync(path.join(d, 'summary.json')) && !existsSync(path.join(d, 'judged.json'))) continue;
    const judged = readJson(path.join(d, 'judged.json'));
    const summary = readJson(path.join(d, 'summary.json'));
    const store = readJson(path.join(d, existsSync(path.join(d, 'appstate.rerun.json')) ? 'appstate.rerun.json' : 'appstate.json'));
    const runs = (store?.launchkit?.runs ?? []).filter((r) => r.status === 'done' && Number.isFinite(r.elapsed_seconds));
    apps[slug] = {
      judged,
      stageSecs: Object.fromEntries(STAGES.map((s) => [s, summary?.stages?.[s]?.secs ?? null])),
      stageOk: Object.fromEntries(STAGES.map((s) => [s, summary?.stages?.[s]?.ok ?? null])),
      driveSecs: STAGES.reduce((a, s) => a + (Number(summary?.stages?.[s]?.secs) || 0), 0),
      pipeSecs: runs.reduce((a, r) => a + r.elapsed_seconds, 0),
    };
  }
  return apps;
}

const overall = (j) => mean(STAGES.map((s) => j.scores[s]));
const severities = (j) => {
  const c = { blocker: 0, high: 0, medium: 0, low: 0 };
  for (const i of j.issues ?? []) if (i.severity in c) c[i.severity]++;
  return c;
};

/** The numbers a turn is judged on, over the given app slugs. */
export function summarise(apps, slugs, bar = 3.5) {
  const judged = slugs.filter((s) => apps[s]?.judged?.scores);
  const J = judged.map((s) => apps[s].judged);
  const stageMeans = Object.fromEntries(STAGES.map((st) => [st, r2(mean(J.map((j) => j.scores[st])))]));
  const stageMins = Object.fromEntries(STAGES.map((st) => [st, J.length ? Math.min(...J.map((j) => j.scores[st])) : null]));
  const postMeans = Object.fromEntries(POSTS.map((p) => [p, r2(mean(J.map((j) => j.post_scores?.[p]).filter((x) => x != null)))]));
  const sev = J.reduce((acc, j) => { const c = severities(j); for (const k in c) acc[k] += c[k]; return acc; }, { blocker: 0, high: 0, medium: 0, low: 0 });
  const timed = slugs.filter((s) => apps[s] && apps[s].driveSecs > 0);
  const timing = {
    driveMinMedian: r2(median(timed.map((s) => apps[s].driveSecs / 60))),
    pipeMinMedian: r2(median(timed.map((s) => apps[s].pipeSecs / 60))),
    slowestApp: timed.sort((a, b) => apps[b].driveSecs - apps[a].driveSecs)[0] ?? null,
    stageMinMedian: Object.fromEntries(STAGES.map((st) => [st, r2(median(timed.map((s) => apps[s].stageSecs[st]).filter((x) => x != null).map((x) => x / 60)))])),
  };
  const postMeanAll = mean(Object.values(postMeans).filter((x) => x != null));
  const gates = {
    everyStageAtBar: STAGES.every((st) => stageMeans[st] != null && stageMeans[st] >= bar),
    noStageBelow2: STAGES.every((st) => stageMins[st] == null || stageMins[st] >= 2),
    postsAtBar: postMeanAll != null && postMeanAll >= bar,
    zeroBlockers: sev.blocker === 0,
  };
  return {
    apps: judged.length, bar, stageMeans, stageMins, postMeans, overall: r2(mean(J.map(overall))),
    severities: sev, timing, gates, barMet: Object.values(gates).every(Boolean),
    perApp: Object.fromEntries(judged.map((s) => [s, { overall: r2(overall(apps[s].judged)), blockers: severities(apps[s].judged).blocker,
      driveMin: r2(apps[s].driveSecs / 60), failedStages: STAGES.filter((st) => apps[s].stageOk[st] === false) }])),
    unjudged: slugs.filter((s) => !apps[s]?.judged?.scores),
  };
}

export function scorecardMarkdown(name, cur, prev) {
  const f = (x) => (x == null ? '-' : x.toFixed(2));
  const lines = [`# Scorecard: ${name}`, ''];
  lines.push(`**Bar ${cur.bar}: ${cur.barMet ? 'MET' : 'NOT MET'}.** Apps judged: ${cur.apps}${cur.unjudged.length ? ` (not judged: ${cur.unjudged.join(', ')})` : ''}.`, '');
  lines.push('| Gate | Result |', '|---|---|');
  lines.push(`| Every stage mean at ${cur.bar} or above | ${cur.gates.everyStageAtBar ? 'pass' : 'fail'} |`);
  lines.push(`| No stage below 2 on any app | ${cur.gates.noStageBelow2 ? 'pass' : 'fail'} |`);
  lines.push(`| Posts mean at ${cur.bar} or above | ${cur.gates.postsAtBar ? 'pass' : 'fail'} |`);
  lines.push(`| Zero blockers | ${cur.gates.zeroBlockers ? 'pass' : `fail (${cur.severities.blocker})`} |`, '');
  lines.push(prev ? '| Stage | Mean | Lowest app | Previous |' : '| Stage | Mean | Lowest app |', prev ? '|---|---|---|---|' : '|---|---|---|');
  for (const st of STAGES) {
    lines.push(`| ${st} | ${f(cur.stageMeans[st])} | ${cur.stageMins[st] ?? '-'} |${prev ? ` ${f(prev.stageMeans[st])} |` : ''}`);
  }
  lines.push(`| **overall** | **${f(cur.overall)}** | |${prev ? ` ${f(prev.overall)} |` : ''}`, '');
  lines.push(`Posts: ${Object.entries(cur.postMeans).map(([k, v]) => `${k} ${f(v)}`).join(', ')}.`, '');
  lines.push(`Issues: ${cur.severities.blocker} blocker, ${cur.severities.high} high, ${cur.severities.medium} medium, ${cur.severities.low} low${prev ? ` (previous: ${prev.severities.blocker} blocker, ${prev.severities.high} high)` : ''}.`, '');
  lines.push('## Time', '');
  lines.push(`Drive per app, median: ${f(cur.timing.driveMinMedian)} min; pipeline time per app, median: ${f(cur.timing.pipeMinMedian)} min; slowest app: ${cur.timing.slowestApp ?? '-'}.${prev ? ` Previous: ${f(prev.timing.driveMinMedian)} and ${f(prev.timing.pipeMinMedian)} min.` : ''}`, '');
  lines.push('| Stage | Median min |', '|---|---|');
  for (const st of STAGES) lines.push(`| ${st} | ${f(cur.timing.stageMinMedian[st])} |`);
  lines.push('', '## Per app', '', '| App | Overall | Blockers | Drive min | Failed stages |', '|---|---|---|---|---|');
  for (const [s, a] of Object.entries(cur.perApp)) lines.push(`| ${s} | ${f(a.overall)} | ${a.blockers} | ${f(a.driveMin)} | ${a.failedStages.join(', ') || '-'} |`);
  return lines.join('\n') + '\n';
}

// ---- CLI ----
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const dir = args[0];
  if (!dir || !existsSync(dir)) { console.error('usage: node tools/evalkit/scorecard.mjs <run dir> [--compare <dir>] [--bar 3.5]'); process.exit(2); }
  const opt = (k) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : null; };
  const bar = Number(opt('--bar') ?? 3.5);
  const apps = loadRun(dir);
  const cmpDir = opt('--compare');
  let cur = summarise(apps, Object.keys(apps), bar);
  let prev = null;
  if (cmpDir) {
    const old = loadRun(cmpDir);
    const both = Object.keys(apps).filter((s) => apps[s].judged && old[s]?.judged);
    cur = { ...summarise(apps, Object.keys(apps), bar), compared: summarise(apps, both, bar) };
    prev = summarise(old, both, bar);
    cur.comparedOn = both;
  }
  writeFileSync(path.join(dir, 'scorecard.json'), JSON.stringify({ current: cur, previous: prev, compare: cmpDir }, null, 2));
  let md = scorecardMarkdown(path.basename(path.resolve(dir)), cur, null);
  if (prev) md += `\n## Against ${path.basename(path.resolve(cmpDir))} (the ${cur.comparedOn.length} apps both judged)\n\n` + scorecardMarkdown('same apps', cur.compared, prev).split('\n').slice(2).join('\n');
  writeFileSync(path.join(dir, 'scorecard.md'), md);
  console.log(md);
}
