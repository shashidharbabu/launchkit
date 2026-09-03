'use client';

import * as React from 'react';
import { ExternalLink } from 'lucide-react';
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
import { StatusStamp } from '@/components/ui/status-stamp';
import { ProvenanceLine } from '@/components/ui/provenance-line';
import { TextShimmer } from '@/components/motion-primitives/text-shimmer';
import { Table, Th, Tr, Td } from '@/components/ui/table';
import { api } from '@/lib/api';

const asStr = (v: unknown) => (v == null ? '' : String(v));
const asArr = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);

function MetaLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-mono text-meta font-medium uppercase tracking-[0.08em] text-muted-foreground">
      {children}
    </p>
  );
}

/** Generic structured renderer — prose in Reading type, data in mono. */
function DataBlock({ data }: { data: unknown }) {
  if (data == null) return null;
  if (typeof data === 'string' || typeof data === 'number' || typeof data === 'boolean') {
    const s = String(data);
    return /^https?:\/\//.test(s) ? (
      <a href={s} target="_blank" rel="noreferrer" className="break-all font-mono text-data text-link hover:text-link-hover">
        {s}
      </a>
    ) : (
      <p className="text-read leading-[1.625rem]">{s}</p>
    );
  }
  if (Array.isArray(data)) {
    return (
      <ul className="grid list-disc gap-1 pl-5">
        {data.map((item, i) => (
          <li key={i} className="text-read leading-[1.625rem]">
            {typeof item === 'object' ? <DataBlock data={item} /> : String(item)}
          </li>
        ))}
      </ul>
    );
  }
  return (
    <div className="grid gap-2">
      {Object.entries(data as Record<string, unknown>).map(([k, v]) => (
        <div key={k}>
          <MetaLabel>{k.replaceAll('_', ' ')}</MetaLabel>
          <div className="mt-0.5">
            <DataBlock data={v} />
          </div>
        </div>
      ))}
    </div>
  );
}

type RecTier = {
  name?: string;
  price?: unknown;
  includes?: unknown[];
  key_limits?: unknown;
  who_its_for?: unknown;
  [k: string]: unknown;
};

/** The pipeline emits price under varying keys (price, price_usd_month, …). */
function tierPrice(t: RecTier): string {
  if (t.price != null && asStr(t.price)) {
    const p = asStr(t.price);
    return /^\d+(\.\d+)?$/.test(p) ? `$${p}` : p;
  }
  const key = Object.keys(t).find((k) => /price/i.test(k) && t[k] != null && asStr(t[k]) !== '');
  if (!key) return '—';
  const v = asStr(t[key]);
  const num = /^\d+(\.\d+)?$/.test(v);
  const perMonth = /month|mo\b|_mo/i.test(key);
  if (num) return `$${v}${perMonth ? '/mo' : ''}`;
  return v;
}

/**
 * The tiers Launch Kit recommends, rendered the way a builder will actually
 * publish them — as a pricing table, not a key/value dump. The rationale and
 * the names the numbers are anchored on sit right under it, because the tiers
 * are only as trustworthy as their anchors.
 */
function RecommendationView({ rec }: { rec: Record<string, unknown> }) {
  const tiers = asArr(rec.tiers) as RecTier[];
  const anchors = asArr(rec.anchor_competitors);
  const risks = asArr(rec.risks);
  const model = asStr(rec.pricing_model) || asStr(rec.model);
  const rationale = asStr(rec.rationale) || asStr(rec.positioning_note);
  const known = ['pricing_model', 'model', 'tiers', 'anchor_competitors', 'rationale',
    'positioning_note', 'risks'];
  const rest = Object.fromEntries(Object.entries(rec).filter(([k]) => !known.includes(k)));

  return (
    <div className="grid gap-3">
      {tiers.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {tiers.map((t, i) => {
            const limits = Array.isArray(t.key_limits)
              ? t.key_limits.map(String).join(' · ')
              : asStr(t.key_limits);
            const audience = asStr(t.who_its_for);
            return (
              <div key={i} className="grid content-start gap-2 rounded-sm border border-border p-3">
                <MetaLabel>{asStr(t.name) || `Tier ${i + 1}`}</MetaLabel>
                <p className="text-title font-semibold">{tierPrice(t)}</p>
                {audience && <p className="text-body text-muted-foreground">{audience}</p>}
                {asArr(t.includes).length > 0 && (
                  <ul className="grid gap-1">
                    {asArr(t.includes).map((inc, j) => (
                      <li key={j} className="text-body">
                        — {String(inc)}
                      </li>
                    ))}
                  </ul>
                )}
                {limits && <p className="text-body text-muted-foreground">{limits}</p>}
              </div>
            );
          })}
        </div>
      )}
      {rationale && <p className="text-read leading-[1.625rem]">{rationale}</p>}
      {(model || anchors.length > 0) && (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          {model && (
            <span className="bg-muted px-1.5 py-0.5 font-mono text-data">{model}</span>
          )}
          {anchors.length > 0 && (
            <span className="text-body text-muted-foreground">
              anchored on{' '}
              <span className="text-foreground">{anchors.map(String).join(', ')}</span>
            </span>
          )}
        </div>
      )}
      {risks.length > 0 && (
        <div>
          <MetaLabel>Risks</MetaLabel>
          <ul className="mt-1 grid gap-1">
            {risks.map((r, i) => (
              <li key={i} className="text-body text-muted-foreground">
                — {String(r)}
              </li>
            ))}
          </ul>
        </div>
      )}
      {Object.keys(rest).length > 0 && <DataBlock data={rest} />}
    </div>
  );
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
 * as the names it is anchored to, so standing is shown in the table rather
 * than buried in the JSON — a row of "niche" is a reason to distrust the
 * numbers. Never colour alone: the word carries the meaning (color.md).
 */
function Standing({ notability, mentions, evidence }: {
  notability?: string;
  mentions?: number;
  evidence?: string;
}) {
  if (!notability) return <span className="text-muted-foreground">—</span>;
  const tone =
    notability === 'established' ? 'text-go'
    : notability === 'emerging' ? 'text-hold'
    : 'text-muted-foreground';
  return (
    <span
      title={evidence || undefined}
      className={`font-mono text-meta font-medium uppercase tracking-[0.08em] ${tone}`}
    >
      {notability}
      {typeof mentions === 'number' && (
        <span className="ml-1 text-muted-foreground">·{mentions}</span>
      )}
    </span>
  );
}

export function CommercialStage() {
  const { project, gate1, pricing, listing, running, runJob, refresh } = useProject();
  if (!project) return null;
  if (!gate1) return <LockedGate />;

  const runBoth = () =>
    runJob('pricing', () => api.runStage(project.id, 'pricing')).then(() =>
      runJob('listing', () => api.runStage(project.id, 'listing')),
    );

  const competitors = (Array.isArray(pricing?.competitors) ? pricing.competitors : []) as Competitor[];
  const rejected = (Array.isArray(pricing?.rejected) ? pricing.rejected : []) as Rejected[];
  const established = competitors.filter((c) => c.notability === 'established');
  const recommendation = pricing?.recommendation;
  const neither = !pricing && !listing;
  const runningKind = running?.kind;

  const listingCopyText = listing
    ? [
        asStr(listing.title),
        asStr(listing.tagline),
        '',
        asStr(listing.description_short),
        '',
        asStr(listing.description_long),
      ]
        .filter(Boolean)
        .join('\n')
    : '';

  return (
    <div className="grid gap-4">
      {neither && !runningKind && (
        <HonestEmpty
          fact="No pricing or listing drafts yet."
          reason="Launch Kit reads real competitor pricing pages, recommends tiers, and rewrites your store listing from the approved profile."
          action={
            <Button variant="secondary" onClick={runBoth}>
              Draft pricing & listing
            </Button>
          }
        />
      )}

      {/* purpose before data — what happened, what to check */}
      {(pricing || listing) && (
        <Orient
          lead={
            <>
              Launch Kit priced your app against real competitors and rewrote your store listing.{' '}
              <strong className="font-medium">Check the tiers and the copy</strong> — regenerate
              anything that reads wrong.
            </>
          }
          detail="Drafted from your approved profile. The numbers are only as strong as the “established” competitors they’re anchored on — a column of “niche” is a reason to distrust them."
        />
      )}

      <div className="grid items-start gap-4 lg:grid-cols-2">
        {/* ---- pricing ---- */}
        <Card>
          <div className="flex items-center justify-between gap-3 px-4 py-3">
            <MetaLabel>Pricing</MetaLabel>
            <div className="flex items-center gap-2">
              {pricing && <StatusStamp kind="hold" />}
              {pricing && (
                <Button
                  variant="secondary"
                  size="compact"
                  disabled={Boolean(runningKind)}
                  onClick={() => runJob('pricing', () => api.runStage(project.id, 'pricing')).then(refresh)}
                >
                  Regenerate
                </Button>
              )}
            </div>
          </div>
          <div className="border-t border-border px-4 py-4">
            {runningKind === 'pricing' ? (
              <TextShimmer duration={2} className="text-body">
                Reading competitor pricing pages…
              </TextShimmer>
            ) : pricing ? (
              <div className="grid gap-4">
                {recommendation != null && (
                  <div>
                    <MetaLabel>Recommendation</MetaLabel>
                    <div className="mt-2">
                      {typeof recommendation === 'object' && !Array.isArray(recommendation) ? (
                        <RecommendationView rec={recommendation as Record<string, unknown>} />
                      ) : (
                        <DataBlock data={recommendation} />
                      )}
                    </div>
                  </div>
                )}
                {competitors.length > 0 && (
                  <div>
                    <MetaLabel>Competitors read — {competitors.length}</MetaLabel>
                    <div className="mt-1 overflow-x-auto">
                      <Table>
                        <thead>
                          <tr>
                            <Th>Name</Th>
                            <Th>Standing</Th>
                            <Th>Model</Th>
                            <Th numeric>Tiers</Th>
                            <Th>Source</Th>
                          </tr>
                        </thead>
                        <tbody>
                          {competitors.map((c, i) => (
                            <Tr key={i}>
                              <Td className="font-medium">{asStr(c.name)}</Td>
                              <Td>
                                <Standing
                                  notability={c.notability}
                                  mentions={c.mentions}
                                  evidence={c.evidence_of_standing}
                                />
                              </Td>
                              <Td className="text-muted-foreground">{asStr(c.pricing_model)}</Td>
                              <Td numeric>{Array.isArray(c.tiers) ? c.tiers.length : '—'}</Td>
                              <Td>
                                {(c.source_url || c.url) && (
                                  <a
                                    href={asStr(c.source_url || c.url)}
                                    target="_blank"
                                    rel="noreferrer"
                                    aria-label={`Pricing page for ${asStr(c.name)}`}
                                    className="inline-flex items-center gap-1 font-mono text-data text-link hover:text-link-hover"
                                  >
                                    page <ExternalLink size={12} strokeWidth={1.5} />
                                  </a>
                                )}
                              </Td>
                            </Tr>
                          ))}
                        </tbody>
                      </Table>
                    </div>
                  </div>
                )}
                {rejected.length > 0 && (
                  <div>
                    <MetaLabel>Not counted as competitors — {rejected.length}</MetaLabel>
                    <ul className="mt-1 grid gap-1">
                      {rejected.map((r, i) => (
                        <li key={i} className="text-body text-muted-foreground">
                          <span className="text-foreground">{asStr(r.name)}</span> — {asStr(r.why)}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <ProvenanceLine
                  parts={[
                    'drafted from approved profile + competitor pricing pages',
                    established.length > 0
                      ? `anchored on ${established.length} established ${established.length === 1 ? 'competitor' : 'competitors'}`
                      : 'no established competitor found — treat these numbers as weak',
                  ]}
                />
                <RawData data={pricing} />
              </div>
            ) : (
              !neither && (
                <HonestEmpty
                  fact="No pricing draft yet."
                  reason="Launch Kit reads competitor pricing pages and recommends tiers for your app."
                  action={
                    <Button
                      variant="secondary"
                      disabled={Boolean(runningKind)}
                      onClick={() => runJob('pricing', () => api.runStage(project.id, 'pricing'))}
                    >
                      Draft pricing
                    </Button>
                  }
                />
              )
            )}
          </div>
        </Card>

        {/* ---- listing ---- */}
        <Card>
          <div className="flex items-center justify-between gap-3 px-4 py-3">
            <MetaLabel>Listing</MetaLabel>
            <div className="flex items-center gap-2">
              {listing && <StatusStamp kind="hold" />}
              {listing && <CopyButton size="compact" text={listingCopyText} label="Copy listing" />}
              {listing && (
                <Button
                  variant="secondary"
                  size="compact"
                  disabled={Boolean(runningKind)}
                  onClick={() => runJob('listing', () => api.runStage(project.id, 'listing')).then(refresh)}
                >
                  Regenerate
                </Button>
              )}
            </div>
          </div>
          <div className="border-t border-border px-4 py-4">
            {runningKind === 'listing' ? (
              <TextShimmer duration={2} className="text-body">
                Rewriting your store listing…
              </TextShimmer>
            ) : listing ? (
              <div className="grid gap-4">
                <div>
                  <p className="text-heading font-semibold">{asStr(listing.title)}</p>
                  {asStr(listing.tagline) && (
                    <p className="mt-1 text-read italic leading-[1.625rem] text-muted-foreground">
                      {asStr(listing.tagline)}
                    </p>
                  )}
                </div>
                {asStr(listing.description_short) && (
                  <div>
                    <MetaLabel>Short description</MetaLabel>
                    <p className="mt-0.5 text-read leading-[1.625rem]">{asStr(listing.description_short)}</p>
                  </div>
                )}
                {asStr(listing.description_long) && (
                  <div>
                    <MetaLabel>Long description</MetaLabel>
                    <p className="mt-0.5 whitespace-pre-wrap text-read leading-[1.625rem]">
                      {asStr(listing.description_long)}
                    </p>
                  </div>
                )}
                {Array.isArray(listing.keywords) && listing.keywords.length > 0 && (
                  <div>
                    <MetaLabel>Keywords</MetaLabel>
                    <p className="mt-1 flex flex-wrap gap-1.5">
                      {(listing.keywords as unknown[]).map((k, i) => (
                        <span key={i} className="bg-muted px-1.5 py-0.5 font-mono text-data">
                          {String(k)}
                        </span>
                      ))}
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
                          <p className="text-read leading-[1.625rem] text-muted-foreground">{asStr(f.a)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {asStr(listing.cta) && (
                  <div>
                    <MetaLabel>Call to action</MetaLabel>
                    <p className="mt-0.5 text-read leading-[1.625rem]">{asStr(listing.cta)}</p>
                  </div>
                )}
                {Array.isArray(listing.changes_from_current) && listing.changes_from_current.length > 0 && (
                  <div>
                    <MetaLabel>Changes from current</MetaLabel>
                    <ul className="mt-1 grid list-disc gap-1 pl-5">
                      {(listing.changes_from_current as unknown[]).map((c, i) => (
                        <li key={i} className="text-body">
                          {String(c)}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <ProvenanceLine parts={['drafted from approved profile + current listing']} />
                <RawData data={listing} />
              </div>
            ) : (
              !neither && (
                <HonestEmpty
                  fact="No listing draft yet."
                  reason="Launch Kit rewrites your store listing for conversion, from the approved profile."
                  action={
                    <Button
                      variant="secondary"
                      disabled={Boolean(runningKind)}
                      onClick={() => runJob('listing', () => api.runStage(project.id, 'listing'))}
                    >
                      Draft listing
                    </Button>
                  }
                />
              )
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
