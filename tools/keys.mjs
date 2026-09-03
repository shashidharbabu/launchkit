import { RocketRideClient } from 'rocketride';
import { readFileSync } from 'node:fs';
const env = Object.fromEntries((readFileSync('.env', 'utf8') + '\n' + (() => { try { return readFileSync('.env.deploy', 'utf8'); } catch { return ''; } })()).split('\n')
  .filter((l) => l.includes('=') && !l.trim().startsWith('#'))
  .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]));
const c = new RocketRideClient({ uri: env.ROCKETRIDE_URI, auth: env.ROCKETRIDE_APIKEY, env, persist: true });
await c.connect();
const pipeline = JSON.parse(readFileSync('pipelines/lk_store.pipe', 'utf8'));
const { token } = await c.use({ pipeline, source: 'chat_1', useExisting: true, ttl: 300 });
const { rows } = await c.database.query({ token,
  sql: `SELECT version, status, data FROM lk_profiles ORDER BY version DESC`, nodeId: 'rocketride_sql_1' });
for (const r of rows) {
  const d = typeof r.data === 'string' ? null : r.data;
  console.log(`v${r.version} ${r.status} type=${typeof r.data} keys=${d ? Object.keys(d).join(',') : String(r.data).slice(0, 60)}`);
}
process.exit(0);
