/**
 * Pure SQL builders for the team workspace table. One row per team: the whole
 * workspace snapshot as JSON text plus a version for optimistic concurrency.
 * Placeholders follow the dialect ($n for Postgres, ? elsewhere). Covered by
 * node tests; the network side lives in data/teamstore.ts.
 */
export type Dialect = 'postgres' | 'mysql' | 'sqlite' | 'unknown';
export const WORKSPACE_TABLE = 'lk_workspaces';

export function placeholder(d: Dialect, n: number): string {
  return d === 'postgres' ? `$${n}` : '?';
}

export function ensureTableSql(): string {
  return `CREATE TABLE IF NOT EXISTS ${WORKSPACE_TABLE} (team_id VARCHAR(128) PRIMARY KEY, version INTEGER NOT NULL, snapshot TEXT NOT NULL, updated_by VARCHAR(256), updated_at VARCHAR(64))`;
}

export function loadSql(d: Dialect): { sql: string; params: (teamId: string) => unknown[] } {
  return {
    sql: `SELECT version, snapshot, updated_by, updated_at FROM ${WORKSPACE_TABLE} WHERE team_id = ${placeholder(d, 1)}`,
    params: (teamId) => [teamId],
  };
}

export function versionSql(d: Dialect): { sql: string; params: (teamId: string) => unknown[] } {
  return { sql: `SELECT version FROM ${WORKSPACE_TABLE} WHERE team_id = ${placeholder(d, 1)}`, params: (teamId) => [teamId] };
}

export function insertSql(d: Dialect): { sql: string; params: (teamId: string, snapshot: string, actor: string, at: string) => unknown[] } {
  return {
    sql: `INSERT INTO ${WORKSPACE_TABLE} (team_id, version, snapshot, updated_by, updated_at) VALUES (${placeholder(d, 1)}, 1, ${placeholder(d, 2)}, ${placeholder(d, 3)}, ${placeholder(d, 4)})`,
    params: (teamId, snapshot, actor, at) => [teamId, snapshot, actor, at],
  };
}

/** Optimistic update: only the row still at `expected` is written. */
export function updateSql(d: Dialect): { sql: string; params: (teamId: string, snapshot: string, actor: string, at: string, expected: number) => unknown[] } {
  return {
    sql: `UPDATE ${WORKSPACE_TABLE} SET version = ${placeholder(d, 1)}, snapshot = ${placeholder(d, 2)}, updated_by = ${placeholder(d, 3)}, updated_at = ${placeholder(d, 4)} WHERE team_id = ${placeholder(d, 5)} AND version = ${placeholder(d, 6)}`,
    params: (teamId, snapshot, actor, at, expected) => [expected + 1, snapshot, actor, at, teamId, expected],
  };
}

export function normalizeDialect(raw: unknown): Dialect {
  const s = String(raw ?? '').toLowerCase();
  if (s.includes('postgres')) return 'postgres';
  if (s.includes('mysql')) return 'mysql';
  if (s.includes('sqlite')) return 'sqlite';
  return 'unknown';
}
