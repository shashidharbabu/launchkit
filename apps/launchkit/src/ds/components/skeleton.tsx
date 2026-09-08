'use client';

import * as React from 'react';
import { cn } from '../lib/cn';

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn('skeleton rounded-control', className)} />;
}

/**
 * Loading rule (motion.md): work over 300ms shows a skeleton that matches
 * the final layout; under 300ms shows nothing. A flash of skeleton is
 * worse than a wait.
 */
export function DelayedSkeleton({ className, delay = 300 }: { className?: string; delay?: number }) {
  const [show, setShow] = React.useState(false);
  React.useEffect(() => {
    const t = setTimeout(() => setShow(true), delay);
    return () => clearTimeout(t);
  }, [delay]);
  if (!show) return null;
  return <Skeleton className={className} />;
}
