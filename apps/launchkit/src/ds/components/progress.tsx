import * as React from 'react';
import { cn } from '../lib/cn';

/**
 * Progress: a 4px track with a flare fill. Used for confidence and for the
 * fraction of a sequence that is done. Always paired with a number.
 */
export function Progress({
  value,
  label,
  className,
}: {
  /** 0 to 100 */
  value: number;
  label?: string;
  className?: string;
}) {
  const v = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <div
        role="progressbar"
        aria-valuenow={v}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
        className="h-1 flex-1 overflow-hidden rounded-full bg-border"
      >
        <div
          className="h-full rounded-full bg-flare transition-[width] duration-(--duration-slow) ease-standard"
          style={{ width: `${v}%` }}
        />
      </div>
      {label && <span className="shrink-0 font-mono text-data tabular text-muted-foreground">{label}</span>}
    </div>
  );
}
