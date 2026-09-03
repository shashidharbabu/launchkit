import * as React from 'react';
import NumberFlow from '@number-flow/react';
import { cn } from '../../lib/utils';

/**
 * Single KPI = stat tile, not a chart (dataviz.md): NumberFlow value in
 * Display type, meta label above, delta/attribution in Data mono below.
 * Numbers are always attributed, pass `attribution` (voice.md).
 * `countUp` rolls the digits from 0 on first paint (NumberFlow only
 * animates on change and respects reduced motion natively).
 */
export function StatTile({
  label,
  value,
  attribution,
  countUp = false,
  countUpDelay = 0,
  className,
}: {
  label: string;
  value: number;
  attribution: string;
  countUp?: boolean;
  countUpDelay?: number;
  className?: string;
}) {
  const [shown, setShown] = React.useState(countUp ? 0 : value);
  React.useEffect(() => {
    if (!countUp) {
      setShown(value);
      return;
    }
    const t = setTimeout(() => setShown(value), countUpDelay);
    return () => clearTimeout(t);
  }, [countUp, countUpDelay, value]);

  return (
    <div className={cn('rounded-sm border border-border bg-card p-4', className)}>
      <p className="font-mono text-meta font-medium uppercase tracking-[0.08em] text-muted-foreground">
        {label}
      </p>
      <NumberFlow
        value={shown}
        className="mt-1 block text-display font-semibold tracking-[-0.01em] tabular"
      />
      <p className="mt-1 font-mono text-data text-muted-foreground">{attribution}</p>
    </div>
  );
}
