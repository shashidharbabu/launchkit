// Correct constructor: { auth, uri } (NOT apikey — that option is ignored).
import { RocketRideClient } from 'rocketride';
import { readFileSync } from 'node:fs';
const load = (p) => Object.fromEntries(readFileSync(p, 'utf8').split('\n')
  .filter((l) => l.includes('=') && !l.trim().startsWith('#'))
  .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]));
const s = load('.env');
const targets = [['staging', s.ROCKETRIDE_URI, s.ROCKETRIDE_APIKEY]];
for (const [label, uri, auth] of targets) {
  process.stdout.write(`${label}: ${uri} -> `);
  const c = new RocketRideClient({ uri, auth, persist: true });
  try {
    const res = await Promise.race([c.connect(),
      new Promise((_, rj) => setTimeout(() => rj(new Error('timeout')), 30000))]);
    console.log('CONNECTED');
    console.log(JSON.stringify(res, null, 2).slice(0, 1500));
  } catch (e) { console.log('FAILED:', e?.message ?? e); }
  finally { try { await c.disconnect?.(); } catch {} }
}
process.exit(0);
