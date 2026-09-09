// A small job table with one worker: every request that touches a browser or
// ffmpeg becomes a job the app polls. Serial on purpose: two renders at once
// on a laptop just makes both slow.
import { randomBytes } from 'node:crypto';

const jobs = new Map();
const queue = [];
let busy = false;

export const newId = () => randomBytes(6).toString('hex');

export function create(kind, project_id, work, id = newId()) {
  const job = { id, kind, project_id, status: 'queued', step: 'queued', error: null, result: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
  jobs.set(id, job);
  queue.push({ job, work });
  void pump();
  return job;
}

export const get = (id) => jobs.get(id) ?? null;
export const list = () => [...jobs.values()].sort((a, b) => (a.created_at < b.created_at ? 1 : -1)).slice(0, 50);

async function pump() {
  if (busy) return;
  const next = queue.shift();
  if (!next) return;
  busy = true;
  const { job, work } = next;
  const touch = () => { job.updated_at = new Date().toISOString(); };
  job.status = 'running'; job.step = 'starting'; touch();
  try {
    job.result = await work((step) => { job.step = step; touch(); });
    job.status = 'done'; job.step = 'done';
  } catch (e) {
    job.status = 'error'; job.error = String(e?.message ?? e).slice(0, 1500); job.step = 'failed';
  } finally {
    touch(); busy = false;
    // keep memory bounded
    if (jobs.size > 200) for (const k of [...jobs.keys()].slice(0, jobs.size - 200)) jobs.delete(k);
    void pump();
  }
}
