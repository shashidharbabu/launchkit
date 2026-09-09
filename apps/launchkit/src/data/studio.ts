/**
 * Client for the studio forge, the local service that reads a site, renders
 * launch cards and renders the reel (services/studio-forge). Every call is a
 * job the forge queues; this client starts it and polls, publishing the
 * forge's step text so the stage can show real progress.
 */
import type { Dict } from '../domain/types';
import type { ConceptSpec } from '../domain/studio';
import { getSetting } from './settings';

export const DEFAULT_STUDIO_URL = 'http://localhost:3500';
export const STUDIO_URL_KEY = 'studio_url';

export function studioUrl(): string {
  return (getSetting(STUDIO_URL_KEY) || DEFAULT_STUDIO_URL).trim().replace(/\/+$/, '');
}

export type ForgeConceptSummary = { id: string; title: string; tagline: string; duration: number; slots: number };
export type ForgeHealth = {
  ok: boolean;
  version: string;
  ffmpeg: string | null;
  chromium: string | null;
  hyperframes: string;
  concepts: ForgeConceptSummary[];
};
export type ForgeJob = {
  id: string;
  kind: string;
  status: 'queued' | 'running' | 'done' | 'error';
  step: string;
  error: string | null;
  result: Dict | null;
};

export function studioUnreachable(url: string): string {
  return `The Studio service did not answer at ${url}. Start it with "npm start" in services/studio-forge, or set its address in Settings.`;
}

async function req<T>(path: string, body?: unknown): Promise<T> {
  const base = studioUrl();
  let res: Response;
  try {
    res = await fetch(base + path, body === undefined
      ? { method: 'GET' }
      : { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
  } catch {
    throw new Error(studioUnreachable(base));
  }
  const data = (await res.json().catch(() => ({}))) as Dict & { error?: string };
  if (!res.ok) throw new Error(String(data.error ?? `${path} failed with ${res.status}`));
  return data as T;
}

export const forgeHealth = () => req<ForgeHealth>('/health');
export const forgeConcept = (id: string) => req<ConceptSpec>(`/concepts/${encodeURIComponent(id)}`);
export const forgeJob = (id: string) => req<ForgeJob>(`/jobs/${encodeURIComponent(id)}`);

/** Start a forge job and wait for it; the step text is published while it runs. */
export async function forgeRun(kind: 'probe' | 'kit' | 'reel', body: Dict): Promise<Dict> {
  const started = await req<{ job_id: string }>(`/${kind}`, body);
  setStudioStep('queued');
  for (;;) {
    const job = await forgeJob(started.job_id);
    setStudioStep(job.step);
    if (job.status === 'done') { setStudioStep(''); return job.result ?? {}; }
    if (job.status === 'error') { setStudioStep(''); throw new Error(job.error ?? `${kind} failed`); }
    await new Promise((r) => setTimeout(r, 2000));
  }
}

// ---- the step channel: a tiny external store the stage subscribes to ----
let currentStep = '';
const listeners = new Set<() => void>();
export function setStudioStep(step: string): void {
  currentStep = step;
  for (const l of listeners) l();
}
export const getStudioStep = () => currentStep;
export function subscribeStudioStep(fn: () => void): () => void {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}
