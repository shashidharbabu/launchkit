/**
 * The store: a per-user document store over the shell's workspace appState
 * (server-persisted, identity-scoped, opaque to the shell). Replaces the
 * rocketride_sql pipe, which cannot be driven on-demand from an app: the SQL
 * node needs a signed-in cloud identity injected server-side, and neither
 * client.use() nor a deployed-pipe getTaskToken provides it for ad-hoc queries
 * (proven 2026-09-02). appState has none of that constraint.
 *
 * Shape: one JSON object, table name -> array of row objects. The api facade
 * calls the tiny relational helpers here instead of SQL. Every mutation marks
 * the snapshot dirty; a debounced flush hands it to the shell's updateAppState.
 */
export type Row = Record<string, unknown>;
type Tables = Record<string, Row[]>;

const TABLES = [
  'projects', 'profiles', 'assets', 'targets', 'signals',
  'commercial_results', 'venues', 'runs', 'signups', 'settings', 'traces', 'platform_rules',
  'studio',
] as const;
export type TableName = (typeof TABLES)[number];

const APP_STATE_KEY = 'launchkit';

let tables: Tables = Object.fromEntries(TABLES.map((t) => [t, []])) as Tables;
let persist: ((snapshot: Record<string, unknown>) => void) | null = null;
let actor = 'user';
// The signed-in user's stable id. Empty in the API-key preview, which has no signed-in
// user; ownership filtering is inert there by design rather than hiding every launch.
let ownerId = '';
let flushTimer: ReturnType<typeof setTimeout> | null = null;

/** Wire the store to the shell's appState: hydrate + register the persister. */
export function initBlobStore(
  appState: Record<string, unknown>,
  updateAppState: (updater: (prev: Record<string, unknown>) => Record<string, unknown>) => void,
  actorDisplay: string,
  userId = '',
) {
  actor = actorDisplay || 'user';
  ownerId = userId || '';
  const saved = (appState?.[APP_STATE_KEY] as Tables | undefined) ?? null;
  tables = Object.fromEntries(
    TABLES.map((t) => [t, Array.isArray(saved?.[t]) ? saved![t].map((r) => ({ ...r })) : []]),
  ) as Tables;
  persist = (snapshot) => updateAppState((prev) => ({ ...prev, [APP_STATE_KEY]: snapshot }));
}

/** Swap the backing tables and persister (team workspace ↔ personal). */
export function mountTables(saved: Record<string, Row[]> | null, persister: (snapshot: Record<string, unknown>) => void): void {
  if (flushTimer) { clearTimeout(flushTimer); flushTimer = null; }
  tables = Object.fromEntries(TABLES.map((t) => [t, (saved?.[t] as Row[] | undefined) ?? []])) as Tables;
  persist = persister;
}

/** The mounted tables as one plain object (what a team row stores). */
export function snapshotTables(): Record<string, unknown> {
  return snapshot();
}

export function isReady(): boolean {
  return persist !== null;
}

export function currentActor(): string {
  return actor;
}

/** The signed-in user's stable id, or '' when nobody is signed in (the preview). */
export function currentOwnerId(): string {
  return ownerId;
}

/** Whether a row belongs to the signed-in user. A row written before ownership
 *  existed has no owner_id and stays visible; only new rows are private. */
export function ownedByMe(row: { owner_id?: unknown }): boolean {
  const owner = typeof row.owner_id === 'string' ? row.owner_id : '';
  if (!owner || !ownerId) return true;
  return owner === ownerId;
}

function markDirty() {
  if (!persist) return;
  if (flushTimer) clearTimeout(flushTimer);
  // debounce: a burst of writes (a run's on-done) persists once
  flushTimer = setTimeout(() => {
    flushTimer = null;
    persist?.(snapshot());
  }, 150);
}

/** Immediate, awaitable flush — use after a critical write (create/approve). */
export function flush(): void {
  if (flushTimer) { clearTimeout(flushTimer); flushTimer = null; }
  persist?.(snapshot());
}

function snapshot(): Tables {
  return Object.fromEntries(TABLES.map((t) => [t, tables[t]])) as Tables;
}

function table(name: TableName): Row[] {
  return tables[name] ?? (tables[name] = []);
}

export const uid = () => {
  try {
    return crypto.randomUUID().replaceAll('-', '').slice(0, 12);
  } catch {
    return Math.random().toString(36).slice(2, 14);
  }
};

// ---------------------------------------------------------------- relational helpers

type Where = Record<string, unknown>;

function matches(row: Row, where: Where): boolean {
  return Object.entries(where).every(([k, v]) => row[k] === v);
}

export function insert(name: TableName, row: Row): Row {
  const withMeta: Row = { created_at: new Date().toISOString(), ...row };
  table(name).push(withMeta);
  markDirty();
  return withMeta;
}

export function select(name: TableName, where: Where = {}): Row[] {
  return table(name).filter((r) => matches(r, where));
}

export function selectOne(name: TableName, where: Where = {}): Row | null {
  return table(name).find((r) => matches(r, where)) ?? null;
}

export function count(name: TableName, where: Where = {}): number {
  return where && Object.keys(where).length ? select(name, where).length : table(name).length;
}

export function update(name: TableName, where: Where, patch: Row): number {
  let n = 0;
  for (const r of table(name)) {
    if (matches(r, where)) { Object.assign(r, patch); n++; }
  }
  if (n) markDirty();
  return n;
}

export function remove(name: TableName, where: Where): number {
  const before = table(name).length;
  tables[name] = table(name).filter((r) => !matches(r, where));
  const n = before - tables[name].length;
  if (n) markDirty();
  return n;
}

/** Sort helper: newest-first by an ISO timestamp column (default created_at). */
export function byNewest(rows: Row[], col = 'created_at'): Row[] {
  return [...rows].sort((a, b) => String(b[col] ?? '').localeCompare(String(a[col] ?? '')));
}

/** Sort helper: ascending by a numeric column. */
export function byNumber(rows: Row[], col: string): Row[] {
  return [...rows].sort((a, b) => Number(a[col] ?? 0) - Number(b[col] ?? 0));
}
