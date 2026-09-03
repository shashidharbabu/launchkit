import * as React from 'react';
import { toast } from 'sonner';
import {
  AtSign,
  Briefcase,
  Clapperboard,
  FileText,
  Mail,
  MessagesSquare,
  Newspaper,
  Rocket,
  type LucideIcon,
} from 'lucide-react';
import { useProject } from '../project-provider';
import {
  Card,
  HonestEmpty,
  LockedGate,
  Orient,
  RawData,
} from '../stage-common';
import { Button } from '../../ui/button';
import { CopyButton } from '../../ui/copy-button';
import { StatusStamp } from '../../ui/status-stamp';
import { ProvenanceLine } from '../../ui/provenance-line';
import { Disclosure } from '../../ui/disclosure';
import { Textarea, Label } from '../../ui/field';
import { TextShimmer } from '../../motion-primitives/text-shimmer';
import {
  MorphingDialog,
  MorphingDialogTrigger,
  MorphingDialogContainer,
  MorphingDialogContent,
  MorphingDialogClose,
  MorphingDialogTitle,
} from '../../motion-primitives/morphing-dialog';
import { useReducedMotion } from 'motion/react';
import { AnimatedGroup } from '../../motion-primitives/animated-group';
import { api } from '../../../data/api';
import { ASSET_LABELS, ASSET_TYPES } from '../../../lib/asset-types';
import { actionError } from '../../../lib/errors';
import { DUR, EASE_STANDARD } from '../../../lib/motion';
import type { AssetRow } from '../../../lib/types';

const asStr = (v: unknown) => (v == null ? '' : String(v));

/** Generic medium icons — the type name carries the meaning, never the icon alone. */
const ASSET_ICONS: Record<string, LucideIcon> = {
  x_post: AtSign,
  linkedin_post: Briefcase,
  reddit_post: MessagesSquare,
  producthunt: Rocket,
  show_hn: Newspaper,
  newsletter_pitch: Mail,
  video_script: Clapperboard,
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
              ? `${i + 1}. ${Object.values(item as Record<string, unknown>).map(asStr).join(' — ')}`
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
          <p className="font-mono text-meta font-medium uppercase tracking-[0.08em] text-muted-foreground">
            {p.label}
          </p>
          <p className="mt-0.5 whitespace-pre-wrap text-read leading-[1.625rem]">{p.text}</p>
        </div>
      ))}
      {!full && paras.length > 3 && (
        <p className="text-body text-muted-foreground">
          + {paras.length - 3} more section{paras.length - 3 === 1 ? '' : 's'} — open to read all
        </p>
      )}
    </div>
  );
}

function AssetCard({
  asset,
  emberApprove,
}: {
  asset: AssetRow;
  /** One ember verb per view: only the first pending card gets the fill. */
  emberApprove: boolean;
}) {
  const { project, runJob, refresh, setError, running } = useProject();
  const [notesOpen, setNotesOpen] = React.useState(false);
  const [feedback, setFeedback] = React.useState('');
  const [approving, setApproving] = React.useState(false);
  if (!project) return null;

  const approved = asset.status === 'approved';
  const warnings = Array.isArray(asset.data.warnings) ? asset.data.warnings.map(asStr) : [];
  const label = ASSET_LABELS[asset.asset_type] ?? asset.asset_type.toUpperCase();
  const Icon = ASSET_ICONS[asset.asset_type] ?? FileText;

  return (
    <Card>
      {/* header: platform icon + asset-type meta label + stamp (components.md) */}
      <div className="flex flex-wrap items-center gap-2 px-4 py-3">
        <Icon size={14} strokeWidth={1.5} aria-hidden className="shrink-0 text-muted-foreground" />
        <span className="font-mono text-meta font-medium uppercase tracking-[0.08em] text-muted-foreground">
          {label}
        </span>
        <StatusStamp kind={approved ? 'go' : 'hold'} />
      </div>

      <div className="border-t border-border px-4 py-4">
        <Disclosure open={notesOpen}>
          <div className="mb-3 grid gap-2 border border-border bg-muted p-3">
            <Label htmlFor={`fb-${asset.id}`}>What should change?</Label>
            <Textarea
              id={`fb-${asset.id}`}
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="e.g. shorter, lead with the benchmark"
            />
            <div>
              <Button
                variant="secondary"
                disabled={Boolean(running)}
                onClick={() => {
                  setNotesOpen(false);
                  runJob(`asset:${asset.asset_type}`, () =>
                    api.runAsset(project.id, asset.asset_type, undefined, feedback),
                  ).then(() => setFeedback(''));
                }}
              >
                Regenerate
              </Button>
            </div>
          </div>
        </Disclosure>

        {warnings.length > 0 && (
          <div className="mb-3 border border-hold bg-hold/10 p-3">
            <p className="text-body font-medium">
              {warnings.length} warning{warnings.length === 1 ? '' : 's'} from the draft check
            </p>
            <ul className="mt-1 grid list-disc gap-1 pl-5">
              {warnings.map((w, i) => (
                <li key={i} className="text-body text-muted-foreground">
                  {w}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* draft in a muted well; opens to a full reading view */}
        <MorphingDialog transition={{ duration: DUR.slow, ease: EASE_STANDARD }}>
          <MorphingDialogTrigger className="block w-full">
            <div className="bg-muted p-3">
              <AssetBody data={asset.data} />
            </div>
          </MorphingDialogTrigger>
          <MorphingDialogContainer>
            <MorphingDialogContent className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-lg border border-border bg-popover p-6 shadow-float">
              <div className="mb-4 flex items-start justify-between gap-3">
                <MorphingDialogTitle>
                  <span className="font-mono text-meta font-medium uppercase tracking-[0.08em] text-muted-foreground">
                    {label}
                  </span>
                </MorphingDialogTitle>
                <MorphingDialogClose />
              </div>
              <AssetBody data={asset.data} full />
            </MorphingDialogContent>
          </MorphingDialogContainer>
        </MorphingDialog>

        <ProvenanceLine parts={['drafted from approved profile', `v${asset.version}`]} />
        <div className="mt-3">
          <RawData data={asset.data} />
        </div>
      </div>

      {/* actions row: below body + provenance, like the Gate Slip */}
      <div className="flex flex-wrap items-center gap-2 border-t border-border px-4 py-3">
        {!approved && (
          <Button
            variant={emberApprove ? 'primary' : 'secondary'}
            loading={approving}
            loadingLabel="Approving…"
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
        <CopyButton text={assetCopyText(asset.data)} label="Copy" />
        <Button variant="secondary" onClick={() => setNotesOpen(!notesOpen)}>
          Regenerate with feedback
        </Button>
      </div>
    </Card>
  );
}

export function AssetsStage() {
  const { project, gate1, assets, running, runJob } = useProject();
  const reduced = useReducedMotion();
  if (!project) return null;
  if (!gate1) return <LockedGate />;

  const runningAsset = running?.kind.startsWith('asset:') ? running.kind.split(':')[1] : null;
  const existing = new Set(assets.map((a) => a.asset_type));
  const firstPendingId = assets.find((a) => a.status !== 'approved')?.id;
  const approvedCount = assets.filter((a) => a.status === 'approved').length;

  return (
    <div className="grid gap-4">
      {/* purpose before data — what happened, what to do */}
      {assets.length > 0 && (
        <Orient
          lead={
            <>
              One post per platform, drafted in your brand voice.{' '}
              <strong className="font-medium">Approve each one you&rsquo;d actually post</strong> —
              or tell it what&rsquo;s wrong and regenerate.
            </>
          }
          detail="Gate 2: only approved assets enter the launch plan."
        />
      )}

      <div className="flex flex-wrap items-center gap-2">
        {ASSET_TYPES.map((t) => (
          <Button
            key={t}
            variant="secondary"
            size="compact"
            disabled={Boolean(running)}
            loading={runningAsset === t}
            loadingLabel="Drafting…"
            onClick={() => runJob(`asset:${t}`, () => api.runAsset(project.id, t))}
            className="font-mono text-meta uppercase tracking-[0.08em]"
          >
            {existing.has(t) ? `Redraft ${ASSET_LABELS[t]}` : `Draft ${ASSET_LABELS[t]}`}
          </Button>
        ))}
      </div>

      {assets.length > 0 && (
        <p className="font-mono text-data text-muted-foreground">
          {approvedCount} approved · {assets.length - approvedCount} awaiting review
        </p>
      )}

      {assets.length === 0 && !runningAsset && (
        <HonestEmpty
          fact="No assets drafted yet."
          reason="Each launch asset is drafted platform-native from your approved profile — Reddit that reads like Reddit, a Show HN that survives HN. Every draft needs your approval before it enters the plan."
          action={
            <Button
              variant="secondary"
              disabled={Boolean(running)}
              onClick={() => runJob('asset:show_hn', () => api.runAsset(project.id, 'show_hn'))}
            >
              Draft SHOW HN
            </Button>
          }
        />
      )}

      {runningAsset && !existing.has(runningAsset) && (
        <Card className="p-4">
          <TextShimmer duration={2} className="text-body">
            {`Drafting ${ASSET_LABELS[runningAsset]?.toLowerCase() ?? runningAsset}…`}
          </TextShimmer>
        </Card>
      )}

      {assets.length > 0 &&
        (reduced ? (
          <div className="grid gap-4">
            {assets.map((a) => (
              <AssetCard key={a.id} asset={a} emberApprove={a.id === firstPendingId} />
            ))}
          </div>
        ) : (
          /* first-paint stagger, 40ms/item — keyed so refetches don't re-fire */
          <AnimatedGroup
            key={project.id}
            preset="fade"
            className="grid gap-4"
            variants={{
              container: { visible: { transition: { staggerChildren: 0.04 } } },
            }}
          >
            {assets.map((a) => (
              <AssetCard key={a.id} asset={a} emberApprove={a.id === firstPendingId} />
            ))}
          </AnimatedGroup>
        ))}
    </div>
  );
}
