import { cn } from '../../lib/utils';

/**
 * The provenance line: every AI-drafted artifact carries one (components.md).
 * The one lowercase mono use in the system. Sits 8px under its content.
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
        'mt-2 font-mono text-meta lowercase tracking-[0.08em] text-muted-foreground',
        className,
      )}
    >
      {clean.join(' · ')}
    </p>
  );
}
