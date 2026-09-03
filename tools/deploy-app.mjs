import { execFileSync as __rrExec } from 'node:child_process';
// Always regenerate the compiled design system before packing — a stale
// styles.generated.ts ships silently (tsc/rsbuild cannot detect a missing utility).
__rrExec('node', ['tools/gen-styles.mjs'], { stdio: 'inherit' });
// Deploy rail: verifyApp -> addApp -> poll build -> (optionally) publish @me.
import { RocketRideClient } from 'rocketride';
import { readFileSync } from 'node:fs';
const env = Object.fromEntries((readFileSync('.env', 'utf8') + '\n' + (() => { try { return readFileSync('.env.deploy', 'utf8'); } catch { return ''; } })()).split('\n')
  .filter((l) => l.includes('=') && !l.trim().startsWith('#'))
  .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]));
const client = new RocketRideClient({
  uri: env.ROCKETRIDE_DEPLOY_URI || env.ROCKETRIDE_URI,
  auth: env.ROCKETRIDE_DEPLOY_APIKEY || env.ROCKETRIDE_APIKEY,
  persist: true,
});
await client.connect();

const report = await client.deploy.verifyApp('./apps/launchkit');
console.log('verifyApp ok:', report.ok, `files=${report.fileCount}`,
  `${(report.uncompressedBytes / 1048576).toFixed(1)}MB uncompressed`);
for (const c of report.checks.filter((x) => !x.ok)) console.log('  FAIL:', c.id, '-', c.note);
if (!report.ok) process.exit(1);

const comment = process.argv[2] ?? 'migration smoke: scaffold + design system mount';
const added = await client.deploy.addApp('./apps/launchkit', {
  comment, onProgress: (l) => console.log('  ', l),
});
console.log('addApp ->', JSON.stringify(added).slice(0, 400));

// poll the server build
const appId = 'rocketride_sb.launchkit';
for (let i = 0; i < 90; i++) {
  await new Promise((r) => setTimeout(r, 5000));
  const versions = await client.deploy.versions(appId).catch(() => null);
  const rows = versions?.rows ?? [];
  const latest = rows.reduce((a, b) => ((a?.version ?? 0) >= (b?.version ?? 0) ? a : b), null);
  const status = latest?.build?.status ?? latest?.snapshot?.build?.status ?? 'unknown';
  console.log(`build poll ${i}: v${latest?.version} ${status}`);
  if (status === 'ok') { console.log('BUILD OK — version', latest.version); break; }
  if (String(status).includes('fail') || String(status).includes('error')) {
    console.log('BUILD FAILED:', JSON.stringify(latest?.build ?? latest).slice(0, 1500));
    process.exit(1);
  }
}
try { await client.disconnect?.(); } catch {}
process.exit(0);
