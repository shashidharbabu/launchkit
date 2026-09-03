import * as React from 'react';
import { Button } from '../components/ui/button';
import { Input, Label } from '../components/ui/field';
import { StatusStamp } from '../components/ui/status-stamp';
import { Table, Th, Tr, Td } from '../components/ui/table';
import { DelayedSkeleton } from '../components/ui/skeleton';
import { HonestEmpty } from '../components/launchkit/stage-common';
import { ConnectionBanner } from '../components/launchkit/connection-banner';
import { api } from '../data/api';
import type { ProjectRow, ProjectDetail } from '../lib/types';
import { useNav } from '../nav';

type LaunchRow = { row: ProjectRow; detail: ProjectDetail | null };

export default function LaunchesPage() {
  const { go, href } = useNav();
  const [launches, setLaunches] = React.useState<LaunchRow[] | null>(null);
  const [apiError, setApiError] = React.useState<string | null>(null);
  const [filter, setFilter] = React.useState('');

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const rows = (await api.listProjects()) as ProjectRow[];
        const detailed = await Promise.all(
          rows.map(async (row) => ({
            row,
            detail: (await api.getProject(row.id).catch(() => null)) as ProjectDetail | null,
          })),
        );
        if (!cancelled) setLaunches(detailed);
      } catch (e) {
        if (!cancelled) {
          setApiError(String(e instanceof Error ? e.message : e));
          setLaunches([]);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const q = filter.trim().toLowerCase();
  const visible = (launches ?? []).filter(
    ({ row }) => !q || row.name.toLowerCase().includes(q) || row.site_url.toLowerCase().includes(q),
  );

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-display font-semibold tracking-[-0.01em]">Launches</h1>
        <a
          href={href({ view: 'new-launch' })}
          onClick={(e) => {
            e.preventDefault();
            go({ view: 'new-launch' });
          }}
        >
          <Button variant="primary">New launch</Button>
        </a>
      </div>

      <ConnectionBanner error={apiError} />

      {launches === null && <DelayedSkeleton className="h-64" />}

      {launches !== null && !apiError && launches.length === 0 && (
        <HonestEmpty
          fact="No launches yet."
          reason="A launch runs your shipped app through seven stages with your approval at every gate — start with your app's name, live site, and repo."
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

      {launches !== null && launches.length > 0 && (
        <>
          <div className="max-w-xs">
            <Label htmlFor="launch-filter">Filter</Label>
            <Input
              id="launch-filter"
              className="mt-1.5"
              placeholder="name or site"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
          </div>

          <div className="overflow-x-auto rounded-sm border border-border bg-card">
            <Table>
              <thead>
                <tr>
                  <Th>Launch</Th>
                  <Th>Site</Th>
                  <Th>Repo</Th>
                  <Th>Profile</Th>
                  <Th numeric>Assets</Th>
                  <Th numeric>Venues</Th>
                  <Th numeric>Signals</Th>
                </tr>
              </thead>
              <tbody>
                {visible.map(({ row, detail }) => (
                  <Tr key={row.id}>
                    <Td>
                      <a
                        href={href({ view: 'workspace', projectId: row.id, stage: 'profile' })}
                        onClick={(e) => {
                          e.preventDefault();
                          go({ view: 'workspace', projectId: row.id, stage: 'profile' });
                        }}
                        className="font-medium text-link hover:text-link-hover"
                      >
                        {row.name}
                      </a>
                    </Td>
                    <Td className="font-mono text-data text-muted-foreground">
                      {row.site_url.replace(/^https?:\/\//, '')}
                    </Td>
                    <Td className="font-mono text-data text-muted-foreground">
                      {row.repo_url ? row.repo_url.replace(/^https?:\/\/(github\.com\/)?/, '') : '—'}
                    </Td>
                    <Td>
                      {row.profile_status === 'approved' ? (
                        <StatusStamp kind="go" />
                      ) : row.profile_status ? (
                        <StatusStamp kind="hold" />
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </Td>
                    <Td numeric>{detail ? detail.counts.assets : '—'}</Td>
                    <Td numeric>
                      {detail ? `${detail.counts.targets_selected}/${detail.counts.targets}` : '—'}
                    </Td>
                    <Td numeric>{detail ? detail.counts.signals : '—'}</Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          </div>
          <p className="font-mono text-data text-muted-foreground">
            {visible.length} of {launches.length} launch{launches.length === 1 ? '' : 'es'}
            {q ? ` matching “${filter.trim()}”` : ''} · venues shown as selected/ranked
          </p>
        </>
      )}
    </div>
  );
}
