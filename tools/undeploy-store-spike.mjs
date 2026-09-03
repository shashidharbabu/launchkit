import { RocketRideClient } from 'rocketride';
import { readFileSync } from 'node:fs';
const env = Object.fromEntries((readFileSync('.env', 'utf8') + '\n' + (() => { try { return readFileSync('.env.deploy', 'utf8'); } catch { return ''; } })()).split('\n')
  .filter((l) => l.includes('=') && !l.trim().startsWith('#'))
  .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]));
const c = new RocketRideClient({ uri: env.ROCKETRIDE_URI, auth: env.ROCKETRIDE_APIKEY, env, persist: true });
const conn = await c.connect();
const teamId = conn.organization.teams.find((t) => t.name === 'Development')?.id;
const pid = JSON.parse(readFileSync('pipelines/lk_store.pipe', 'utf8')).project_id;
try { const r = await c.deploy.remove?.(pid, teamId) ?? await c.deploy.disable?.(pid, teamId); console.log('removed:', JSON.stringify(r).slice(0,80)); }
catch (e) { console.log('cleanup:', String(e?.message).slice(0,100)); }
process.exit(0);
