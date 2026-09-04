import * as React from 'react';
import { cn } from '../lib/cn';

/**
 * The Launch Kit mark (foundations/identity.md)
 *
 * One geometric mark: an upward arrow held inside a rounded square. The
 * square is the gantry, the arrow is the thing it releases. Drawn in
 * currentColor so it inherits ink in light and dark, and inverts on a
 * dark surface with `inverted`.
 */
export function LaunchKitMark({
  size = 24,
  className,
  inverted = false,
}: {
  size?: number;
  className?: string;
  inverted?: boolean;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      aria-hidden
      className={cn('shrink-0', className)}
    >
      <rect width="32" height="32" rx="9" className={inverted ? 'fill-background' : 'fill-foreground'} />
      <path
        d="M16 7.5 23 17h-4.2v7.5h-5.6V17H9z"
        className={inverted ? 'fill-foreground' : 'fill-background'}
      />
    </svg>
  );
}

export function LaunchKitLogo({
  className,
  markSize = 24,
  wordmark = true,
}: {
  className?: string;
  markSize?: number;
  wordmark?: boolean;
}) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <LaunchKitMark size={markSize} />
      {wordmark && (
        <span className="text-[1.0625rem] font-semibold tracking-[-0.02em] text-foreground">Launch Kit</span>
      )}
    </span>
  );
}
