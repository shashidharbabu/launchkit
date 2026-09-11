import * as React from 'react';
import { toast } from 'sonner';
import { Check, ExternalLink } from 'lucide-react';
import { useProject } from '../project-provider';
import { Card, CardHeader, CardBody, HonestEmpty, LockedGate, Orient, RawData } from '../stage-common';
import { Button } from '@launchkit/design-system/components/button';
import { Banner } from '@launchkit/design-system/components/banner';
import { CopyButton } from '@launchkit/design-system/components/copy-button';
import { Field, Input } from '@launchkit/design-system/components/field';
import { StatusStamp, Badge, type BadgeTone } from '@launchkit/design-system/components/status-stamp';
import { ProvenanceLine } from '@launchkit/design-system/components/provenance-line';
import { cn } from '@launchkit/design-system/lib/cn';
import { api } from '../../../data/api';
import { actionError } from '../../../lib/errors';
import type { SelectedPricing, SelectedPricingTier } from '../../../lib/types';

const asStr = (v: unknown) => (v == null ? '' : String(v));
const asArr = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);
const asObj = (v: unknown): Record<string, unknown> =>
  v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {};

function MetaLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-label text-muted-foreground">{children}</p>;
}

type RecTier = {
  name?: string;
  price?: unknown;
  price_usd_month?: unknown;
  includes?: unknown[];
  key_limits?: unknown;
  who_its_for?: unknown;
  rationale?: unknown;
  [k: string]: unknown;
};

/** The pipeline emits the price under varying keys (price, price_usd_month, …); this reads it as a number when it is one. */
function tierNumber(t: RecTier): number | null {
  for (const k of ['price_usd_month', 'price', ...Object.keys(t).filter((x) => /price/i.test(x))]) {
    const v = t[k];
    if (v == null || v === '') continue;
    const n = typeof v === 'number' ? v : Number(String(v).replace(/[^0-9.]/g, ''));
    if (!Number.isNaN(n)) return n;
  }
  return null;
}

type Competitor = {
  name?: string;
  pricing_model?: string;
  tiers?: unknown[];
  url?: string;
  source_url?: string;
  notability?: 'established' | 'emerging' | 'niche' | string;
  evidence_of_standing?: string;
  mentions?: number;
};

type Rejected = { name?: string; url?: string; why?: string };

/**
 * How well-known a competitor is. The pricing recommendation is only as good
 * as the names it is anchored to, so standing is shown next to each one.
 * Never colour alone: the word carries the meaning (color.md).
 */
function Standing({ notability, mentions, evidence }: { notability?: string; mentions?: number; evidence?: string }) {
  if (!notability) return null;
  const tone: BadgeTone = notability === 'established' ? 'go' : notability === 'emerging' ? 'hold' : 'neutral';
  return (
    <Badge tone={tone} title={evidence || undefined}>
      {notability.charAt(0).toUpperCase() + notability.slice(1)}
      {typeof mentions === 'number' && <span className="ml-1 opacity-70">{mentions}</span>}
    </Badge>
  );
}

/** One competitor with the tiers actually read from its pricing page: the evidence behind the numbers above. */
function CompetitorRow({ c }: { c: Competitor }) {
  const tiers = asArr(c.tiers).map(asObj);
  const link = asStr(c.source_url || c.url);
  return (
    <div className="grid gap-2 rounded-card border border-border p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-body font-medium">{asStr(c.name)}</span>
        <Standing notability={c.notability} mentions={c.mentions} evidence={c.evidence_of_standing} />
        {asStr(c.pricing_model) && <span className="text-small text-muted-foreground">{asStr(c.pricing_model)}</span>}
        {link && (
          <a href={link} target="_blank" rel="noreferrer" aria-label={`Pricing page for ${asStr(c.name)}`} className="ml-auto inline-flex items-center gap-1 font-mono text-data text-link hover:text-link-hover">
            Pricing page <ExternalLink size={12} strokeWidth={1.75} aria-hidden />
          </a>
        )}
      </div>
      {tiers.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {tiers.map((t, i) => (
            <span key={i} className="inline-flex items-baseline gap-1.5 rounded-control border border-border px-2.5 py-1 text-small" title={asStr(t.key_limits)}>
              <span className="font-medium">{asStr(t.name) || `Tier ${i + 1}`}</span>
              <span className="font-mono text-data">{asStr(t.price)}{asStr(t.period) ? `/${asStr(t.period).replace(/^per\s+/i, '')}` : ''}</span>
            </span>
          ))}
        </div>
      ) : (
        <p className="text-small text-muted-foreground">Tiers not read from the page.</p>
      )}
      {asStr(c.evidence_of_standing) && <p className="text-small text-muted-foreground">{asStr(c.evidence_of_standing)}</p>}
    </div>
  );
}

/**
 * The tiers as a choice, not a dump: keep or drop each one, adjust a price,
 * then use it. What is chosen goes onto the project and into the plan.
 */
function PricingChooser({ projectId, rec, chosen, disabled, onChosen }: {
  projectId: string;
  rec: Record<string, unknown>;
  chosen: SelectedPricing | null;
  disabled: boolean;
  onChosen: () => Promise<void>;
}) {
  const recTiers = asArr(rec.tiers) as RecTier[];
  const model = asStr(rec.model) || asStr(rec.pricing_model);
  const anchors = asArr(rec.anchor_competitors).map(asStr);
  const initial = React.useMemo<SelectedPricingTier[]>(() => {
    if (chosen && chosen.tiers.length > 0) return chosen.tiers.map((t) => ({ ...t }));
    return recTiers.map((t, i) => ({
      name: asStr(t.name) || `Tier ${i + 1}`,
      price_usd_month: tierNumber(t),
      included: true,
      who_its_for: asStr(t.who_its_for),
      includes: asArr(t.includes).map(asStr),
    }));
  }, [chosen, recTiers]);
  const [tiers, setTiers] = React.useState<SelectedPricingTier[]>(initial);
  const [saving, setSaving] = React.useState(false);
  React.useEffect(() => { setTiers(initial); }, [initial]);

  const dirty = !chosen || JSON.stringify(chosen.tiers.map((t) => [t.name, t.price_usd_month, t.included])) !== JSON.stringify(tiers.map((t) => [t.name, t.price_usd_month, t.included]));
  const kept = tiers.filter((t) => t.included);

  const commit = async () => {
    setSaving(true);
    try {
      await api.selectPricing(projectId, { model, tiers, anchor_competitors: anchors });
      toast.success('Pricing chosen. It goes into the plan.');
      await onChosen();
    } catch (e) {
      toast.error(actionError('choose this pricing', e));
    } finally {
      setSaving(false);
    }
  };
  const clear = async () => {
    setSaving(true);
    try {
      await api.selectPricing(projectId, null);
      await onChosen();
    } catch (e) {
      toast.error(actionError('clear the pricing choice', e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid gap-4">
      {chosen && !dirty ? (
        <Banner tone="go" title={`Chosen: ${kept.map((t) => `${t.name} ${t.price_usd_month == null ? '' : `$${t.price_usd_month}/mo`}`.trim()).join(', ')}.`}>
          This is the pricing your launch plan carries. Change a tier or a price below and use it again to update it.
        </Banner>
      ) : (
        <Banner tone="hold" title={chosen ? 'You changed the tiers since you chose.' : 'Choose the pricing you will launch with.'}>
          Keep or drop each tier, adjust a price if the research below argues for it, then press Use this pricing.
        </Banner>
      )}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {tiers.map((t, i) => {
          const src = recTiers[i];
          return (
            <div key={i} className={cn('grid content-start gap-3 rounded-card border p-5 transition-colors', t.included ? 'border-go bg-go-soft/30' : 'border-border opacity-70')}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <MetaLabel>{t.name}</MetaLabel>
                  {asStr(t.who_its_for) && <p className="mt-0.5 text-body text-muted-foreground">{asStr(t.who_its_for)}</p>}
                </div>
                <Button
                  variant={t.included ? 'primary' : 'secondary'}
                  size="sm"
                  aria-pressed={t.included}
                  disabled={disabled || saving}
                  onClick={() => setTiers((cur) => cur.map((x, j) => (j === i ? { ...x, included: !x.included } : x)))}
                >
                  {t.included ? <><Check aria-hidden /> Keep</> : 'Dropped'}
                </Button>
              </div>
              <Field label="Price per month, USD" htmlFor={`tier-price-${i}`} helper={src && tierNumber(src) !== t.price_usd_month ? `Recommended ${tierNumber(src) == null ? 'none' : `$${tierNumber(src)}`}` : undefined}>
                <Input
                  id={`tier-price-${i}`}
                  type="number"
                  min={0}
                  step={1}
                  inputMode="numeric"
                  value={t.price_usd_month == null ? '' : String(t.price_usd_month)}
                  disabled={disabled || saving || !t.included}
                  className="font-mono"
                  onChange={(e) => {
                    const v = e.target.value;
                    setTiers((cur) => cur.map((x, j) => (j === i ? { ...x, price_usd_month: v === '' ? null : Number(v) } : x)));
                  }}
                />
              </Field>
              {(t.includes ?? []).length > 0 && (
                <ul className="grid gap-1">
                  {(t.includes ?? []).map((inc, j) => <li key={j} className="text-body">{inc}</li>)}
                </ul>
              )}
              {src && asStr(src.rationale) && <p className="text-small text-muted-foreground">{asStr(src.rationale)}</p>}
            </div>
          );
        })}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button variant={dirty ? 'primary' : 'secondary'} disabled={disabled || kept.length === 0 || (!dirty && Boolean(chosen))} loading={saving} loadingLabel="Saving" onClick={commit}>
          {chosen ? 'Use this pricing again' : 'Use this pricing'}
        </Button>
        {chosen && (
          <Button variant="ghost" disabled={disabled || saving} onClick={clear}>Clear the choice</Button>
        )}
        <span className="text-small text-muted-foreground">
          {kept.length} of {tiers.length} tiers kept{model ? `, ${model}` : ''}{anchors.length > 0 ? `, anchored on ${anchors.join(', ')}` : ''}.
        </span>
      </div>
    </div>
  );
}

export function CommercialStage() {
  const { project, gate1, pricing, listing, listingApproved, running, runJob, refresh } = useProject();
  const [approving, setApproving] = React.useState(false);
  if (!project) return null;
  if (!gate1) return <LockedGate />;

  const runBoth = () =>
    runJob('pricing', () => api.runStage(project.id, 'pricing')).then(() =>
      runJob('listing', () => api.runStage(project.id, 'listing')),
    );

  const competitors = (Array.isArray(pricing?.competitors) ? pricing.competitors : []) as Competitor[];
  const rejected = (Array.isArray(pricing?.rejected) ? pricing.rejected : []) as Rejected[];
  const established = competitors.filter((c) => c.notability === 'established');
  const recommendation = pricing && typeof pricing.recommendation === 'object' && pricing.recommendation && !Array.isArray(pricing.recommendation)
    ? (pricing.recommendation as Record<string, unknown>)
    : null;
  const risks = asArr(recommendation?.risks).map(asStr);
  const rationale = asStr(recommendation?.rationale) || asStr(recommendation?.positioning_note);
  const confidence = asObj(pricing?.confidence);
  const neither = !pricing && !listing;
  const runningKind = running?.kind;
  const chosenPricing = project.selected_pricing ?? null;

  const listingCopyText = listing
    ? [asStr(listing.title), asStr(listing.tagline), '', asStr(listing.description_short), '', asStr(listing.description_long)].filter(Boolean).join('\n')
    : '';

  const approveListing = async () => {
    setApproving(true);
    try {
      await api.approveCommercial(project.id, 'listing');
      toast.success('Listing approved. It goes into the plan.');
      await refresh();
    } catch (e) {
      toast.error(actionError('approve the listing', e));
    } finally {
      setApproving(false);
    }
  };

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-4">
      <Orient
        runKind="pricing"
        lead={
          <>
            Two decisions, in order. <strong className="font-medium">First choose the pricing you will launch with</strong>, from
            tiers anchored on real competitors. <strong className="font-medium">Then approve your store listing</strong>, the page
            copy a visitor reads before signing up.
          </>
        }
        detail="Both are drafted from your approved profile. The numbers are only as strong as the established competitors they are anchored on; a list of niche names is a reason to distrust them."
      />

      {neither && !runningKind && (
        <HonestEmpty
          fact="No pricing or listing drafts yet."
          reason="Launch Kit finds who actually competes with you, reads their pricing pages, recommends tiers you can keep or change, and rewrites your store listing from the approved profile."
          runKind="pricing"
          action={<Button variant="secondary" onClick={runBoth}>Draft pricing and listing</Button>}
        />
      )}

      {/* ---- Step 1: Pricing ---- */}
      {(pricing || runningKind === 'pricing' || (!neither && !pricing)) && (
        <Card>
          <CardHeader
            title="Step 1 of 2: Pricing"
            description="Tiers recommended from competitor pricing pages. Keep the ones you want, adjust a price, and use it."
            actions={
              <>
                {pricing && <StatusStamp kind={chosenPricing ? 'go' : 'hold'} label={chosenPricing ? 'Chosen' : 'Choose'} />}
                {pricing && (
                  <Button variant="secondary" size="sm" disabled={Boolean(runningKind)} onClick={() => runJob('pricing', () => api.runStage(project.id, 'pricing')).then(refresh)}>
                    Regenerate
                  </Button>
                )}
              </>
            }
          />
          <CardBody>
            {runningKind === 'pricing' ? (
              <span className="text-shimmer text-small">Finding who competes with you and reading their pricing pages</span>
            ) : pricing ? (
              <div className="grid gap-6">
                {recommendation ? (
                  <PricingChooser
                    key={`${chosenPricing?.chosen_at ?? 'new'}:${asArr(recommendation.tiers).length}`}
                    projectId={project.id}
                    rec={recommendation}
                    chosen={chosenPricing}
                    disabled={Boolean(runningKind)}
                    onChosen={refresh}
                  />
                ) : (
                  <p className="text-body text-muted-foreground">The draft came back without a recommendation. Regenerate it.</p>
                )}
                {(rationale || risks.length > 0) && (
                  <div className="grid gap-3">
                    {rationale && (
                      <div>
                        <MetaLabel>Why these numbers</MetaLabel>
                        <p className="mt-1 text-read">{rationale}</p>
                      </div>
                    )}
                    {risks.length > 0 && (
                      <div>
                        <MetaLabel>Risks</MetaLabel>
                        <ul className="mt-1 grid gap-1">
                          {risks.map((r, i) => <li key={i} className="text-body text-muted-foreground">{r}</li>)}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
                {competitors.length > 0 && (
                  <div className="grid gap-3">
                    <div>
                      <MetaLabel>The research: {competitors.length} competitors read, {established.length} established</MetaLabel>
                      <p className="mt-0.5 text-small text-muted-foreground">
                        Each name recurred in independent comparisons before it was counted; the tiers are what its pricing page says today. This is what the recommendation above is anchored on.
                      </p>
                    </div>
                    <div className="grid gap-3">
                      {competitors.map((c, i) => <CompetitorRow key={i} c={c} />)}
                    </div>
                  </div>
                )}
                {rejected.length > 0 && (
                  <div>
                    <MetaLabel>Not counted as competitors, {rejected.length}</MetaLabel>
                    <ul className="mt-1 grid gap-1">
                      {rejected.map((r, i) => (
                        <li key={i} className="text-body text-muted-foreground">
                          <span className="text-foreground">{asStr(r.name)}</span>, {asStr(r.why)}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <ProvenanceLine
                  parts={[
                    'Drafted from the approved profile and competitor pricing pages',
                    established.length > 0
                      ? `Anchored on ${established.length} established ${established.length === 1 ? 'competitor' : 'competitors'}`
                      : 'No established competitor found; treat these numbers as weak',
                    asStr(confidence.notes) || undefined,
                  ].filter(Boolean) as string[]}
                />
                <RawData data={pricing} />
              </div>
            ) : (
              <HonestEmpty
                fact="No pricing draft yet."
                reason="Launch Kit finds who actually competes with you, reads their pricing pages and recommends tiers you can keep or change."
                runKind="pricing"
                action={
                  <Button variant="secondary" disabled={Boolean(runningKind)} onClick={() => runJob('pricing', () => api.runStage(project.id, 'pricing'))}>
                    Draft pricing
                  </Button>
                }
              />
            )}
          </CardBody>
        </Card>
      )}

      {/* ---- Step 2: Listing ---- */}
      {(listing || runningKind === 'listing' || (!neither && !listing)) && (
        <Card>
          <CardHeader
            title="Step 2 of 2: Store listing"
            description="Your app's page copy: title, tagline, descriptions, keywords and FAQ. Posts announce; this page converts the visitor who arrives. It is what goes on the RocketRide App Store and any directory that lists you."
            actions={
              <>
                {listing && <StatusStamp kind={listingApproved ? 'go' : 'hold'} label={listingApproved ? 'Approved' : 'Review'} />}
                {listing && <CopyButton size="sm" text={listingCopyText} label="Copy listing" />}
                {listing && (
                  <Button variant="secondary" size="sm" disabled={Boolean(runningKind)} onClick={() => runJob('listing', () => api.runStage(project.id, 'listing')).then(refresh)}>
                    Regenerate
                  </Button>
                )}
              </>
            }
          />
          <CardBody>
            {runningKind === 'listing' ? (
              <span className="text-shimmer text-small">Rewriting your store listing</span>
            ) : listing ? (
              <div className="grid gap-5">
                {listingApproved ? (
                  <Banner tone="go" title="Approved.">
                    The plan carries this copy, and the Assets stage uses its tagline on the cards. Regenerate to start a new draft.
                  </Banner>
                ) : (
                  <Banner
                    tone="hold"
                    title="Read it as a visitor would, then approve it."
                    action={
                      <Button variant="primary" size="sm" disabled={Boolean(runningKind)} loading={approving} loadingLabel="Approving" onClick={approveListing}>
                        Approve listing
                      </Button>
                    }
                  >
                    Only approved copy goes into the plan.
                  </Banner>
                )}
                <div className="grid gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
                  <div className="grid content-start gap-4">
                    <div>
                      <p className="text-heading">{asStr(listing.title)}</p>
                      {asStr(listing.tagline) && <p className="mt-1 text-read italic text-muted-foreground">{asStr(listing.tagline)}</p>}
                    </div>
                    {asStr(listing.description_short) && (
                      <div>
                        <MetaLabel>Short description</MetaLabel>
                        <p className="mt-0.5 text-read">{asStr(listing.description_short)}</p>
                      </div>
                    )}
                    {asStr(listing.description_long) && (
                      <div>
                        <MetaLabel>Long description</MetaLabel>
                        <p className="mt-0.5 whitespace-pre-wrap text-read">{asStr(listing.description_long)}</p>
                      </div>
                    )}
                    {asStr(listing.cta) && (
                      <div>
                        <MetaLabel>Call to action</MetaLabel>
                        <p className="mt-0.5 text-read">{asStr(listing.cta)}</p>
                      </div>
                    )}
                  </div>
                  <div className="grid content-start gap-4">
                    {Array.isArray(listing.keywords) && listing.keywords.length > 0 && (
                      <div>
                        <MetaLabel>Keywords</MetaLabel>
                        <p className="mt-1 flex flex-wrap gap-1.5">
                          {(listing.keywords as unknown[]).map((k, i) => <Badge key={i} tone="neutral">{String(k)}</Badge>)}
                        </p>
                      </div>
                    )}
                    {Array.isArray(listing.faq) && listing.faq.length > 0 && (
                      <div>
                        <MetaLabel>FAQ</MetaLabel>
                        <div className="mt-1 grid gap-2">
                          {(listing.faq as { q?: string; a?: string }[]).map((f, i) => (
                            <div key={i} className="border-l-2 border-border pl-3">
                              <p className="text-body font-medium">{asStr(f.q)}</p>
                              <p className="text-read text-muted-foreground">{asStr(f.a)}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {Array.isArray(listing.changes_from_current) && listing.changes_from_current.length > 0 && (
                      <div>
                        <MetaLabel>What changed from your current page</MetaLabel>
                        <ul className="mt-1 grid list-disc gap-1 pl-5">
                          {(listing.changes_from_current as unknown[]).map((c, i) => <li key={i} className="text-body">{String(c)}</li>)}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
                <ProvenanceLine parts={['Drafted from the approved profile and the current listing']} />
                <RawData data={listing} />
              </div>
            ) : (
              <HonestEmpty
                fact="No listing draft yet."
                reason="Launch Kit rewrites your store page copy for conversion, from the approved profile."
                runKind="listing"
                action={
                  <Button variant="secondary" disabled={Boolean(runningKind)} onClick={() => runJob('listing', () => api.runStage(project.id, 'listing'))}>
                    Draft listing
                  </Button>
                }
              />
            )}
          </CardBody>
        </Card>
      )}
    </div>
  );
}
