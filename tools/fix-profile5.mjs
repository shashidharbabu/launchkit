import { RocketRideClient } from 'rocketride';
import { readFileSync } from 'node:fs';
const { parseJsonLoose } = await import('./tests/domain/.build/parse.js');
const env = Object.fromEntries((readFileSync('.env', 'utf8') + '\n' + (() => { try { return readFileSync('.env.deploy', 'utf8'); } catch { return ''; } })()).split('\n')
  .filter((l) => l.includes('=') && !l.trim().startsWith('#'))
  .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]));
const c = new RocketRideClient({ uri: env.ROCKETRIDE_URI, auth: env.ROCKETRIDE_APIKEY, env, persist: true });
await c.connect();
const pipeline = JSON.parse(readFileSync('pipelines/lk_store.pipe', 'utf8'));
const { token } = await c.use({ pipeline, source: 'chat_1', useExisting: true, ttl: 600 });
const q = (sql, params) => c.database.query({ token, sql, params, nodeId: 'rocketride_sql_1' });
const lit = (s) => `'${s.replaceAll("'", "''")}'`;
const { rows } = await q(`SELECT id, data FROM lk_profiles`);
for (const r of rows) {
  if (typeof r.data !== 'string') continue;
  let parsed; try { JSON.parse(r.data); continue; } catch { /* python text — repair */ }
  try { parsed = parseJsonLoose(r.data); } catch { continue; }
  const res = await q(`UPDATE lk_profiles SET data = ${lit(JSON.stringify(parsed))} WHERE id = ${lit(r.id)}`);
  console.log('repaired', r.id, 'affected:', res.affected_rows);
}
const after = await q(`SELECT data FROM lk_profiles ORDER BY version DESC LIMIT 1`);
const d = after.rows[0].data;
const obj = typeof d === 'string' ? JSON.parse(d) : d;
console.log('READBACK OK — keys:', Object.keys(obj).join(',').slice(0, 140));
process.exit(0);
