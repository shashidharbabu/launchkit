import * as React from 'react';
import { Button } from '@launchkit/design-system/components/button';
import { StatTile, StatRow } from '@launchkit/design-system/components/stat-tile';
import { Badge } from '@launchkit/design-system/components/status-stamp';
import { PageContainer } from '@launchkit/design-system/components/page-container';
import { PageHeader } from '@launchkit/design-system/components/page-header';
import { StatusStamp } from '@launchkit/design-system/components/status-stamp';
import { Table, TableFrame, TableCaption, Th, Tr, Td } from '@launchkit/design-system/components/table';
import { DelayedSkeleton } from '@launchkit/design-system/components/skeleton';
import { HonestEmpty } from '../components/launchkit/stage-common';
import { ConnectionBanner } from '../components/launchkit/connection-banner';
import { api } from '../data/api';
import type { ProjectRow, ProjectDetail, PlanData, AttributionData } from '../lib/types';
import { useNav } from '../nav';

type LaunchSummary = {
  row: ProjectRow;
  detail: ProjectDetail | null;
  plan: PlanData | null;
  attribution: AttributionData | null;
};

export default function DashboardPage() {
  const { go, href } = useNav();
  const [launches, setLaunches] = React.useState<LaunchSummary[] | null>(null);
  const [apiError, setApiError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const rows = (await api.listProjects()) as ProjectRow[];
        const detailed = await Promise.all(
          rows.map(async (row) => ({
            row,
            detail: (await api.getProject(row.id).catch(() => null)) as ProjectDetail | null,
            plan: (await api.plan(row.id).catch(() => null)) as PlanData | null,
            attribution: (await api.attribution(row.id).catch(() => null)) as AttributionData | null,
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

  const newLaunch = (
    <a
      href={href({ view: 'new-launch' })}
      onClick={(e) => {
        e.preventDefault();
        go({ view: 'new-launch' });
      }}
    >
      <Button variant="primary">New launch</Button>
    </a>
  );
  const header = (
    <PageHeader
      title="Dashboard"
      description="Every launch at a glance: profiles approved, plans ready, and signups attributed to their venues."
      actions={newLaunch}
    />
  );
  if (launches === null) {
    return (
      <PageContainer className="grid gap-8">
        {header}
        <div className="grid gap-4">
          <DelayedSkeleton className="h-28" />
          <DelayedSkeleton className="h-64" />
        </div>
      </PageContainer>
    );
  }

  const approved = launches.filter((l) => l.row.profile_status === 'approved').length;
  const plansReady = launches.filter((l) => l.plan?.ready).length;
  const signups = launches.reduce((s, l) => s + (l.attribution?.total ?? 0), 0);
  const signupVenues = launches.reduce(
    (s, l) => s + (l.attribution?.by_target.filter((t) => t.signups > 0).length ?? 0),
    0,
  );

  return (
    <PageContainer className="grid gap-8">
      {header}
      <ConnectionBanner error={apiError} />

      {!apiError && launches.length === 0 && (
        <HonestEmpty
          align="center"
          fact="No launches yet."
          reason="A launch runs your app through seven stages (profile, brand, commercial, posts, targets, signals, plan) with your approval at every gate. Start with your app's name, live site, and repo."
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

      {launches.length > 0 && (
        <>
          <StatRow columns={3}>
            <StatTile
              countUp
              label="Launches"
              value={launches.length}
              attribution={`${approved} with approved profiles`}
            />
            <StatTile
              countUp
              countUpDelay={120}
              label="Plans ready"
              value={plansReady}
              attribution={`of ${launches.length} launch${launches.length === 1 ? '' : 'es'}`}
            />
            <StatTile
              countUp
              countUpDelay={240}
              label="Signups attributed"
              value={signups}
              attribution={
                signups > 0
                  ? `across ${signupVenues} venue${signupVenues === 1 ? '' : 's'}, via the mock store`
                  : 'none through tracked links yet'
              }
            />
          </StatRow>
          <div className="grid gap-3">
          <TableFrame>
            <Table>
              <thead>
                <tr>
                  <Th>Launch</Th>
                  <Th>Site</Th>
                  <Th>Profile</Th>
                  <Th numeric>Venues</Th>
                  <Th numeric>Signals</Th>
                  <Th numeric>Signups</Th>
                  <Th>Plan</Th>
                </tr>
              </thead>
              <tbody>
                {launches.map(({ row, detail, plan, attribution }) => (
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
                    <Td>
                      {row.profile_status === 'approved' ? (
                        <StatusStamp kind="go" />
                      ) : row.profile_status ? (
                        <StatusStamp kind="hold" />
                      ) : (
                        <StatusStamp kind="none" />
                      )}
                    </Td>
                    <Td numeric>
                      {detail ? `${detail.counts.targets_selected} of ${detail.counts.targets}` : ''}
                    </Td>
                    <Td numeric>{detail ? detail.counts.signals : ''}</Td>
                    <Td numeric>{attribution ? attribution.total : ''}</Td>
                    <Td>
                      {plan?.ready ? <StatusStamp kind="go" label="Ready" /> : <Badge tone="neutral">Not ready</Badge>}
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          </TableFrame>
          <TableCaption>
            {launches.length} launch{launches.length === 1 ? '' : 'es'}. Venues are shown as selected of ranked; signups come through the mock store.
          </TableCaption>
          </div>
        </>
      )}
    </PageContainer>
  );
}
