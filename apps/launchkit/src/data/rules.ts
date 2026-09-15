import { byNewest, select } from './blobstore';
import { DEFAULT_RULEBOOKS, GLOBAL_RULES, RULEBOOK_VERSION, type Rulebook } from '../lib/rulebooks';

/** The newest stored row for a platform, or null. */
function storedRow(platform: string): Record<string, unknown> | null {
  const rows = byNewest(select('platform_rules', { platform }), 'updated_at') as Array<Record<string, unknown>>;
  return rows[0] ?? null;
}

// a seeded row from an older default gives way to the newer default; an owner's own edit never does
function isStale(row: Record<string, unknown> | null): boolean {
  return Boolean(row) && row?.source !== 'owner' && Number(row?.version ?? 0) < RULEBOOK_VERSION;
}

/** The stored rulebook for a platform, falling back to the shipped default. */
export function rulesFor(platform: string): Rulebook {
  const row = storedRow(platform);
  const def = DEFAULT_RULEBOOKS.find((r) => r.platform === platform);
  if (row && Array.isArray(row.rules) && !isStale(row)) {
    // a stored row that predates hooks (or an owner edit that saved none) keeps the default hooks
    const hooks = Array.isArray(row.hooks) && row.hooks.length > 0 ? (row.hooks as unknown[]).map(String) : def?.hooks;
    return { platform, name: String(row.name ?? def?.name ?? platform), summary: String(row.summary ?? def?.summary ?? ''), rules: (row.rules as unknown[]).map(String), hooks };
  }
  return def ?? { platform, name: platform, summary: '', rules: [] };
}

/** Which rulebook a draft is written against: the stored row's version and source, or the code default. */
export function rulebookMeta(platform: string): { version: number; source: string } {
  const row = storedRow(platform);
  if (row && Array.isArray(row.rules) && !isStale(row)) return { version: Number(row.version ?? 0), source: String(row.source ?? 'default') };
  return { version: RULEBOOK_VERSION, source: 'default' };
}

/** The block the model receives. Order and wording are part of the contract. */
export function rulesBlock(platform: string): string {
  const rb = rulesFor(platform);
  return [
    `PLATFORM_RULES for ${rb.name} (obey every line; the draft check rejects violations):`,
    ...rb.rules.map((r) => `- ${r}`),
    ...(rb.hooks && rb.hooks.length > 0 ? [`HOOK_PATTERNS for ${rb.name} (pick one and adapt it to this app; never copy the words):`, ...rb.hooks.map((h) => `- ${h}`)] : []),
    'GLOBAL_RULES (every platform):',
    ...GLOBAL_RULES.map((r) => `- ${r}`),
  ].join('\n');
}

export { sanitizeDraft } from '../domain/sanitize';
