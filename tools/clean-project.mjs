import { RocketRideClient } from 'rocketride';
import { readFileSync } from 'node:fs';
const env = Object.fromEntries((readFileSync('.env', 'utf8') + '\n' + (() => { try { return readFileSync('.env.deploy', 'utf8'); } catch { return ''; } })()).split('\n')
  .filter((l) => l.includes('=') && !l.trim().startsWith('#'))
  .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]));
const c = new RocketRideClient({ uri: env.ROCKETRIDE_URI, auth: env.ROCKETRIDE_APIKEY, env, persist: true });
await c.connect();
const pipeline = JSON.parse(readFileSync('pipelines/lk_store.pipe', 'utf8'));
const { token } = await c.use({ pipeline, source: 'chat_1', useExisting: true, ttl: 300 });
const q = (sql) => c.database.query({ token, sql, nodeId: 'rocketride_sql_1' });
for (const t of ['lk_profiles', 'lk_projects', 'lk_runs', 'lk_assets', 'lk_targets', 'lk_signals', 'lk_commercial_results']) {
  const r = await q(`DELETE FROM ${t}`);
  console.log(t, 'cleared:', r.affected_rows);
}
process.exit(0);
