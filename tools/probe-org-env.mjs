import { RocketRideClient } from 'rocketride';
import { readFileSync } from 'node:fs';
const parse = (t) => Object.fromEntries(t.split('\n').filter((l) => l.includes('=') && !l.trim().startsWith('#')).map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]));
const env = { ...parse(readFileSync('.env', 'utf8')), ...parse((() => { try { return readFileSync('.env.deploy', 'utf8'); } catch { return ''; } })()) };
const c = new RocketRideClient({ uri: env.ROCKETRIDE_URI, auth: env.ROCKETRIDE_APIKEY, env, persist: true });
const conn = await c.connect();
console.log('org:', conn.organization?.name, '| devId:', conn.organization?.developerId);
const keys = conn.envKeys ?? conn.organization?.envKeys ?? null;
console.log('envKeys visible to this connection:', keys ? JSON.stringify(keys) : '(none reported)');
for (const k of ['ROCKETRIDE_ANTHROPIC_KEY','ROCKETRIDE_FIRECRAWL_KEY','ROCKETRIDE_EXA_KEY','ROCKETRIDE_GMI_KEY','ROCKETRIDE_GITHUB_TOKEN']) {
  const inList = Array.isArray(keys) ? keys.includes(k) : (keys && typeof keys === 'object' ? k in keys : null);
  console.log(`  ${k}: org=${inList === null ? '?' : inList} local=${Boolean(env[k])}`);
}
process.exit(0);
