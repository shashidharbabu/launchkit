import * as React from 'react';
import { StatusStamp } from '@launchkit/design-system/components/status-stamp';
import { elapsedLabel } from '../../lib/format';
import { etaLabel } from '../../lib/run-eta';
import { ASSET_LABELS } from '../../lib/asset-types';

/** Name what people control, not how it's built (voice.md). */
function runningLine(kind: string, secs: number): string {
  if (kind === 'understand') {
    if (secs < 30) return 'Reading your repo';
    if (secs < 75) return 'Reading your live site';
    return 'Drafting your profile';
  }
  if (kind === 'pricing') return 'Reading competitor pricing pages';
  if (kind === 'listing') return 'Rewriting your store listing';
  if (kind === 'targets') return 'Ranking launch venues';
  if (kind === 'signals') return 'Searching for people asking for this';
  if (kind.startsWith('asset')) {
    const type = kind.split(':')[1] ?? '';
    return `Drafting ${ASSET_LABELS[type]?.toLowerCase() ?? type}`;
  }
  return 'Working';
}

/**
 * Running state (components.md): RUNNING stamp + shimmer status line + elapsed
 * against a measured typical time, plus the one fact people actually need
 * the run continues if they navigate away.
 */
export function RunningIndicator({ kind, since }: { kind: string; since: number }) {
  const [secs, setSecs] = React.useState(() => Math.floor((Date.now() - since) / 1000));
  React.useEffect(() => {
    const t = setInterval(() => setSecs(Math.floor((Date.now() - since) / 1000)), 1000);
    return () => clearInterval(t);
  }, [since]);

  return (
    <span role="status" className="flex flex-wrap items-center gap-2">
      <StatusStamp kind="running" />
      <span className="text-shimmer text-small">{runningLine(kind, secs)}</span>
      <span className="font-mono text-data tabular text-muted-foreground">
        {elapsedLabel(secs)}
        {secs > 30 ? ` of ~${etaLabel(kind).replace(/^about /, '')}` : ''}
      </span>
    </span>
  );
}
