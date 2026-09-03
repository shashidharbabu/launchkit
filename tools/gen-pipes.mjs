// Pipe generator (doc 03 §6): ONE owner for every .pipe the app ships.
//
// Sources of truth:
//   - launchkit/pipelines/*.pipe        the tuned production pipes (templates)
//   - tools/pipe-ids.json               stable project_ids (created on first run,
//                                       then NEVER regenerated — task addressing
//                                       and deploy history key on them)
// Outputs (both written on every run; never hand-edit them):
//   - pipelines/<name>.pipe             workspace copies, for deploy
//   - apps/launchkit/pipelines/<name>.pipe  app-local copies, bundled with the app
//
// Variants: a pipe whose components include a `rocketride_sql` node is ALSO
// emitted as <name>.external.pipe with the node swapped to `db_postgres`
// (same node id — the app's execute calls address the id, not the provider),
// per doc 05 §2. None of the seven launch pipes touch a store today; the seam
// exists for lk_seed and future pipes.
import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync } from 'node:fs';
import { join, basename } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const SRC = join(ROOT, 'launchkit', 'pipelines');
const IDS_FILE = join(ROOT, 'tools', 'pipe-ids.json');
const OUT_WORKSPACE = join(ROOT, 'pipelines');
const OUT_APP = join(ROOT, 'apps', 'launchkit', 'pipelines');

const ids = existsSync(IDS_FILE) ? JSON.parse(readFileSync(IDS_FILE, 'utf8')) : {};
let idsDirty = false;

mkdirSync(OUT_WORKSPACE, { recursive: true });
mkdirSync(OUT_APP, { recursive: true });

const pipes = readdirSync(SRC).filter((f) => f.endsWith('.pipe'));
if (pipes.length === 0) throw new Error(`no .pipe templates in ${SRC}`);

const emitted = [];
for (const file of pipes) {
  const name = basename(file, '.pipe');
  const doc = JSON.parse(readFileSync(join(SRC, file), 'utf8'));

  // pin the project_id: first sight of a pipe freezes its id forever
  if (!ids[name]) {
    ids[name] = doc.project_id;
    idsDirty = true;
  }
  doc.project_id = ids[name];

  const secretLeaks = JSON.stringify(doc).match(/"(sk-[A-Za-z0-9_-]{8,}|rr_[a-f0-9]{16,})"/);
  if (secretLeaks) throw new Error(`literal secret in ${file}: ${secretLeaks[1].slice(0, 12)}… — use \${ROCKETRIDE_*}`);

  const out = JSON.stringify(doc, null, 1) + '\n';
  writeFileSync(join(OUT_WORKSPACE, file), out);
  writeFileSync(join(OUT_APP, file), out);
  emitted.push(name);

  // external store variant
  if (doc.components.some((c) => c.provider === 'rocketride_sql')) {
    const extName = `${name}.external`;
    if (!ids[extName]) { ids[extName] = crypto.randomUUID(); idsDirty = true; }
    const ext = JSON.parse(JSON.stringify(doc));
    ext.project_id = ids[extName];
    for (const c of ext.components) {
      if (c.provider === 'rocketride_sql') {
        c.provider = 'db_postgres';
        c.name = 'PostgreSQL (external fallback)';
        c.config = {
          type: 'db_postgres',
          uri: '${ROCKETRIDE_LAUNCHKIT_PG_URI}',
          parameters: c.config?.parameters ?? {},
        };
      }
    }
    const extOut = JSON.stringify(ext, null, 1) + '\n';
    writeFileSync(join(OUT_WORKSPACE, `${extName}.pipe`), extOut);
    writeFileSync(join(OUT_APP, `${extName}.pipe`), extOut);
    emitted.push(extName);
  }
}

if (idsDirty) writeFileSync(IDS_FILE, JSON.stringify(ids, null, 2) + '\n');
console.log(`generated ${emitted.length} pipes -> pipelines/ + apps/launchkit/pipelines/`);
for (const e of emitted) console.log('  ', e, ids[e]);
