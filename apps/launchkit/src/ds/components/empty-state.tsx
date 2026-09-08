import * as React from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '../lib/cn';

/**
 * EmptyState (components/feedback-states.md)
 *
 * Fact, reason, next act. The title states what is true ("No venues ranked
 * yet."), the description says why and what happens next, the action is
 * one quiet button. Never a centered illustration with a cheerful line.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  align = 'center',
  className,
}: {
  icon?: LucideIcon;
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  align?: 'center' | 'start';
  className?: string;
}) {
  return (
    <div
      className={cn(
        'rounded-card border border-dashed border-border-strong bg-surface/60 px-6',
        align === 'center' ? 'flex flex-col items-center py-12 text-center' : 'py-8',
        className,
      )}
    >
      {Icon && (
        <div className="mb-4 flex size-11 items-center justify-center rounded-control bg-sunken text-muted-foreground">
          <Icon size={20} strokeWidth={1.75} aria-hidden />
        </div>
      )}
      <p className="text-heading">{title}</p>
      {description && (
        <p className={cn('mt-1.5 text-body text-muted-foreground', align === 'center' ? 'max-w-md' : 'max-w-xl')}>
          {description}
        </p>
      )}
      {action && <div className="mt-5 flex flex-wrap items-center gap-2">{action}</div>}
    </div>
  );
}
