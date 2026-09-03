import { RocketRideClient } from 'rocketride';
import { readFileSync } from 'node:fs';
const s = Object.fromEntries((readFileSync('.env', 'utf8') + '\n' + (() => { try { return readFileSync('.env.deploy', 'utf8'); } catch { return ''; } })()).split('\n')
  .filter((l) => l.includes('=') && !l.trim().startsWith('#'))
  .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]));
const c = new RocketRideClient({ uri: s.ROCKETRIDE_URI, auth: s.ROCKETRIDE_APIKEY, persist: true });
await c.connect();
console.log('client.deploy verbs:', Object.keys(c.deploy ?? {}).sort().join(', '));
for (const v of ['createApp','addApp','verifyApp','add','enable','setSchedule','preview','versions','listDeployments','publishApp','submitApp'])
  console.log(` ${v}: ${typeof c.deploy?.[v]==='function'?'client.deploy':typeof c[v]==='function'?'client':'MISSING'}`);
try { await c.disconnect?.(); } catch {}
process.exit(0);
