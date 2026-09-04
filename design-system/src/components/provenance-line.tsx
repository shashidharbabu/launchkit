import * as React from 'react';
import { cn } from '../lib/cn';

/**
 * ProvenanceLine (components/status.md)
 *
 * Every AI-drafted artifact carries one: where it came from and whether it
 * was verified. Mono, muted, sentence case, parts separated by a hairline
 * rather than dots. Sits under its content.
 */
export function ProvenanceLine({
  parts,
  className,
}: {
  parts: Array<string | null | undefined | false>;
  className?: string;
}) {
  const clean = parts.filter((p): p is string => Boolean(p));
  if (clean.length === 0) return null;
  return (
    <p
      className={cn(
        'mt-3 flex flex-wrap items-center gap-x-2.5 gap-y-1 font-mono text-data text-muted-foreground',
        className,
      )}
    >
      {clean.map((p, i) => (
        <React.Fragment key={`${p}-${i}`}>
          {i > 0 && <span aria-hidden className="h-3 w-px bg-border-strong" />}
          <span>{p}</span>
        </React.Fragment>
      ))}
    </p>
  );
}
