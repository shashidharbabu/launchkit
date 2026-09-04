'use client';

import * as React from 'react';
import NumberFlow from '@number-flow/react';
import { Card } from './card';
import { cn } from '../lib/cn';

/**
 * StatTile + StatRow (components/data-viz.md)
 *
 * A single KPI is a number with a name and an attribution line, never a
 * chart. Tiles live together in one StatRow card, divided by hairlines,
 * so three numbers read as one instrument instead of three boxes.
 * `countUp` rolls the digits from 0 on first paint; NumberFlow honors
 * reduced motion natively.
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
  const [rolled, setRolled] = React.useState(0);
  React.useEffect(() => {
    if (!countUp) return;
    const t = setTimeout(() => setRolled(value), countUpDelay);
    return () => clearTimeout(t);
  }, [countUp, countUpDelay, value]);
  const shown = countUp ? rolled : value;

  return (
    <div className={cn('px-5 py-4', className)}>
      <p className="text-small font-medium text-muted-foreground">{label}</p>
      <NumberFlow value={shown} className="mt-1 block text-display tabular" />
      <p className="mt-1 text-small text-muted-foreground">{attribution}</p>
    </div>
  );
}

export function StatRow({
  children,
  columns = 3,
  className,
}: {
  children: React.ReactNode;
  columns?: 2 | 3 | 4;
  className?: string;
}) {
  const cols = { 2: 'sm:grid-cols-2', 3: 'sm:grid-cols-3', 4: 'sm:grid-cols-2 lg:grid-cols-4' }[columns];
  return (
    <Card className={cn('grid divide-y divide-border sm:divide-x sm:divide-y-0', cols, className)}>
      {children}
    </Card>
  );
}
