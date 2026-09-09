#!/usr/bin/env node
// Render the Verdict concept for hack-judge with hand-written copy (no pipeline),
// then cut a frame after every seam so the edit can be judged honestly.
//   node verdict-smoke.mjs [--no-probe]   (reuses the newest smoke probe when --no-probe)
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';

const base = 'http://localhost:3500';
const site = 'https://hackathon-judge-aid.onrender.com';
const project = 'verdict';
const OUT = path.resolve('out');

const j = async (p, body) => {
  const r = await fetch(base + p, body ? { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) } : undefined);
  const d = await r.json();
  if (!r.ok) throw new Error(`${p}: ${d.error ?? r.status}`);
  return d;
};
const wait = async (id) => {
  let last = '';
  for (;;) {
    const job = await j(`/jobs/${id}`);
    if (job.step !== last && !/rendering \d+%/.test(job.step)) { console.log(`  [${job.kind}] ${job.step}`); last = job.step; }
    if (job.status === 'done') return job.result;
    if (job.status === 'error') throw new Error(`${job.kind} failed: ${job.error}`);
    await new Promise((r) => setTimeout(r, 1500));
  }
};

let probe = null;
if (process.argv.includes('--no-probe') && existsSync(path.join(OUT, project))) {
  const dirs = readdirSync(path.join(OUT, project)).filter((d) => d.startsWith('probe-')).map((d) => path.join(OUT, project, d)).sort((a, b) => statSync(b).mtimeMs - statSync(a).mtimeMs);
  if (dirs[0]) probe = JSON.parse(readFileSync(path.join(dirs[0], 'probe.json'), 'utf8'));
}
if (!probe) probe = await wait((await j('/probe', { project_id: project, site_url: site })).job_id);
console.log('PROBE', { title: probe.title, primary: probe.palette.roles.primary.hex, accent: probe.palette.roles.accent.hex, copyLines: probe.copy?.lines?.length, shot: probe.screenshot_path });

const slots = {
  open_line: 'DEMO DAY. 5:40 PM.',
  load_n1: '38', load_l1: 'SUBMISSIONS', load_n2: '30', load_l2: 'MINUTES', load_n3: '4', load_l3: 'JUDGES',
  pile_line: 'EVERY REPO. BY HAND.', pile_label: 'SUBMISSION', pile_sub: 'REPO · README · DEMO',
  doubt_1: 'DID THEY EVEN USE IT?', doubt_2: 'BUILT LAST WEEK?', cost_line: 'THE LOUDEST DEMO WINS.',
  app_name: 'HACK-JUDGE AID', drop_line: 'VERIFIES EVERY REPO.',
  step1_label: 'PASTE THE REPOS.', step1_field: 'GITHUB REPO URLS, ONE PER LINE', step1_button: 'RUN',
  step2_label: 'EVERY REPO, READ.', chip_1: 'SIGNIFICANT', chip_2: 'MODERATE', chip_3: 'LESS', chip_4: 'NONE',
  step3_label: 'PRE-EVENT WORK, FLAGGED.', step3_marker: 'HACKATHON DATE', step3_chip: '-2 PTS',
  product_line: 'ONE DOSSIER PER TEAM.',
  payoff_n: '15', payoff_unit: 'MINUTES.', payoff_line: 'EVERY TEAM. VERIFIED.', payoff_timer: '15:00',
  breathe_line: 'NO MORE GUESSING.',
  arrive_line: 'JUDGE WITH PROOF.', arrive_chip: 'HACKATHON-JUDGE-AID.ONRENDER.COM',
  lock_top: 'FOR HACKATHON ORGANIZERS', lock_title: 'HACK-JUDGE AID', lock_tag: 'USAGE VERIFICATION FOR EVERY SUBMISSION', lock_host: 'HACKATHON-JUDGE-AID.ONRENDER.COM',
};

const t0 = Date.now();
const reel = await wait((await j('/reel', {
  project_id: project, concept: 'verdict', palette: probe.palette, logo: probe.logos.find((l) => l.picked) ?? null,
  screenshot_path: probe.screenshot_path, slots,
})).job_id);
console.log('REEL', Math.round((Date.now() - t0) / 1000) + 's', { duration: reel.duration, mb: (reel.bytes / 1048576).toFixed(1), clamped: reel.clamped, shot: reel.screenshot_used, logo: reel.logo_used, video: reel.video_url });

// frames just after every seam, plus mid-scene holds
const seams = [0.4, 1.0, 1.9, 2.6, 3.1, 3.7, 4.3, 4.8, 5.2, 5.8, 6.25, 6.6, 7.2, 8.0, 8.8, 9.6, 10.3, 10.9, 11.6, 12.3, 12.9, 13.6, 14.2, 14.9, 15.8, 16.4, 16.9, 17.6, 18.3, 18.9, 19.6, 20.3, 21.0, 21.8, 22.4, 23.6];
const dir = path.join(OUT, project, path.basename(path.dirname(new URL(reel.video_url).pathname)));
const sheet = path.join(dir, 'seams.jpg');
execFileSync('python3', ['frames.py', path.join(dir, 'reel.mp4'), sheet, seams.join(',')], { stdio: 'inherit' });
console.log('SHEET', sheet);
