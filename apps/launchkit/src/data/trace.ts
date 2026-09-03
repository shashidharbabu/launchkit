import { byNewest, flush, insert, isReady, remove, select, uid } from './blobstore';

/**
 * Pipeline tracing (layer 1): every pipeline call the runner makes records one
 * trace row: pipe, timing, the question sent, the outcome/error, and the
 * engine's step-level `_trace` (lane writes + invokes, requested via
 * `pipelineTraceLevel: 'summary'` on use()). Rows link to the run that
 * triggered them so the Runs page can map a failed action to the exact
 * pipeline step. Tracing is FAIL-SAFE: it can never throw into a run.
 */
export type TraceEntry = { op?: string; component?: string; lane?: string; error?: string; result?: string };
export type TraceRow = {
  id: string; run_id: string | null; pipe: string; ok: boolean; ms: number;
  error: string | null; question: string; entries: TraceEntry[]; created_at: string;
};

const KEEP = 60;
const MAX_ENTRIES = 200;
const PREVIEW = 300;

let currentRun: string | null = null;
export function setCurrentRun(id: string | null) { currentRun = id; }
export function getCurrentRun(): string | null { return currentRun; }

const preview = (v: unknown): string | undefined => {
  if (v == null) return undefined;
  const s = typeof v === 'string' ? v : (() => { try { return JSON.stringify(v); } catch { return String(v); } })();
  return s.length > PREVIEW ? s.slice(0, PREVIEW) + '…' : s;
};

/** Flatten the engine's `_trace` (apaevt_flow-shaped entries) into compact rows. */
export function normalizeTrace(raw: unknown): TraceEntry[] {
  if (!Array.isArray(raw)) return [];
  return raw.slice(0, MAX_ENTRIES).map((e) => {
    const x = (e ?? {}) as Record<string, unknown>;
    const t = (x.trace ?? {}) as Record<string, unknown>;
    return {
      op: typeof x.op === 'string' ? x.op : undefined,
      component: typeof x.component === 'string' ? x.component : undefined,
      lane: typeof t.lane === 'string' ? t.lane : undefined,
      error: typeof t.error === 'string' ? t.error : undefined,
      result: preview(t.result ?? x.result),
    };
  });
}

export function recordTrace(p: Omit<TraceRow, 'id' | 'created_at'>): void {
  try {
    if (!isReady()) return;
    insert('traces', { ...p, id: uid(), question: p.question.slice(0, 240) } as unknown as Record<string, unknown>);
    const all = byNewest(select('traces', {}), 'created_at');
    for (const r of all.slice(KEEP)) remove('traces', { id: (r as Record<string, unknown>).id });
    flush();
  } catch { /* tracing must never break a run */ }
}

export function tracesForRun(runId: string): TraceRow[] {
  try { return byNewest(select('traces', { run_id: runId }), 'created_at') as unknown as TraceRow[]; }
  catch { return []; }
}

// ---------------------------------------------------------------- layer 2: live FLOW events
// The shell re-broadcasts engine DAP events; with `pipelineTraceLevel` on use()
// and a FLOW monitor on the task token, `apaevt_flow` bodies arrive per component
// step. They carry `project_id` (not the token), so buffer them per pipe project.
const live = new Map<string, TraceEntry[]>();
export function clearLive(projectId: string): void { live.delete(projectId); }
export function takeLive(projectId: string): TraceEntry[] { const e = live.get(projectId) ?? []; live.delete(projectId); return e; }
/** Feed one DAP message; only `apaevt_flow` is kept. Never throws. */
export function ingestShellEvent(msg: unknown): void {
  try {
    const m = (msg ?? {}) as { event?: string; body?: unknown };
    if (m.event !== 'apaevt_flow') return;
    const b = (m.body ?? {}) as Record<string, unknown>;
    const pid = typeof b.project_id === 'string' ? b.project_id : null;
    if (!pid) return;
    const tr = (b.trace ?? {}) as Record<string, unknown>;
    const entry: TraceEntry = {
      op: typeof b.op === 'string' ? b.op : undefined,
      component: typeof b.component === 'string' ? b.component : undefined,
      lane: typeof tr.lane === 'string' ? tr.lane : undefined,
      error: typeof tr.error === 'string' ? tr.error : undefined,
      result: preview(tr.result ?? b.result),
    };
    const arr = live.get(pid) ?? [];
    if (arr.length < MAX_ENTRIES) arr.push(entry);
    live.set(pid, arr);
  } catch { /* tracing must never throw */ }
}
