// terminate the old lk_store task so the new secret-free config takes over
import { RocketRideClient } from 'rocketride';
import { readFileSync } from 'node:fs';
const env = Object.fromEntries(readFileSync('/Users/shashidharbabu/rocketride-apps-gtm/.env', 'utf8').split('\n')
  .filter((l) => l.includes('=') && !l.trim().startsWith('#'))
  .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]));
const c = new RocketRideClient({ uri: env.ROCKETRIDE_URI, auth: env.ROCKETRIDE_APIKEY, env, persist: true });
await c.connect();
const pipeline = JSON.parse(readFileSync('/Users/shashidharbabu/rocketride-apps-gtm/pipelines/lk_store.pipe', 'utf8'));
const old = await c.use({ pipeline, source: 'chat_1', useExisting: true, ttl: 60 }).catch(() => null);
if (old?.token) { await c.terminate(old.token).catch(() => {}); console.log('old store task terminated'); }
await new Promise((r) => setTimeout(r, 3000));
const fresh = await c.use({ pipeline, source: 'chat_1', useExisting: false, ttl: 300 });
const res = await c.database.query({ token: fresh.token, sql: 'SELECT 1 AS ok', nodeId: 'rocketride_sql_1' });
console.log('secret-free store task works:', JSON.stringify(res.rows));
await c.terminate(fresh.token).catch(() => {});
process.exit(0);
