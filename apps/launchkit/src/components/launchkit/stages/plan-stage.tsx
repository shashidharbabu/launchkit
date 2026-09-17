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
import { Download } from 'lucide-react';
import { Banner } from '@launchkit/design-system/components/banner';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from '@launchkit/design-system/components/dialog';
import { api } from '../../../data/api';
import { useNav } from '../../../nav';
import { actionError } from '../../../lib/errors';
import { billingIsLive, getTier, requestUpgrade, subscribeLocally, type Tier } from '../../../lib/subscription';
import type { Plan as FullPlan } from '../../../domain/plan';

const chartConfig = {
  signups: { label: 'Signups', color: 'var(--chart-1)' },
} satisfies ChartConfig;

/**
 * Simulating a signup writes a fake event to the mock store. That is a
 * developer affordance for testing attribution, handing it to builders would
 * let them fabricate their own launch numbers. Inlined at build time, so the
 * button is absent from the production bundle rather than merely hidden.
 */
// TODO(env): NEXT_PUBLIC_ENABLE_DEV_TOOLS had no shell-app equivalent, the
// dev-only simulate-signup affordance stays compiled out, matching the
// production default of the Next build.
const DEV_TOOLS = false;

/** Hand a built file to the browser's download flow under the given name. */
function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
  // the object URL outlives the click long enough for the browser to read it
  window.setTimeout(() => URL.revokeObjectURL(url), 30_000);
}

export function PlanStage() {
  const { go, href } = useNav();
  const { project, gate1, plan, attribution, assets, brandDna, studio, refresh } = useProject();
  const [markdown, setMarkdown] = React.useState('');
  // the subscription placeholder (lib/subscription.ts): the document is a Pro surface
  const [tier, setTier] = React.useState<Tier>(() => getTier());
  const [building, setBuilding] = React.useState(false);
  const [askDocument, setAskDocument] = React.useState(false);

  /** Build the PDF: the renderer loads on first use, so the main bundle stays as it was. */
  const buildDocument = React.useCallback(async () => {
    if (!project) return;
    setBuilding(true);
    try {
      const [doc, full] = await Promise.all([
        import('../../../lib/plan-document'),
        api.plan(project.id).then((r) => r as FullPlan),
      ]);
      const input = doc.collectPlanDocument({ project, plan: full, brandDna, studio });
      const blob = await doc.renderPlanPdf(input);
      saveBlob(blob, doc.planFileName(project.name));
      toast('Plan document downloaded');
    } catch (e) {
      toast.error(actionError('build the plan document', e));
    } finally {
      setBuilding(false);
    }
  }, [project, brandDna, studio]);

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
  // a ready plan can always be built; a Pro tier may build an unready one after confirming in the dialog
  const canBuild = Boolean(plan?.ready) || tier === 'pro';

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-4">
      {/* purpose before data: what happened, what to do */}
      <Orient
        lead={
          plan?.ready ? (
            <>
              Your launch, in order, each venue with its own tracked link.{' '}
              <strong className="font-medium">Post each one yourself</strong>, then watch signups
              attribute back here.
            </>
          ) : (
            <>
              The plan assembles your approved posts across the venues you chose, each with its own tracked link.{' '}
              <strong className="font-medium">Approve a post and tick a venue</strong>, and it assembles here.
            </>
          )
        }
        detail="Nothing auto-publishes: Launch Kit hands you the plan; every post is yours to make."
      />

      {/* ---- The document: the deliverable, as a PDF or as markdown ---- */}
      <Card>
        <CardHeader
          title="The document"
          description="The whole plan in one file: an A4 PDF in the Launch Kit template, or the same plan as markdown to paste anywhere. Download it once a post is approved and a venue is chosen; on Pro you can build an early draft that says where it is incomplete."
          actions={
            plan?.ready ? (
              <>
                <Badge tone="go">Plan ready</Badge>
                <span className="text-small text-muted-foreground">
                  {plan.targets.length} venue{plan.targets.length === 1 ? '' : 's'}
                </span>
              </>
            ) : (
              <Badge tone="neutral">Plan not ready</Badge>
            )
          }
        />
        <CardBody className="grid gap-4">
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

          <div className="flex flex-wrap items-center gap-3">
            {/* the document is the deliverable; the markdown copy stays beside it */}
            <Button
              variant={plan?.ready ? 'primary' : 'secondary'}
              disabled={!canBuild}
              loading={building}
              loadingLabel="Building the document"
              onClick={() => {
                if (plan?.ready && tier === 'pro') void buildDocument();
                else setAskDocument(true);
              }}
            >
              <Download aria-hidden />
              Download the plan (PDF)
            </Button>
            {!canBuild && (
              <span className="text-small text-muted-foreground">Approve a post and choose venues first</span>
            )}
            {markdown ? (
              <CopyButton
                variant="secondary"
                text={markdown}
                label="Copy launch plan"
                toastMessage="Launch plan copied as markdown"
              />
            ) : null}
          </div>

          {markdown && (
            <div>
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
            </div>
          )}
        </CardBody>
      </Card>

      {/* ---- Decisions: the choices the plan carries besides posts and venues ---- */}
      {plan && ((plan.angles ?? []).length > 0 || plan.pricing || plan.listing) && (
        <Card>
          <CardHeader title="Decisions" description="What this launch says: the angle, the pricing and the listing chosen on the Brand and Commercial stages; the document carries all three." />
          <CardBody>
            <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-3">
              <div>
                <dt className="text-label text-muted-foreground">Angle</dt>
                <dd className="mt-0.5 text-body">
                  {(plan.angles ?? []).length > 0
                    ? (plan.angles ?? []).map((c) => String(c.name ?? '')).join(' and ')
                    : 'None chosen, posts written from the profile alone'}
                </dd>
              </div>
              <div>
                <dt className="text-label text-muted-foreground">Pricing</dt>
                <dd className="mt-0.5 text-body">
                  {plan.pricing
                    ? (() => {
                        const tiers = plan.pricing.tiers.filter((t) => t.included).map((t) => `${t.name}${t.price_usd_month == null ? '' : ` $${t.price_usd_month}/mo`}`).join(', ');
                        const head = [plan.pricing.option, plan.pricing.billing].filter(Boolean).join(', ');
                        return head ? `${head}: ${tiers}` : tiers;
                      })()
                    : 'Not chosen yet'}
                </dd>
              </div>
              <div>
                <dt className="text-label text-muted-foreground">Listing</dt>
                <dd className="mt-0.5 text-body">{plan.listing ? String(plan.listing.title ?? 'approved') : 'Not approved yet'}</dd>
              </div>
            </dl>
          </CardBody>
        </Card>
      )}

      {plan && plan.targets.length > 0 && (
        <Card>
          <CardHeader
            title="Tracked links"
            description="One link per venue, carrying a ref code the store records at signup. Use each venue's link when you post there; that is how attribution fills in."
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
      <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-4 lg:grid-cols-3">
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
            description="Which venue produced signups, read from the ref codes on your tracked links. Nothing shows until the first signup arrives."
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
              <div className="grid grid-cols-[minmax(0,1fr)] gap-4">
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

      {/* the document behind the subscription placeholder; a Pro tier can also build an unready plan from here */}
      <Dialog open={askDocument} onOpenChange={setAskDocument}>
        <DialogContent>
          <DialogTitle>The plan as a document</DialogTitle>
          <DialogDescription>
            An A4 PDF in the Launch Kit template: the whole plan in one file to follow, print or hand to a
            co-founder. It holds:
          </DialogDescription>
          <ol className="mt-4 grid list-decimal gap-1 pl-5 text-body">
            <li>The app: one liner, description, who it is for</li>
            <li>Voice and angle: tone words, key messages, the chosen angle</li>
            <li>Pricing and listing: the tiers and the approved store copy</li>
            <li>Posts by platform, full text</li>
            <li>Where to launch: venues, rules, tracked links, the order</li>
            <li>Launch assets: the reel poster and the story card</li>
          </ol>
          {!plan?.ready && (
            <Banner tone="hold" title="Plan not ready." className="mt-4">
              No approved post or no venue chosen yet; sections 4 and 5 will say so. You can still build the
              document now.
            </Banner>
          )}
          {tier !== 'pro' && (
            <p className="mt-4 text-small text-muted-foreground">
              Downloading the document is part of Pro.{' '}
              {billingIsLive()
                ? 'Upgrading opens checkout in your RocketRide account; this app never handles your card.'
                : 'No shell connection, so the button below stands in for checkout and charges nothing.'}
            </p>
          )}
          <DialogFooter>
            <DialogClose render={<Button variant="secondary">Not now</Button>} />
            <Button
              variant="primary"
              onClick={() => {
                if (tier !== 'pro') {
                  // the shell owns checkout: hand off and let its status come back to us
                  if (billingIsLive()) {
                    requestUpgrade();
                    setAskDocument(false);
                    return;
                  }
                  subscribeLocally();
                  setTier('pro');
                }
                setAskDocument(false);
                void buildDocument();
              }}
            >
              {tier === 'pro' ? 'Build the document anyway' : billingIsLive() ? 'Upgrade to Pro' : 'Subscribe and download'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
