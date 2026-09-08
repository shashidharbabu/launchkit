import * as React from 'react';
import { cn } from '../lib/cn';

/**
 * Table (components/tables-lists.md)
 *
 * A framed sheet with horizontal rules only: no vertical lines, no zebra.
 * Headers are sentence-case 13px, rows are 48px, numbers sit right-aligned
 * in mono with tabular figures. A selected row carries a 3px flare bar.
 */
export function TableFrame({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('overflow-x-auto rounded-card border border-border bg-surface shadow-card', className)}
      {...props}
    />
  );
}

export function Table({ className, ...props }: React.TableHTMLAttributes<HTMLTableElement>) {
  return <table className={cn('w-full border-collapse text-body', className)} {...props} />;
}

export function Th({
  className,
  numeric,
  ...props
}: React.ThHTMLAttributes<HTMLTableCellElement> & { numeric?: boolean }) {
  return (
    <th
      className={cn(
        'h-11 whitespace-nowrap border-b border-border px-4 text-left align-middle text-label font-medium text-muted-foreground first:pl-5 last:pr-5',
        numeric && 'text-right',
        className,
      )}
      {...props}
    />
  );
}

export function Tr({
  className,
  selected,
  ...props
}: React.HTMLAttributes<HTMLTableRowElement> & { selected?: boolean }) {
  return (
    <tr
      data-selected={selected || undefined}
      className={cn(
        'border-b border-border transition-colors duration-(--duration-fast) last:border-0 hover:bg-accent/50',
        selected && 'bg-flare-soft/40 shadow-[inset_3px_0_0_var(--flare)]',
        className,
      )}
      {...props}
    />
  );
}

export function Td({
  className,
  numeric,
  ...props
}: React.TdHTMLAttributes<HTMLTableCellElement> & { numeric?: boolean }) {
  return (
    <td
      className={cn(
        'px-4 py-3 align-middle first:pl-5 last:pr-5',
        numeric && 'whitespace-nowrap text-right font-mono text-data tabular text-muted-foreground',
        className,
      )}
      {...props}
    />
  );
}

/** The line under a table: what the count counts. */
export function TableCaption({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('text-small text-muted-foreground', className)} {...props} />;
}
