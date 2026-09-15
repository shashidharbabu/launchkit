/**
 * Seed the curated venues into the store on first use (config-as-data: these
 * are defaults, editable in Settings). Idempotent by url. On every later load
 * the curated rows are reconciled with the seed: a venue the seed gained is
 * inserted, a curated row whose rules or links the seed corrected is updated,
 * and a row the owner touched (source other than curated) is left alone.
 */
import { DEFAULT_RULEBOOKS, RULEBOOK_VERSION } from '../lib/rulebooks';
import { byNewest, count, insert, select, selectOne, uid, update } from './blobstore';
import { VENUE_SEED } from './venues.seed';

export function seedVenuesIfEmpty(): void {
  for (const v of VENUE_SEED) {
    const row = selectOne('venues', { url: v.url }) as Record<string, unknown> | null;
    if (!row) {
      insert('venues', {
        id: uid(),
        name: v.name,
        kind: v.kind,
        url: v.url,
        submission_url: v.submission_url,
        rules_summary: v.rules_summary,
        audience_signal: v.audience_signal,
        tags: v.tags,
        source: 'curated',
        enabled: true,
      });
      continue;
    }
    // the seed is the curated record: a rules snapshot that changed reaches the store, an owner's row does not move
    if (row.source === 'curated' && (row.rules_summary !== v.rules_summary || row.submission_url !== v.submission_url || row.tags !== v.tags)) {
      update('venues', { id: row.id }, { rules_summary: v.rules_summary, submission_url: v.submission_url, tags: v.tags, audience_signal: v.audience_signal });
    }
  }
}

/**
 * Seed the per-platform rulebooks once; Settings edits the stored copies.
 * A seeded row from an older RULEBOOK_VERSION is stale: the newer default is
 * inserted above it (newest wins in rulesFor) so the store records which
 * version every later draft was written against. An owner's edit (source
 * owner) is never replaced, whatever its version.
 */
export function seedRulebooksIfEmpty(): void {
  const empty = count('platform_rules') === 0;
  for (const rb of DEFAULT_RULEBOOKS) {
    const newest = empty ? null : (byNewest(select('platform_rules', { platform: rb.platform }), 'updated_at')[0] as Record<string, unknown> | undefined);
    const stale = Boolean(newest) && newest?.source !== 'owner' && Number(newest?.version ?? 0) < RULEBOOK_VERSION;
    if (newest && !stale) continue;
    insert('platform_rules', {
      id: uid(), platform: rb.platform, name: rb.name, summary: rb.summary, rules: rb.rules, hooks: rb.hooks ?? [],
      updated_at: new Date().toISOString(), source: 'default', version: RULEBOOK_VERSION,
    });
  }
}
