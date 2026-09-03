/**
 * Typical run times, measured from real runs on 2026-09-02/03 (Claude for every
 * stage). Used to set expectations before a run starts and to keep the running
 * indicator honest — never a promise, always "about".
 */
export const RUN_ETA_SECONDS: Record<string, number> = {
  understand: 110,
  brand_dna: 95,
  brand_campaigns: 65,
  pricing: 125,
  listing: 35,
  targets: 110,
  signals: 400,
};

export function etaSeconds(kind: string): number {
  if (kind.startsWith('asset')) return 30;
  return RUN_ETA_SECONDS[kind] ?? 90;
}

/** "about 2 minutes" — plain words, rounded the way a person would say it. */
export function etaLabel(kind: string): string {
  const s = etaSeconds(kind);
  if (s < 60) return 'about half a minute';
  const m = Math.round(s / 60);
  return m <= 1 ? 'about a minute' : `about ${m} minutes`;
}
