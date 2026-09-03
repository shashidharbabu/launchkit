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
const { rows } = await q(`SELECT project_id, data FROM lk_profiles WHERE version = 1`);
const parsed = parseJsonLoose(rows[0].data);
const id = crypto.randomUUID().replaceAll('-', '').slice(0, 12);
await q(`INSERT INTO lk_profiles (id, project_id, version, data, status, job_id, approved_by)
         VALUES ($1, $2, 2, $3, 'approved', 'repair-v2', $4)`,
  [id, rows[0].project_id, JSON.stringify(parsed), 'migration-repair']);
const after = await q(`SELECT version, data FROM lk_profiles ORDER BY version DESC LIMIT 1`);
const d = after.rows[0].data;
const obj = typeof d === 'string' ? JSON.parse(d) : d;
console.log(`v${after.rows[0].version} READBACK OK — keys:`, Object.keys(obj).join(',').slice(0, 160));
console.log('one_liner:', JSON.stringify(obj.one_liner ?? '(absent)').slice(0, 140));
process.exit(0);
