import * as React from 'react';
import { cn } from '../lib/cn';

/**
 * Surfaces (components/cards-surfaces.md)
 *
 * Card: a sheet on the canvas. 12px radius, hairline border, a whisper of
 * shadow. Header and body flow inside one padding; only the footer draws
 * a rule, and only when it carries actions.
 * Well: a sunken area inside a card for quoted drafts, code, and notes.
 */
export function Card({
  className,
  interactive,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { interactive?: boolean }) {
  return (
    <div
      className={cn(
        'rounded-card border border-border bg-surface shadow-card',
        interactive && 'transition-colors duration-(--duration-fast) hover:border-border-strong',
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({
  title,
  description,
  actions,
  className,
  children,
}: {
  title?: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className={cn('flex flex-wrap items-start justify-between gap-x-4 gap-y-2 px-5 pt-5', className)}>
      <div className="min-w-0 flex-1">
        {title && <h3 className="text-heading">{title}</h3>}
        {description && <p className="mt-1 text-small text-muted-foreground">{description}</p>}
        {children}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}

export function CardBody({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('px-5 py-5', className)} {...props} />;
}

export function CardFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('flex flex-wrap items-center gap-2 border-t border-border px-5 py-3.5', className)}
      {...props}
    />
  );
}

export function Well({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('rounded-control bg-sunken px-4 py-3', className)} {...props} />;
}

export function CodeWell({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <pre
      className={cn(
        'max-h-96 overflow-auto rounded-control bg-sunken p-4 font-mono text-data leading-5 whitespace-pre-wrap text-foreground',
        className,
      )}
    >
      {children}
    </pre>
  );
}
