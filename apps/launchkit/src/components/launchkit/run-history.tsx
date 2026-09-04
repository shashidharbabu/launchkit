import * as React from 'react';
import { History, ChevronDown, ChevronRight } from 'lucide-react';
import { Dialog, DialogTrigger, SheetContent, DialogTitle } from '@launchkit/design-system/components/dialog';
import { Button } from '@launchkit/design-system/components/button';
import { StatusStamp, type StampKind } from '@launchkit/design-system/components/status-stamp';
import { Disclosure } from '@launchkit/design-system/components/disclosure';
import { CodeWell } from '@launchkit/design-system/components/card';
import { api } from '../../data/api';
import { elapsedLabel, provDate } from '../../lib/format';
import { jobLabel } from '../../lib/jobs';
import type { JobRow } from '../../lib/types';

function stampFor(status: string): StampKind {
  if (status === 'done') return 'go';
  if (status === 'error') return 'nogo';
  if (status === 'running' || status === 'queued') return 'running';
  return 'hold';
}

/**
 * Run history panel (components.md): side sheet, reverse-chron rows
 * stamp, stage name, duration + timestamp in Data mono. Auto-refreshes
 * while a job runs; failed rows expand to the error in a mono well.
 */
export function RunHistory({
  projectId,
  running,
}: {
  projectId: string;
  running: boolean;
}) {
  const [open, setOpen] = React.useState(false);
  const [jobs, setJobs] = React.useState<JobRow[]>([]);
  const [expanded, setExpanded] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open) return;
    const load = () => api.jobs(projectId).then((rows) => setJobs(rows as JobRow[])).catch(() => {});
    load();
    if (!running) return;
    const t = setInterval(load, 4000);
    return () => clearInterval(t);
  }, [open, projectId, running]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="secondary">
            <History aria-hidden />
            Run history
          </Button>
        }
      />
      <SheetContent aria-describedby={undefined}>
        <DialogTitle>Run history</DialogTitle>
        <div className="mt-4">
          {jobs.length === 0 && (
            <div>
              <p className="text-heading font-semibold">No runs yet.</p>
              <p className="mt-1 text-body text-muted-foreground">
                Every run for this launch lands here with its result and timing.
              </p>
            </div>
          )}
          {jobs.map((j) => (
            <div key={j.id} className="border-b border-border last:border-0">
              <div className="flex items-center gap-3 py-2.5">
                <StatusStamp kind={stampFor(j.status)} />
                <span className="min-w-0 flex-1 truncate text-body">{jobLabel(j.kind)}</span>
                <span className="shrink-0 font-mono text-data tabular text-muted-foreground">
                  {j.elapsed_seconds ? elapsedLabel(j.elapsed_seconds) : ''}
                  {j.created_at ? `${j.elapsed_seconds ? ', ' : ''}${provDate(j.created_at)}` : ''}
                </span>
                {j.error && (
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={expanded === j.id ? 'Hide error' : 'Show error'}
                    aria-expanded={expanded === j.id}
                    onClick={() => setExpanded(expanded === j.id ? null : j.id)}
                    className="-my-1 text-muted-foreground"
                  >
                    {expanded === j.id ? <ChevronDown aria-hidden /> : <ChevronRight aria-hidden />}
                  </Button>
                )}
              </div>
              {j.error && (
                <Disclosure open={expanded === j.id}>
                  <CodeWell className="mb-3">{j.error}</CodeWell>
                </Disclosure>
              )}
            </div>
          ))}
        </div>
      </SheetContent>
    </Dialog>
  );
}
