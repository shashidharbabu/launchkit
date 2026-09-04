// The @me publish bound to the API key's user, which may not be the browser
// session's account. Publishing to both org teams makes v2 visible to every
// member of Shashidhar's Workspace regardless of which account is signed in.
import { RocketRideClient } from 'rocketride';
import { readFileSync } from 'node:fs';
const env = Object.fromEntries((readFileSync('.env', 'utf8') + '\n' + (() => { try { return readFileSync('.env.deploy', 'utf8'); } catch { return ''; } })()).split('\n')
  .filter((l) => l.includes('=') && !l.trim().startsWith('#'))
  .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]));
const client = new RocketRideClient({
  uri: env.ROCKETRIDE_DEPLOY_URI || env.ROCKETRIDE_URI,
  auth: env.ROCKETRIDE_DEPLOY_APIKEY || env.ROCKETRIDE_APIKEY, persist: true });
const res = await client.connect();
console.log('key belongs to user:', JSON.stringify(res?.user ?? res?.email ?? '(not in payload)').slice(0, 120));
for (const team of res?.organization?.teams ?? []) {
  try {
    const out = await client.publishApp('rocketride_sb.launchkit', 22, `@team/${team.id}`);
    console.log(`published v2 -> @team/${team.name}:`, JSON.stringify(out.publish?.state ?? out).slice(0, 80));
  } catch (e) {
    console.log(`team ${team.name} FAILED:`, String(e?.message ?? e).slice(0, 160));
  }
}
try { await client.disconnect?.(); } catch {}
process.exit(0);
