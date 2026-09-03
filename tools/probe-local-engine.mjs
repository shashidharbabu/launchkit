import { RocketRideClient } from 'rocketride';
const URI = process.env.LOCAL_ENGINE_URI ?? 'ws://localhost:5565';
try {
  const info = await RocketRideClient.getServerInfo(URI.replace(/^wss?:\/\//, ''));
  console.log('SERVER_INFO', JSON.stringify(info).slice(0, 300));
} catch (e) { console.log('SERVER_INFO_ERR', String(e?.message ?? e).slice(0, 140)); }
for (const key of ['', 'local', 'rr_local_dev']) {
  try {
    const c = new RocketRideClient({ uri: URI, auth: key, persist: false });
    const conn = await c.connect();
    console.log(`CONNECT_OK key=${JSON.stringify(key)} user=${JSON.stringify(conn?.user ?? null)} org=${conn?.organization?.name ?? 'none'} devId=${conn?.organization?.developerId ?? 'none'}`);
    try { await c.disconnect?.(); } catch {}
    process.exit(0);
  } catch (e) { console.log(`CONNECT_FAIL key=${JSON.stringify(key)}:`, String(e?.message ?? e).slice(0, 110)); }
}
process.exit(1);
