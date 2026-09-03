/**
 * The seven-stage procedure line (01-direction.md). A true sequence, numbered
 * labels are earned here and used nowhere else. Names are fixed vocabulary
 * (voice.md): no synonyms. Brand sits right after Profile: its DNA feeds
 * every stage that writes copy.
 */
export const STAGES = [
  { num: '01', slug: 'profile', name: 'Profile' },
  { num: '02', slug: 'brand', name: 'Brand' },
  { num: '03', slug: 'commercial', name: 'Commercial' },
  { num: '04', slug: 'assets', name: 'Social Launch' },
  { num: '05', slug: 'targets', name: 'Targets' },
  { num: '06', slug: 'signals', name: 'Signals' },
  { num: '07', slug: 'plan', name: 'Plan' },
] as const;

export type StageSlug = (typeof STAGES)[number]['slug'];

export const STAGE_SLUGS = STAGES.map((s) => s.slug);

export function stageIndex(slug: string): number {
  return STAGES.findIndex((s) => s.slug === slug);
}
