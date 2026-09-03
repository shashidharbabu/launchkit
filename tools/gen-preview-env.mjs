// gen-preview-env: writes apps/launchkit/preview/env.generated.ts (gitignored).
//
// The preview harness builds its OWN RocketRideClient from this file, so this is
// where "which engine do development pipeline runs hit" is decided:
//   node tools/gen-preview-env.mjs local     → ws://localhost:5565 (docker engine)
//   node tools/gen-preview-env.mjs staging   → the .env dev pair
// Tool keys (Anthropic/GMI/Exa/Firecrawl/GitHub) are forwarded from .env either
// way — a local engine has no org environment, so the client must supply them.
// Deploys are unaffected: they read .env + .env.deploy, never this file.
import { readFileSync, writeFileSync } from 'node:fs';

const target = (process.argv[2] ?? 'staging').toLowerCase();
if (!['local', 'staging'].includes(target)) {
  console.error(`usage: node tools/gen-preview-env.mjs local|staging`); process.exit(1);
}
const parse = (t) => Object.fromEntries(t.split('\n')
  .filter((l) => l.includes('=') && !l.trim().startsWith('#'))
  .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]));
const env = { ...parse(readFileSync('.env', 'utf8')),
  ...parse((() => { try { return readFileSync('.env.deploy', 'utf8'); } catch { return ''; } })()) };

const LOCAL_URI = process.env.LOCAL_ENGINE_URI ?? 'ws://localhost:5565';
const LOCAL_KEY = process.env.LOCAL_ENGINE_KEY ?? '';
const out = { ...env };
if (target === 'local') { out.ROCKETRIDE_URI = LOCAL_URI; out.ROCKETRIDE_APIKEY = LOCAL_KEY; }

const body = Object.entries(out).map(([k, v]) => `  '${k}': ${JSON.stringify(v)},`).join('\n');
writeFileSync('apps/launchkit/preview/env.generated.ts',
  `// GENERATED preview env — gitignored, never shipped\n` +
  `// target: ${target}  (regenerate: node tools/gen-preview-env.mjs ${target})\n` +
  `export const PREVIEW_ENV: Record<string, string> = {\n${body}\n};\n`);
console.log(`preview env → ${target} (${out.ROCKETRIDE_URI})`);
