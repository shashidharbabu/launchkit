'use client';

import * as React from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Bar, BarChart, Cell, LabelList, XAxis, YAxis, Tooltip as RechartsTooltip } from 'recharts';
import { useProject } from '@/components/launchkit/project-provider';
import {
  Card,
  HonestEmpty,
  LockedGate,
  Orient,
  RawData,
} from '@/components/launchkit/stage-common';
import { Button } from '@/components/ui/button';
import { CopyButton } from '@/components/ui/copy-button';
import { ProvenanceLine } from '@/components/ui/provenance-line';
import { RefChip } from '@/components/ui/ref-chip';
import { StatTile } from '@/components/ui/stat-tile';
import { ChartContainer, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { Table, Th, Tr, Td } from '@/components/ui/table';
import { api } from '@/lib/api';

const chartConfig = {
  signups: { label: 'Signups', color: 'var(--chart-1)' },
} satisfies ChartConfig;

/**
 * Simulating a signup writes a fake event to the mock store. That is a
 * developer affordance for testing attribution — shipping it to builders would
 * let them fabricate their own launch numbers. Inlined at build time, so the
 * button is absent from the production bundle rather than merely hidden.
 */
const DEV_TOOLS = process.env.NEXT_PUBLIC_ENABLE_DEV_TOOLS === '1';

function MetaLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-mono text-meta font-medium uppercase tracking-[0.08em] text-muted-foreground">
      {children}
    </p>
  );
}

export function PlanStage() {
  const { project, gate1, plan, attribution, assets, refresh } = useProject();
  const [markdown, setMarkdown] = React.useState('');

  React.useEffect(() => {
    if (!project || !gate1) return;
    api
      .plan(project.id, 'markdown')
      .then((r: { markdown: string }) => setMarkdown(r.markdown))
      .catch(() => {});
  }, [project, gate1, plan]);

  if (!project) return null;
  if (!gate1) return <LockedGate />;

  const rows = (attribution?.by_target ?? [])
    .slice()
    .sort((a, b) => b.signups - a.signups);
  const chartRows = rows
    .filter((r) => r.signups > 0)
    .map((r) => ({ venue: r.target ?? r.ref, signups: r.signups }));
  const total = attribution?.total ?? 0;
  const attributedVenues = rows.filter((r) => r.signups > 0).length;

  return (
    <div className="grid gap-4">
      {/* purpose before data — what happened, what to do */}
      {plan?.ready && (
        <Orient
          lead={
            <>
              Your launch, in order — each venue with its own tracked link.{' '}
              <strong className="font-medium">Post each one yourself</strong>, then watch signups
              attribute back here.
            </>
          }
          detail="Nothing auto-publishes — Launch Kit hands you the plan; every post is yours to make."
        />
      )}

      <div className="flex flex-wrap items-center gap-3">
        {markdown && plan?.ready ? (
          <CopyButton
            variant="primary"
            text={markdown}
            label="Copy launch plan"
            toastMessage="Launch plan copied as markdown"
          />
        ) : null}
        <span className="font-mono text-data text-muted-foreground">
          {plan?.ready
            ? `plan ready · ${plan.targets.length} venue${plan.targets.length === 1 ? '' : 's'}`
            : 'plan not ready'}
        </span>
      </div>

      {!plan?.ready &&
        (() => {
          const needsAssets = !assets.some((a) => a.status === 'approved');
          return (
            <HonestEmpty
              fact="Plan not ready."
              reason={
                needsAssets
                  ? 'The plan assembles your approved assets across your selected venues with sequencing advice — approve at least one asset first, then tick venues in Targets.'
                  : 'The plan assembles your approved assets across your selected venues with sequencing advice — your assets are approved; now tick at least one venue in Targets.'
              }
              action={
                <Link href={`/p/${project.id}/${needsAssets ? 'assets' : 'targets'}`}>
                  <Button variant="secondary">{needsAssets ? 'Review assets' : 'Choose targets'}</Button>
                </Link>
              }
            />
          );
        })()}

      {plan && plan.targets.length > 0 && (
        <Card>
          <div className="flex items-center justify-between gap-3 px-4 py-3">
            <MetaLabel>Tracked links — one per venue</MetaLabel>
          </div>
          <div className="border-t border-border px-4 py-1">
            <p className="py-2 text-body text-muted-foreground">
              Use each venue&rsquo;s link when you post there. The store records the ref code at
              signup — that&rsquo;s how attribution below fills in.
            </p>
            <Table>
              <thead>
                <tr>
                  <Th>Venue</Th>
                  <Th>Kind</Th>
                  <Th>Tracked link</Th>
                  {DEV_TOOLS && (
                    <Th>
                      <span className="sr-only">Actions</span>
                    </Th>
                  )}
                </tr>
              </thead>
              <tbody>
                {plan.targets.map((t) => (
                  <Tr key={t.ref}>
                    <Td className="font-medium">{t.name}</Td>
                    <Td className="text-muted-foreground">{t.kind}</Td>
                    <Td>
                      <RefChip refCode={t.ref} url={t.ref_url} />
                    </Td>
                    {DEV_TOOLS && (
                      <Td>
                        <Button
                          variant="ghost"
                          size="compact"
                          title="Dev only: posts a signup event to the mock store"
                          onClick={async () => {
                            await api.simulateSignup(project.id, t.ref);
                            toast('Signup recorded (dev)');
                            refresh();
                          }}
                        >
                          Simulate signup (dev)
                        </Button>
                      </Td>
                    )}
                  </Tr>
                ))}
              </tbody>
            </Table>
          </div>
        </Card>
      )}

      {/* telemetry after liftoff */}
      <div className="grid items-start gap-4 lg:grid-cols-3">
        <StatTile
          label="Total signups"
          value={total}
          attribution={
            total > 0
              ? `via ${attributedVenues} venue${attributedVenues === 1 ? '' : 's'} · mock store`
              : 'none attributed yet · mock store'
          }
        />
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between gap-3 px-4 py-3">
            <MetaLabel>Attribution — which venue produced signups</MetaLabel>
            {rows.length > 0 && total > 0 && (
              <CopyButton
                size="compact"
                label="Copy as CSV"
                toastMessage="Attribution copied as CSV"
                text={[
                  'venue,ref,signups',
                  ...rows.map((r) => `${r.target ?? '(unknown ref)'},${r.ref},${r.signups}`),
                ].join('\n')}
              />
            )}
          </div>
          <div className="border-t border-border px-4 py-4">
            {rows.length === 0 || total === 0 ? (
              <HonestEmpty
                fact="No signups attributed yet."
                reason="Post with your tracked links and signups will appear here with their venue."
                action={
                  markdown ? (
                    <CopyButton variant="secondary" text={markdown} label="Copy launch plan" />
                  ) : undefined
                }
              />
            ) : (
              <div className="grid gap-4">
                {chartRows.length > 0 && chartRows.length <= 15 && (
                  <ChartContainer
                    config={chartConfig}
                    className="h-[max(6rem,calc(2.25rem*var(--bars)))]"
                    style={{ '--bars': chartRows.length } as React.CSSProperties}
                  >
                    <BarChart
                      data={chartRows}
                      layout="vertical"
                      margin={{ top: 0, right: 32, bottom: 0, left: 8 }}
                    >
                      <XAxis type="number" hide />
                      <YAxis
                        type="category"
                        dataKey="venue"
                        width={140}
                        tickLine={false}
                        axisLine={false}
                        tick={{
                          fill: 'var(--muted-foreground)',
                          fontSize: 13,
                          fontFamily: 'var(--font-mono)',
                        }}
                      />
                      <RechartsTooltip
                        cursor={{ fill: 'var(--muted)' }}
                        content={<ChartTooltipContent config={chartConfig} />}
                      />
                      <Bar
                        dataKey="signups"
                        fill="var(--color-signups)"
                        barSize={16}
                        radius={[0, 4, 4, 0]}
                        isAnimationActive={false}
                      >
                        <LabelList
                          dataKey="signups"
                          position="right"
                          className="font-mono"
                          style={{ fill: 'var(--foreground)', fontSize: 13 }}
                        />
                        {chartRows.map((r) => (
                          <Cell key={r.venue} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ChartContainer>
                )}
                {/* the table is the source of truth; the chart is the glance */}
                <Table>
                  <thead>
                    <tr>
                      <Th>Venue</Th>
                      <Th>Ref</Th>
                      <Th numeric>Signups</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => (
                      <Tr key={r.ref}>
                        <Td className="font-medium">{r.target ?? '(unknown ref)'}</Td>
                        <Td className="font-mono text-data text-muted-foreground">{r.ref}</Td>
                        <Td numeric>{r.signups}</Td>
                      </Tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            )}
          </div>
        </Card>
      </div>

      {markdown && (
        <Card>
          <div className="flex items-center justify-between gap-3 px-4 py-3">
            <MetaLabel>The plan — markdown export</MetaLabel>
            <CopyButton
              size="compact"
              text={markdown}
              label="Copy markdown"
              toastMessage="Launch plan copied as markdown"
            />
          </div>
          <div className="border-t border-border px-4 py-3">
            <ProvenanceLine
              className="mt-0"
              parts={[
                'assembled from approved assets + selected venues',
                plan ? `${plan.targets.length} venue${plan.targets.length === 1 ? '' : 's'}` : null,
                'sequencing advice drafted — not verified',
              ]}
            />
            {/* the export is the deliverable; its source stays folded like raw data */}
            <div className="mt-3">
              <RawData data={markdown} label="Plan markdown" />
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
