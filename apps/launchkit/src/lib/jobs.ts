import { ASSET_LABELS } from './asset-types';

/** Stage vocabulary, not pipeline kinds (voice.md: name what people control). */
export function jobLabel(kind: string): string {
  if (kind === 'understand') return 'Profile — analysis';
  if (kind === 'brand_dna') return 'Brand — DNA extraction';
  if (kind === 'brand_campaigns') return 'Brand — campaign ideas';
  if (kind === 'pricing') return 'Commercial — pricing';
  if (kind === 'listing') return 'Commercial — listing';
  if (kind === 'targets') return 'Targets — venue ranking';
  if (kind === 'signals') return 'Signals — search';
  if (kind.startsWith('asset:')) {
    const t = kind.slice('asset:'.length);
    return `Assets — ${ASSET_LABELS[t] ?? t}`;
  }
  return kind;
}
