import * as React from 'react';
import { History, ChevronDown, ChevronRight } from 'lucide-react';
import { Dialog, DialogTrigger, SheetContent, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { StatusStamp, type StampKind } from '../ui/status-stamp';
import { Disclosure } from '../ui/disclosure';
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
            <History size={14} strokeWidth={1.5} />
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
                Every pipeline run for this launch lands here with its result and timing.
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
                  {j.created_at ? ` · ${provDate(j.created_at)}` : ''}
                </span>
                {j.error && (
                  <button
                    type="button"
                    aria-label={expanded === j.id ? 'Hide error' : 'Show error'}
                    onClick={() => setExpanded(expanded === j.id ? null : j.id)}
                    className="-my-2 inline-grid h-10 w-10 place-items-center text-muted-foreground hover:text-foreground"
                  >
                    {expanded === j.id ? (
                      <ChevronDown size={14} strokeWidth={1.5} />
                    ) : (
                      <ChevronRight size={14} strokeWidth={1.5} />
                    )}
                  </button>
                )}
              </div>
              {j.error && (
                <Disclosure open={expanded === j.id}>
                  <pre className="mb-2.5 overflow-x-auto whitespace-pre-wrap bg-muted p-3 font-mono text-data text-foreground">
                    {j.error}
                  </pre>
                </Disclosure>
              )}
            </div>
          ))}
        </div>
      </SheetContent>
    </Dialog>
  );
}
