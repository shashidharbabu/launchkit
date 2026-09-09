#!/usr/bin/env node
// Print the forge's job table: node jobs-list.mjs [--base http://localhost:3500]
const base = process.argv.includes('--base') ? process.argv[process.argv.indexOf('--base') + 1] : 'http://localhost:3500';
const r = await fetch(base + '/jobs');
const d = await r.json();
for (const j of d.jobs) console.log([j.kind, j.project_id, j.status, j.step.slice(0, 60), j.error ? j.error.slice(0, 160) : ''].join(' | '));
if (d.jobs.length === 0) console.log('(no jobs)');
