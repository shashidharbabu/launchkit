'use client';

import * as React from 'react';
import Link from 'next/link';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatusStamp, type StampKind } from '@/components/ui/status-stamp';
import { Table, Th, Tr, Td } from '@/components/ui/table';
import { DelayedSkeleton } from '@/components/ui/skeleton';
import { Disclosure } from '@/components/ui/disclosure';
import { HonestEmpty } from '@/components/launchkit/stage-common';
import { api } from '@/lib/api';
import { age, elapsedLabel } from '@/lib/format';
import { jobLabel } from '@/lib/jobs';
import type { JobRow } from '@/lib/types';

function stampFor(status: string): StampKind {
  if (status === 'done') return 'go';
  if (status === 'error') return 'nogo';
  // RUNNING is reserved for actively executing jobs; queued work is HOLD (color.md)
  if (status === 'running') return 'running';
  return 'hold';
}

const PAGE = 50;

export default function RunsPage() {
  const [jobs, setJobs] = React.useState<JobRow[] | null>(null);
  const [apiDown, setApiDown] = React.useState(false);
  const [expanded, setExpanded] = React.useState<string | null>(null);
  const [page, setPage] = React.useState(0);

  React.useEffect(() => {
    let cancelled = false;
    const load = () =>
      api
        .allJobs(100)
        .then((rows: JobRow[]) => {
          if (!cancelled) setJobs(rows);
        })
        .catch(() => {
          if (!cancelled) {
            setApiDown(true);
            setJobs([]);
          }
        });
    load();
    // auto-refresh while any run is live; slow poll otherwise
    const t = setInterval(load, 5000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, []);

  const running = (jobs ?? []).filter((j) => j.status === 'running').length;
  const queued = (jobs ?? []).filter((j) => j.status === 'queued').length;
  const failed = (jobs ?? []).filter((j) => j.status === 'error').length;
  // the fetch is capped at 100 — scope the header claim to what is shown
  const atCap = (jobs?.length ?? 0) >= 100;

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-display font-semibold tracking-[-0.01em]">Runs</h1>
        {jobs !== null && jobs.length > 0 && (
          <p className="font-mono text-data text-muted-foreground">
            {atCap ? 'last ' : ''}
            {jobs.length} run{jobs.length === 1 ? '' : 's'} · {running} running
            {queued > 0 ? ` · ${queued} queued` : ''} · {failed} failed
          </p>
        )}
      </div>

      {apiDown && (
        <p className="border border-nogo bg-nogo/10 p-3 text-body">
          Couldn&rsquo;t reach the backend at{' '}
          <span className="font-mono text-data">
            {process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8090'}
          </span>
          . Start it, then reload:{' '}
          <code className="font-mono text-data">
            .venv/bin/uvicorn app.main:app --app-dir backend --port 8090
          </code>
        </p>
      )}

      {jobs === null && <DelayedSkeleton className="h-64" />}

      {jobs !== null && !apiDown && jobs.length === 0 && (
        <HonestEmpty
          fact="No runs yet."
          reason="Every pipeline run across all your launches lands here with its result and timing — analysis, drafts, venue ranking, signal searches."
          action={
            <Link href="/launches/new">
              <Button variant="secondary">Start your first launch</Button>
            </Link>
          }
        />
      )}

      {jobs !== null && jobs.length > 0 && (
        <div className="overflow-x-auto rounded-sm border border-border bg-card">
          <Table>
            <thead>
              <tr>
                <Th>Status</Th>
                <Th>Run</Th>
                <Th>Launch</Th>
                <Th numeric>Duration</Th>
                <Th numeric>When</Th>
                <Th className="w-10">
                  <span className="sr-only">Error details</span>
                </Th>
              </tr>
            </thead>
            <tbody>
              {(jobs.length > PAGE ? jobs.slice(page * PAGE, (page + 1) * PAGE) : jobs).map((j) => (
                <React.Fragment key={j.id}>
                  <Tr>
                    <Td>
                      <StatusStamp kind={stampFor(j.status)} />
                    </Td>
                    <Td className="font-medium">{jobLabel(j.kind)}</Td>
                    <Td>
                      {j.project_id ? (
                        <Link
                          href={`/p/${j.project_id}/profile`}
                          className="text-link hover:text-link-hover"
                        >
                          {j.project_name ?? j.project_id}
                        </Link>
                      ) : (
                        '—'
                      )}
                    </Td>
                    <Td numeric>{j.elapsed_seconds ? elapsedLabel(j.elapsed_seconds) : '—'}</Td>
                    <Td numeric>{j.created_at ? age(j.created_at) : '—'}</Td>
                    <Td>
                      {j.error && (
                        <button
                          type="button"
                          aria-label={expanded === j.id ? 'Hide error' : 'Show error'}
                          aria-expanded={expanded === j.id}
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
                    </Td>
                  </Tr>
                  {j.error && (
                    <tr className="border-b border-border">
                      <td colSpan={6} className="p-0">
                        <Disclosure open={expanded === j.id}>
                          <pre className="m-3 overflow-x-auto whitespace-pre-wrap bg-muted p-3 font-mono text-data leading-5">
                            {j.error}
                          </pre>
                        </Disclosure>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </Table>
          {jobs.length > PAGE && (
            <div className="flex items-center justify-between border-t border-border px-3 py-2">
              <span className="font-mono text-data text-muted-foreground">
                showing {page * PAGE + 1}–{Math.min((page + 1) * PAGE, jobs.length)} of {jobs.length}{' '}
                runs
              </span>
              <span className="flex gap-2">
                <Button variant="ghost" size="compact" disabled={page === 0} onClick={() => setPage(page - 1)}>
                  Previous
                </Button>
                <Button
                  variant="ghost"
                  size="compact"
                  disabled={(page + 1) * PAGE >= jobs.length}
                  onClick={() => setPage(page + 1)}
                >
                  Next
                </Button>
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
