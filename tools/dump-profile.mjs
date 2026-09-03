import { RocketRideClient } from 'rocketride';
import { readFileSync, writeFileSync } from 'node:fs';
const env = Object.fromEntries((readFileSync('.env', 'utf8') + '\n' + (() => { try { return readFileSync('.env.deploy', 'utf8'); } catch { return ''; } })()).split('\n')
  .filter((l) => l.includes('=') && !l.trim().startsWith('#'))
  .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]));
const c = new RocketRideClient({ uri: env.ROCKETRIDE_URI, auth: env.ROCKETRIDE_APIKEY, env, persist: true });
await c.connect();
const pipeline = JSON.parse(readFileSync('pipelines/lk_store.pipe', 'utf8'));
const { token } = await c.use({ pipeline, source: 'chat_1', useExisting: true, ttl: 300 });
const { rows } = await c.database.query({ token,
  sql: 'SELECT data FROM lk_profiles ORDER BY created_at DESC LIMIT 1', nodeId: 'rocketride_sql_1' });
writeFileSync('/tmp/profile-raw.json', JSON.stringify(rows[0].data));
console.log('saved; typeof stored:', typeof rows[0].data, '| length:', JSON.stringify(rows[0].data).length);
process.exit(0);
