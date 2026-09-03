// Spike: deploy lk_store as a TEAM pipe, then getTaskToken + query.
// If ROCKETRIDE_CLIENT_ID resolves for a deployed task, this is the fix.
import { RocketRideClient } from 'rocketride';
import { readFileSync } from 'node:fs';
const env = Object.fromEntries((readFileSync('.env', 'utf8') + '\n' + (() => { try { return readFileSync('.env.deploy', 'utf8'); } catch { return ''; } })()).split('\n')
  .filter((l) => l.includes('=') && !l.trim().startsWith('#'))
  .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]));
const c = new RocketRideClient({ uri: env.ROCKETRIDE_DEPLOY_URI || env.ROCKETRIDE_URI,
  auth: env.ROCKETRIDE_DEPLOY_APIKEY || env.ROCKETRIDE_APIKEY, env, persist: true });
const conn = await c.connect();
const teamId = conn.organization.teams.find((t) => t.name === 'Development')?.id
            ?? conn.organization.teams[0].id;
console.log('teamId:', teamId);

const pipe = JSON.parse(readFileSync('pipelines/lk_store.pipe', 'utf8'));
const projectId = pipe.project_id;

// deploy as a team pipe
try {
  const dep = await c.deploy.add({ kind: 'pipe', pipeline: { ...pipe, name: 'lk_store' },
    comment: 'store spike', deployTo: teamId });
  console.log('deploy.add ok:', JSON.stringify(dep).slice(0, 120));
} catch (e) { console.log('deploy.add:', String(e?.message).slice(0, 140)); }
try { await c.deploy.enable(projectId, teamId); console.log('enabled'); }
catch (e) { console.log('enable:', String(e?.message).slice(0, 140)); }

// address the deployed task
const token = await c.getTaskToken({ projectId, source: 'chat_1', teamId });
console.log('getTaskToken ->', token ? token.slice(0, 20) + '…' : 'UNDEFINED');
if (token) {
  try {
    const r = await c.database.query({ token, sql: 'SELECT count(*)::int AS n FROM lk_venues', nodeId: 'rocketride_sql_1' });
    console.log('QUERY OK — deployed store works:', JSON.stringify(r.rows));
  } catch (e) { console.log('QUERY FAILED:', String(e?.message).slice(0, 200)); }
}
process.exit(0);
