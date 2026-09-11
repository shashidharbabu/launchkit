import * as React from 'react';
import { toast } from 'sonner';
import { AtSign, Briefcase, ExternalLink, FileText, Mail, MessagesSquare, Newspaper, RefreshCw, Rocket, type LucideIcon } from 'lucide-react';
import { useProject } from '../project-provider';
import { Card, CardBody, CardFooter, CardHeader, LockedGate, Orient, RawData, Well } from '../stage-common';
import { Button } from '@launchkit/design-system/components/button';
import { CopyButton } from '@launchkit/design-system/components/copy-button';
import { StatusStamp, Badge } from '@launchkit/design-system/components/status-stamp';
import { Banner } from '@launchkit/design-system/components/banner';
import { ProvenanceLine } from '@launchkit/design-system/components/provenance-line';
import { Field, Textarea } from '@launchkit/design-system/components/field';
import { cn } from '@launchkit/design-system/lib/cn';
import {
  MorphingDialog,
  MorphingDialogTrigger,
  MorphingDialogContainer,
  MorphingDialogContent,
  MorphingDialogClose,
  MorphingDialogTitle,
} from '@launchkit/design-system/motion/morphing-dialog';
import { api } from '../../../data/api';
import { ASSET_LABELS, ASSET_TYPES } from '../../../lib/asset-types';
import { fillDeep, pickUrl, shareLinks, type ShareLink } from '../../../lib/share';
import { rulesFor } from '../../../data/rules';
import { actionError } from '../../../lib/errors';
import { DUR, EASE_STANDARD } from '../../../lib/motion';
import type { AssetRow } from '../../../lib/types';
import { useNav } from '../../../nav';

const asStr = (v: unknown) => (v == null ? '' : String(v));

/** Generic medium icons: the platform name carries the meaning, never the icon alone. */
const ASSET_ICONS: Record<string, LucideIcon> = {
  x_post: AtSign,
  linkedin_post: Briefcase,
  reddit_post: MessagesSquare,
  producthunt: Rocket,
  show_hn: Newspaper,
  newsletter_pitch: Mail,
};

/** Fields that read as paste-ready text, in preference order per type. */
const SKIP_KEYS = new Set(['warnings', 'confidence']);

function assetParagraphs(data: Record<string, unknown>): Array<{ label: string; text: string }> {
  const out: Array<{ label: string; text: string }> = [];
  for (const [k, v] of Object.entries(data)) {
    if (SKIP_KEYS.has(k)) continue;
    if (typeof v === 'string' && v.trim()) {
      out.push({ label: k.replaceAll('_', ' '), text: v });
    } else if (Array.isArray(v) && v.length > 0) {
      out.push({
        label: k.replaceAll('_', ' '),
        text: v
          .map((item, i) =>
            typeof item === 'object' && item !== null
              ? `${i + 1}. ${Object.values(item as Record<string, unknown>).map(asStr).join(', ')}`
              : `• ${asStr(item)}`,
          )
          .join('\n'),
      });
    } else if (typeof v === 'number') {
      out.push({ label: k.replaceAll('_', ' '), text: String(v) });
    }
  }
  return out;
}

function assetCopyText(data: Record<string, unknown>): string {
  return assetParagraphs(data)
    .map((p) => p.text)
    .join('\n\n');
}

function AssetBody({ data, full }: { data: Record<string, unknown>; full?: boolean }) {
  const paras = assetParagraphs(data);
  const shown = full ? paras : paras.slice(0, 3);
  return (
    <div className="grid gap-3">
      {shown.map((p) => (
        <div key={p.label}>
          <p className="text-label text-muted-foreground">{p.label}</p>
          <p className="mt-1 whitespace-pre-wrap text-read">{p.text}</p>
        </div>
      ))}
      {!full && paras.length > 3 && (
        <p className="text-body text-muted-foreground">
          + {paras.length - 3} more section{paras.length - 3 === 1 ? '' : 's'}: open to read all
        </p>
      )}
    </div>
  );
}

/**
 * The draft box beside a platform tile: the latest version of that platform's
 * post, its warnings, provenance, the regenerate well and the actions row.
 */
function AssetCard({
  asset,
  name,
  emberApprove,
  drafting,
}: {
  asset: AssetRow;
  /** The rulebook's platform name, the same word the tile and its button use. */
  name: string;
  /** One ember verb per view: only the first pending draft gets the fill. */
  emberApprove: boolean;
  /** A new version of this platform's post is being written right now. */
  drafting: boolean;
}) {
  const { project, runJob, refresh, setError, running } = useProject();
  const [feedback, setFeedback] = React.useState('');
  const [approving, setApproving] = React.useState(false);
  if (!project) return null;

  const approved = asset.status === 'approved';
  const warnings = Array.isArray(asset.data.warnings) ? asset.data.warnings.map(asStr) : [];
  const label = ASSET_LABELS[asset.asset_type] ?? asset.asset_type.toUpperCase();
  // the draft carries {APP_URL}; the card shows, copies and shares the real address
  const appUrl = pickUrl(project as unknown as Record<string, unknown>);
  const data = fillDeep(asset.data as Record<string, unknown>, appUrl);
  const fixed = typeof data.punctuation_fixed === 'number' ? data.punctuation_fixed : 0;
  const verbsFixed = typeof data.wording_fixed === 'number' ? data.wording_fixed : 0;
  const links = shareLinks(
    asset.asset_type,
    data,
    appUrl,
    typeof data.subreddit === 'string' ? data.subreddit : undefined,
  );
  // the referral-button pattern: open the platform's composer with the draft in it
  const share = async (l: ShareLink) => {
    if (l.copyFirst) {
      try {
        await navigator.clipboard.writeText(l.copyFirst);
      } catch {
        /* clipboard blocked: the composer still opens */
      }
    }
    window.open(l.href, '_blank', 'noopener,noreferrer');
    if (l.note) toast(l.note);
  };

  return (
    <Card>
      {/* header: which version this is and where it stands; the tile beside it names the platform */}
      <div className="flex flex-wrap items-center gap-2.5 px-6 pb-2 pt-5">
        <span className="text-heading">Latest draft, v{asset.version}</span>
        <StatusStamp kind={approved ? 'go' : 'hold'} />
        {drafting && (
          <span role="status" className="text-shimmer text-small">{`Redrafting the ${name} post`}</span>
        )}
      </div>

      <div className="px-6 pb-5">
        {warnings.length > 0 && (
          <Banner tone="hold" title={`${warnings.length} warning${warnings.length === 1 ? '' : 's'} from the draft check`} className="mb-4">
            <ul className="grid list-disc gap-1 pl-5">
              {warnings.map((w, i) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
          </Banner>
        )}

        {/* draft in a muted well; opens to a full reading view */}
        <MorphingDialog transition={{ duration: DUR.slow, ease: EASE_STANDARD }}>
          <MorphingDialogTrigger className="block w-full">
            <Well className="py-4 text-left">
              <AssetBody data={data} />
            </Well>
          </MorphingDialogTrigger>
          <MorphingDialogContainer>
            <MorphingDialogContent className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-panel border border-border bg-surface-raised p-6 shadow-overlay">
              <div className="mb-4 flex items-start justify-between gap-3">
                <MorphingDialogTitle>
                  <span className="text-heading">{label}</span>
                </MorphingDialogTitle>
                <MorphingDialogClose />
              </div>
              <AssetBody data={data} full />
            </MorphingDialogContent>
          </MorphingDialogContainer>
        </MorphingDialog>

        <ProvenanceLine parts={['Drafted from the approved profile', `v${asset.version}`]} />
        <div className="mt-3">
          <RawData data={data} />
        </div>
      </div>

      {/* redraft: always visible, its own section; the feedback is the point of the review */}
      <Well className="mx-6 mb-5 grid gap-3 py-4">
        <div className="flex items-center gap-2">
          <RefreshCw size={16} strokeWidth={1.75} aria-hidden className="text-muted-foreground" />
          <span className="text-body font-medium">Redraft with feedback</span>
        </div>
        <p className="text-body text-muted-foreground">
          Not right? Say what should change. The {label} rulebook and the no-dash rule still apply
          to the new draft.
        </p>
        <Field label="What should change?" htmlFor={`fb-${asset.id}`}>
          <Textarea
            id={`fb-${asset.id}`}
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="e.g. shorter, lead with the benchmark, drop the second paragraph"
          />
        </Field>
        <div>
          <Button
            variant="secondary"
            disabled={Boolean(running)}
            loading={drafting}
            loadingLabel="Redrafting"
            aria-label={`Redraft the ${name} post`}
            onClick={() => {
              runJob(`asset:${asset.asset_type}`, () =>
                api.runAsset(project.id, asset.asset_type, undefined, feedback),
              ).then(() => setFeedback(''));
            }}
          >
            Redraft
          </Button>
        </div>
      </Well>
      {/* actions row: below body and provenance, like the gate */}
      <CardFooter className="flex flex-wrap items-center gap-2">
        {!approved && (
          <Button
            variant={emberApprove ? 'flare' : 'secondary'}
            loading={approving}
            loadingLabel="Approving"
            aria-label={`Approve the ${name} draft`}
            onClick={async () => {
              setApproving(true);
              try {
                await api.approveAsset(asset.id);
                toast('Approved');
                await refresh();
              } catch (e) {
                setError(actionError('approve this asset', e));
              } finally {
                setApproving(false);
              }
            }}
          >
            Approve
          </Button>
        )}
        {links.map((l) => (
          <Button key={l.platform} variant="secondary" onClick={() => share(l)}>
            <ExternalLink aria-hidden />
            {l.label}
          </Button>
        ))}
        <CopyButton text={assetCopyText(data)} label="Copy" />
        {(fixed > 0 || verbsFixed > 0) && (
          <span className="text-small text-muted-foreground">
            {[fixed > 0 ? `${fixed} ${fixed === 1 ? 'dash' : 'dashes'} replaced by the punctuation rule` : '', verbsFixed > 0 ? `${verbsFixed} banned ${verbsFixed === 1 ? 'verb' : 'verbs'} swapped for release` : ''].filter(Boolean).join(', ')}
          </span>
        )}
      </CardFooter>
    </Card>
  );
}

/** Where a platform stands: nothing yet, a draft waiting for review, or an approved post. */
type DraftState = 'none' | 'drafted' | 'approved';

/** Tile tint per state. The tint never stands alone: a Badge or a sentence says the same thing. */
const TILE_TONE: Record<DraftState, string> = {
  none: 'border-border bg-surface',
  drafted: 'border-hold bg-hold-soft/30',
  approved: 'border-go bg-go-soft/30',
};

/**
 * The left tile of a platform row: name, what its rulebook optimises for,
 * status in words, and the first Draft. Once a draft exists the verb moves to
 * the card beside it: Redraft, with feedback.
 */
function PlatformTile({
  type,
  latest,
  drafting,
  busy,
  onDraft,
  className,
}: {
  type: string;
  latest: AssetRow | undefined;
  drafting: boolean;
  /** Any job is running: one run at a time, so every Draft button waits. */
  busy: boolean;
  onDraft: () => void;
  className?: string;
}) {
  const rb = rulesFor(type);
  const Icon = ASSET_ICONS[type] ?? FileText;
  const state: DraftState = !latest ? 'none' : latest.status === 'approved' ? 'approved' : 'drafted';
  const line = !latest
    ? `Nothing drafted for ${rb.name} yet.`
    : latest.status === 'approved'
      ? `Version ${latest.version} is approved and enters the plan.`
      : `Version ${latest.version} needs your review.`;
  return (
    <div className={cn('flex flex-col gap-2 rounded-card border p-5', TILE_TONE[state], className)}>
      <div className="flex items-center gap-2">
        <Icon size={16} strokeWidth={1.75} aria-hidden className="shrink-0 text-muted-foreground" />
        <span className="text-body font-medium text-foreground">{rb.name}</span>
      </div>
      <p className="text-body text-muted-foreground">{rb.summary}</p>
      <div className="flex flex-wrap items-center gap-2">
        {state === 'approved' && <Badge tone="go">Approved</Badge>}
        {state === 'drafted' && <Badge tone="hold">Needs review</Badge>}
        <span className="text-small text-muted-foreground">{line}</span>
      </div>
      {state === 'none' && (
        <div className="mt-1">
          <Button
            variant="secondary"
            size="sm"
            disabled={busy}
            loading={drafting}
            loadingLabel="Drafting"
            onClick={onDraft}
          >
            {`Draft for ${rb.name}`}
          </Button>
        </div>
      )}
    </div>
  );
}

/** The right box before a platform has a draft: quiet, dashed, and it says how the draft gets here. */
function DraftPlaceholder({ name, drafting }: { name: string; drafting: boolean }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex items-center rounded-card border border-dashed border-border-strong bg-surface/60 px-6 py-5"
    >
      {drafting ? (
        <span className="text-shimmer text-small">{`Drafting the ${name} post`}</span>
      ) : (
        <p className="text-body text-muted-foreground">
          No draft yet. Press Draft for {name} and it appears here.
        </p>
      )}
    </div>
  );
}

/** The newest version per platform. Rows arrive newest first; the version number settles any tie. */
function latestByType(assets: AssetRow[]): Map<string, AssetRow> {
  const latest = new Map<string, AssetRow>();
  for (const a of assets) {
    const cur = latest.get(a.asset_type);
    if (!cur || a.version > cur.version) latest.set(a.asset_type, a);
  }
  return latest;
}

export function AssetsStage() {
  const { project, gate1, assets, brandCampaigns, running, runJob } = useProject();
  const { go, href } = useNav();
  if (!project) return null;
  if (!gate1) return <LockedGate />;

  const runningAsset = running?.kind.startsWith('asset:') ? running.kind.split(':')[1] : null;
  const chosenAngles = project.selected_campaigns ?? [];
  const campaigns = (Array.isArray(brandCampaigns?.campaigns) ? brandCampaigns.campaigns : []) as Record<string, unknown>[];
  const chosenCampaigns = campaigns.filter((c) => chosenAngles.includes(asStr(c.name)));
  const brandHref = href({ view: 'workspace', projectId: project.id, stage: 'brand' });
  const goBrand = (e: React.MouseEvent) => { e.preventDefault(); go({ view: 'workspace', projectId: project.id, stage: 'brand' }); };
  // one row per platform, in catalogue order; the box beside each tile shows that platform's newest draft
  const latest = latestByType(assets);
  const shown = ASSET_TYPES.flatMap((t) => {
    const a = latest.get(t);
    return a ? [a] : [];
  });
  const firstPendingId = shown.find((a) => a.status !== 'approved')?.id;
  const approvedCount = shown.filter((a) => a.status === 'approved').length;
  const pendingCount = shown.length - approvedCount;

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-4">
      {/* purpose before data: what happens here, what to do */}
      <Orient
        runKind="asset:x_post"
        lead={
          <>
            One step. <strong className="font-medium">Draft a post for each platform, then approve the ones you would actually publish</strong>,{' '}
            or say what is wrong and redraft.
          </>
        }
        detail="Each post is written in your brand voice to that platform's rulebook. Gate 2: only approved posts enter the launch plan."
      />

      {chosenAngles.length > 0 ? (
        <Banner
          tone="go"
          title={`Writing from your angle: ${chosenAngles.join(' and ')}.`}
          action={
            <a href={brandHref} onClick={goBrand}>
              <Button variant="ghost" size="sm">Change it in Brand</Button>
            </a>
          }
        >
          {chosenCampaigns.length > 0
            ? chosenCampaigns.map((c) => asStr(c.hook) || asStr(c.big_idea)).filter(Boolean).join(' ')
            : 'Every post below carries this story, in your brand voice.'}
        </Banner>
      ) : (
        <Banner
          tone="hold"
          title="No campaign angle chosen yet."
          action={
            <a href={brandHref} onClick={goBrand}>
              <Button variant="secondary" size="sm">Choose an angle in Brand</Button>
            </a>
          }
        >
          Posts are written from the profile and the brand voice alone. An angle gives them one story to tell.
        </Banner>
      )}

      {/* ---- the one step: the posts, one per platform ---- */}
      <Card>
        <CardHeader
          title="Posts"
          description="One per platform, written to that platform's rulebook from your angle and voice. Draft each platform, read the draft beside its tile, then approve the ones you would post."
          actions={
            shown.length > 0 ? (
              <StatusStamp
                kind={pendingCount === 0 ? 'go' : 'hold'}
                label={pendingCount === 0 ? `${approvedCount} approved` : `${approvedCount} approved, ${pendingCount} need${pendingCount === 1 ? 's' : ''} review`}
              />
            ) : undefined
          }
        />
        <CardBody>
          {/* platform rows: the tile on the left, its draft (or the place it will land) on the right */}
          <ul className="grid gap-4" aria-label="Platforms">
            {ASSET_TYPES.map((t) => {
              const rb = rulesFor(t);
              const a = latest.get(t);
              const drafting = runningAsset === t;
              return (
                <li key={t} className="grid gap-3 lg:grid-cols-[300px_minmax(0,1fr)] lg:gap-4">
                  <PlatformTile
                    type={t}
                    latest={a}
                    drafting={drafting}
                    busy={Boolean(running)}
                    onDraft={() => runJob(`asset:${t}`, () => api.runAsset(project.id, t))}
                    className="lg:self-start"
                  />
                  {a ? (
                    <AssetCard asset={a} name={rb.name} emberApprove={a.id === firstPendingId} drafting={drafting} />
                  ) : (
                    <DraftPlaceholder name={rb.name} drafting={drafting} />
                  )}
                </li>
              );
            })}
          </ul>
        </CardBody>
      </Card>
    </div>
  );
}
