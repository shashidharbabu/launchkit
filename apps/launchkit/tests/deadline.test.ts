/**
 * A pipe call that goes silent is bounded, restarted and retried once, through the
 * real ask() path. Yesterday the same silence lasted 25 to 34 minutes and the retry
 * never fired because nothing ever raised.
 */
import { ASK_DEADLINE_MS, ask, initRunner } from '../src/data/runner';

let bad = 0;
const ok = (n: string, c: boolean) => { if (!c) { bad++; console.log('  FAIL ' + n); } else console.log('  pass ' + n); };
// ask() may hand back the answer object itself or wrap it; read either way
const notes = (r: unknown): string | undefined => {
  const o = r as { coverage_notes?: string; data?: { coverage_notes?: string } };
  return o?.coverage_notes ?? o?.data?.coverage_notes;
};

const calls = { chat: 0, use: 0, terminate: 0 };
const fake = {
  use: async () => { calls.use += 1; return { token: `tk_${calls.use}` }; },
  addMonitor: async () => undefined,
  terminate: async () => { calls.terminate += 1; },
  chat: async () => {
    calls.chat += 1;
    if (calls.chat === 1) return new Promise(() => { /* the socket died: this never resolves */ });
    return { answers: [`{"signals": [], "coverage_notes": "attempt ${calls.chat}"}`] };
  },
};
initRunner(fake as never);
ASK_DEADLINE_MS['lk_assets.pipe'] = 250; // milliseconds, for the test only

const t0 = Date.now();
const r = await ask('lk_assets.pipe', 'anything');
const took = Date.now() - t0;

// restartPipe waits three seconds for the engine to reap the dead task, so the bound is seconds, not 30 minutes
ok(`the silent first call was abandoned in ${took}ms, not 30 minutes`, took < 8000);
ok('the second attempt answered', notes(r) === 'attempt 2');
ok('the dead pipe was terminated before the retry', calls.terminate === 1);
ok('the pipe was re-registered', calls.use === 2);
ok('exactly two chat attempts', calls.chat === 2);

const t1 = Date.now();
const r2 = await ask('lk_assets.pipe', 'anything');
ok('a prompt answer passes straight through', notes(r2) === 'attempt 3' && Date.now() - t1 < 500);

console.log(bad ? `\nDEADLINE FAILED (${bad})` : '\nDEADLINE OK');
if (bad) process.exit(1);
