import * as React from 'react';
import { useReducedMotion } from 'motion/react';
import { AnimatedGroup } from '../components/motion-primitives/animated-group';
import { Button } from '../components/ui/button';
import { StatTile } from '../components/ui/stat-tile';
import { StatusStamp } from '../components/ui/status-stamp';
import { Table, Th, Tr, Td } from '../components/ui/table';
import { DelayedSkeleton } from '../components/ui/skeleton';
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
  const reduced = useReducedMotion();

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

  if (launches === null) {
    return (
      <div className="grid gap-4">
        <div className="grid gap-4 sm:grid-cols-3">
          <DelayedSkeleton className="h-28" />
          <DelayedSkeleton className="h-28" />
          <DelayedSkeleton className="h-28" />
        </div>
        <DelayedSkeleton className="h-64" />
      </div>
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
    <div className="grid gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-display font-semibold tracking-[-0.01em]">Dashboard</h1>
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

      {!apiError && launches.length === 0 && (
        <HonestEmpty
          fact="No launches yet."
          reason="A launch runs your shipped app through seven stages — profile, brand, commercial, assets, targets, signals, plan — with your approval at every gate."
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
          <AnimatedGroup
            preset={reduced ? undefined : 'fade'}
            className="grid gap-4 sm:grid-cols-3"
            variants={{ container: { visible: { transition: { staggerChildren: 0.06 } } } }}
          >
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
                  ? `via ${signupVenues} venue${signupVenues === 1 ? '' : 's'} · mock store`
                  : 'none yet · mock store'
              }
            />
          </AnimatedGroup>

          <div className="overflow-x-auto rounded-sm border border-border bg-card">
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
                        className="font-medium text-link hover:text-link-hover"
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
                        <span className="text-muted-foreground">—</span>
                      )}
                    </Td>
                    <Td numeric>
                      {detail
                        ? `${detail.counts.targets_selected}/${detail.counts.targets}`
                        : '—'}
                    </Td>
                    <Td numeric>{detail ? detail.counts.signals : '—'}</Td>
                    <Td numeric>{attribution ? attribution.total : '—'}</Td>
                    <Td>
                      {plan?.ready ? (
                        <StatusStamp kind="go" />
                      ) : (
                        <span className="font-mono text-data text-muted-foreground">not ready</span>
                      )}
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          </div>
          <p className="font-mono text-data text-muted-foreground">
            {launches.length} launch{launches.length === 1 ? '' : 'es'} · venues shown as
            selected/ranked · signups via mock store
          </p>
        </>
      )}
    </div>
  );
}
