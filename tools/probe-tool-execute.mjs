// Does the lower-level client.tool({tool:'execute'}) path reach the SQL node?
// This is the fallback store.execSql uses when the shell client lacks .database.
import { RocketRideClient } from 'rocketride';
import { readFileSync } from 'node:fs';
const env = Object.fromEntries((readFileSync('.env', 'utf8') + '\n' + (() => { try { return readFileSync('.env.deploy', 'utf8'); } catch { return ''; } })()).split('\n')
  .filter((l) => l.includes('=') && !l.trim().startsWith('#'))
  .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]));
const c = new RocketRideClient({ uri: env.ROCKETRIDE_URI, auth: env.ROCKETRIDE_APIKEY, env, persist: true });
await c.connect();
const pipeline = JSON.parse(readFileSync('pipelines/lk_store.pipe', 'utf8'));
const { token } = await c.use({ pipeline, source: 'chat_1', useExisting: true, ttl: 300 });
console.log('typeof client.database:', typeof c.database);
console.log('typeof client.tool:', typeof c.tool);
// the fallback path
const out = await c.tool({ token, tool: 'execute', nodeId: 'rocketride_sql_1', input: { sql: 'SELECT count(*)::int AS n FROM lk_venues' } });
console.log('tool(execute) result:', JSON.stringify(out).slice(0, 200));
process.exit(0);
