import * as React from 'react';
import { TextShimmer } from '../motion-primitives/text-shimmer';
import { StatusStamp } from '../ui/status-stamp';
import { elapsedLabel } from '../../lib/format';
import { ASSET_LABELS } from '../../lib/asset-types';

/** Name what people control, not how it's built (voice.md). */
function runningLine(kind: string, secs: number): string {
  if (kind === 'understand') {
    if (secs < 30) return 'Reading your repo…';
    if (secs < 75) return 'Reading your live site…';
    return 'Drafting your profile…';
  }
  if (kind === 'pricing') return 'Reading competitor pricing pages…';
  if (kind === 'listing') return 'Rewriting your store listing…';
  if (kind === 'targets') return 'Ranking launch venues…';
  if (kind === 'signals') return 'Searching for people asking for this…';
  if (kind.startsWith('asset')) {
    const type = kind.split(':')[1] ?? '';
    return `Drafting ${ASSET_LABELS[type]?.toLowerCase() ?? type}…`;
  }
  return 'Working…';
}

/**
 * Running state (components.md): RUNNING stamp + shimmer status line +
 * elapsed in Data mono; jobs >30s add "usually ~2 min".
 */
export function RunningIndicator({ kind, since }: { kind: string; since: number }) {
  const [secs, setSecs] = React.useState(() => Math.floor((Date.now() - since) / 1000));
  React.useEffect(() => {
    const t = setInterval(() => setSecs(Math.floor((Date.now() - since) / 1000)), 1000);
    return () => clearInterval(t);
  }, [since]);

  return (
    <span className="flex items-center gap-2">
      <StatusStamp kind="running" />
      <TextShimmer duration={2} className="text-body">
        {runningLine(kind, secs)}
      </TextShimmer>
      <span className="font-mono text-data tabular text-muted-foreground">
        {elapsedLabel(secs)}
        {secs > 30 ? ' · usually ~2 min' : ''}
      </span>
    </span>
  );
}
