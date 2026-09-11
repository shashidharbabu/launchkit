import * as React from 'react';
import { toast } from 'sonner';
import { ExternalLink } from 'lucide-react';
import { useProject } from '../project-provider';
import { Card, CardHeader, CardBody, HonestEmpty, LockedGate, Orient, RawData, Well } from '../stage-common';
import { Button } from '@launchkit/design-system/components/button';
import { Banner } from '@launchkit/design-system/components/banner';
import { CopyButton } from '@launchkit/design-system/components/copy-button';
import { Checkbox, Field, Input } from '@launchkit/design-system/components/field';
import { Segmented } from '@launchkit/design-system/components/segmented';
import { StatusStamp, Badge, type BadgeTone } from '@launchkit/design-system/components/status-stamp';
import { ProvenanceLine } from '@launchkit/design-system/components/provenance-line';
import { cn } from '@launchkit/design-system/lib/cn';
import { api } from '../../../data/api';
import { actionError } from '../../../lib/errors';
import type {
  PricingModelConsidered, PricingOption, PricingOptionTier, SelectedPricing, SelectedPricingTier,
} from '../../../lib/types';

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

/**
 * The pipeline emits the price under varying keys (price, price_usd_month, …); this reads it as a number when it is one.
 * A string with no digits (Custom, Contact us) is not a price: null, never 0.
 */
function tierNumber(t: RecTier): number | null {
  for (const k of ['price_usd_month', 'price', ...Object.keys(t).filter((x) => /price/i.test(x))]) {
    const v = t[k];
    if (v == null || v === '') continue;
    const s = typeof v === 'number' ? String(v) : String(v).replace(/[^0-9.]/g, '');
    if (!s) continue;
    const n = Number(s);
    if (Number.isFinite(n)) return n;
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

// ---------------------------------------------------------------- the pricing choice

/** The research pipe names a model (freemium, subscription, one-time, usage); the choice speaks in billing models. */
const BILLING_OF_MODEL: Record<string, string> = {
  freemium: 'free plus paid tiers',
  free: 'free plus paid tiers',
  subscription: 'monthly subscription',
  monthly: 'monthly subscription',
  annual: 'annual subscription',
  yearly: 'annual subscription',
  'one-time': 'one-time purchase',
  onetime: 'one-time purchase',
  'one time': 'one-time purchase',
  usage: 'usage-based',
};

function billingOfModel(model: string): string {
  const key = model.trim().toLowerCase();
  if (!key) return 'monthly subscription';
  if (BILLING_OF_MODEL[key]) return BILLING_OF_MODEL[key];
  for (const [k, v] of Object.entries(BILLING_OF_MODEL)) if (key.includes(k)) return v;
  return key;
}

const usd = (n: number) => `$${Math.round(n).toLocaleString('en-US')}`;
const priceLabel = (p: number | null) => (p == null ? 'price to decide' : p === 0 ? 'Free' : `${usd(p)}/mo`);

type Revenue = { floor: number; mid: number; cheapest: number | null; average: number | null; paid: number };

/**
 * Monthly revenue at a number of paying customers, from the included paid
 * tiers: the floor puts everyone on the cheapest paid tier, the mid figure
 * spreads them evenly (the average paid price).
 */
function revenueAt(tiers: { price_usd_month: number | null; included?: boolean }[], customers: number): Revenue {
  const paid: number[] = [];
  for (const t of tiers) {
    if (t.included !== false && t.price_usd_month != null && t.price_usd_month > 0) paid.push(t.price_usd_month);
  }
  if (paid.length === 0) return { floor: 0, mid: 0, cheapest: null, average: null, paid: 0 };
  let min = paid[0];
  let sum = 0;
  for (const p of paid) {
    if (p < min) min = p;
    sum += p;
  }
  const average = sum / paid.length;
  return { floor: min * customers, mid: average * customers, cheapest: min, average, paid: paid.length };
}

/**
 * The plan options the research drafted; when the options ask did not run or
 * failed (older results, a failed second ask), the recommendation becomes the
 * one option so the page still offers a choice to make.
 */
function readOptions(pricing: Record<string, unknown>, rec: Record<string, unknown> | null): PricingOption[] {
  const list: PricingOption[] = [];
  for (const raw of asArr(pricing.options).map(asObj)) {
    if (!asStr(raw.name) || asArr(raw.tiers).length === 0) continue;
    const revenue_at: Record<string, number> = {};
    for (const [k, v] of Object.entries(asObj(raw.revenue_at))) {
      const n = Number(v);
      if (Number.isFinite(n)) revenue_at[k] = n;
    }
    list.push({
      name: asStr(raw.name),
      billing: asStr(raw.billing),
      positioning: asStr(raw.positioning),
      tiers: asArr(raw.tiers).map(asObj).map((t, i) => ({
        name: asStr(t.name) || `Tier ${i + 1}`,
        price_usd_month: tierNumber(t as RecTier),
        who_its_for: asStr(t.who_its_for),
        includes: asArr(t.includes).map(asStr),
      })),
      market_rate_note: asStr(raw.market_rate_note),
      revenue_at,
      when_to_pick: asStr(raw.when_to_pick),
    });
  }
  if (list.length > 0) return list;
  if (!rec) return [];
  const model = asStr(rec.model) || asStr(rec.pricing_model);
  return [{
    name: 'Recommended plan',
    billing: billingOfModel(model),
    positioning: asStr(rec.positioning_note),
    tiers: (asArr(rec.tiers) as RecTier[]).map((t, i) => ({
      name: asStr(t.name) || `Tier ${i + 1}`,
      price_usd_month: tierNumber(t),
      who_its_for: asStr(t.who_its_for),
      includes: asArr(t.includes).map(asStr),
    })),
    market_rate_note: '',
    revenue_at: {},
    when_to_pick: '',
  }];
}

/** The billing models the research weighed, plus any model an option uses that the list forgot. */
function readModels(pricing: Record<string, unknown>, options: PricingOption[]): PricingModelConsidered[] {
  const list: PricingModelConsidered[] = [];
  const seen = new Set<string>();
  for (const raw of asArr(pricing.models_considered).map(asObj)) {
    const model = asStr(raw.model);
    if (!model || seen.has(model)) continue;
    seen.add(model);
    list.push({ model, fit: asStr(raw.fit).toLowerCase(), why: asStr(raw.why) });
  }
  for (const o of options) {
    if (o.billing && !seen.has(o.billing)) {
      seen.add(o.billing);
      list.push({ model: o.billing, fit: '', why: '' });
    }
  }
  return list;
}

const FIT: Record<string, { word: string; tone: BadgeTone }> = {
  good: { word: 'Good fit', tone: 'go' },
  possible: { word: 'Possible fit', tone: 'hold' },
  poor: { word: 'Poor fit', tone: 'nogo' },
};

const tiersOf = (o: PricingOption): SelectedPricingTier[] =>
  o.tiers.map((t) => ({ name: t.name, price_usd_month: t.price_usd_month, included: true, who_its_for: t.who_its_for, includes: [...t.includes] }));

const tierSignature = (ts: SelectedPricingTier[]) => JSON.stringify(ts.map((t) => [t.name, t.price_usd_month, t.included]));

/** One tier inside a plan card: name, price, who it is for, what it includes. */
function OptionTier({ t }: { t: PricingOptionTier }) {
  return (
    <div className="rounded-control border border-border px-3 py-2">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-body font-medium">{t.name}</span>
        <span className="font-mono text-data">{priceLabel(t.price_usd_month)}</span>
      </div>
      {t.who_its_for && <p className="text-small text-muted-foreground">{t.who_its_for}</p>}
      {t.includes.length > 0 && <p className="text-small text-muted-foreground">Includes {t.includes.join(', ')}.</p>}
    </div>
  );
}

/**
 * One plan option as a radio card: click anywhere on it or press Select.
 * The selected card says so in a word, and option 1 carries Recommended.
 */
function PlanCard({ option, recommended, selected, disabled, onSelect }: {
  option: PricingOption;
  recommended: boolean;
  selected: boolean;
  disabled: boolean;
  onSelect: () => void;
}) {
  // computed here from the paid tiers, never the model's arithmetic, so the card and the revenue check agree
  const revenue = (n: number) => revenueAt(option.tiers, n).mid;
  const onKey = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (!disabled) onSelect();
    }
  };
  return (
    <div
      role="radio"
      aria-checked={selected}
      aria-label={option.name}
      tabIndex={disabled ? -1 : 0}
      onClick={() => { if (!disabled) onSelect(); }}
      onKeyDown={onKey}
      className={cn(
        'grid content-start gap-3 rounded-card border p-5 transition-colors cursor-pointer',
        'focus:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/25',
        selected ? 'border-go bg-go-soft/30' : 'border-border hover:border-border-strong',
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-body font-medium">{option.name}</span>
        {recommended && <Badge tone="flare">Recommended</Badge>}
        {selected && <Badge tone="go">Selected</Badge>}
      </div>
      {option.billing && <p className="text-small text-muted-foreground">Billing: {option.billing}</p>}
      {option.positioning && <p className="text-small">{option.positioning}</p>}
      <div className="grid gap-2">
        {option.tiers.map((t, j) => <OptionTier key={j} t={t} />)}
      </div>
      {option.market_rate_note && (
        <p className="text-small text-muted-foreground"><span className="text-foreground">Market rate:</span> {option.market_rate_note}</p>
      )}
      <div>
        <MetaLabel>Revenue at 10 / 50 / 200 paying customers</MetaLabel>
        <div className="mt-1 grid grid-cols-3 gap-2">
          {[10, 50, 200].map((n) => (
            <Well key={n} className="px-3 py-2">
              <p className="text-label text-muted-foreground">{n}</p>
              <p className="font-mono text-data">{usd(revenue(n))}/mo</p>
            </Well>
          ))}
        </div>
      </div>
      {option.when_to_pick && (
        <div>
          <MetaLabel>When to pick it</MetaLabel>
          <p className="mt-0.5 text-small">{option.when_to_pick}</p>
        </div>
      )}
      {!selected && (
        <Button variant="secondary" size="sm" disabled={disabled} className="justify-self-start" onClick={(e) => { e.stopPropagation(); onSelect(); }}>
          Select
        </Button>
      )}
    </div>
  );
}

/**
 * The pricing as a decision: a billing model, the plan options the research
 * drafted (the recommended one pre-selected), the tiers of the selected plan
 * to include or price, a revenue check, then Use this pricing. What is chosen
 * goes onto the project and into the plan.
 */
function PricingChooser({ projectId, pricing, rec, researched, chosen, disabled, onChosen }: {
  projectId: string;
  pricing: Record<string, unknown>;
  rec: Record<string, unknown> | null;
  researched: { read: number; established: number };
  chosen: SelectedPricing | null;
  disabled: boolean;
  onChosen: () => Promise<void>;
}) {
  const options = React.useMemo(() => readOptions(pricing, rec), [pricing, rec]);
  const models = React.useMemo(() => readModels(pricing, options), [pricing, options]);
  const model = asStr(rec?.model) || asStr(rec?.pricing_model);
  const anchors = asArr(rec?.anchor_competitors).map(asStr);
  const marketRate = asStr(pricing.market_rate);
  const rationaleByName = React.useMemo(() => {
    const m = new Map<string, string>();
    for (const t of asArr(rec?.tiers) as RecTier[]) if (asStr(t.name) && asStr(t.rationale)) m.set(asStr(t.name), asStr(t.rationale));
    return m;
  }, [rec]);

  // which option the earlier choice named; an older choice without a name means the recommended plan
  const chosenName = chosen ? chosen.option || options[0]?.name || '' : '';
  const chosenIdx = chosen ? Math.max(0, options.findIndex((o) => o.name === chosenName)) : 0;
  const chosenMatches = Boolean(chosen) && options[chosenIdx]?.name === chosenName;
  const chosenBilling = chosen ? chosen.billing || options[chosenIdx]?.billing || '' : '';
  const tiersFor = (idx: number): SelectedPricingTier[] => {
    const o = options[idx];
    if (!o) return [];
    if (chosen && chosenMatches && idx === chosenIdx && chosen.tiers.length > 0) return chosen.tiers.map((t) => ({ ...t, includes: [...(t.includes ?? [])] }));
    return tiersOf(o);
  };

  // the billing models at least one option implements go on the switch; the rest are read-only notes under it
  const implemented = React.useMemo(() => {
    const used = new Set<string>();
    for (const o of options) if (o.billing) used.add(o.billing);
    return models.filter((m) => used.has(m.model));
  }, [models, options]);
  const alsoConsidered = React.useMemo(() => {
    const used = new Set<string>();
    for (const o of options) if (o.billing) used.add(o.billing);
    return models.filter((m) => !used.has(m.model));
  }, [models, options]);

  const [selectedIdxRaw, setSelectedIdx] = React.useState(chosenIdx);
  const [billing, setBilling] = React.useState(() => chosenBilling || options[chosenIdx]?.billing || implemented[0]?.model || '');
  const [tiers, setTiers] = React.useState<SelectedPricingTier[]>(() => tiersFor(chosenIdx));
  const [customersRaw, setCustomersRaw] = React.useState('50');
  const [saving, setSaving] = React.useState(false);

  // every option is always on the page; the selection always points at one of them
  const selectedIdx = options[selectedIdxRaw] ? selectedIdxRaw : 0;
  const sel = options[selectedIdx];
  const selectedModel = models.find((m) => m.model === billing);
  const customers = Math.max(0, Math.floor(Number(customersRaw) || 0));
  const kept = tiers.filter((t) => t.included);
  const savedBilling = sel ? sel.billing || billing : billing;
  const dirty = !chosen || !sel || chosenName !== sel.name || chosenBilling !== savedBilling || tierSignature(chosen.tiers) !== tierSignature(tiers);

  const choose = (idx: number) => {
    if (idx === selectedIdx || !options[idx]) return;
    setSelectedIdx(idx);
    if (options[idx].billing) setBilling(options[idx].billing);
    setTiers(tiersFor(idx));
  };
  const changeBilling = (b: string) => {
    setBilling(b);
    if (sel?.billing === b) return;
    const j = options.findIndex((o) => o.billing === b);
    if (j >= 0) {
      setSelectedIdx(j);
      setTiers(tiersFor(j));
    }
  };

  const revenue = revenueAt(tiers, customers);
  let revenueLine: string;
  if (revenue.paid === 0) {
    revenueLine = 'No paid tier is included, so revenue at that size is $0.';
  } else if (revenue.paid === 1) {
    revenueLine = `At that size: ${usd(revenue.mid)} per month, ${usd(revenue.mid * 12)} per year, on the one paid tier (${usd(revenue.average ?? 0)}/mo).`;
  } else {
    revenueLine =
      `At that size: ${usd(revenue.mid)} per month, ${usd(revenue.mid * 12)} per year, if customers spread evenly across the ${revenue.paid} paid tiers (average ${usd(revenue.average ?? 0)}/mo). ` +
      `Floor: ${usd(revenue.floor)} per month, ${usd(revenue.floor * 12)} per year, if every customer takes the cheapest paid tier (${usd(revenue.cheapest ?? 0)}/mo).`;
  }

  const commit = async () => {
    if (!sel) return;
    setSaving(true);
    try {
      await api.selectPricing(projectId, { option: sel.name, billing: savedBilling, model, tiers, anchor_competitors: anchors });
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

  const chosenTierList = chosen
    ? chosen.tiers.filter((t) => t.included).map((t) => `${t.name} ${t.price_usd_month == null ? '' : `$${t.price_usd_month}/mo`}`.trim()).join(', ')
    : '';

  return (
    <div className="grid gap-6">
      {chosen && !dirty && (
        <Banner tone="go" title={`Chosen: ${chosenName} on ${chosenBilling || 'billing not stated'}, with ${chosenTierList}.`}>
          The plan carries it.
        </Banner>
      )}
      {chosen && dirty && (
        <Banner tone="hold" title="Changed since you chose. Use this pricing again to update it." />
      )}

      {/* a. how it was researched, and the market rate */}
      <div className="grid gap-1.5">
        <p className="text-small text-muted-foreground">
          How this was researched: {researched.read} {researched.read === 1 ? 'competitor' : 'competitors'} read, {researched.established} established
          {anchors.length > 0 ? `, the numbers anchored on ${anchors.join(', ')}` : ', no established anchor'}.
        </p>
        {marketRate ? (
          <p className="text-read">{marketRate}</p>
        ) : (
          <p className="text-small text-muted-foreground">No market rate summary came back with this draft; the competitor tiers below are the rate.</p>
        )}
      </div>

      {/* b. billing model: the switch selects the first plan on that billing; the models no plan uses are notes */}
      {models.length > 0 && (
        <div className="grid gap-2">
          <MetaLabel>Billing model</MetaLabel>
          {implemented.length > 0 && (
            <Segmented
              ariaLabel="Billing model"
              value={billing}
              onChange={changeBilling}
              options={implemented.map((m) => ({ value: m.model, label: m.model }))}
            />
          )}
          {selectedModel && (selectedModel.fit || selectedModel.why) && (
            <p className="flex flex-wrap items-center gap-2 text-small text-muted-foreground">
              {selectedModel.fit && (
                <Badge tone={FIT[selectedModel.fit]?.tone ?? 'neutral'}>{FIT[selectedModel.fit]?.word ?? selectedModel.fit}</Badge>
              )}
              {selectedModel.why && <span>{selectedModel.why}</span>}
            </p>
          )}
          {alsoConsidered.length > 0 && (
            <div className="grid gap-0.5">
              {alsoConsidered.map((m) => (
                <p key={m.model} className="text-small text-muted-foreground">
                  Also considered: {m.model}{m.fit ? `: ${FIT[m.fit]?.word ?? m.fit}` : ''}{m.why ? `, ${m.why}` : ''}
                </p>
              ))}
            </div>
          )}
        </div>
      )}

      {/* c. the plans */}
      <div className="grid gap-2">
        <MetaLabel>Plans</MetaLabel>
        <div
          role="radiogroup"
          aria-label="Plans"
          className={cn('grid gap-3', options.length === 2 && 'lg:grid-cols-2', options.length >= 3 && 'lg:grid-cols-3')}
        >
          {options.map((o, i) => (
            <PlanCard key={i} option={o} recommended={i === 0} selected={i === selectedIdx} disabled={disabled || saving} onSelect={() => choose(i)} />
          ))}
        </div>
        {options.length === 1 && (
          <p className="text-small text-muted-foreground">Only the recommended plan came back with this draft. Regenerate to get two alternatives on other billing models.</p>
        )}
      </div>

      {/* d. the selected plan's tiers */}
      {sel && (
        <div className="grid gap-2">
          <MetaLabel>Your tiers: {sel.name}</MetaLabel>
          <div className="grid gap-2">
            {tiers.map((t, i) => {
              const base = sel.tiers[i];
              const recPrice = base ? base.price_usd_month : null;
              const changed = Boolean(base) && recPrice !== t.price_usd_month;
              const why = rationaleByName.get(t.name);
              return (
                <div key={i} className={cn('grid gap-3 rounded-card border border-border p-4 sm:grid-cols-[minmax(0,1fr)_11rem] sm:items-start', !t.included && 'opacity-70')}>
                  <div className="grid gap-1.5">
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                      <span className="text-body font-medium">{t.name}</span>
                      <label htmlFor={`tier-included-${i}`} className="inline-flex items-center gap-2 text-small">
                        <Checkbox
                          id={`tier-included-${i}`}
                          checked={t.included}
                          disabled={disabled || saving}
                          onChange={(e) => {
                            const on = e.target.checked;
                            setTiers((cur) => cur.map((x, j) => (j === i ? { ...x, included: on } : x)));
                          }}
                        />
                        Included
                      </label>
                    </div>
                    {asStr(t.who_its_for) && <p className="text-small text-muted-foreground">{asStr(t.who_its_for)}</p>}
                    {(t.includes ?? []).length > 0 && <p className="text-small text-muted-foreground">Includes {(t.includes ?? []).join(', ')}.</p>}
                    {why && <p className="text-small text-muted-foreground">{why}</p>}
                  </div>
                  <Field label="USD per month" htmlFor={`tier-price-${i}`} helper={changed ? `Recommended ${recPrice == null ? 'no price' : usd(recPrice)}` : undefined}>
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
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* e. revenue check */}
      <div className="grid gap-2">
        <MetaLabel>Revenue check</MetaLabel>
        <div className="grid gap-3 sm:grid-cols-[14rem_minmax(0,1fr)] sm:items-end">
          <Field label="Paying customers per month" htmlFor="pricing-customers">
            <Input
              id="pricing-customers"
              type="number"
              min={0}
              step={1}
              inputMode="numeric"
              value={customersRaw}
              className="font-mono"
              onChange={(e) => setCustomersRaw(e.target.value)}
            />
          </Field>
          <p className="text-body" aria-live="polite">{revenueLine}</p>
        </div>
      </div>

      {/* f. use it */}
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant={dirty ? 'primary' : 'secondary'}
          disabled={disabled || !sel || kept.length === 0 || !dirty}
          loading={saving}
          loadingLabel="Saving"
          onClick={commit}
        >
          Use this pricing
        </Button>
        {chosen && (
          <Button variant="ghost" disabled={disabled || saving} onClick={clear}>Clear the choice</Button>
        )}
        <span className="text-small text-muted-foreground">
          {kept.length} of {tiers.length} tiers included{savedBilling ? `, ${savedBilling}` : ''}.
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
  const optionCount = asArr(pricing?.options).length;
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
            Two decisions, in order. <strong className="font-medium">First choose the pricing you will launch with</strong>: a
            billing model and a plan, drafted from what real competitors charge. <strong className="font-medium">Then approve your store listing</strong>, the page
            copy a visitor reads before signing up.
          </>
        }
        detail="Both are drafted from your approved profile. The numbers are only as strong as the established competitors they are anchored on; a list of niche names is a reason to distrust them."
      />

      {neither && !runningKind && (
        <HonestEmpty
          fact="No pricing or listing drafts yet."
          reason="Launch Kit finds who actually competes with you, reads their pricing pages, drafts three plans on different billing models with the revenue each brings, and rewrites your store listing from the approved profile."
          runKind="pricing"
          action={<Button variant="secondary" onClick={runBoth}>Draft pricing and listing</Button>}
        />
      )}

      {/* ---- Step 1: Pricing ---- */}
      {(pricing || runningKind === 'pricing' || (!neither && !pricing)) && (
        <Card>
          <CardHeader
            title="Step 1 of 2: Pricing"
            description="The plan you will charge for, drafted from competitor pricing pages. Pick a billing model and a plan, include or price its tiers, check the revenue, and use it."
            actions={
              <>
                {pricing && <StatusStamp kind={chosenPricing ? 'go' : 'hold'} label={chosenPricing ? 'Chosen' : 'Not chosen'} />}
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
              <span className="text-shimmer text-small">Finding who competes with you, reading their pricing pages, then drafting three plans</span>
            ) : pricing ? (
              <div className="grid gap-6">
                {recommendation || optionCount > 0 ? (
                  <PricingChooser
                    key={`${chosenPricing?.chosen_at ?? 'new'}:${optionCount}:${asArr(recommendation?.tiers).length}`}
                    projectId={project.id}
                    pricing={pricing}
                    rec={recommendation}
                    researched={{ read: competitors.length, established: established.length }}
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
                        Each name recurred in independent comparisons before it was counted; the tiers are what its pricing page says today. This is what the plans above are anchored on.
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
                    optionCount > 0 ? `${optionCount} plan ${optionCount === 1 ? 'option' : 'options'} drafted from the research` : 'Plan options not drafted; the recommendation stands alone',
                    asStr(confidence.notes) || undefined,
                  ].filter(Boolean) as string[]}
                />
                <RawData data={pricing} />
              </div>
            ) : (
              <HonestEmpty
                fact="No pricing draft yet."
                reason="Launch Kit finds who actually competes with you, reads their pricing pages and drafts three plans on different billing models, with the revenue each brings."
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
            description="Your app's page copy, title through FAQ, for the RocketRide App Store and any directory that lists you: posts announce, this page converts the visitor who arrives. Read it as a visitor would, then approve it."
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
