// Raw probe of the client's real websocket endpoint (/task/service).
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const WebSocket = require('ws');

const env = Object.fromEntries((readFileSync('.env', 'utf8') + '\n' + (() => { try { return readFileSync('.env.deploy', 'utf8'); } catch { return ''; } })()).split('\n')
  .filter((l) => l.includes('=') && !l.trim().startsWith('#'))
  .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]));
const host = (env.ROCKETRIDE_URI ?? '').replace(/:443$/, '').replace(/^https?:\/\//, '');
const key = env.ROCKETRIDE_APIKEY ?? '';
const url = `wss://${host}/task/service`;

console.log('connecting:', url);
const ws = new WebSocket(url, { handshakeTimeout: 15000 });
let opened = false;
const t = setTimeout(() => { console.log('-> TIMEOUT'); process.exit(0); }, 25000);
ws.on('open', () => {
  opened = true;
  console.log('-> socket OPENED; sending connect frame with credential');
  ws.send(JSON.stringify({ endpoint: 'connect', credential: key, id: 'probe-1' }));
});
ws.on('message', (d) => {
  console.log('-> SERVER:', String(d).slice(0, 700));
  clearTimeout(t); process.exit(0);
});
ws.on('close', (code, reason) => {
  console.log(`-> ${opened ? 'opened then ' : ''}CLOSED code=${code} reason="${reason?.toString() || '(empty)'}"`);
  clearTimeout(t); process.exit(0);
});
ws.on('error', (e) => { console.log('-> ERROR', e.message); clearTimeout(t); process.exit(0); });
