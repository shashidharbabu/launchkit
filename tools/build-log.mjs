// Print the full build record (including compiler output) for recent app
// versions. deploy-app.mjs only surfaces the failing phase, which is not enough
// to fix a server-side typecheck failure.
//
// Usage: node tools/build-log.mjs [version]

import { RocketRideClient } from 'rocketride';
import { readFileSync } from 'node:fs';

const env = Object.fromEntries(
  (readFileSync('.env', 'utf8') +
    '\n' +
    (() => {
      try {
        return readFileSync('.env.deploy', 'utf8');
      } catch {
        return '';
      }
    })())
    .split('\n')
    .filter((l) => l.includes('=') && !l.trim().startsWith('#'))
    .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]),
);

const want = process.argv[2] ? Number(process.argv[2]) : null;
const client = new RocketRideClient({
  uri: env.ROCKETRIDE_URI,
  auth: env.ROCKETRIDE_APIKEY,
  persist: true,
});
await client.connect();

const APP = 'rocketride_sb.launchkit';
const deployments = await client.listDeployments(APP);
const targets = want
  ? [want]
  : deployments.slice(0, 3).map((d) => d.registryVersion);

for (const version of targets) {
  const meta = deployments.find((d) => d.registryVersion === version);
  console.log(
    `\n=== v${version} status=${meta?.buildStatus ?? '?'} — ${meta?.message ?? ''} ===`,
  );
  try {
    const { log } = await client.buildLog(APP, version);
    console.log(log || '(empty log)');
  } catch (e) {
    console.log('buildLog failed:', e instanceof Error ? e.message : String(e));
  }
}

try {
  await client.disconnect?.();
} catch {}
process.exit(0);
