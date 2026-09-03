import { RocketRideClient } from 'rocketride';
import { readFileSync } from 'node:fs';
const s = Object.fromEntries((readFileSync('.env', 'utf8') + '\n' + (() => { try { return readFileSync('.env.deploy', 'utf8'); } catch { return ''; } })()).split('\n')
  .filter((l) => l.includes('=') && !l.trim().startsWith('#'))
  .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]));
const c = new RocketRideClient({ uri: s.ROCKETRIDE_URI, auth: s.ROCKETRIDE_APIKEY, persist: true });
const res = await c.connect();
console.log('org developerId:', res?.organization?.developerId);
console.log('visible apps (id | publisher):');
for (const a of res?.apps ?? []) console.log(`  ${a.id}  |  publisher=${a.publisher ?? '(none)'}`);
try { await c.disconnect?.(); } catch {}
process.exit(0);
