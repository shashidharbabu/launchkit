import { RocketRideClient } from 'rocketride';
import { readFileSync } from 'node:fs';
const env = Object.fromEntries((readFileSync('.env', 'utf8') + '\n' + (() => { try { return readFileSync('.env.deploy', 'utf8'); } catch { return ''; } })()).split('\n')
  .filter((l) => l.includes('=') && !l.trim().startsWith('#'))
  .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]));
const c = new RocketRideClient({ uri: env.ROCKETRIDE_URI, auth: env.ROCKETRIDE_APIKEY, env, persist: true });
await c.connect();
const pipeline = JSON.parse(readFileSync('pipelines/lk_store.pipe', 'utf8'));
const { token } = await c.use({ pipeline, source: 'chat_1', useExisting: true, ttl: 300 });
const q = (sql, params) => c.database.query({ token, sql, params, nodeId: 'rocketride_sql_1' });
console.log('projects:', JSON.stringify((await q('SELECT id, name, site_url, repo_url FROM lk_projects')).rows));
console.log('runs:', JSON.stringify((await q('SELECT kind, status, error, elapsed_seconds FROM lk_runs ORDER BY created_at DESC LIMIT 5')).rows).slice(0, 600));
const prof = (await q('SELECT version, status, data FROM lk_profiles ORDER BY created_at DESC LIMIT 1')).rows[0];
console.log('profile v' + prof?.version, prof?.status, '| data:', JSON.stringify(prof?.data).slice(0, 500));
process.exit(0);
