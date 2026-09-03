/**
 * Team workspace persistence: one row per team in the store pipe's SQL node,
 * holding the whole blobstore snapshot as JSON with a version. Members share
 * it; writes are optimistic (a stale version does not overwrite), and the
 * provider polls the version to pick up teammates' saves.
 *
 * The SQL node needs the signed-in shell identity, which the deployed app has
 * and an API-key preview does not: Settings has a one-click store check.
 */
import { getClient, getPipeToken } from './runner';
import { ensureTableSql, insertSql, loadSql, normalizeDialect, updateSql, versionSql, type Dialect } from '../domain/workspace-sql';

const PIPE = 'lk_store.pipe';
const NODE = 'rocketride_sql_1';

type Db = {
  query(o: { token: string; sql: string; nodeId?: string; params?: unknown[] }): Promise<{ rows: Record<string, unknown>[]; affected_rows: number }>;
  dialect(o: { token: string; nodeId?: string }): Promise<unknown>;
};

let dialect: Dialect | null = null;

function db(): Db {
  return (getClient() as unknown as { database: Db }).database;
}

const TIMEOUT_MS = 45_000;

/** The store must always answer: a hung pipe start or query becomes an error the UI can show. */
function withTimeout<T>(p: Promise<T>, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`${label} did not answer within ${TIMEOUT_MS / 1000} s`)), TIMEOUT_MS);
    p.then((v) => { clearTimeout(t); resolve(v); }, (e) => { clearTimeout(t); reject(e); });
  });
}

async function token(): Promise<string> {
  return withTimeout(getPipeToken(PIPE), 'store pipeline start');
}

async function run(sql: string, params: unknown[] = []) {
  const tk = await token();
  return withTimeout(db().query({ token: tk, sql, params, nodeId: NODE }), 'store query');
}

export async function detectDialect(): Promise<Dialect> {
  if (dialect) return dialect;
  const tk = await token();
  try {
    dialect = normalizeDialect(await withTimeout(db().dialect({ token: tk, nodeId: NODE }), 'store dialect'));
  } catch {
    dialect = 'unknown';
  }
  return dialect;
}

export type StoreCheck = { ok: boolean; dialect: string; ms: number; error?: string };

/** Round trip through the store pipe: dialect + a trivial select. */
export async function checkStore(): Promise<StoreCheck> {
  const t0 = Date.now();
  try {
    const d = await detectDialect();
    await run('SELECT 1 AS ok');
    await run(ensureTableSql());
    return { ok: true, dialect: d, ms: Date.now() - t0 };
  } catch (e) {
    return { ok: false, dialect: dialect ?? 'unknown', ms: Date.now() - t0, error: e instanceof Error ? e.message : String(e) };
  }
}

export type WorkspaceRow = { version: number; snapshot: Record<string, unknown>; updated_by: string; updated_at: string };

export async function loadWorkspace(teamId: string): Promise<WorkspaceRow | null> {
  const d = await detectDialect();
  await run(ensureTableSql());
  const q = loadSql(d);
  const { rows } = await run(q.sql, q.params(teamId));
  const r = rows[0];
  if (!r) return null;
  let snapshot: Record<string, unknown> = {};
  try { snapshot = JSON.parse(String(r.snapshot ?? '{}')) as Record<string, unknown>; } catch { snapshot = {}; }
  return { version: Number(r.version ?? 0), snapshot, updated_by: String(r.updated_by ?? ''), updated_at: String(r.updated_at ?? '') };
}

export async function workspaceVersion(teamId: string): Promise<number | null> {
  const d = await detectDialect();
  const q = versionSql(d);
  const { rows } = await run(q.sql, q.params(teamId));
  return rows[0] ? Number(rows[0].version ?? 0) : null;
}

export type SaveResult = { ok: true; version: number } | { ok: false; reason: 'conflict' | 'error'; error?: string };

/** expected = 0 inserts; otherwise an optimistic update that fails on a stale version. */
export async function saveWorkspace(teamId: string, snapshot: Record<string, unknown>, expected: number, actor: string): Promise<SaveResult> {
  const d = await detectDialect();
  const at = new Date().toISOString();
  const body = JSON.stringify(snapshot);
  try {
    if (expected === 0) {
      const q = insertSql(d);
      await run(q.sql, q.params(teamId, body, actor, at));
      return { ok: true, version: 1 };
    }
    const q = updateSql(d);
    const res = await run(q.sql, q.params(teamId, body, actor, at, expected));
    if (Number(res.affected_rows ?? 0) === 0) return { ok: false, reason: 'conflict' };
    return { ok: true, version: expected + 1 };
  } catch (e) {
    return { ok: false, reason: 'error', error: e instanceof Error ? e.message : String(e) };
  }
}
