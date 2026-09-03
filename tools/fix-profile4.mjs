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
const { rows } = await q(`SELECT id, data FROM lk_profiles`);
for (const r of rows) {
  if (typeof r.data !== 'string') continue;
  let parsed;
  try { parsed = parseJsonLoose(r.data); } catch { continue; }
  if (!parsed || typeof parsed !== 'object') continue;
  // param stays a plain string; the stored value becomes VALID JSON text,
  // which asData() parses — same convention as every normal write
  const res = await q(`UPDATE lk_profiles SET data = $2 WHERE id = $1`,
    [r.id, JSON.stringify(parsed)]);
  console.log('repaired', r.id, 'affected:', res.affected_rows);
}
const after = await q(`SELECT data FROM lk_profiles ORDER BY version DESC LIMIT 1`);
const d = after.rows[0].data;
const obj = typeof d === 'string' ? JSON.parse(d) : d;
console.log('readback keys:', Object.keys(obj).join(','));
console.log('one_liner:', JSON.stringify(obj.one_liner ?? '(absent)').slice(0, 120));
process.exit(0);
