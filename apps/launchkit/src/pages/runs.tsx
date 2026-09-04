import * as React from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@launchkit/design-system/components/button';
import { StatusStamp, Badge, type StampKind } from '@launchkit/design-system/components/status-stamp';
import { PageContainer } from '@launchkit/design-system/components/page-container';
import { PageHeader } from '@launchkit/design-system/components/page-header';
import { CodeWell } from '@launchkit/design-system/components/card';
import { Table, TableFrame, Th, Tr, Td } from '@launchkit/design-system/components/table';
import { DelayedSkeleton } from '@launchkit/design-system/components/skeleton';
import { Disclosure } from '@launchkit/design-system/components/disclosure';
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
    <PageContainer className="grid gap-8">
      <PageHeader
        title="Runs"
        description={`Every run across your launches, newest first${atCap ? ' (the last 100)' : ''}.`}
        actions={
          jobs !== null && jobs.length > 0 ? (
            <>
              <Badge tone="neutral">{jobs.length} run{jobs.length === 1 ? '' : 's'}</Badge>
              {running > 0 && <Badge tone="flare">{running} running</Badge>}
              {queued > 0 && <Badge tone="neutral">{queued} queued</Badge>}
              {failed > 0 && <Badge tone="nogo">{failed} failed</Badge>}
            </>
          ) : undefined
        }
      />
      <ConnectionBanner error={apiError} />

      {jobs === null && <DelayedSkeleton className="h-64" />}

      {jobs !== null && !apiError && jobs.length === 0 && (
        <HonestEmpty
          align="center"
          fact="No runs yet."
          reason="Every run across all your launches lands here with its result and timing: analysis, drafts, venue ranking, signal searches."
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
        <TableFrame>
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
                          className="hover:text-link-hover"
                        >
                          {j.project_name ?? j.project_id}
                        </a>
                      ) : null}
                    </Td>
                    <Td numeric>{j.elapsed_seconds ? elapsedLabel(j.elapsed_seconds) : ''}</Td>
                    <Td numeric>{j.created_at ? age(j.created_at) : ''}</Td>
                    <Td>
                      {(j.error || tracesForRun(j.id).length > 0) && (
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={expanded === j.id ? 'Hide details' : 'Show details'}
                          aria-expanded={expanded === j.id}
                          onClick={() => setExpanded(expanded === j.id ? null : j.id)}
                          className="-my-1 text-muted-foreground"
                        >
                          {expanded === j.id ? <ChevronDown aria-hidden /> : <ChevronRight aria-hidden />}
                        </Button>
                      )}
                    </Td>
                  </Tr>
                  {(j.error || tracesForRun(j.id).length > 0) && (
                    <tr className="border-b border-border last:border-0">
                      <td colSpan={6} className="p-0">
                        <Disclosure open={expanded === j.id}>
                          <div className="grid gap-3 bg-sunken/40 px-5 py-4">
                            {j.error && <CodeWell>{j.error}</CodeWell>}
                            <RunTrace runId={j.id} />
                          </div>
                        </Disclosure>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </Table>
          {jobs.length > PAGE && (
            <div className="flex items-center justify-between border-t border-border px-5 py-2.5">
              <span className="text-small text-muted-foreground">
                Runs {page * PAGE + 1} to {Math.min((page + 1) * PAGE, jobs.length)} of {jobs.length}
              </span>
              <span className="flex gap-2">
                <Button variant="ghost" size="sm" disabled={page === 0} onClick={() => setPage(page - 1)}>
                  Previous
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={(page + 1) * PAGE >= jobs.length}
                  onClick={() => setPage(page + 1)}
                >
                  Next
                </Button>
              </span>
            </div>
          )}
        </TableFrame>
      )}
    </PageContainer>
  );
}

/**
 * Newest trace for a run. Collapsed by default: the components involved
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
    <li key={i} className="grid grid-cols-[6rem_1fr] gap-3 px-4 py-1.5 font-mono text-data">
      <span className="text-muted-foreground">{e.op ?? ''}</span>
      <span>
        <span className="text-foreground">{e.component ?? ''}</span>
        {e.lane && <span className="text-muted-foreground">, {e.lane}</span>}
        {e.error && <span className="font-medium text-foreground">: {e.error}</span>}
        {e.result && <span className="block truncate text-muted-foreground">{e.result}</span>}
      </span>
    </li>
  );
  return (
    <div className="rounded-control border border-border bg-surface">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-border px-4 py-2 text-label text-muted-foreground">
        <span>Run trace</span>
        <span className="font-mono text-data text-foreground">{t.pipe}</span>
        <StatusStamp kind={t.ok ? 'go' : 'nogo'} label={t.ok ? 'Completed' : 'Failed'} />
        <span className="font-mono text-data">{t.ms} ms</span>
        <span className="font-mono text-data">{t.entries.length} steps</span>
        {t.entries.length > 0 && (
          <Button variant="ghost" size="sm" className="ml-auto" onClick={() => setShowAll((v) => !v)}>
            {showAll ? 'Collapse' : `Show all ${t.entries.length} steps`}
          </Button>
        )}
      </div>
      {t.question && (
        <p className="border-b border-border px-4 py-2 font-mono text-data text-muted-foreground">Question: {t.question}</p>
      )}
      {t.error && (
        <p className="border-b border-border px-4 py-2 font-mono text-data font-medium text-foreground">{t.error}</p>
      )}
      {t.entries.length === 0 ? (
        <p className="px-4 py-2 text-small text-muted-foreground">No step-level trace was returned for this run.</p>
      ) : showAll ? (
        <ol className="max-h-[32rem] divide-y divide-border overflow-auto">{t.entries.map(renderStep)}</ol>
      ) : (
        <>
          {components.length > 0 && (
            <p className="border-b border-border px-4 py-2 text-small text-muted-foreground">
              <span className="text-label">Components</span>{' '}
              <span className="font-mono text-data">{components.join(', ')}</span>
            </p>
          )}
          {errorSteps.length > 0 ? (
            <ol className="divide-y divide-border">{errorSteps.map(renderStep)}</ol>
          ) : (
            <p className="px-4 py-2 text-small text-muted-foreground">No step errors. Expand to see all {t.entries.length} steps.</p>
          )}
        </>
      )}
    </div>
  );
}
