import { RocketRideClient } from 'rocketride';
import { readFileSync } from 'node:fs';
const env = Object.fromEntries((readFileSync('.env', 'utf8') + '\n' + (() => { try { return readFileSync('.env.deploy', 'utf8'); } catch { return ''; } })()).split('\n')
  .filter((l) => l.includes('=') && !l.trim().startsWith('#'))
  .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]));
const client = new RocketRideClient({ uri: env.ROCKETRIDE_URI, auth: env.ROCKETRIDE_APIKEY, persist: true });
await client.connect();
const versions = await client.deploy.versions('rocketride_sb.launchkit');
console.log(JSON.stringify(versions, null, 1).slice(0, 2500));
const deployments = await client.listDeployments?.().catch((e) => String(e?.message));
console.log('\nlistDeployments:', JSON.stringify(deployments).slice(0, 600));
try { await client.disconnect?.(); } catch {}
process.exit(0);
