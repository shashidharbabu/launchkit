// Stage-0 identity probe (doc 01 §7/§8): confirms the staging connection,
// the org, the developer id, team ids, and which deploy verbs the vendored
// client actually exposes. Read-only — creates nothing.
import { RocketRideClient } from 'rocketride';

const client = new RocketRideClient({ persist: true });

try {
  const res = await client.connect();
  const pick = (o, keys) => Object.fromEntries(keys.filter((k) => k in (o ?? {})).map((k) => [k, o[k]]));

  console.log('connect() top-level keys:', Object.keys(res ?? {}).join(', '));
  console.log(JSON.stringify(pick(res, ['org', 'organization', 'developerId', 'developer_id',
    'teams', 'user', 'email', 'workspace', 'plan']), null, 2));

  const devId = res?.developerId ?? res?.developer_id ?? res?.org?.developerId ?? null;
  console.log('\ndeveloperId:', devId ?? 'NULL — must be claimed on the Deploy tab before scaffolding');

  const teams = res?.teams ?? res?.org?.teams ?? [];
  console.log('teams:', Array.isArray(teams)
    ? teams.map((t) => `${t.name ?? t.title ?? '?'}=${t.id ?? t._id ?? '?'}`).join('  ') : teams);

  console.log('\nclient.deploy verbs:', Object.keys(client.deploy ?? {}).sort().join(', '));
  for (const verb of ['createApp', 'addApp', 'verifyApp', 'add', 'enable', 'setSchedule',
                      'preview', 'versions', 'listDeployments']) {
    const where = typeof client.deploy?.[verb] === 'function' ? 'deploy'
      : typeof client[verb] === 'function' ? 'client' : 'MISSING';
    console.log(`  ${verb}: ${where}`);
  }
  console.log('publishApp:', typeof client.publishApp === 'function' ? 'client.publishApp'
    : typeof client.deploy?.publishApp === 'function' ? 'client.deploy.publishApp' : 'MISSING');
} catch (e) {
  console.error('PROBE FAILED:', e?.message ?? e);
  process.exitCode = 1;
} finally {
  try { await client.disconnect?.(); } catch {}
  process.exit(process.exitCode ?? 0);
}
