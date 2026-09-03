import { RocketRideClient } from 'rocketride';
import { readFileSync } from 'node:fs';
const { parseJsonLoose } = await import('./tests/domain/.build/parse.js');
const env = Object.fromEntries((readFileSync('.env', 'utf8') + '\n' + (() => { try { return readFileSync('.env.deploy', 'utf8'); } catch { return ''; } })()).split('\n')
  .filter((l) => l.includes('=') && !l.trim().startsWith('#'))
  .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]));
const c = new RocketRideClient({ uri: env.ROCKETRIDE_URI, auth: env.ROCKETRIDE_APIKEY, env, persist: true });
await c.connect();
console.log('connected');
const pipeline = JSON.parse(readFileSync('pipelines/lk_store.pipe', 'utf8'));
const { token } = await c.use({ pipeline, source: 'chat_1', useExisting: true, ttl: 600 });
console.log('task ok');
const q = async (label, sql, params) => {
  try {
    const r = await c.database.query({ token, sql, params, nodeId: 'rocketride_sql_1' });
    console.log(label, 'OK', `rows=${r.rows?.length ?? 0} affected=${r.affected_rows}`);
    return r;
  } catch (e) {
    console.log(label, 'FAILED:', String(e?.message).slice(0, 120));
    throw e;
  }
};
const sel = await q('select', `SELECT id, data FROM lk_profiles`);
const r0 = sel.rows[0];
console.log('data type:', typeof r0.data);
if (typeof r0.data === 'string') {
  const parsed = parseJsonLoose(r0.data);
  await q('update', `UPDATE lk_profiles SET data = $2::jsonb WHERE id = $1`, [r0.id, JSON.stringify(parsed)]);
}
const after = await q('reread', `SELECT data FROM lk_profiles WHERE id = $1`, [r0.id]);
const d = after.rows[0].data;
console.log('after type:', typeof d, '| keys:', typeof d === 'object' ? Object.keys(d).slice(0, 8).join(',') : String(d).slice(0, 50));
process.exit(0);
