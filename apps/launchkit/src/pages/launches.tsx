import * as React from 'react';
import { Button } from '@launchkit/design-system/components/button';
import { Field, Input } from '@launchkit/design-system/components/field';
import { StatusStamp } from '@launchkit/design-system/components/status-stamp';
import { Table, TableFrame, TableCaption, Th, Tr, Td } from '@launchkit/design-system/components/table';
import { PageContainer } from '@launchkit/design-system/components/page-container';
import { PageHeader } from '@launchkit/design-system/components/page-header';
import { DelayedSkeleton } from '@launchkit/design-system/components/skeleton';
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
    <PageContainer className="grid gap-8">
      <PageHeader
        title="Launches"
        description="Every app you are taking to market, and how far each one has come."
        actions={
          <a
            href={href({ view: 'new-launch' })}
            onClick={(e) => {
              e.preventDefault();
              go({ view: 'new-launch' });
            }}
          >
            <Button variant="primary">New launch</Button>
          </a>
        }
      />
      <ConnectionBanner error={apiError} />

      {launches === null && <DelayedSkeleton className="h-64" />}

      {launches !== null && !apiError && launches.length === 0 && (
        <HonestEmpty
          align="center"
          fact="No launches yet."
          reason="A launch runs your app through seven stages with your approval at every gate. Start with your app's name, live site, and repo."
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
          <div className="grid gap-3">
          <Field label="Filter" htmlFor="launch-filter" className="max-w-xs">
            <Input
              id="launch-filter"
              placeholder="name or site"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
          </Field>
          <TableFrame>
            <Table>
              <thead>
                <tr>
                  <Th>Launch</Th>
                  <Th>Site</Th>
                  <Th>Repo</Th>
                  <Th>Profile</Th>
                  <Th numeric>Posts</Th>
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
                        className="font-medium hover:text-link-hover"
                      >
                        {row.name}
                      </a>
                    </Td>
                    <Td className="font-mono text-data text-muted-foreground">
                      {row.site_url.replace(/^https?:\/\//, '')}
                    </Td>
                    <Td className="font-mono text-data text-muted-foreground">
                      {row.repo_url ? row.repo_url.replace(/^https?:\/\/(github\.com\/)?/, '') : ''}
                    </Td>
                    <Td>
                      {row.profile_status === 'approved' ? (
                        <StatusStamp kind="go" />
                      ) : row.profile_status ? (
                        <StatusStamp kind="hold" />
                      ) : (
                        <StatusStamp kind="none" />
                      )}
                    </Td>
                    <Td numeric>{detail ? detail.counts.assets : ''}</Td>
                    <Td numeric>
                      {detail ? `${detail.counts.targets_selected} of ${detail.counts.targets}` : ''}
                    </Td>
                    <Td numeric>{detail ? detail.counts.signals : ''}</Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          </TableFrame>
          <TableCaption>
            {visible.length} of {launches.length} launch{launches.length === 1 ? '' : 'es'}
            {q ? ` matching “${filter.trim()}”` : ''}. Venues are shown as selected of ranked.
          </TableCaption>
          </div>
        </>
      )}
    </PageContainer>
  );
}
