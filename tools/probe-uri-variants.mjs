// Which URI form does the vendored client actually accept? Tries the .env
// value as-is and the port-less form, reporting connect() success per variant.
import { RocketRideClient } from 'rocketride';
import { readFileSync } from 'node:fs';

const env = Object.fromEntries((readFileSync('.env', 'utf8') + '\n' + (() => { try { return readFileSync('.env.deploy', 'utf8'); } catch { return ''; } })()).split('\n')
  .filter((l) => l.includes('=') && !l.trim().startsWith('#'))
  .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]));

const key = env.ROCKETRIDE_APIKEY;
const variants = [
  ['as-configured', env.ROCKETRIDE_URI],
  ['no explicit port', (env.ROCKETRIDE_URI ?? '').replace(/:443$/, '')],
];

for (const [label, uri] of variants) {
  if (!uri) continue;
  process.stdout.write(`${label.padEnd(18)} ${uri}  ->  `);
  const client = new RocketRideClient({ uri, apikey: key, persist: true });
  try {
    const res = await Promise.race([
      client.connect(),
      new Promise((_, rej) => setTimeout(() => rej(new Error('timeout 30s')), 30000)),
    ]);
    const devId = res?.developerId ?? res?.developer_id ?? res?.org?.developerId ?? null;
    console.log(`OK  keys=[${Object.keys(res ?? {}).join(',')}]  developerId=${devId ?? 'NULL'}`);
    console.log('   full:', JSON.stringify(res).slice(0, 600));
  } catch (e) {
    console.log('FAILED:', e?.message ?? e);
  } finally {
    try { await client.disconnect?.(); } catch {}
  }
}
process.exit(0);
