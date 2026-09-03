// Scaffold Launch Kit through the platform scaffold (doc 02: never hand-create).
// Contract D4: id rocketride_sb.launchkit, sidebar layout, Blank template.
import { RocketRideClient } from 'rocketride';
import { readFileSync } from 'node:fs';

const env = Object.fromEntries((readFileSync('.env', 'utf8') + '\n' + (() => { try { return readFileSync('.env.deploy', 'utf8'); } catch { return ''; } })()).split('\n')
  .filter((l) => l.includes('=') && !l.trim().startsWith('#'))
  .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]));

const client = new RocketRideClient({
  uri: env.ROCKETRIDE_URI, auth: env.ROCKETRIDE_APIKEY, persist: true,
});

const res = await client.connect();
const devId = res?.organization?.developerId;
if (devId !== 'rocketride_sb') {
  console.error(`ABORT: expected developerId 'rocketride_sb', got ${devId}`);
  process.exit(1);
}
console.log('connected · developerId:', devId);

const created = await client.deploy.createApp('launchkit', {
  template: 'Blank',
  displayName: 'Launch Kit',
  developerId: "rocketride_sb",
  sidebar: false, // FULL-SCREEN frame: app renders its own rail; no shell sidebar column/header
  statusFooter: false,
  docTabs: false,
  install: true,
  onProgress: (line) => console.log('  ', line),
});

console.log('\nCREATED:', JSON.stringify(created, null, 2));
try { await client.disconnect?.(); } catch {}
process.exit(0);
