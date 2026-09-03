import { RocketRideClient } from 'rocketride';
import { readFileSync } from 'node:fs';
const { parseJsonLoose } = await import('./tests/domain/.build/parse.js');
const env = Object.fromEntries((readFileSync('.env', 'utf8') + '\n' + (() => { try { return readFileSync('.env.deploy', 'utf8'); } catch { return ''; } })()).split('\n')
  .filter((l) => l.includes('=') && !l.trim().startsWith('#'))
  .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]));
const c = new RocketRideClient({ uri: env.ROCKETRIDE_URI, auth: env.ROCKETRIDE_APIKEY, env, persist: true });
await c.connect();
const pipeline = JSON.parse(readFileSync('pipelines/lk_store.pipe', 'utf8'));
const { token } = await c.use({ pipeline, source: 'chat_1', useExisting: true, ttl: 300 });
const q = (sql, params) => c.database.query({ token, sql, params, nodeId: 'rocketride_sql_1' });
const { rows } = await q(`SELECT id, data FROM lk_profiles`);
let fixed = 0;
for (const r of rows) {
  if (typeof r.data === 'string') {
    const parsed = parseJsonLoose(r.data);
    if (parsed && typeof parsed === 'object') {
      await q(`UPDATE lk_profiles SET data = $2 WHERE id = $1`, [r.id, JSON.stringify(parsed)]);
      fixed++;
    }
  }
}
console.log('profiles repaired:', fixed);
process.exit(0);
