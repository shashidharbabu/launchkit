import { RocketRideClient, Question } from 'rocketride';
import { readFileSync } from 'node:fs';
const parse = (t) => Object.fromEntries(t.split('\n').filter((l) => l.includes('=') && !l.trim().startsWith('#')).map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]));
const env = { ...parse(readFileSync('.env', 'utf8')), ...parse((() => { try { return readFileSync('.env.deploy', 'utf8'); } catch { return ''; } })()) };
const c = new RocketRideClient({ uri: env.ROCKETRIDE_URI, auth: env.ROCKETRIDE_APIKEY, env, persist: true });
await c.connect();
const pipeline = JSON.parse(readFileSync('apps/launchkit/pipelines/lk_navigator.pipe', 'utf8'));
const { token } = await c.use({ pipeline, source: 'chat_1', useExisting: true, ttl: 900 });
const { instructions } = JSON.parse(readFileSync('apps/launchkit/src/data/navigator.prompt.json', 'utf8'));
const ctx = { currentView: 'home', launches: [{ id: 'p1', name: 'Excalidraw', stage: 'brand', status: 'done' }, { id: 'p2', name: 'Gridiron', stage: 'profile', status: 'queued' }] };
const build = (msg, hist = []) => [...instructions, 'CONTEXT: ' + JSON.stringify(ctx), hist.length ? 'RECENT TURNS:\n' + hist.join('\n') : '', 'USER: ' + msg].filter(Boolean).join('\n\n');
const cases = [
  ['open my Excalidraw launch', { view: 'workspace', projectId: 'p1' }],
  ['show me all launches', { view: 'launches' }],
  ['start a new launch', { view: 'new-launch' }],
  ['where do I add my API keys', { view: 'settings', orNull: true }],
  ['what is gate 2', { view: null }],
  ['take me to runs', { view: 'runs' }],
  ['go home', { view: 'home' }],
  ['open my launch', { view: null }],
];
let pass = 0;
for (const [msg, exp] of cases) {
  const q = new Question({ expectJson: true }); q.questions.push({ text: build(msg) });
  let ans = null, err = '';
  try { const r = await c.chat({ token, question: q }); let a = r?.answers?.[0] ?? Object.values(r ?? {}).flat().find((x) => x != null);
    for (let i = 0; i < 3 && typeof a === 'string'; i++) { try { a = JSON.parse(a.replace(/^```(?:json)?\s*|\s*```$/g, '')); } catch { break; } } ans = a; } catch (e) { err = String(e?.message ?? e).slice(0, 80); }
  const got = ans && typeof ans === 'object' ? (ans.action ? ans.action.view : null) : 'unparsed';
  const gotPid = ans?.action?.projectId ?? null;
  const ok = exp.view === null ? got === null : (got === exp.view || (exp.orNull && got === null)) && (!exp.projectId || gotPid === exp.projectId);
  pass += ok ? 1 : 0;
  console.log((ok ? 'PASS' : 'FAIL') + ' | ' + msg.padEnd(28) + ' | expect ' + String(exp.view).padEnd(10) + ' | got ' + String(got).padEnd(10) + (gotPid ? ' pid=' + gotPid : '') + ' | ' + String(ans?.reply ?? err).slice(0, 64));
}
console.log(`NAVIGATOR ${pass}/${cases.length}`);
process.exit(0);
