import { RocketRideClient } from 'rocketride';
import { readFileSync } from 'node:fs';
const env = Object.fromEntries((readFileSync('.env', 'utf8') + '\n' + (() => { try { return readFileSync('.env.deploy', 'utf8'); } catch { return ''; } })()).split('\n')
  .filter((l) => l.includes('=') && !l.trim().startsWith('#'))
  .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]));
const client = new RocketRideClient({ uri: env.ROCKETRIDE_URI, auth: env.ROCKETRIDE_APIKEY, persist: true });
await client.connect();
const d = await client.listDeployments('rocketride_sb.launchkit');
console.log(JSON.stringify(d).slice(0, 1200));
for (const row of d?.rows ?? d?.deployments ?? []) {
  console.log(JSON.stringify({ audience: row.audience, version: row.version, state: row.state }));
}
try { await client.disconnect?.(); } catch {}
process.exit(0);
