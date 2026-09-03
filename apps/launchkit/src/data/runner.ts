/**
 * Pipe execution engine: the TS mirror of rr.py's ask() machinery, running
 * over the shell-owned client against app-local pipeline copies.
 *
 * Faithfully ported semantics (rr.py 2026-08 fix-pass state):
 *  - one task per pipe per session, `useExisting: true`
 *  - answers extracted via result_types → answers lane
 *  - engine failures arrive as ANSWER TEXT ("LLM error…"): checked BEFORE
 *    parsing, retried in 3 bounded attempts
 *  - stale-task errors terminate + re-register once
 *  - signals: the no-tools death signature (empty queries + empty signals)
 *    restarts the pipe and retries once
 */
import { clearLive, getCurrentRun, normalizeTrace, recordTrace, takeLive } from './trace';
import type { PipelineConfig, RocketRideClient } from 'rocketride';
import { Question } from 'rocketride';
import { parseJsonLoose } from '../domain/parse';
import type { Dict } from '../domain/types';

import understandPipe from '../../pipelines/lk_understand.pipe';
import storePipe from '../../pipelines/lk_store.pipe';
import brandPipe from '../../pipelines/lk_brand.pipe';
import commercialPipe from '../../pipelines/lk_commercial.pipe';
import targetsPipe from '../../pipelines/lk_targets.pipe';
import assetsPipe from '../../pipelines/lk_assets.pipe';
import signalsPipe from '../../pipelines/lk_signals.pipe';
import rescorePipe from '../../pipelines/lk_rescore.pipe';
import navigatorPipe from '../../pipelines/lk_navigator.pipe';

const PIPES: Record<string, unknown> = {
  'lk_understand.pipe': understandPipe,
  'lk_brand.pipe': brandPipe,
  'lk_commercial.pipe': commercialPipe,
  'lk_targets.pipe': targetsPipe,
  'lk_assets.pipe': assetsPipe,
  'lk_signals.pipe': signalsPipe,
  'lk_rescore.pipe': rescorePipe,
  'lk_navigator.pipe': navigatorPipe,
  'lk_store.pipe': storePipe,
};

let client: RocketRideClient | null = null;
const tokens = new Map<string, string>();

export function initRunner(c: RocketRideClient) {
  client = c;
  tokens.clear();
}

function pipeProjectId(pipeName: string): string | null {
  return (PIPES[pipeName] as { project_id?: string } | undefined)?.project_id ?? null;
}

function requireClient(): RocketRideClient {
  if (!client) throw new Error('runner not initialized: no shell connection yet');
  return client;
}

/** Token for a pipe by file name (team store, diagnostics). */
export const getPipeToken = (pipeName: string) => pipeToken(pipeName);
export function getClient(): RocketRideClient { return requireClient(); }

async function pipeToken(pipeName: string): Promise<string> {
  const cached = tokens.get(pipeName);
  if (cached) return cached;
  const c = requireClient();
  const res = await c.use({
    pipeline: PIPES[pipeName] as unknown as PipelineConfig,
    source: 'chat_1',
    useExisting: true,
    ttl: 3600,
    pipelineTraceLevel: 'summary',
  });
  const t = (res as { token: string }).token;
  tokens.set(pipeName, t);
  // tracing layer 2 (best-effort): step-level FLOW events for this task
  void c.addMonitor({ token: t }, ['flow']).catch((e) => console.warn('[LaunchKit] addMonitor failed', e));
  return t;
}

export async function restartPipe(pipeName: string): Promise<string> {
  const c = requireClient();
  const old = tokens.get(pipeName) ?? (await pipeToken(pipeName));
  try { await c.terminate(old); } catch { /* already dead is fine */ }
  await new Promise((r) => setTimeout(r, 3000)); // let the engine reap the task
  tokens.delete(pipeName);
  return pipeToken(pipeName);
}

function extractAnswer(response: Dict): unknown {
  const resultTypes = (response?.result_types ?? {}) as Record<string, string>;
  const keys = Object.entries(resultTypes)
    .filter(([, lane]) => lane === 'answers')
    .map(([k]) => k);
  keys.push('answers');
  for (const key of keys) {
    const answers = response?.[key] as unknown[] | undefined;
    if (answers && answers.length) return answers[0];
  }
  return null;
}

async function askOnceInner(pipeName: string, questionText: string): Promise<{ data: Dict; trace: unknown }> {
  const c = requireClient();
  let response: Dict | null = null;
  for (const attempt of [1, 2]) {
    try {
      const token = await pipeToken(pipeName);
      const q = new Question({ expectJson: true });
      q.questions.push({ text: questionText });
      response = (await c.chat({ token, question: q })) as Dict;
      break;
    } catch (e) {
      const msg = String((e as Error)?.message ?? e).toLowerCase();
      const stalePipe = ['pipeline is not running', 'not running', 'close pipe with id',
        'invalid token', 'unknown token', 'not found'].some((t) => msg.includes(t));
      const transportish = ['connection', 'websocket', 'timed out', 'closed', 'disconnect']
        .some((t) => msg.includes(t));
      if (attempt === 1 && (stalePipe || transportish)) {
        try { await restartPipe(pipeName); } catch { /* fall through to raise */ }
        continue;
      }
      throw e;
    }
  }
  const raw = extractAnswer(response ?? {});
  if (raw == null) throw new Error('pipeline returned no answers');
  // engine failures come back as ANSWER TEXT, check BEFORE parsing (rr.py fix)
  if (typeof raw === 'string' && raw.trim().replace(/^\*+\s*/, '').startsWith('LLM error')) {
    throw new Error(String(raw));
  }
  // Peel up to 3 layers: the staging engine has been observed to hand back
  // answers as (JSON-quoted) STRINGS of python-dict text. rr.py's parse can
  // only ever return dict/list; mirror that guarantee, a string result is a
  // parse failure, never data.
  let parsed: unknown = raw;
  for (let peel = 0; peel < 3 && typeof parsed === 'string'; peel++) {
    parsed = parseJsonLoose(parsed);
  }
  if (parsed === null || typeof parsed !== 'object') {
    throw new Error(`pipeline answer did not parse to an object: ${String(raw).slice(0, 200)}`);
  }
  if (!Array.isArray(parsed)) {
    const vals = Object.values(parsed as Dict);
    if (vals.some((v) => typeof v === 'string' && v.startsWith('LLM error'))) {
      throw new Error(`LLM error in pipeline response: ${JSON.stringify(parsed).slice(0, 300)}`);
    }
  }
  return { data: parsed as Dict, trace: (response as Record<string, unknown> | null)?._trace };
}

/** Trace-recording wrapper: every pipeline call leaves a trace row linked to the current run. */
async function askOnce(pipeName: string, questionText: string): Promise<Dict> {
  const runId = getCurrentRun();
  const t0 = Date.now();
  const pid = pipeProjectId(pipeName);
  if (pid) clearLive(pid);
  try {
    const { data, trace } = await askOnceInner(pipeName, questionText);
    const inline = normalizeTrace(trace);
    recordTrace({ run_id: runId, pipe: pipeName, ok: true, ms: Date.now() - t0, error: null, question: questionText, entries: inline.length ? inline : (pid ? takeLive(pid) : []) });
    return data;
  } catch (e) {
    recordTrace({ run_id: runId, pipe: pipeName, ok: false, ms: Date.now() - t0, error: String((e as Error)?.message ?? e), question: questionText, entries: pid ? takeLive(pid) : [] });
    throw e;
  }
}

/** rr.ask: three bounded attempts on engine-side "LLM error" flakiness. */
export async function ask(pipeName: string, questionText: string): Promise<Dict> {
  let last: Error | null = null;
  for (const attempt of [1, 2, 3]) {
    try {
      return await askOnce(pipeName, questionText);
    } catch (e) {
      const err = e as Error;
      if (!String(err?.message ?? e).includes('LLM error')) throw e;
      last = err;
      if (attempt < 3) await new Promise((r) => setTimeout(r, 2000));
    }
  }
  throw last ?? new Error('ask failed');
}

/** rr.run_signals: detect the no-tools death signature, restart, retry once. */
export async function askSignals(questionText: string): Promise<Dict> {
  let result = await ask('lk_signals.pipe', questionText);
  const empty = !(result.search_queries_used as unknown[] | undefined)?.length &&
    !(result.signals as unknown[] | undefined)?.length;
  if (empty) {
    await restartPipe('lk_signals.pipe');
    result = await ask('lk_signals.pipe', questionText);
  }
  return result;
}
