import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * Ruled-paper table visuals (components.md): meta mono headers, 40px rows,
 * horizontal hairlines only — no vertical rules, no zebra. Numbers
 * right-aligned in Data mono with tabular figures.
 */
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
        'h-10 border-b border-border px-3 text-left align-middle',
        'font-mono text-meta font-medium uppercase tracking-[0.08em] text-muted-foreground',
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
      className={cn(
        'h-10 border-b border-border transition-colors duration-120 hover:bg-accent',
        // selection: 2px ember left rule
        selected && 'shadow-[inset_2px_0_0_var(--primary)]',
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
        'px-3 py-2 align-middle',
        numeric && 'text-right font-mono text-data tabular',
        className,
      )}
      {...props}
    />
  );
}
