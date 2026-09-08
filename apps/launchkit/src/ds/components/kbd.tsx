import * as React from 'react';
import { cn } from '../lib/cn';

/** Keyboard hint: a small raised key. Used beside actions that have a shortcut. */
export function Kbd({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <kbd
      className={cn(
        'inline-flex h-5 min-w-5 items-center justify-center rounded-[5px] border border-border-strong bg-surface-raised px-1.5',
        'font-sans text-[11px] font-medium text-muted-foreground shadow-[0_1px_0_0_var(--border-strong)]',
        className,
      )}
    >
      {children}
    </kbd>
  );
}
