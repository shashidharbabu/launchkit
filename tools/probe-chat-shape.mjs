import { RocketRideClient, Question } from 'rocketride';
import { readFileSync } from 'node:fs';
const env = Object.fromEntries((readFileSync('.env', 'utf8') + '\n' + (() => { try { return readFileSync('.env.deploy', 'utf8'); } catch { return ''; } })()).split('\n')
  .filter((l) => l.includes('=') && !l.trim().startsWith('#'))
  .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]));
const client = new RocketRideClient({ uri: env.ROCKETRIDE_URI, auth: env.ROCKETRIDE_APIKEY, persist: true, env });
await client.connect();
const pipeline = JSON.parse(readFileSync('pipelines/lk_rescore.pipe', 'utf8'));
// kill any stale task running with the old (empty) env, then start fresh
const stale = await client.use({ pipeline, source: 'chat_1', useExisting: true, ttl: 60 }).catch(() => null);
if (stale?.token) { await client.terminate(stale.token).catch(() => {}); await new Promise(r => setTimeout(r, 3000)); }
const { token } = await client.use({ pipeline, source: 'chat_1', useExisting: false, ttl: 300 });
const q = new Question({ expectJson: true });
q.questions.push({ text: 'Reply with ONLY RFC 8259 JSON: {"probe": true, "sum": 41}' });
const res = await client.chat({ token, question: q });
console.log(JSON.stringify({ answers: res.answers, result_types: res.result_types }, null, 1));
try { await client.terminate(token); } catch {}
try { await client.disconnect?.(); } catch {}
process.exit(0);
