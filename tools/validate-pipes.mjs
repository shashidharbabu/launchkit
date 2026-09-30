// Validate every generated pipe against the staging engine (no runs).
// PIPE_DIR (default pipelines/) and ENV_FILE (default .env, the dev pair) pick what and where; the eval kit sets
// PIPE_DIR=apps/launchkit/pipelines, the live pipes the app imports.
import { RocketRideClient } from 'rocketride';
import { readFileSync, readdirSync } from 'node:fs';
const env = Object.fromEntries((readFileSync(process.env.ENV_FILE || '.env', 'utf8') + '\n' + (() => { try { return readFileSync((process.env.ENV_FILE || '.env') + '.deploy', 'utf8'); } catch { return ''; } })()).split('\n')
  .filter((l) => l.includes('=') && !l.trim().startsWith('#'))
  .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]));
const client = new RocketRideClient({ uri: env.ROCKETRIDE_URI, auth: env.ROCKETRIDE_APIKEY, persist: true });
await client.connect();
let bad = 0;
for (const f of readdirSync(process.env.PIPE_DIR || 'pipelines').filter((x) => x.endsWith('.pipe')).sort()) {
  const pipeline = JSON.parse(readFileSync(`${process.env.PIPE_DIR || 'pipelines'}/${f}`, 'utf8'));
  try {
    const v = await client.validate({ pipeline });
    const errs = v?.errors ?? v?.problems ?? [];
    const ok = (v?.valid ?? v?.ok ?? (Array.isArray(errs) && errs.length === 0));
    console.log(`${ok ? 'OK  ' : 'FAIL'} ${f}${ok ? '' : ' ' + JSON.stringify(errs).slice(0, 300)}`);
    if (!ok) bad++;
  } catch (e) {
    console.log(`ERR  ${f}: ${String(e?.message ?? e).slice(0, 200)}`); bad++;
  }
}
try { await client.disconnect?.(); } catch {}
process.exit(bad ? 1 : 0);
