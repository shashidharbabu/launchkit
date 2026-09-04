import * as React from 'react';
import { ChevronRight, Clock } from 'lucide-react';
import { Button } from '@launchkit/design-system/components/button';
import { EmptyState } from '@launchkit/design-system/components/empty-state';
import { CodeWell } from '@launchkit/design-system/components/card';
import { Disclosure } from '@launchkit/design-system/components/disclosure';
import { cn } from '@launchkit/design-system/lib/cn';
import { useNav } from '../../nav';
import { etaLabel } from '../../lib/run-eta';

/** The package's surfaces, re-exported so every stage builds from the same sheet. */
export { Card, CardHeader, CardBody, CardFooter, Well } from '@launchkit/design-system/components/card';

/** How long a run takes and where it runs; the one line people ask for on an empty stage. */
function RunLine({ runKind, className }: { runKind: string; className?: string }) {
  return (
    <span className={cn('flex flex-wrap items-center gap-x-2 text-small text-muted-foreground', className)}>
      <Clock size={14} strokeWidth={1.75} aria-hidden className="shrink-0" />
      <span>Takes {etaLabel(runKind)}. Runs in the background; you can leave this page and come back.</span>
    </span>
  );
}

/**
 * Honest-empty state (feedback-states.md): fact, reason, next act. Keeps the
 * older fact / reason prop names; renders the package's EmptyState, left-aligned
 * inside a stage so it reads as content.
 */
export function HonestEmpty({
  fact,
  reason,
  action,
  className,
  runKind,
  align = 'start',
}: {
  fact: string;
  reason: string;
  action?: React.ReactNode;
  className?: string;
  align?: 'start' | 'center';
  /** Run kind the action starts: an empty state is exactly where "how long?" is asked. */
  runKind?: string;
}) {
  return (
    <EmptyState
      align={align}
      title={fact}
      description={
        <>
          {reason}
          {runKind && <RunLine runKind={runKind} className="mt-2" />}
        </>
      }
      action={action}
      className={className}
    />
  );
}

/**
 * The stage intro (workspace-stage-anatomy.md): one lead sentence saying what
 * Launch Kit did and what the person should do, with the ask in medium weight;
 * one muted detail sentence. Not a card.
 */
export function Orient({
  lead,
  detail,
  runKind,
}: {
  lead: React.ReactNode;
  detail?: React.ReactNode;
  /** Run kind this stage starts: adds the measured "how long / where it runs" line. */
  runKind?: string;
}) {
  return (
    <div className="grid max-w-reading gap-1.5">
      <p className="text-lead">{lead}</p>
      {detail && <p className="text-body text-muted-foreground">{detail}</p>}
      {runKind && <RunLine runKind={runKind} />}
    </div>
  );
}

/**
 * Raw output, folded shut at the bottom of a card (cards-surfaces.md: a CodeWell).
 * People review the structured view; this exists for support and the curious.
 */
export function RawData({ data, label = 'Raw data' }: { data: unknown; label?: string }) {
  const [open, setOpen] = React.useState(false);
  const isText = typeof data === 'string';
  return (
    <div>
      <Button variant="ghost" size="sm" onClick={() => setOpen(!open)} aria-expanded={open} className="-ml-2 text-muted-foreground">
        <ChevronRight aria-hidden className={cn('transition-transform duration-(--duration-fast) motion-reduce:transition-none', open && 'rotate-90')} />
        {label}
      </Button>
      <Disclosure open={open}>
        <CodeWell className="mt-2">{isText ? data : JSON.stringify(data, null, 2)}</CodeWell>
      </Disclosure>
    </div>
  );
}

/** Locked gates say why (voice.md); a locked stage is never a dead end. */
export function LockedGate() {
  const { nav, go, href } = useNav();
  const id = nav.projectId;
  return (
    <HonestEmpty
      fact="Locked until you approve the profile."
      reason="Everything downstream is built from it: pricing, posts, venues and signal search all read the approved profile."
      action={
        <a
          href={href({ view: 'workspace', projectId: id, stage: 'profile' })}
          onClick={(e) => {
            e.preventDefault();
            go({ view: 'workspace', projectId: id, stage: 'profile' });
          }}
        >
          <Button variant="secondary">Review the profile</Button>
        </a>
      }
    />
  );
}
