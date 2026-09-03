import * as React from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '../components/ui/button';
import { StatusStamp, type StampKind } from '../components/ui/status-stamp';
import { Table, Th, Tr, Td } from '../components/ui/table';
import { DelayedSkeleton } from '../components/ui/skeleton';
import { Disclosure } from '../components/ui/disclosure';
import { HonestEmpty } from '../components/launchkit/stage-common';
import { ConnectionBanner } from '../components/launchkit/connection-banner';
import { api } from '../data/api';
import { tracesForRun } from '../data/trace';
import { age, elapsedLabel } from '../lib/format';
import { jobLabel } from '../lib/jobs';
import type { JobRow } from '../lib/types';
import { useNav } from '../nav';

function stampFor(status: string): StampKind {
  if (status === 'done') return 'go';
  if (status === 'error') return 'nogo';
  // RUNNING is reserved for actively executing jobs; queued work is HOLD (color.md)
  if (status === 'running') return 'running';
  return 'hold';
}

const PAGE = 50;

export default function RunsPage() {
  const { go, href } = useNav();
  const [jobs, setJobs] = React.useState<JobRow[] | null>(null);
  const [apiError, setApiError] = React.useState<string | null>(null);
  const [expanded, setExpanded] = React.useState<string | null>(null);
  const [page, setPage] = React.useState(0);

  React.useEffect(() => {
    let cancelled = false;
    const load = () =>
      api
        .allJobs(100)
        .then((rows) => {
          if (!cancelled) setJobs(rows as JobRow[]);
        })
        .catch((e) => {
          if (!cancelled) {
            setApiError(String(e instanceof Error ? e.message : e));
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
  // the fetch is capped at 100, scope the header claim to what is shown
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

      <ConnectionBanner error={apiError} />

      {jobs === null && <DelayedSkeleton className="h-64" />}

      {jobs !== null && !apiError && jobs.length === 0 && (
        <HonestEmpty
          fact="No runs yet."
          reason="Every pipeline run across all your launches lands here with its result and timing; analysis, drafts, venue ranking, signal searches."
          action={
            <a
              href={href({ view: 'new-launch' })}
              onClick={(e) => {
                e.preventDefault();
                go({ view: 'new-launch' });
              }}
            >
              <Button variant="secondary">Start your first launch</Button>
            </a>
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
                        <a
                          href={href({ view: 'workspace', projectId: j.project_id, stage: 'profile' })}
                          onClick={(e) => {
                            e.preventDefault();
                            go({ view: 'workspace', projectId: j.project_id, stage: 'profile' });
                          }}
                          className="text-link hover:text-link-hover"
                        >
                          {j.project_name ?? j.project_id}
                        </a>
                      ) : (
                        '-'
                      )}
                    </Td>
                    <Td numeric>{j.elapsed_seconds ? elapsedLabel(j.elapsed_seconds) : '-'}</Td>
                    <Td numeric>{j.created_at ? age(j.created_at) : '-'}</Td>
                    <Td>
                      {(j.error || tracesForRun(j.id).length > 0) && (
                        <button
                          type="button"
                          aria-label={expanded === j.id ? 'Hide details' : 'Show details'}
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
                  {(j.error || tracesForRun(j.id).length > 0) && (
                    <tr className="border-b border-border">
                      <td colSpan={6} className="p-0">
                        <Disclosure open={expanded === j.id}>
                          {j.error && (
                            <pre className="m-3 overflow-x-auto whitespace-pre-wrap bg-muted p-3 font-mono text-data leading-5">
                              {j.error}
                            </pre>
                          )}
                          <RunTrace runId={j.id} />
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


/**
 * Newest pipeline trace for a run. Collapsed by default: the components involved
 * plus ONLY the steps that errored (the thing you need to map a failure); expand
 * for the full timeline in a scrollable panel.
 */
function RunTrace({ runId }: { runId: string }) {
  const [showAll, setShowAll] = React.useState(false);
  const t = tracesForRun(runId)[0];
  if (!t) return null;
  const errorSteps = t.entries.filter((e) => e.error);
  const components = Array.from(new Set(t.entries.map((e) => e.component).filter((c): c is string => Boolean(c))));
  const renderStep = (e: (typeof t.entries)[number], i: number) => (
    <li key={i} className="grid grid-cols-[6rem_1fr] gap-3 px-3 py-1.5 font-mono text-data">
      <span className="text-muted-foreground">{e.op ?? '·'}</span>
      <span>
        <span className="text-foreground">{e.component ?? ''}</span>
        {e.lane && <span className="text-muted-foreground"> · {e.lane}</span>}
        {e.error && <span className="font-medium text-foreground"> · {e.error}</span>}
        {e.result && <span className="block truncate text-muted-foreground">{e.result}</span>}
      </span>
    </li>
  );
  return (
    <div className="m-3 border border-border bg-background">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-border px-3 py-2 font-mono text-meta uppercase tracking-[0.08em] text-muted-foreground">
        <span>Pipeline trace</span>
        <span className="text-foreground">{t.pipe}</span>
        <span className={t.ok ? 'text-foreground' : 'font-medium text-foreground'}>{t.ok ? 'ok' : 'failed'}</span>
        <span>{t.ms} ms</span>
        <span>{t.entries.length} steps</span>
        {t.entries.length > 0 && (
          <Button variant="ghost" size="compact" className="ml-auto" onClick={() => setShowAll((v) => !v)}>
            {showAll ? 'Collapse' : `Show all ${t.entries.length} steps`}
          </Button>
        )}
      </div>
      {t.question && (
        <p className="border-b border-border px-3 py-2 font-mono text-data text-muted-foreground">Q: {t.question}</p>
      )}
      {t.error && (
        <p className="border-b border-border px-3 py-2 font-mono text-data font-medium text-foreground">{t.error}</p>
      )}
      {t.entries.length === 0 ? (
        <p className="px-3 py-2 font-mono text-data text-muted-foreground">No step-level trace was returned by the engine for this call.</p>
      ) : showAll ? (
        <ol className="max-h-[32rem] divide-y divide-border overflow-auto">{t.entries.map(renderStep)}</ol>
      ) : (
        <>
          {components.length > 0 && (
            <p className="border-b border-border px-3 py-2 font-mono text-data text-muted-foreground">
              <span className="text-meta uppercase tracking-[0.08em]">Components</span> {components.join(' · ')}
            </p>
          )}
          {errorSteps.length > 0 ? (
            <ol className="divide-y divide-border">{errorSteps.map(renderStep)}</ol>
          ) : (
            <p className="px-3 py-2 font-mono text-data text-muted-foreground">No step errors. Expand to see all {t.entries.length} steps.</p>
          )}
        </>
      )}
    </div>
  );
}
