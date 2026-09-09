#!/usr/bin/env node
// Smoke test for the forge without the app: health, probe, kit, reel.
//   node smoke.mjs https://example.com [--reel] [--base http://localhost:3500]
const args = process.argv.slice(2);
const site = args.find((a) => a.startsWith('http')) ?? 'https://hackathon-judge-aid.onrender.com';
const base = args.includes('--base') ? args[args.indexOf('--base') + 1] : 'http://localhost:3500';
const doReel = args.includes('--reel');
const project = 'smoke';

const j = async (path, body) => {
  const r = await fetch(base + path, body ? { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) } : undefined);
  const d = await r.json();
  if (!r.ok) throw new Error(`${path}: ${d.error ?? r.status}`);
  return d;
};
const wait = async (id) => {
  let last = '';
  for (;;) {
    const job = await j(`/jobs/${id}`);
    if (job.step !== last) { console.log(`  [${job.kind}] ${job.step}`); last = job.step; }
    if (job.status === 'done') return job.result;
    if (job.status === 'error') throw new Error(`${job.kind} failed: ${job.error}`);
    await new Promise((r) => setTimeout(r, 1500));
  }
};

const h = await j('/health');
console.log('HEALTH', { ok: h.ok, ffmpeg: h.ffmpeg, chromium: h.chromium, concepts: h.concepts.map((c) => c.id) });

const t0 = Date.now();
const probe = await wait((await j('/probe', { project_id: project, site_url: site })).job_id);
console.log('PROBE', Math.round((Date.now() - t0) / 1000) + 's', {
  title: probe.title, roles: Object.fromEntries(Object.entries(probe.palette.roles).map(([k, v]) => [k, `${v.hex} (${v.source})`])),
  checks: probe.palette.checks, notes: probe.palette.notes, fonts: probe.fonts,
  logos: probe.logos.map((l) => `${l.kind}${l.picked ? '*' : ''} ${l.w}x${l.h} ${l.file}`),
});

const t1 = Date.now();
const kit = await wait((await j('/kit', {
  project_id: project, site_url: site, name: probe.title.split(/[|:–-]/)[0].trim() || 'App', tagline: probe.description.slice(0, 80) || probe.title,
  one_liner: probe.description, palette: probe.palette, logos: probe.logos, fonts: probe.fonts,
})).job_id);
console.log('KIT', Math.round((Date.now() - t1) / 1000) + 's', kit.cards.map((c) => `${c.name} ${c.w}x${c.h}`), kit.cards[0].url);

if (doReel) {
  const t2 = Date.now();
  const reel = await wait((await j('/reel', {
    project_id: project, concept: 'signal', palette: probe.palette, logo: probe.logos.find((l) => l.picked) ?? null,
    slots: {
      s1_line: 'NEW BUILD DETECTED.', s3_audience: 'HACKATHON JUDGES.', drop_l1: probe.title.split(/[|:–-]/)[0].trim().toUpperCase(), drop_l2: 'IS LIVE.',
      s6_label: 'STATUS', s6_l1: 'SCORING.', s6_l2: 'SOLVED.', s7_label: 'DOES //', s7_w1: 'RUBRICS', s7_w2: 'SCORES', s7_w3: 'FEEDBACK',
      s8_num: 'ONE', s8_word: 'DASHBOARD', s8_decode: 'INCLUDED.', s9_label: 'PRICE:', s9_val: 'FREE.', s10_label: 'SETUP REQUIRED:', s10_val: 'NONE.',
      s11_label: 'YOU GET:', s11_l1: 'FAIR SCORES', s11_l2: 'FAST.', s11_sub: '+ EXPORTS', s12_l1: '+ BUILT FOR', s12_l2: 'JUDGES.',
      t1: `URL: ${new URL(site).host.toUpperCase()}`, t2: 'OPEN SOURCE', t3: 'LIVE NOW',
      lock_top: 'ON THE ROCKETRIDE APP STORE', lock_title_a: probe.title.split(/[|:–-]/)[0].trim().toUpperCase(), lock_title_b: 'LIVE', lock_line1: probe.description.slice(0, 40), lock_line2: new URL(site).host.toUpperCase(),
    },
  })).job_id);
  console.log('REEL', Math.round((Date.now() - t2) / 1000) + 's', { duration: reel.duration, size: reel.width + 'x' + reel.height, mb: (reel.bytes / 1048576).toFixed(1), clamped: reel.clamped, vars: reel.vars, video: reel.video_url, strip: reel.strip_url });
}
