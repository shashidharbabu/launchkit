import * as React from 'react';
import { toast } from 'sonner';
import { Bar, BarChart, Cell, LabelList, XAxis, YAxis, Tooltip as RechartsTooltip } from 'recharts';
import { useProject } from '../project-provider';
import { Card, CardHeader, CardBody, HonestEmpty, LockedGate, Orient, RawData } from '../stage-common';
import { Button } from '@launchkit/design-system/components/button';
import { CopyButton } from '@launchkit/design-system/components/copy-button';
import { ProvenanceLine } from '@launchkit/design-system/components/provenance-line';
import { RefChip } from '@launchkit/design-system/components/ref-chip';
import { Badge } from '@launchkit/design-system/components/status-stamp';
import { StatTile } from '@launchkit/design-system/components/stat-tile';
import { ChartContainer, ChartTooltipContent, type ChartConfig } from '@launchkit/design-system/components/chart';
import { Table, Th, Tr, Td } from '@launchkit/design-system/components/table';
import { api } from '../../../data/api';
import { useNav } from '../../../nav';

const chartConfig = {
  signups: { label: 'Signups', color: 'var(--chart-1)' },
} satisfies ChartConfig;

/**
 * Simulating a signup writes a fake event to the mock store. That is a
 * developer affordance for testing attribution, shipping it to builders would
 * let them fabricate their own launch numbers. Inlined at build time, so the
 * button is absent from the production bundle rather than merely hidden.
 */
// TODO(env): NEXT_PUBLIC_ENABLE_DEV_TOOLS had no shell-app equivalent, the
// dev-only simulate-signup affordance stays compiled out, matching the
// production default of the Next build.
const DEV_TOOLS = false;

export function PlanStage() {
  const { go, href } = useNav();
  const { project, gate1, plan, attribution, assets, refresh } = useProject();
  const [markdown, setMarkdown] = React.useState('');

  React.useEffect(() => {
    if (!project || !gate1) return;
    api
      .plan(project.id, 'markdown')
      .then((r) => setMarkdown((r as { markdown: string }).markdown))
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
              Your launch, in order, each venue with its own tracked link.{' '}
              <strong className="font-medium">Post each one yourself</strong>, then watch signups
              attribute back here.
            </>
          }
          detail="Nothing auto-publishes: Launch Kit hands you the plan; every post is yours to make."
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
        {plan?.ready ? (
          <>
            <Badge tone="go">Plan ready</Badge>
            <span className="text-small text-muted-foreground">
              {plan.targets.length} venue{plan.targets.length === 1 ? '' : 's'}
            </span>
          </>
        ) : (
          <Badge tone="neutral">Plan not ready</Badge>
        )}
      </div>

      {!plan?.ready &&
        (() => {
          const needsAssets = !assets.some((a) => a.status === 'approved');
          return (
            <HonestEmpty
              fact="Plan not ready."
              reason={
                needsAssets
                  ? 'The plan assembles your approved posts across your selected venues with sequencing advice. Approve at least one post first, then tick venues in Targets.'
                  : 'The plan assembles your approved posts across your selected venues with sequencing advice. Your posts are approved; now tick at least one venue in Targets.'
              }
              action={
                <a
                  href={href({ view: 'workspace', projectId: project.id, stage: needsAssets ? 'assets' : 'targets' })}
                  onClick={(e) => {
                    e.preventDefault();
                    go({ view: 'workspace', projectId: project.id, stage: needsAssets ? 'assets' : 'targets' });
                  }}
                >
                  <Button variant="secondary">{needsAssets ? 'Review posts' : 'Choose targets'}</Button>
                </a>
              }
            />
          );
        })()}

      {plan && plan.targets.length > 0 && (
        <Card>
          <CardHeader
            title="Tracked links"
            description="One per venue. Use each venue's link when you post there; the store records the ref code at signup, which is how attribution below fills in."
          />
          <CardBody className="overflow-x-auto pt-0">
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
                          size="sm"
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
          </CardBody>
        </Card>
      )}

      {/* telemetry after liftoff */}
      <div className="grid items-start gap-4 lg:grid-cols-3">
        <StatTile
          label="Total signups"
          value={total}
          attribution={
            total > 0
              ? `across ${attributedVenues} venue${attributedVenues === 1 ? '' : 's'}, via the mock store`
              : 'none attributed yet'
          }
        />
        <Card className="lg:col-span-2">
          <CardHeader
            title="Attribution"
            description="Which venue produced signups."
            actions={
              rows.length > 0 && total > 0 ? (
                <CopyButton
                  size="sm"
                  label="Copy as CSV"
                  toastMessage="Attribution copied as CSV"
                  text={[
                    'venue,ref,signups',
                    ...rows.map((r) => `${r.target ?? '(unknown ref)'},${r.ref},${r.signups}`),
                  ].join('\n')}
                />
              ) : undefined
            }
          />
          <CardBody>
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
          </CardBody>
        </Card>
      </div>

      {markdown && (
        <Card>
          <CardHeader
            title="The plan"
            description="Markdown export."
            actions={
              <CopyButton
                size="sm"
                text={markdown}
                label="Copy markdown"
                toastMessage="Launch plan copied as markdown"
              />
            }
          />
          <CardBody>
            <ProvenanceLine
              className="mt-0"
              parts={[
                'Assembled from approved posts and selected venues',
                plan ? `${plan.targets.length} venue${plan.targets.length === 1 ? '' : 's'}` : null,
                'Sequencing advice drafted, not verified',
              ]}
            />
            {/* the export is the deliverable; its source stays folded like raw data */}
            <div className="mt-3">
              <RawData data={markdown} label="Plan markdown" />
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
