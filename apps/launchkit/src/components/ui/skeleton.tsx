import * as React from 'react';
import { cn } from '../../lib/utils';

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-sm bg-muted', className)} />;
}

/**
 * Loading rule (motion.md): ops >300ms show a skeleton; sub-300ms show
 * nothing — a flash of skeleton is worse than a wait.
 */
export function DelayedSkeleton({
  className,
  delay = 300,
}: {
  className?: string;
  delay?: number;
}) {
  const [show, setShow] = React.useState(false);
  React.useEffect(() => {
    const t = setTimeout(() => setShow(true), delay);
    return () => clearTimeout(t);
  }, [delay]);
  if (!show) return null;
  return <Skeleton className={className} />;
}
