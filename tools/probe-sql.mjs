// Doc 05 §1 storage probe: validate + run the throwaway rocketride_sql pipe
// on staging and execute a trivial statement. A broker/identity error here is
// a REPORT-TO-DMITRII finding, not something to work around client-side.
import { RocketRideClient, Question } from 'rocketride';
import { readFileSync } from 'node:fs';

const env = Object.fromEntries((readFileSync('.env', 'utf8') + '\n' + (() => { try { return readFileSync('.env.deploy', 'utf8'); } catch { return ''; } })()).split('\n')
  .filter((l) => l.includes('=') && !l.trim().startsWith('#'))
  .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]));

const client = new RocketRideClient({
  uri: env.ROCKETRIDE_URI, auth: env.ROCKETRIDE_APIKEY, persist: true,
});
await client.connect();
console.log('connected to staging');

const pipeline = JSON.parse(readFileSync('tools/probe-pipes/lk_probe_sql.pipe', 'utf8'));

const validation = await client.validate({ pipeline });
console.log('validate:', JSON.stringify(validation).slice(0, 800));

const okToRun = validation?.valid ?? validation?.ok ?? validation?.success;
if (okToRun === false) {
  console.log('VALIDATION FAILED — stopping before run');
  process.exit(1);
}

const useRes = await client.use({ pipeline, source: 'chat_1', useExisting: false, ttl: 300 });
console.log('use -> token:', useRes.token);

const q = new Question({ expectJson: false });
q.questions.push({ text: 'Execute exactly this SQL statement and return its result: SELECT 1 AS ok' });

try {
  const res = await client.chat({ token: useRes.token, question: q });
  console.log('chat result:', JSON.stringify(res).slice(0, 1200));
} catch (e) {
  console.log('CHAT FAILED:', e?.message ?? e);
}

try { await client.terminate?.({ token: useRes.token }); } catch {}
try { await client.disconnect?.(); } catch {}
process.exit(0);
