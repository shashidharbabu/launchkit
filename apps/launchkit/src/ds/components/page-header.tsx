import * as React from 'react';
import { cn } from '../lib/cn';

/**
 * PageHeader (patterns/page-anatomy.md)
 *
 * Every page opens the same way: an optional eyebrow, a display title, one
 * plain sentence, and the page's actions on the right. Sentence case.
 */
export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
  children,
}: {
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <header className={cn('flex flex-wrap items-end justify-between gap-x-6 gap-y-4', className)}>
      <div className="min-w-0 flex-1">
        {eyebrow && <div className="mb-1.5 text-small font-medium text-muted-foreground">{eyebrow}</div>}
        <h1 className="text-display text-balance">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-body text-muted-foreground">{description}</p>}
        {children}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}
