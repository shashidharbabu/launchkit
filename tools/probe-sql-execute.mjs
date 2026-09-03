// Full round-trip: DDL + INSERT + SELECT through client.database.query
// against the staging-managed rocketride_sql node. No LLM in the loop.
import { RocketRideClient } from 'rocketride';
import { readFileSync } from 'node:fs';
const env = Object.fromEntries((readFileSync('.env', 'utf8') + '\n' + (() => { try { return readFileSync('.env.deploy', 'utf8'); } catch { return ''; } })()).split('\n')
  .filter((l) => l.includes('=') && !l.trim().startsWith('#'))
  .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]));
const client = new RocketRideClient({ uri: env.ROCKETRIDE_URI, auth: env.ROCKETRIDE_APIKEY, persist: true });
await client.connect();
const pipeline = JSON.parse(readFileSync('pipelines/lk_store.pipe', 'utf8'));
const { token } = await client.use({ pipeline, source: 'chat_1', useExisting: true, ttl: 600 });
console.log('store task token:', token);
const q = (sql, params) => client.database.query({ token, sql, params, nodeId: 'rocketride_sql_1' });

console.log('dialect:', await client.database.dialect({ token, nodeId: 'rocketride_sql_1' }).catch((e) => 'ERR ' + e.message));
console.log('ddl:', JSON.stringify(await q('CREATE TABLE IF NOT EXISTS lk_probe (id TEXT PRIMARY KEY, note TEXT, at TIMESTAMPTZ DEFAULT now())')));
console.log('insert:', JSON.stringify(await q('INSERT INTO lk_probe (id, note) VALUES ($1, $2) ON CONFLICT (id) DO UPDATE SET note = $2', ['p1', 'hello from launchkit migration'])));
console.log('select:', JSON.stringify(await q('SELECT id, note FROM lk_probe ORDER BY id')));
console.log('cleanup:', JSON.stringify(await q('DROP TABLE lk_probe')));
try { await client.disconnect?.(); } catch {}
process.exit(0);
