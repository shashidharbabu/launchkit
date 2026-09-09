// A tiny .env loader for the forge's own secrets (services/studio-forge/.env,
// gitignored). Values already in the environment win; nothing is exported to
// the browser, the forge calls the image API itself.
import { readFileSync } from 'node:fs';

export function loadEnv(file) {
  let text;
  try { text = readFileSync(file, 'utf8'); } catch { return []; }
  const loaded = [];
  for (const raw of text.split('\n')) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const i = line.indexOf('=');
    if (i < 1) continue;
    const key = line.slice(0, i).trim();
    let value = line.slice(i + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
    if (process.env[key] === undefined) { process.env[key] = value; loaded.push(key); }
  }
  return loaded;
}
