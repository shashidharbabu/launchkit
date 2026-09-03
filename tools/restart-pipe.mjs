import { RocketRideClient } from 'rocketride';
import { readFileSync } from 'node:fs';
const name = process.argv[2]; if (!name) { console.error('usage: node tools/restart-pipe.mjs lk_signals'); process.exit(1); }
const parse = (t) => Object.fromEntries(t.split('\n').filter((l) => l.includes('=') && !l.trim().startsWith('#')).map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]));
// plain .env only — this must match the PREVIEW's identity (preview/env.generated.ts), not the deploy overlay
const env = parse(readFileSync('.env', 'utf8'));
const c = new RocketRideClient({ uri: env.ROCKETRIDE_URI, auth: env.ROCKETRIDE_APIKEY, env, persist: true });
const conn = await c.connect(); console.log('as', JSON.stringify(conn.user ?? '?'), 'devId', conn.organization?.developerId);
const pipeline = JSON.parse(readFileSync(`apps/launchkit/pipelines/${name}.pipe`, 'utf8'));
const { token } = await c.use({ pipeline, source: 'chat_1', useExisting: true, ttl: 60 });
await c.terminate(token); console.log('terminated task for', name, '— next use() starts fresh with the new config');
process.exit(0);
