import * as React from 'react';
import {
  createColumnHelper,
  createSortedRowModel,
  rowSortingFeature,
  sortFn_alphanumeric,
  sortFn_basic,
  tableFeatures,
  useTable,
  type ColumnDef,
} from '@tanstack/react-table';
import { ChevronDown, ChevronRight, ChevronUp, ExternalLink } from 'lucide-react';
import { useProject } from '../project-provider';
import { HonestEmpty, LockedGate, Orient } from '../stage-common';
import { Button } from '@launchkit/design-system/components/button';
import { ProvenanceLine } from '@launchkit/design-system/components/provenance-line';
import { Table, TableFrame, Th, Tr, Td } from '@launchkit/design-system/components/table';
import { api } from '../../../data/api';
import { actionError } from '../../../lib/errors';
import { cn } from '@launchkit/design-system/lib/cn';

type Row = {
  id: string;
  rank: number;
  selected: boolean;
  name: string;
  kind: string;
  url: string;
  why_fit: string;
  rules_summary: string;
  rules_url: string;
  expected_impact: string;
  effort: string;
  audience_signal: string;
};

const IMPACT_PCT: Record<string, number> = { high: 100, medium: 66, med: 66, low: 33 };

const features = tableFeatures({
  rowSortingFeature,
  sortedRowModel: createSortedRowModel(),
  sortFns: { alphanumeric: sortFn_alphanumeric, basic: sortFn_basic },
});
const col = createColumnHelper<typeof features, Row>();

const columns = [
  col.accessor('rank', { id: 'rank', sortFn: 'basic' }),
  col.accessor('name', { id: 'name', sortFn: 'alphanumeric' }),
  col.accessor('kind', { id: 'kind', sortFn: 'alphanumeric' }),
  col.accessor('expected_impact', { id: 'expected_impact', sortFn: 'alphanumeric' }),
  col.accessor('effort', { id: 'effort', sortFn: 'alphanumeric' }),
] as unknown as ColumnDef<typeof features, Row, unknown>[];

const PAGE = 50;

export function TargetsStage() {
  const { project, gate1, targets, running, runJob, refresh, setError } = useProject();
  const [expanded, setExpanded] = React.useState<Set<string>>(new Set());
  const [page, setPage] = React.useState(0);

  const data = React.useMemo<Row[]>(
    () =>
      targets.map((t) => ({
        id: t.id,
        rank: t.rank,
        selected: t.selected,
        name: String(t.data.name ?? '-'),
        kind: String(t.data.kind ?? '-'),
        url: String(t.data.submission_url || t.data.url || ''),
        why_fit: String(t.data.why_fit ?? ''),
        rules_summary: String(t.data.rules_summary ?? ''),
        rules_url: String(t.data.rules_url ?? ''),
        expected_impact: String(t.data.expected_impact ?? ''),
        effort: String(t.data.effort ?? ''),
        audience_signal: String(t.data.audience_signal ?? ''),
      })),
    [targets],
  );

  const table = useTable({
    features,
    columns,
    data,
    initialState: { sorting: [{ id: 'rank', desc: false }] },
  });

  if (!project) return null;
  if (!gate1) return <LockedGate />;

  const selectedCount = targets.filter((t) => t.selected).length;
  const rows = table.getRowModel().rows;
  const paged = rows.length > PAGE ? rows.slice(page * PAGE, (page + 1) * PAGE) : rows;

  const toggle = async (id: string, next: boolean) => {
    try {
      await api.selectTarget(id, next);
      await refresh();
    } catch (e) {
      setError(actionError(next ? 'add this venue to your plan' : 'remove this venue from your plan', e));
    }
  };

  const sortHeader = (id: string, label: string, numeric = false) => {
    const column = table.getColumn(id);
    const dir = column?.getIsSorted?.();
    return (
      <Th
        numeric={numeric}
        aria-sort={dir === 'asc' ? 'ascending' : dir === 'desc' ? 'descending' : 'none'}
      >
        <button
          type="button"
          onClick={() => column?.toggleSorting?.()}
          className="inline-flex items-center gap-1"
        >
          {label}
          {dir === 'asc' ? (
            <ChevronUp size={12} strokeWidth={1.5} />
          ) : dir === 'desc' ? (
            <ChevronDown size={12} strokeWidth={1.5} />
          ) : (
            <ChevronDown size={12} strokeWidth={1.5} className="opacity-30" />
          )}
        </button>
      </Th>
    );
  };

  return (
    <div className="grid gap-4">
      {/* purpose before data — what happened, what to do */}
      {targets.length > 0 && (
        <Orient
          runKind="targets"
          lead={
            <>
              Launch Kit ranked where this app should launch.{' '}
              <strong className="font-medium">Tick the venues you&rsquo;ll actually do</strong>:{' '}
              five right venues beat fifty.
            </>
          }
          detail="Gate 3: only the venues you select get tracked links in the launch plan."
        />
      )}

      {targets.length > 0 && (
        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="secondary"
            disabled={Boolean(running)}
            loading={running?.kind === 'targets'}
            loadingLabel="Ranking venues"
            onClick={() => runJob('targets', () => api.runStage(project.id, 'targets'))}
          >
            Re-rank venues
          </Button>
          <span className="text-small text-muted-foreground">
            {selectedCount} selected of {targets.length} ranked
          </span>
        </div>
      )}

      {targets.length === 0 && (
        <HonestEmpty
          fact="No venues ranked yet."
          reason="Launch Kit ranks the venues where your app should launch, niche subreddits, directories, communities, with the rules of each, from your approved profile."
          action={
            <Button
              variant="secondary"
              disabled={Boolean(running)}
              loading={running?.kind === 'targets'}
              loadingLabel="Ranking venues"
              onClick={() => runJob('targets', () => api.runStage(project.id, 'targets'))}
            >
              Find launch venues
            </Button>
          }
        />
      )}

      {targets.length > 0 && (
        <TableFrame>
          <Table>
            <thead>
              <tr>
                <Th className="w-10">
                  <span className="sr-only">Select</span>
                </Th>
                {sortHeader('rank', 'Rank', true)}
                {sortHeader('name', 'Venue')}
                {sortHeader('kind', 'Kind')}
                {sortHeader('expected_impact', 'Impact')}
                {sortHeader('effort', 'Effort')}
                <Th>Link</Th>
                <Th className="w-10">
                  <span className="sr-only">Details</span>
                </Th>
              </tr>
            </thead>
            <tbody>
              {paged.map((r) => {
                const t = r.original;
                const open = expanded.has(t.id);
                const pct = IMPACT_PCT[t.expected_impact.toLowerCase()] ?? 33;
                return (
                  <React.Fragment key={t.id}>
                    <Tr selected={t.selected}>
                      <Td>
                        <input
                          type="checkbox"
                          aria-label={`Select ${t.name} for the plan`}
                          checked={t.selected}
                          onChange={(e) => toggle(t.id, e.target.checked)}
                          className="size-4 accent-flare"
                        />
                      </Td>
                      <Td numeric>{t.rank}</Td>
                      <Td className="font-medium">{t.name}</Td>
                      <Td className="text-muted-foreground">{t.kind}</Td>
                      <Td>
                        <span className="flex items-center gap-2">
                          <span className="h-1 w-16 overflow-hidden rounded-full bg-sunken" aria-hidden>
                            <span
                              className="block h-full rounded-full bg-chart-2"
                              style={{ width: `${pct}%` }}
                            />
                          </span>
                          <span className="text-small text-muted-foreground">{t.expected_impact}</span>
                        </span>
                      </Td>
                      <Td className="text-muted-foreground">{t.effort}</Td>
                      <Td>
                        {t.url && (
                          <a
                            href={t.url}
                            target="_blank"
                            rel="noreferrer"
                            aria-label={`Open ${t.name}`}
                            className="inline-flex items-center gap-1 font-mono text-data text-link hover:text-link-hover"
                          >
                            Open <ExternalLink size={12} strokeWidth={1.75} aria-hidden />
                          </a>
                        )}
                      </Td>
                      <Td>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={open ? `Hide details for ${t.name}` : `Show details for ${t.name}`}
                          aria-expanded={open}
                          onClick={() =>
                            setExpanded((s) => {
                              const n = new Set(s);
                              if (n.has(t.id)) n.delete(t.id);
                              else n.add(t.id);
                              return n;
                            })
                          }
                          className="-my-1 text-muted-foreground"
                        >
                          {open ? <ChevronDown aria-hidden /> : <ChevronRight aria-hidden />}
                        </Button>
                      </Td>
                    </Tr>
                    {open && (
                      <tr className={cn('border-b border-border bg-sunken/40', t.selected && 'bg-flare-soft/40')}>
                        <td colSpan={8} className="px-5 pb-4 pt-2">
                          <div className="grid gap-2 pl-7 lg:grid-cols-3">
                            <div>
                              <p className="text-label text-muted-foreground">Why it fits</p>
                              <p className="mt-1 text-body">{t.why_fit}</p>
                            </div>
                            <div>
                              <p className="text-label text-muted-foreground">Rules</p>
                              <p className="mt-1 text-body">{t.rules_summary}</p>
                              {(() => {
                                // machines get blocked from rules pages; humans don't.
                                // an unverified summary becomes a one-click manual check.
                                const unverified =
                                  !t.rules_summary || /not verified/i.test(t.rules_summary);
                                const m = t.url.match(/reddit\.com\/(r\/[^/?#]+)/i);
                                const href =
                                  t.rules_url ||
                                  (m ? `https://www.reddit.com/${m[1]}/about/rules` : '');
                                if (!unverified || !href) return null;
                                return (
                                  <a
                                    href={href}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="mt-1 inline-flex items-center gap-1 text-body text-link hover:text-link-hover"
                                  >
                                    Read the rules yourself
                                    <ExternalLink size={12} strokeWidth={1.5} aria-hidden />
                                  </a>
                                );
                              })()}
                            </div>
                            <div>
                              <p className="text-label text-muted-foreground">Audience signal</p>
                              <p className="mt-1 text-body">{t.audience_signal}</p>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </Table>
          {rows.length > PAGE && (
            <div className="flex items-center justify-between border-t border-border px-5 py-2.5">
              <span className="text-small text-muted-foreground">
                Venues {page * PAGE + 1} to {Math.min((page + 1) * PAGE, rows.length)} of {rows.length}
              </span>
              <span className="flex gap-2">
                <Button variant="ghost" size="sm" disabled={page === 0} onClick={() => setPage(page - 1)}>
                  Previous
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={(page + 1) * PAGE >= rows.length}
                  onClick={() => setPage(page + 1)}
                >
                  Next
                </Button>
              </span>
            </div>
          )}
        </TableFrame>
      )}

      {targets.length > 0 && (
        <ProvenanceLine
          className="mt-0"
          parts={['Ranked from the approved profile', 'Venue rules summarised; verify before posting']}
        />
      )}
    </div>
  );
}
