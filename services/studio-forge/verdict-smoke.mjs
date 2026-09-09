#!/usr/bin/env node
// Render the Verdict concept for hack-judge with hand-written copy (no pipeline),
// then cut a frame after every seam so the edit can be judged honestly.
//   node verdict-smoke.mjs [--no-probe] [--images | --no-images]
//     --no-probe   reuse the newest smoke probe
//     --images     make the four photographs first (OpenAI on the forge) and put them in the film and the cards
//     --no-images  reuse the newest smoke images
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

// the photographs: hand-written briefs for hack-judge (the app writes these through the pipe)
const newest = (prefix) => {
  if (!existsSync(path.join(OUT, project))) return null;
  const dirs = readdirSync(path.join(OUT, project)).filter((d) => d.startsWith(prefix)).map((d) => path.join(OUT, project, d)).sort((a, b) => statSync(b).mtimeMs - statSync(a).mtimeMs);
  return dirs[0] ?? null;
};
let images = null;
if (process.argv.includes('--no-images')) {
  const d = newest('images-');
  if (d && existsSync(path.join(d, 'images.json'))) images = JSON.parse(readFileSync(path.join(d, 'images.json'), 'utf8'));
} else if (process.argv.includes('--images')) {
  const ti = Date.now();
  images = await wait((await j('/images', { project_id: project, briefs: [
    { id: 'scene', size: '1024x1536', grade: 'cold', prompt: 'A university hackathon hall at nine in the morning after an all-nighter: rows of long trestle tables covered in laptops, cables, energy drink cans and pizza boxes, forty or so student teams slumped or still typing, a big wall clock, banners without words, seen from the back of the hall at head height, fluorescent light mixed with grey daylight from high windows.' },
    { id: 'pile', size: '1024x1536', grade: 'cold', prompt: 'A single hackathon judge, a woman in her thirties with a lanyard, sitting alone at a judging table at the front of the hall, a tall stack of printed submission sheets and three open laptops in front of her, one hand pressed to her forehead, reading, exhausted, teams blurred in the background, seen from slightly above and to the side.' },
    { id: 'arrival', size: '1024x1536', grade: 'warm', prompt: 'The same judge an hour later, standing upright at the front of the hall holding one printed results sheet, relaxed, faint smile, sleeves rolled, the hall behind her bright with morning light and teams packing up, seen from a low angle at a slight distance.' },
    { id: 'hero', size: '1536x1024', grade: 'warm', prompt: 'A hackathon judging table in a bright hall, three organizers standing together on the right side of the frame looking at one laptop, relaxed and pleased, badges on lanyards, trophies on the table, the left third of the frame open with a plain wall and soft daylight, wide landscape shot.' },
  ] })).job_id);
  console.log('IMAGES', Math.round((Date.now() - ti) / 1000) + 's', { model: images.model, made: images.images.map((i) => `${i.id} ${i.w}x${i.h} ${i.seconds}s`) });
}
const plate = (id) => images?.images?.find((i) => i.id === id)?.file_path ?? null;

if (images) {
  const tk = Date.now();
  const kit = await wait((await j('/kit', {
    project_id: project, site_url: site, name: 'Hack-Judge Aid', tagline: 'Usage verification for every submission', one_liner: 'Paste the repos, get a verdict on every team in fifteen minutes.',
    description: 'Hack-Judge Aid reads every submitted repository and classifies how much of the hackathon sponsor tool each team actually used.', palette: probe.palette, logos: probe.logos, fonts: probe.fonts,
    images: { hero: plate('hero'), story: plate('arrival') },
    headlines: { x: 'Forty-eight repos. Six judges. Fifteen minutes.', linkedin: 'We judged a hackathon in fifteen minutes and every team got a fair verdict.', producthunt: 'Usage verification for every hackathon submission', reddit: 'I built a tool that reads every hackathon repo and flags pre-event work', newsletter: 'Judge every submission with proof' },
  })).job_id);
  console.log('KIT', Math.round((Date.now() - tk) / 1000) + 's', { cards: kit.cards.length, images: kit.images.map((i) => i.name), zip: kit.zip_url });
}

// the voice-over: hand-written pitch lines (the app writes these through the pipe)
let voice = null;
if (process.argv.includes('--no-voice')) {
  const d = newest('voice-');
  if (d && existsSync(path.join(d, 'voice.json'))) voice = JSON.parse(readFileSync(path.join(d, 'voice.json'), 'utf8'));
} else if (process.argv.includes('--voice')) {
  const tv = Date.now();
  voice = await wait((await j('/voice', { project_id: project, concept: 'verdict', segments: [
    { id: 'problem', at: 0.4, until: 6.3, text: 'Demo day. Thirty-eight submissions, four judges, thirty minutes. And someone reads every repo by hand.' },
    { id: 'drop', at: 6.7, until: 8.4, text: 'Hack-Judge Aid checks every one.' },
    { id: 'how', at: 8.7, until: 14.3, text: 'Paste the repos. Every one gets read and classified. Anything built before the event gets flagged.' },
    { id: 'proof', at: 14.7, until: 18.4, text: 'One dossier per team, in fifteen minutes.' },
    { id: 'close', at: 20.2, until: 23.6, text: 'Judge with proof. Try Hack-Judge Aid today.' },
  ] })).job_id);
  console.log('VOICE', Math.round((Date.now() - tv) / 1000) + 's', { engine: voice.engine, allFit: voice.all_fit, lines: voice.segments.map((s) => `${s.id} ${s.words}w ${s.seconds}s/${s.window}s x${s.tempo}${s.fits ? '' : ' OVER'}`), preview: voice.preview_url });
}

const t0 = Date.now();
const reel = await wait((await j('/reel', {
  project_id: project, concept: 'verdict', palette: probe.palette, logo: probe.logos.find((l) => l.picked) ?? null,
  screenshot_path: probe.screenshot_path, slots,
  plates: { scene: plate('scene'), pile: plate('pile'), arrival: plate('arrival') },
  voice: voice ? { segments: voice.segments.map((s) => ({ id: s.id, file_path: s.file_path, at: s.at })) } : undefined,
})).job_id);
console.log('REEL', Math.round((Date.now() - t0) / 1000) + 's', { duration: reel.duration, mb: (reel.bytes / 1048576).toFixed(1), clamped: reel.clamped, shot: reel.screenshot_used, logo: reel.logo_used, plates: reel.plates_used, voice: reel.voice_used, video: reel.video_url });

// frames just after every seam, plus mid-scene holds
const seams = [0.4, 1.0, 1.9, 2.6, 3.1, 3.7, 4.3, 4.8, 5.2, 5.8, 6.25, 6.6, 7.2, 8.0, 8.8, 9.6, 10.3, 10.9, 11.6, 12.3, 12.9, 13.6, 14.2, 14.9, 15.8, 16.4, 16.9, 17.6, 18.3, 18.9, 19.6, 20.3, 21.0, 21.8, 22.4, 23.6];
const dir = path.join(OUT, project, path.basename(path.dirname(new URL(reel.video_url).pathname)));
const sheet = path.join(dir, 'seams.jpg');
execFileSync('python3', ['frames.py', path.join(dir, 'reel.mp4'), sheet, seams.join(',')], { stdio: 'inherit' });
console.log('SHEET', sheet);
