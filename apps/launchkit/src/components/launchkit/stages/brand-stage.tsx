import * as React from 'react';
import { Check, ExternalLink } from 'lucide-react';
import { useProject } from '../project-provider';
import { Card, CardHeader, CardBody, HonestEmpty, LockedGate, Orient, RawData, Well } from '../stage-common';
import { Button } from '@launchkit/design-system/components/button';
import { CopyButton } from '@launchkit/design-system/components/copy-button';
import { StatusStamp, Badge } from '@launchkit/design-system/components/status-stamp';
import { ProvenanceLine } from '@launchkit/design-system/components/provenance-line';
import { api } from '../../../data/api';

const asStr = (v: unknown) => (v == null ? '' : String(v));
const asArr = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);
const asObj = (v: unknown): Record<string, unknown> =>
  v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {};

function MetaLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-label text-muted-foreground">{children}</p>
  );
}

function Chips({ items }: { items: unknown[] }) {
  if (items.length === 0) return null;
  return (
    <p className="mt-1 flex flex-wrap gap-1.5">
      {items.map((k, i) => (
        <Badge key={i} tone="neutral">
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
            <span
              aria-hidden
              className="size-5 rounded-full border border-border"
              style={{ background: value }}
            />
            <span className="font-mono text-data">{value}</span>
            {asStr(col.role) && (
              <span className="text-label text-muted-foreground">{asStr(col.role)}</span>
            )}
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

export function BrandStage() {
  const { project, gate1, brandDna, brandCampaigns, running, runJob, refresh } = useProject();
  if (!project) return null;
  if (!gate1) return <LockedGate />;

  const runningKind = running?.kind;
  const dna = brandDna;
  const voice = asObj(dna?.voice);
  const messaging = asObj(dna?.messaging);
  const visual = asObj(dna?.visual);
  const dosDonts = asObj(dna?.dos_and_donts);
  const confidence = asObj(dna?.confidence);
  const typography = asObj(visual.typography);
  const campaigns = asArr(brandCampaigns?.campaigns) as Campaign[];
  const chosenAngles = asArr((project as unknown as Record<string, unknown> | null)?.selected_campaigns).map(asStr);
  const neither = !dna && !brandCampaigns;

  return (
    <div className="grid gap-4">
      {neither && !runningKind && (
        <HonestEmpty
          fact="No Business DNA yet."
          reason="Launch Kit reads your live site and extracts the brand, voice, vocabulary, observed colors and type, key messages. Every asset and campaign after this is written in that voice."
          action={
            <Button
              variant="secondary"
              onClick={() => runJob('brand_dna', () => api.runStage(project.id, 'brand_dna'))}
            >
              Extract Business DNA
            </Button>
          }
        />
      )}

      {/* purpose before data — what happened, what to check */}
      {(dna || campaigns.length > 0) && (
        <Orient
          runKind="brand_dna"
          lead={
            <>
              Launch Kit read your live site and wrote down your brand, the voice every post and
              campaign will be written in.{' '}
              <strong className="font-medium">Check it sounds like you</strong>, re-extract if it
              doesn&rsquo;t.
            </>
          }
          detail="Everything here was observed on your site, voice, colors, and type come with evidence, never invention."
        />
      )}

      <div className="grid items-start gap-4 lg:grid-cols-2">
        {/* ---- Business DNA ---- */}
        <Card>
          <CardHeader
            title="Business DNA"
            actions={
              <>
              {dna && <StatusStamp kind="hold" />}
              {dna && (
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={Boolean(runningKind)}
                  onClick={() =>
                    runJob('brand_dna', () => api.runStage(project.id, 'brand_dna')).then(refresh)
                  }
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
              <div className="grid gap-4">
                <div>
                  <p className="text-heading">{asStr(dna.brand_name) || project.name}</p>
                  {asStr(dna.tagline_observed) && (
                    <p className="mt-1 text-read italic text-muted-foreground">
                      “{asStr(dna.tagline_observed)}”
                    </p>
                  )}
                </div>
                {asArr(voice.tone_words).length > 0 && (
                  <div>
                    <MetaLabel>Voice</MetaLabel>
                    <Chips items={asArr(voice.tone_words)} />
                    {asStr(voice.sentence_style) && (
                      <p className="mt-1 text-read">{asStr(voice.sentence_style)}</p>
                    )}
                  </div>
                )}
                {asArr(voice.vocabulary).length > 0 && (
                  <div>
                    <MetaLabel>Vocabulary the brand uses</MetaLabel>
                    <Chips items={asArr(voice.vocabulary)} />
                  </div>
                )}
                {asArr(messaging.key_messages).length > 0 && (
                  <div>
                    <MetaLabel>Key messages</MetaLabel>
                    <ul className="mt-1 grid list-disc gap-1 pl-5">
                      {asArr(messaging.key_messages).map((m, i) => (
                        <li key={i} className="text-read">
                          {String(m)}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <div>
                  <MetaLabel>Observed colors</MetaLabel>
                  {asArr(visual.colors).length > 0 ? (
                    <Swatches colors={asArr(visual.colors)} />
                  ) : (
                    <p className="mt-1 text-body text-muted-foreground">
                      None observable in the scraped pages, see confidence notes.
                    </p>
                  )}
                </div>
                {(asStr(typography.headings) || asStr(typography.body)) && (
                  <div>
                    <MetaLabel>Typography</MetaLabel>
                    <p className="mt-1 text-read">
                      {[
                        asStr(typography.headings) && `Headings: ${asStr(typography.headings)}`,
                        asStr(typography.body) && `Body: ${asStr(typography.body)}`,
                      ]
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
                        {asArr(dosDonts.do).map((d, i) => (
                          <li key={i} className="text-body">
                            {String(d)}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <MetaLabel>Don’t</MetaLabel>
                      <ul className="mt-1 grid list-disc gap-1 pl-5">
                        {asArr(dosDonts.dont).map((d, i) => (
                          <li key={i} className="text-body">
                            {String(d)}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
                {asArr(dna.sources_read).length > 0 && (
                  <div>
                    <MetaLabel>Sources read, {asArr(dna.sources_read).length}</MetaLabel>
                    <ul className="mt-1 grid gap-0.5">
                      {asArr(dna.sources_read).map((u, i) => (
                        <li key={i}>
                          <a
                            href={String(u)}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 break-all font-mono text-data text-link hover:text-link-hover"
                          >
                            {String(u)} <ExternalLink size={12} strokeWidth={1.75} aria-hidden />
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <ProvenanceLine
                  parts={[
                    'Extracted from the live site only; nothing invented',
                    asStr(confidence.notes) || undefined,
                  ].filter(Boolean) as string[]}
                />
                <RawData data={dna} />
              </div>
            ) : (
              !neither && (
                <HonestEmpty
                  fact="No Business DNA yet."
                  reason="Launch Kit reads your live site and extracts the brand identity every downstream draft should follow."
                  action={
                    <Button
                      variant="secondary"
                      disabled={Boolean(runningKind)}
                      onClick={() => runJob('brand_dna', () => api.runStage(project.id, 'brand_dna'))}
                    >
                      Extract Business DNA
                    </Button>
                  }
                />
              )
            )}
          </CardBody>
        </Card>

        {/* ---- Campaigns ---- */}
        <Card>
          <CardHeader
            title="Campaign angles"
            actions={
              <>
              {campaigns.length > 0 && <StatusStamp kind="hold" />}
              {campaigns.length > 0 && (
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={Boolean(runningKind)}
                  onClick={() =>
                    runJob('brand_campaigns', () =>
                      api.runStage(project.id, 'brand_campaigns'),
                    ).then(refresh)
                  }
                >
                  Regenerate
                </Button>
              )}
              </>
            }
          />
          <CardBody>
            <p className="mb-3 text-body text-muted-foreground">
              An angle is the story and where to tell it, not a post. Choose the angles you would
              run; Social Launch writes each platform&rsquo;s post from your chosen angle, in this
              brand voice. The sample copy is an illustration of the angle, never the post itself.
            </p>
            {runningKind === 'brand_campaigns' ? (
              <span className="text-shimmer text-small">Drafting campaign ideas in your brand voice</span>
            ) : campaigns.length > 0 ? (
              <div className="grid gap-4">
                {campaigns.map((c, i) => {
                  const copy = asObj(c.sample_copy);
                  const copyText = [asStr(copy.headline), '', asStr(copy.body), '', asStr(copy.cta)]
                    .filter(Boolean)
                    .join('\n');
                  return (
                    <div key={i} className="rounded-card border border-border p-5">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-body font-semibold">{asStr(c.name)}</p>
                        {asStr(c.effort) && <Badge tone="neutral">{asStr(c.effort)}</Badge>}
                        <Button
                          variant="secondary"
                          aria-pressed={chosenAngles.includes(asStr(c.name))}
                          size="sm"
                          disabled={Boolean(runningKind)}
                          onClick={async () => {
                            const on = !chosenAngles.includes(asStr(c.name));
                            await api.selectCampaign(project.id, asStr(c.name), on);
                            await refresh();
                          }}
                        >
                          {chosenAngles.includes(asStr(c.name)) ? <><Check aria-hidden />Chosen angle</> : 'Use this angle'}
                        </Button>
                      </div>
                      <p className="mt-1 text-body text-muted-foreground">{asStr(c.objective)}</p>
                      <p className="mt-2 text-read">{asStr(c.big_idea)}</p>
                      <Chips items={asArr(c.channels)} />
                      {asStr(c.hook) && (
                        <p className="mt-2 border-l-2 border-border pl-3 text-read italic">
                          {asStr(c.hook)}
                        </p>
                      )}
                      {copyText && (
                        <Well className="mt-3">
                          <div className="flex items-center justify-between gap-2">
                            <MetaLabel>Sample copy (illustration)</MetaLabel>
                            <CopyButton size="sm" text={copyText} label="Copy" />
                          </div>
                          {asStr(copy.headline) && (
                            <p className="mt-1 text-body font-medium">{asStr(copy.headline)}</p>
                          )}
                          {asStr(copy.body) && (
                            <p className="mt-1 whitespace-pre-wrap text-body">{asStr(copy.body)}</p>
                          )}
                          {asStr(copy.cta) && (
                            <p className="mt-1 font-mono text-data">{asStr(copy.cta)}</p>
                          )}
                        </Well>
                      )}
                      {asStr(c.success_metric) && (
                        <p className="mt-2 text-body">
                          <span className="text-muted-foreground">Measure: </span>
                          {asStr(c.success_metric)}
                        </p>
                      )}
                      {asStr(c.why_on_brand) && (
                        <p className="mt-1 text-body text-muted-foreground">{asStr(c.why_on_brand)}</p>
                      )}
                    </div>
                  );
                })}
                <ProvenanceLine parts={['Generated from the Business DNA and the approved profile']} />
                <RawData data={brandCampaigns} />
              </div>
            ) : (
              <HonestEmpty
                fact="No campaigns yet."
                reason={
                  dna
                    ? 'Launch Kit turns the Business DNA into four to six campaign concepts a solo builder can run, each in your brand voice.'
                    : 'Campaigns are generated from the Business DNA. Extract it first.'
                }
                action={
                  dna ? (
                    <Button
                      variant="secondary"
                      disabled={Boolean(runningKind)}
                      onClick={() =>
                        runJob('brand_campaigns', () => api.runStage(project.id, 'brand_campaigns'))
                      }
                    >
                      Draft campaigns
                    </Button>
                  ) : undefined
                }
              />
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
