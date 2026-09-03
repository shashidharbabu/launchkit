import { RocketRideClient } from 'rocketride';
import { readFileSync } from 'node:fs';
const env = Object.fromEntries((readFileSync('.env', 'utf8') + '\n' + (() => { try { return readFileSync('.env.deploy', 'utf8'); } catch { return ''; } })()).split('\n')
  .filter((l) => l.includes('=') && !l.trim().startsWith('#'))
  .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]));
const client = new RocketRideClient({
  uri: env.ROCKETRIDE_DEPLOY_URI || env.ROCKETRIDE_URI,
  auth: env.ROCKETRIDE_DEPLOY_APIKEY || env.ROCKETRIDE_APIKEY, persist: true });
await client.connect();
const res = await client.publishApp('rocketride_sb.launchkit', 17, '@me');
console.log('publishApp:', JSON.stringify(res).slice(0, 500));
try { await client.disconnect?.(); } catch {}
process.exit(0);
