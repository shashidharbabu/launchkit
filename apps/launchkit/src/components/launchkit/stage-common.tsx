import * as React from 'react';
import { ChevronRight, Clock } from 'lucide-react';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';
import { useNav } from '../../nav';
import { etaLabel } from '../../lib/run-eta';

/** A sheet laid on the desk: bg-card, hairline border, sharp, no shadow. */
export function Card({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('rounded-sm border border-border bg-card', className)}
      {...props}
    />
  );
}

/**
 * Honest-empty state (components.md / voice.md): fact → reason → next act.
 * Heading + faint body + one secondary action, left-aligned. Never a
 * centered illustration.
 */
export function HonestEmpty({
  fact,
  reason,
  action,
  className,
  runKind,
}: {
  fact: string;
  reason: string;
  action?: React.ReactNode;
  className?: string;
  /** Run kind the action starts — an empty state is exactly where "how long?" is asked. */
  runKind?: string;
}) {
  return (
    <div className={cn('max-w-xl', className)}>
      <p className="text-heading font-semibold">{fact}</p>
      <p className="mt-1 text-body text-muted-foreground">{reason}</p>
      {action && <div className="mt-3">{action}</div>}
      {runKind && (
        <p className="mt-2 flex flex-wrap items-center gap-x-2 font-mono text-data text-muted-foreground">
          <Clock size={13} strokeWidth={1.5} aria-hidden />
          <span>Takes {etaLabel(runKind)}.</span>
          <span>Runs in the background; you can leave this page.</span>
        </p>
      )}
    </div>
  );
}

/**
 * The orienting card every stage opens with: what Launch Kit just did, what
 * the builder is being asked to do, and why it matters. A screen that starts
 * with data before purpose reads as a database, not a product.
 */
export function Orient({
  lead,
  detail,
  runKind,
}: {
  lead: React.ReactNode;
  detail?: React.ReactNode;
  /** Run kind this stage starts — adds a measured "how long / where it runs" line. */
  runKind?: string;
}) {
  return (
    <Card className="grid gap-1 p-4">
      <p className="text-read leading-[1.625rem]">{lead}</p>
      {detail && <p className="text-body text-muted-foreground">{detail}</p>}
      {runKind && (
        <p className="mt-1 flex flex-wrap items-center gap-x-2 font-mono text-data text-muted-foreground">
          <Clock size={13} strokeWidth={1.5} aria-hidden />
          <span>Takes {etaLabel(runKind)}.</span>
          <span>Runs in the background; you can leave this page.</span>
        </p>
      )}
    </Card>
  );
}

/**
 * The raw pipeline output, demoted to a debugging affordance. Builders review
 * structured views; the JSON exists for support and for the curious, folded
 * shut at the bottom of a card, never at eye level.
 */
export function RawData({ data, label = 'Raw data' }: { data: unknown; label?: string }) {
  const [open, setOpen] = React.useState(false);
  const isText = typeof data === 'string';
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="inline-flex items-center gap-1 font-mono text-meta font-medium uppercase tracking-[0.08em] text-muted-foreground hover:text-foreground"
      >
        <ChevronRight
          size={12}
          strokeWidth={1.5}
          aria-hidden
          className={cn(
            'transition-transform motion-reduce:transition-none',
            open && 'rotate-90',
          )}
        />
        {label}
      </button>
      {open && (
        <pre
          className={cn(
            'mt-2 max-h-80 overflow-auto border border-border bg-muted p-3 font-mono text-data leading-5',
            isText && 'whitespace-pre-wrap',
          )}
        >
          {isText ? data : JSON.stringify(data, null, 2)}
        </pre>
      )}
    </div>
  );
}

/** Locked gates say why (voice.md). A 409 is never a dead end. */
export function LockedGate() {
  const { nav, go, href } = useNav();
  const id = nav.projectId;
  return (
    <HonestEmpty
      fact="Locked until you approve the profile."
      reason="Everything downstream is built from it, pricing, assets, venues, and signal search all read the approved profile."
      action={
        <a
          href={href({ view: 'workspace', projectId: id, stage: 'profile' })}
          onClick={(e) => {
            e.preventDefault();
            go({ view: 'workspace', projectId: id, stage: 'profile' });
          }}
        >
          <Button variant="secondary">Review profile</Button>
        </a>
      }
    />
  );
}
