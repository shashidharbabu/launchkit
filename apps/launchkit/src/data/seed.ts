/**
 * Seed the curated venues into the store on first use (config-as-data: these
 * are defaults, editable in Settings). Idempotent by url.
 */
import { DEFAULT_RULEBOOKS } from '../lib/rulebooks';
import { count, insert, selectOne, uid } from './blobstore';
import { VENUE_SEED } from './venues.seed';

export function seedVenuesIfEmpty(): void {
  if (count('venues') > 0) return;
  for (const v of VENUE_SEED) {
    if (selectOne('venues', { url: v.url })) continue;
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
  }
}

/** Seed the per-platform rulebooks once; Settings edits the stored copies. */
export function seedRulebooksIfEmpty(): void {
  if (count('platform_rules') > 0) return;
  for (const rb of DEFAULT_RULEBOOKS) {
    insert('platform_rules', { id: uid(), platform: rb.platform, name: rb.name, summary: rb.summary, rules: rb.rules, updated_at: new Date().toISOString() });
  }
}
