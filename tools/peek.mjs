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
  sql: `SELECT version, status, data FROM lk_profiles ORDER BY version DESC LIMIT 1`, nodeId: 'rocketride_sql_1' });
if (!rows.length) { console.log('NO PROFILE ROWS'); process.exit(0); }
const r = rows[0];
console.log('version', r.version, 'status', r.status, 'data typeof', typeof r.data);
const d = typeof r.data === 'string' ? (() => { try { return JSON.parse(r.data); } catch { return { RAW_STRING: r.data.slice(0, 80) }; } })() : r.data;
console.log('top keys:', Object.keys(d).join(','));
console.log('one_liner:', JSON.stringify(d.one_liner));
console.log('differentiators:', JSON.stringify(d.differentiators)?.slice(0, 100));
console.log('icp.who:', JSON.stringify(d.icp?.who));
console.log('confidence:', JSON.stringify(d.confidence));
console.log('sources_read len:', (d.sources_read ?? []).length);
process.exit(0);
