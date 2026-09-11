import { byNewest, select } from './blobstore';
import { DEFAULT_RULEBOOKS, GLOBAL_RULES, RULEBOOK_VERSION, type Rulebook } from '../lib/rulebooks';

/** The stored rulebook for a platform, falling back to the shipped default. */
export function rulesFor(platform: string): Rulebook {
  const rows = byNewest(select('platform_rules', { platform }), 'updated_at') as Array<Record<string, unknown>>;
  const row = rows[0];
  const def = DEFAULT_RULEBOOKS.find((r) => r.platform === platform);
  // a seeded row from an older default gives way to the newer default; an owner's own edit never does
  const stale = row && row.source !== 'owner' && Number(row.version ?? 0) < RULEBOOK_VERSION;
  if (row && Array.isArray(row.rules) && !stale) {
    return { platform, name: String(row.name ?? def?.name ?? platform), summary: String(row.summary ?? def?.summary ?? ''), rules: (row.rules as unknown[]).map(String),
      hooks: Array.isArray(row.hooks) ? (row.hooks as unknown[]).map(String) : def?.hooks };
  }
  return def ?? { platform, name: platform, summary: '', rules: [] };
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
