import * as React from 'react';
import { toast } from 'sonner';
import { ArrowRight, Check, ChevronRight, ExternalLink } from 'lucide-react';
import { useProject } from '../project-provider';
import { Card, CardHeader, CardBody, HonestEmpty, LockedGate, Orient, RawData, Well } from '../stage-common';
import { Button } from '@launchkit/design-system/components/button';
import { Banner } from '@launchkit/design-system/components/banner';
import { CopyButton } from '@launchkit/design-system/components/copy-button';
import { Disclosure } from '@launchkit/design-system/components/disclosure';
import { StatusStamp, Badge } from '@launchkit/design-system/components/status-stamp';
import { ProvenanceLine } from '@launchkit/design-system/components/provenance-line';
import { Table, TableFrame, Th, Tr, Td } from '@launchkit/design-system/components/table';
import { cn } from '@launchkit/design-system/lib/cn';
import { api } from '../../../data/api';
import { ASSET_LABELS } from '../../../lib/asset-types';
import { actionError } from '../../../lib/errors';
import { useNav } from '../../../nav';

const asStr = (v: unknown) => (v == null ? '' : String(v));
const asArr = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);
const asObj = (v: unknown): Record<string, unknown> =>
  v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {};

function MetaLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-label text-muted-foreground">{children}</p>;
}

function Chips({ items }: { items: unknown[] }) {
  if (items.length === 0) return null;
  return (
    <p className="mt-1 flex min-w-0 flex-wrap gap-1.5">
      {items.map((k, i) => (
        <Badge key={i} tone="neutral" className="h-auto max-w-full whitespace-normal break-words text-left">
          {String(k)}
        </Badge>
      ))}
    </p>
  );
}

/** Observed brand colors as swatches. Values come straight from the scraped
 * site's CSS, never invented, so an empty set is honest, not a bug. */
function Swatches({ colors }: { colors: unknown[] }) {
  if (colors.length === 0) return null;
  return (
    <div className="mt-1 flex flex-wrap gap-2">
      {colors.map((c, i) => {
        const col = asObj(c);
        const value = asStr(col.value);
        return (
          <div key={i} className="flex items-center gap-1.5" title={asStr(col.evidence)}>
            <span aria-hidden className="size-5 rounded-full border border-border" style={{ background: value }} />
            <span className="font-mono text-data">{value}</span>
            {asStr(col.role) && <span className="text-label text-muted-foreground">{asStr(col.role)}</span>}
          </div>
        );
      })}
    </div>
  );
}

type Campaign = {
  name?: string;
  objective?: string;
  big_idea?: string;
  channels?: unknown[];
  asset_types?: unknown[];
  hook?: string;
  sample_copy?: { headline?: string; body?: string; cta?: string };
  assets_needed?: unknown[];
  effort?: string;
  success_metric?: string;
  why_on_brand?: string;
};

const GOALS = ['awareness', 'signups', 'community', 'retention'];

/** "signups: one sentence" (any separator) splits into the goal word and the sentence. */
function splitObjective(objective: string): { goal: string; rest: string } {
  const m = objective.trim().match(/^(awareness|signups|community|retention)\b[\s:,.|–—-]*/i);
  if (!m) return { goal: '', rest: objective.trim() };
  return { goal: m[1].toLowerCase(), rest: objective.trim().slice(m[0].length) };
}

/** The platforms an angle needs, in the names Social Launch uses. */
function platformNames(assetTypes: unknown[]): string[] {
  return assetTypes.map(asStr).map((t) => ASSET_LABELS[t] ?? (t === 'video_script' ? 'Short video (Assets)' : t)).filter(Boolean);
}

/** The DNA, read top to bottom: who they are, how they sound, what they say, how they look. */
function DnaView({ dna, fallbackName }: { dna: Record<string, unknown>; fallbackName: string }) {
  const voice = asObj(dna.voice);
  const messaging = asObj(dna.messaging);
  const visual = asObj(dna.visual);
  const dosDonts = asObj(dna.dos_and_donts);
  const confidence = asObj(dna.confidence);
  const typography = asObj(visual.typography);
  return (
    <div className="grid gap-5">
      <div>
        <p className="text-heading">{asStr(dna.brand_name) || fallbackName}</p>
        {asStr(dna.tagline_observed) && (
          <p className="mt-1 text-read italic text-muted-foreground">“{asStr(dna.tagline_observed)}”</p>
        )}
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="grid content-start gap-4">
          {asArr(voice.tone_words).length > 0 && (
            <div>
              <MetaLabel>How the brand sounds</MetaLabel>
              <Chips items={asArr(voice.tone_words)} />
              {asStr(voice.sentence_style) && <p className="mt-2 text-read">{asStr(voice.sentence_style)}</p>}
            </div>
          )}
          {asArr(voice.vocabulary).length > 0 && (
            <div>
              <MetaLabel>Words the brand uses</MetaLabel>
              <Chips items={asArr(voice.vocabulary)} />
            </div>
          )}
          {asArr(messaging.key_messages).length > 0 && (
            <div>
              <MetaLabel>What it keeps saying</MetaLabel>
              <ul className="mt-1 grid list-disc gap-1 pl-5">
                {asArr(messaging.key_messages).map((m, i) => (
                  <li key={i} className="text-read">{String(m)}</li>
                ))}
              </ul>
            </div>
          )}
          {asArr(messaging.proof_points_observed).length > 0 && (
            <div>
              <MetaLabel>Proof the site itself shows</MetaLabel>
              <ul className="mt-1 grid list-disc gap-1 pl-5">
                {asArr(messaging.proof_points_observed).map((m, i) => (
                  <li key={i} className="text-read">{String(m)}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
        <div className="grid content-start gap-4">
          <div>
            <MetaLabel>Observed colors</MetaLabel>
            {asArr(visual.colors).length > 0 ? (
              <Swatches colors={asArr(visual.colors)} />
            ) : (
              <p className="mt-1 text-body text-muted-foreground">None observable in the scraped pages, see the confidence note.</p>
            )}
          </div>
          {(asStr(typography.headings) || asStr(typography.body)) && (
            <div>
              <MetaLabel>Typography</MetaLabel>
              <p className="mt-1 text-read">
                {[asStr(typography.headings) && `Headings: ${asStr(typography.headings)}`, asStr(typography.body) && `Body: ${asStr(typography.body)}`]
                  .filter(Boolean)
                  .join(', ')}
              </p>
            </div>
          )}
          {(asArr(dosDonts.do).length > 0 || asArr(dosDonts.dont).length > 0) && (
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <MetaLabel>Do</MetaLabel>
                <ul className="mt-1 grid list-disc gap-1 pl-5">
                  {asArr(dosDonts.do).map((d, i) => <li key={i} className="text-body">{String(d)}</li>)}
                </ul>
              </div>
              <div>
                <MetaLabel>Don’t</MetaLabel>
                <ul className="mt-1 grid list-disc gap-1 pl-5">
                  {asArr(dosDonts.dont).map((d, i) => <li key={i} className="text-body">{String(d)}</li>)}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
      {asArr(dna.sources_read).length > 0 && (
        <div>
          <MetaLabel>Sources read, {asArr(dna.sources_read).length}</MetaLabel>
          <ul className="mt-1 grid gap-0.5">
            {asArr(dna.sources_read).map((u, i) => (
              <li key={i}>
                <a href={String(u)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 break-all font-mono text-data text-link hover:text-link-hover">
                  {String(u)} <ExternalLink size={12} strokeWidth={1.75} aria-hidden />
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
      <ProvenanceLine parts={['Extracted from the live site only; nothing invented', asStr(confidence.notes) || undefined].filter(Boolean) as string[]} />
      <RawData data={dna} />
    </div>
  );
}

/**
 * One angle, laid out as a decision: the story, where it plays, what it takes,
 * how you would know it worked. The sample copy is folded away and labelled an
 * illustration, because it kept being read as the post.
 */
function AngleCard({ c, chosen, busy, disabled, onToggle }: {
  c: Campaign; chosen: boolean; busy: boolean; disabled: boolean; onToggle: () => void;
}) {
  const [showCopy, setShowCopy] = React.useState(false);
  const { goal, rest } = splitObjective(asStr(c.objective));
  const copy = asObj(c.sample_copy);
  const copyText = [asStr(copy.headline), '', asStr(copy.body), '', asStr(copy.cta)].filter(Boolean).join('\n');
  const platforms = platformNames(asArr(c.asset_types));
  return (
    <div className={cn('grid gap-4 rounded-card border p-5 transition-colors', chosen ? 'border-go bg-go-soft/30' : 'border-border')}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-heading">{asStr(c.name)}</p>
            {chosen && <Badge tone="go">Chosen</Badge>}
            {goal && <Badge tone="neutral">{goal}</Badge>}
            {asStr(c.effort) && <Badge tone="neutral">{asStr(c.effort)} effort</Badge>}
          </div>
          {rest && <p className="mt-1 text-body text-muted-foreground">{rest}</p>}
        </div>
        <Button
          variant={chosen ? 'primary' : 'secondary'}
          size="sm"
          aria-pressed={chosen}
          disabled={disabled}
          loading={busy}
          loadingLabel="Saving"
          onClick={onToggle}
        >
          {chosen ? <><Check aria-hidden /> Chosen, click to drop</> : 'Choose this angle'}
        </Button>
      </div>

      <p className="text-read">{asStr(c.big_idea)}</p>
      {asStr(c.hook) && (
        <p className="border-l-2 border-border pl-3 text-read italic">{asStr(c.hook)}</p>
      )}

      <div className="grid gap-4 sm:grid-cols-3 [&>div]:min-w-0">
        <div>
          <MetaLabel>Where it plays</MetaLabel>
          <Chips items={asArr(c.channels)} />
          {platforms.length > 0 && (
            <p className="mt-1.5 text-small text-muted-foreground">Social Launch writes: {platforms.join(', ')}.</p>
          )}
        </div>
        <div>
          <MetaLabel>What you would make</MetaLabel>
          {asArr(c.assets_needed).length > 0 ? (
            <ul className="mt-1 grid gap-0.5">
              {asArr(c.assets_needed).map((a, i) => <li key={i} className="text-body">{String(a)}</li>)}
            </ul>
          ) : (
            <p className="mt-1 text-body text-muted-foreground">Nothing beyond the posts.</p>
          )}
        </div>
        <div>
          <MetaLabel>How you would know</MetaLabel>
          <p className="mt-1 text-body">{asStr(c.success_metric) || 'No measure given.'}</p>
        </div>
      </div>

      {asStr(c.why_on_brand) && <p className="text-body text-muted-foreground">{asStr(c.why_on_brand)}</p>}

      {copyText && (
        <div>
          <Button variant="ghost" size="sm" onClick={() => setShowCopy(!showCopy)} aria-expanded={showCopy} className="-ml-2 text-muted-foreground">
            <ChevronRight aria-hidden className={cn('transition-transform duration-(--duration-fast) motion-reduce:transition-none', showCopy && 'rotate-90')} />
            Hear the tone (an illustration, not a post)
          </Button>
          <Disclosure open={showCopy}>
            <Well className="mt-2">
              <div className="flex items-center justify-between gap-2">
                <MetaLabel>Illustration of the angle&rsquo;s tone</MetaLabel>
                <CopyButton size="sm" text={copyText} label="Copy" />
              </div>
              {asStr(copy.headline) && <p className="mt-1 text-body font-medium">{asStr(copy.headline)}</p>}
              {asStr(copy.body) && <p className="mt-1 whitespace-pre-wrap text-body">{asStr(copy.body)}</p>}
              {asStr(copy.cta) && <p className="mt-1 font-mono text-data">{asStr(copy.cta)}</p>}
            </Well>
          </Disclosure>
        </div>
      )}
    </div>
  );
}

export function BrandStage() {
  const { project, gate1, brandDna, brandCampaigns, running, runJob, refresh } = useProject();
  const { go, href } = useNav();
  const [busyName, setBusyName] = React.useState<string | null>(null);
  if (!project) return null;
  if (!gate1) return <LockedGate />;

  const runningKind = running?.kind;
  const dna = brandDna;
  const campaigns = asArr(brandCampaigns?.campaigns) as Campaign[];
  const chosenAngles = project.selected_campaigns ?? [];
  const chosenCampaigns = campaigns.filter((c) => chosenAngles.includes(asStr(c.name)));
  const neither = !dna && !brandCampaigns;
  const assetsHref = href({ view: 'workspace', projectId: project.id, stage: 'assets' });
  const goAssets = (e: React.MouseEvent) => { e.preventDefault(); go({ view: 'workspace', projectId: project.id, stage: 'assets' }); };

  const toggle = async (name: string) => {
    setBusyName(name);
    try {
      await api.selectCampaign(project.id, name, !chosenAngles.includes(name));
      await refresh();
    } catch (e) {
      toast.error(actionError('choose this angle', e));
    } finally {
      setBusyName(null);
    }
  };

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-4">
      <Orient
        runKind="brand_dna"
        lead={
          <>
            Two steps, in order. <strong className="font-medium">First check the Business DNA</strong>, the voice Launch Kit
            observed on your site. <strong className="font-medium">Then choose one campaign angle</strong>, the story every post
            will carry.
          </>
        }
        detail="The DNA is how you sound; an angle is what you say and where. Social Launch writes the actual posts from the angle you choose here, one per platform, in that voice."
      />

      {/* ---- Step 1: Business DNA ---- */}
      <Card>
        <CardHeader
          title="Step 1 of 2: Business DNA"
          description="How your brand sounds and looks, observed on your live site. Every post, card and film is written in this voice."
          actions={
            <>
              {dna && <StatusStamp kind="go" label="Extracted" />}
              {dna && (
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={Boolean(runningKind)}
                  onClick={() => runJob('brand_dna', () => api.runStage(project.id, 'brand_dna')).then(refresh)}
                >
                  Re-extract
                </Button>
              )}
            </>
          }
        />
        <CardBody>
          {runningKind === 'brand_dna' ? (
            <span className="text-shimmer text-small">Reading your site for brand voice, colors, and messaging</span>
          ) : dna ? (
            <DnaView dna={dna} fallbackName={project.name} />
          ) : (
            <HonestEmpty
              fact="No Business DNA yet."
              reason="Launch Kit reads your live site and writes down the brand: voice, vocabulary, key messages, observed colors and type. Nothing is invented; every item cites where it was seen."
              runKind="brand_dna"
              action={
                <Button variant="secondary" disabled={Boolean(runningKind)} onClick={() => runJob('brand_dna', () => api.runStage(project.id, 'brand_dna'))}>
                  Extract Business DNA
                </Button>
              }
            />
          )}
        </CardBody>
      </Card>

      {/* ---- Step 2: Campaign angles ---- */}
      <Card>
        <CardHeader
          title="Step 2 of 2: Campaign angle"
          description="Four to six stories you could launch with, each with its audience, its channels, what it takes and how you would measure it. Choose one; two at most."
          actions={
            <>
              {campaigns.length > 0 && (
                <StatusStamp kind={chosenAngles.length > 0 ? 'go' : 'hold'} label={chosenAngles.length > 0 ? 'Chosen' : 'Choose one'} />
              )}
              {campaigns.length > 0 && (
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={Boolean(runningKind)}
                  onClick={() => runJob('brand_campaigns', () => api.runStage(project.id, 'brand_campaigns')).then(refresh)}
                >
                  Regenerate
                </Button>
              )}
            </>
          }
        />
        <CardBody className="grid gap-5">
          {runningKind === 'brand_campaigns' ? (
            <span className="text-shimmer text-small">Drafting campaign angles in your brand voice</span>
          ) : campaigns.length > 0 ? (
            <>
              {chosenCampaigns.length > 0 ? (
                <Banner
                  tone="go"
                  title={`Chosen: ${chosenCampaigns.map((c) => asStr(c.name)).join(' and ')}.`}
                  action={
                    <a href={assetsHref} onClick={goAssets}>
                      <Button variant="secondary" size="sm">Write the posts <ArrowRight aria-hidden /></Button>
                    </a>
                  }
                >
                  Social Launch writes every platform&rsquo;s post from this angle, in your DNA voice. The plan carries it too.
                </Banner>
              ) : (
                <Banner tone="hold" title="No angle chosen yet.">
                  Until you choose one, Social Launch writes from the profile and the voice alone. Compare the angles below and press Choose on the one you would run.
                </Banner>
              )}

              {campaigns.length > 1 && (
                <div>
                  <MetaLabel>At a glance</MetaLabel>
                  <TableFrame className="mt-2">
                    <Table>
                      <thead>
                        <tr>
                          <Th>Angle</Th>
                          <Th>Goal</Th>
                          <Th>Where</Th>
                          <Th>Effort</Th>
                          <Th>Measure</Th>
                        </tr>
                      </thead>
                      <tbody>
                        {campaigns.map((c, i) => {
                          const name = asStr(c.name);
                          const chosen = chosenAngles.includes(name);
                          return (
                            <Tr key={i}>
                              <Td className="font-medium">
                                {chosen && <Check size={14} strokeWidth={2} aria-label="chosen" className="mr-1 inline text-go-text" />}
                                {name}
                              </Td>
                              <Td className="text-muted-foreground">{splitObjective(asStr(c.objective)).goal || '?'}</Td>
                              <Td className="text-muted-foreground">{asArr(c.channels).map(asStr).slice(0, 3).join(', ')}</Td>
                              <Td className="text-muted-foreground">{asStr(c.effort)}</Td>
                              <Td className="text-muted-foreground">{asStr(c.success_metric)}</Td>
                            </Tr>
                          );
                        })}
                      </tbody>
                    </Table>
                  </TableFrame>
                </div>
              )}

              <div className="grid gap-4">
                {campaigns.map((c, i) => {
                  const name = asStr(c.name);
                  return (
                    <AngleCard
                      key={i}
                      c={c}
                      chosen={chosenAngles.includes(name)}
                      busy={busyName === name}
                      disabled={Boolean(runningKind) || (busyName !== null && busyName !== name)}
                      onToggle={() => toggle(name)}
                    />
                  );
                })}
              </div>
              <ProvenanceLine parts={['Generated from the Business DNA and the approved profile', `${campaigns.length} angles`]} />
              <RawData data={brandCampaigns} />
            </>
          ) : (
            <HonestEmpty
              fact="No angles yet."
              reason={
                dna
                  ? 'Launch Kit turns the Business DNA into four to six campaign angles a solo builder can run: the story, the channels, the effort and the measure for each. You choose one; Social Launch writes from it.'
                  : 'Angles are written from the Business DNA. Extract it first, above.'
              }
              runKind="brand_campaigns"
              action={
                dna ? (
                  <Button variant="secondary" disabled={Boolean(runningKind)} onClick={() => runJob('brand_campaigns', () => api.runStage(project.id, 'brand_campaigns'))}>
                    Draft the angles
                  </Button>
                ) : undefined
              }
            />
          )}
        </CardBody>
      </Card>

      {neither && !runningKind && (
        <p className="text-small text-muted-foreground">Start with step 1. Step 2 unlocks once the DNA exists.</p>
      )}
    </div>
  );
}
