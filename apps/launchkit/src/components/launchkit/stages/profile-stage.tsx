import * as React from 'react';
import { toast } from 'sonner';
import { Check, ChevronRight, Pencil, X } from 'lucide-react';
import { useProject } from '../project-provider';
import { Card, HonestEmpty } from '../stage-common';
import { GateSlip } from '../gate-slip';
import { Button } from '../../ui/button';
import { Textarea, Label } from '../../ui/field';
import { Disclosure } from '../../ui/disclosure';
import { StatusStamp } from '../../ui/status-stamp';
import { TextShimmer } from '../../motion-primitives/text-shimmer';
import { Skeleton } from '../../ui/skeleton';
import { api } from '../../../data/api';
import { provDate } from '../../../lib/format';
import { actionError } from '../../../lib/errors';
import { cn } from '../../../lib/utils';

const asStr = (v: unknown) => (v == null ? '' : String(v));
const asList = (v: unknown): string[] => (Array.isArray(v) ? v.map(String) : []);

/**
 * A single reviewable claim. Reads as prose by default, the builder's job at
 * this gate is to *check*, not to fill in a form, and turns into an input
 * only when they choose to correct it.
 */
function ReviewRow({
  label,
  step,
  hint,
  value,
  onChange,
  rows = 2,
}: {
  label: string;
  step?: string;
  hint?: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
}) {
  const [editing, setEditing] = React.useState(false);
  const id = React.useId();

  return (
    <div className="grid gap-1.5 border-t border-border py-3 first:border-t-0 first:pt-0">
      <div className="flex items-baseline gap-2">
        {step && (
          <span className="font-mono text-meta font-medium tabular text-muted-foreground">
            {step}
          </span>
        )}
        <Label htmlFor={editing ? id : undefined} className="flex-1">
          {label}
        </Label>
        <Button
          variant="ghost"
          onClick={() => setEditing(!editing)}
          aria-label={editing ? `Done editing ${label}` : `Edit ${label}`}
        >
          {editing ? (
            'Done'
          ) : (
            <>
              <Pencil size={12} strokeWidth={1.5} aria-hidden />
              Edit
            </>
          )}
        </Button>
      </div>
      {hint && <p className="text-body text-muted-foreground">{hint}</p>}
      {editing ? (
        <Textarea
          id={id}
          autoFocus
          value={value}
          rows={rows}
          onChange={(e) => onChange(e.target.value)}
          className="text-read leading-[1.625rem]"
        />
      ) : (
        <p className={cn('text-read leading-[1.625rem]', !value && 'text-muted-foreground')}>
          {value || 'Nothing found: click Edit to fill this in.'}
        </p>
      )}
    </div>
  );
}

/** Same contract as ReviewRow, for the list-valued claims. */
function ReviewListRow({
  label,
  step,
  hint,
  value,
  onChange,
}: {
  label: string;
  step?: string;
  hint?: string;
  value: string[];
  onChange: (v: string[]) => void;
}) {
  const [editing, setEditing] = React.useState(false);
  const id = React.useId();

  return (
    <div className="grid gap-1.5 border-t border-border py-3 first:border-t-0 first:pt-0">
      <div className="flex items-baseline gap-2">
        {step && (
          <span className="font-mono text-meta font-medium tabular text-muted-foreground">
            {step}
          </span>
        )}
        <Label htmlFor={editing ? id : undefined} className="flex-1">
          {label}
        </Label>
        <Button
          variant="ghost"
          onClick={() => setEditing(!editing)}
          aria-label={editing ? `Done editing ${label}` : `Edit ${label}`}
        >
          {editing ? (
            'Done'
          ) : (
            <>
              <Pencil size={12} strokeWidth={1.5} aria-hidden />
              Edit
            </>
          )}
        </Button>
      </div>
      {hint && <p className="text-body text-muted-foreground">{hint}</p>}
      {editing ? (
        <Textarea
          id={id}
          autoFocus
          value={value.join('\n')}
          rows={Math.max(3, value.length)}
          onChange={(e) => onChange(e.target.value.split('\n').filter((s) => s.trim() !== ''))}
          placeholder="One item per line"
          className="text-read leading-[1.625rem]"
        />
      ) : value.length > 0 ? (
        <ul className="grid gap-1">
          {value.map((v, i) => (
            <li key={`${v}-${i}`} className="text-read leading-[1.625rem]">
{v}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-read leading-[1.625rem] text-muted-foreground">
          Nothing found: click Edit to fill this in.
        </p>
      )}
    </div>
  );
}

/** Collapsed-by-default section, so the page opens at four decisions, not eleven. */
function Section({
  title,
  summary,
  open,
  onToggle,
  children,
}: {
  title: string;
  summary: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="border-t border-border">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center gap-2 py-3 text-left"
      >
        <ChevronRight
          size={14}
          strokeWidth={1.5}
          aria-hidden
          className={cn(
            'shrink-0 text-muted-foreground transition-transform motion-reduce:transition-none',
            open && 'rotate-90',
          )}
        />
        <span className="font-mono text-meta font-medium uppercase tracking-[0.08em]">{title}</span>
        <span className="text-body text-muted-foreground">{summary}</span>
      </button>
      <Disclosure open={open}>
        <div className="pb-3 pl-6">{children}</div>
      </Disclosure>
    </div>
  );
}

type SourceRow = { source?: string; via?: string; ok?: boolean; note?: string };

/** The evidence trail — Gate 1 is a review step; show what was read. */
function SourcesList({ sources }: { sources: SourceRow[] }) {
  if (sources.length === 0) {
    return <p className="text-body text-muted-foreground">No sources were recorded.</p>;
  }
  return (
    <ul className="grid gap-1.5">
      {sources.map((s, i) => (
        <li key={`${s.source}-${i}`} className="flex items-start gap-2 text-body">
          {/* status never color alone — icon + word (color.md) */}
          <span
            className={`mt-0.5 flex shrink-0 items-center gap-1 font-mono text-meta font-medium uppercase tracking-[0.08em] ${
              s.ok === false ? 'text-nogo' : 'text-go'
            }`}
          >
            {s.ok === false ? (
              <X size={12} strokeWidth={1.5} aria-hidden />
            ) : (
              <Check size={12} strokeWidth={1.5} aria-hidden />
            )}
            {s.ok === false ? 'failed' : 'read'}
          </span>
          <span className="min-w-0 flex-1">
            <span className="break-all font-mono text-data">{asStr(s.source) || '-'}</span>
            {asStr(s.via) && <span className="ml-2 text-muted-foreground">via {asStr(s.via)}</span>}
            {asStr(s.note) && <p className="text-body text-muted-foreground">{asStr(s.note)}</p>}
          </span>
        </li>
      ))}
    </ul>
  );
}

export function ProfileStage() {
  const { project, running, runJob, refresh, setError } = useProject();
  const initialProfile = project?.profile ?? null;
  const [draft, setDraft] = React.useState<Record<string, unknown> | null>(
    initialProfile ? { ...initialProfile.data } : null,
  );
  const [dirty, setDirty] = React.useState(false);
  const [showJson, setShowJson] = React.useState(false);
  const [notesOpen, setNotesOpen] = React.useState(false);
  const [moreOpen, setMoreOpen] = React.useState(false);
  const [evidenceOpen, setEvidenceOpen] = React.useState(false);
  const [feedback, setFeedback] = React.useState('');
  const [saving, setSaving] = React.useState(false);
  const [approving, setApproving] = React.useState(false);

  const profile = project?.profile ?? null;
  const analysing = running?.kind === 'understand';

  // Re-seed the draft when a new profile version arrives. Adjusted during
  // render (React's documented pattern) rather than in an effect, so the
  // stale draft never paints for a frame.
  const [syncedFrom, setSyncedFrom] = React.useState(profile);
  if (syncedFrom !== profile) {
    setSyncedFrom(profile);
    setDraft(profile ? { ...profile.data } : null);
    setDirty(false);
  }

  if (!project) return null;

  const set = (key: string, value: unknown) => {
    setDraft((d) => ({ ...(d ?? {}), [key]: value }));
    setDirty(true);
  };
  const setIcp = (key: string, value: unknown) => {
    setDraft((d) => ({
      ...(d ?? {}),
      icp: { ...((d?.icp as Record<string, unknown>) ?? {}), [key]: value },
    }));
    setDirty(true);
  };

  const icp = (draft?.icp ?? {}) as Record<string, unknown>;
  const voice = (draft?.voice ?? {}) as Record<string, unknown>;
  const confidence = (draft?.confidence ?? {}) as Record<string, unknown>;
  const sources = (Array.isArray(draft?.sources_read) ? draft.sources_read : []) as SourceRow[];
  const degraded = Boolean(draft?.analysis_degraded);
  const pct = Math.round(Number(confidence.overall ?? 0) * 100);

  /* ---- no profile yet ---- */
  if (!profile) {
    if (analysing) {
      return (
        <Card className="grid gap-3 p-4">
          <div className="flex items-center gap-2">
            <StatusStamp kind="running" />
            <TextShimmer duration={2} className="text-body">
              Reading your repo and site to draft the profile…
            </TextShimmer>
          </div>
          <p className="text-body text-muted-foreground">
            This takes 1–3 minutes. You can leave this page and come back, the run continues.
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        </Card>
      );
    }
    return (
      <HonestEmpty
        fact="No profile yet."
        reason="Analysis starts the moment your launch is created, if it didn't finish, run it again. Launch Kit reads your repo and live site to draft the profile you'll approve."
        action={
          <Button
            variant="secondary"
            onClick={() => runJob('understand', () => api.runUnderstand(project.id))}
          >
            Analyze my app
          </Button>
        }
      />
    );
  }

  /* ---- the gate slip ---- */
  const approved = profile.status === 'approved';

  const regenerateButton = (
    <Button variant="secondary" onClick={() => setNotesOpen(!notesOpen)}>
      Something&apos;s wrong, redo it
    </Button>
  );
  const saveButton = dirty && (
    <Button
      variant="secondary"
      loading={saving}
      loadingLabel="Saving…"
      onClick={async () => {
        setSaving(true);
        try {
          await api.editProfile(project.id, draft);
          toast(`Saved as v${(profile.version ?? 0) + 1}`);
          await refresh();
        } catch (e) {
          setError(actionError('save your edits', e));
        } finally {
          setSaving(false);
        }
      }}
    >
      Save my edits
    </Button>
  );
  const jsonToggle = (
    <Button variant="ghost" onClick={() => setShowJson(!showJson)}>
      {showJson ? 'Back to review' : 'View raw JSON'}
    </Button>
  );

  return (
    <div className="grid gap-4">
      {/* what this screen is for, before the screen itself */}
      {!approved && (
        <Card className="grid gap-1 p-4">
          <p className="text-read leading-[1.625rem]">
            Launch Kit read {project.repo_url ? 'your repo and your site' : 'your site'} and wrote
            down what it thinks your app is. <strong className="font-medium">Check the four
            things below</strong>, fix anything wrong, then approve.
          </p>
          <p className="text-body text-muted-foreground">
            Every later stage, pricing, listing, posts, venues, signals, is written from this. It
            is the only thing you have to get right.
          </p>
        </Card>
      )}

      <GateSlip
        gateLabel="GATE 01: PROFILE"
        stamp="hold"
        signed={approved}
        signedLine={`profile approved · ${
          profile.created_at ? provDate(profile.created_at) : `v${profile.version}`
        }`}
        provenance={[
          `drafted from ${project.repo_url ? 'repo + site' : 'site'}`,
          `v${profile.version}`,
          degraded && 'partial analysis',
        ]}
        reopenActions={
          <>
            {regenerateButton}
            {saveButton}
            <span className="ml-auto" />
            {jsonToggle}
          </>
        }
        actions={
          <>
            <Button
              variant="primary"
              loading={approving}
              loadingLabel="Approving…"
              disabled={dirty}
              title={
                dirty
                  ? 'Save your edits first; approval locks the version that unlocks every later stage'
                  : undefined
              }
              onClick={async () => {
                setApproving(true);
                try {
                  await api.approveProfile(project.id);
                  toast('Approved');
                  await refresh();
                } catch (e) {
                  setError(actionError('approve the profile', e));
                } finally {
                  setApproving(false);
                }
              }}
            >
              {dirty ? 'Save your edits first' : 'This is right: approve'}
            </Button>
            {saveButton}
            {regenerateButton}
            <span className="ml-auto" />
            {jsonToggle}
          </>
        }
      >
        <div className="grid gap-4">
          {degraded && (
            <div className="border border-hold bg-hold/10 p-3 text-body">
              <p className="font-medium">Partial analysis: read this one more carefully.</p>
              <p className="mt-1 text-muted-foreground">
                {asStr(confidence.notes) ||
                  'Some sources could not be read, so parts of this profile are inferred rather than evidenced.'}
                {!project.repo_url &&
                  ' No repo was supplied, adding a public GitHub repo gives a much stronger profile.'}
              </p>
            </div>
          )}

          <Disclosure open={notesOpen}>
            <div className="grid gap-2 border border-border bg-muted p-3">
              <Label htmlFor="profile-notes">What did it get wrong?</Label>
              <Textarea
                id="profile-notes"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="e.g. the target user is agencies, not indie devs"
              />
              <div>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setNotesOpen(false);
                    runJob('understand', () => api.runUnderstand(project.id, feedback)).then(() =>
                      setFeedback(''),
                    );
                  }}
                >
                  Read my app again
                </Button>
              </div>
            </div>
          </Disclosure>

          {showJson ? (
            <pre className="max-h-96 overflow-auto border border-border bg-muted p-4 font-mono text-data leading-5">
              {JSON.stringify(profile.data, null, 2)}
            </pre>
          ) : (
            draft && (
              <div className="grid gap-0">
                {/* the four claims every downstream stage is built on */}
                <ReviewRow
                  step="1/4"
                  label="What your app is"
                  hint="One sentence. This becomes your tagline and the first line of every post."
                  value={asStr(draft.one_liner)}
                  onChange={(v) => set('one_liner', v)}
                />
                <ReviewRow
                  step="2/4"
                  label="Who it's for"
                  hint="A specific role, not “everyone”. This decides which venues and subreddits you launch in."
                  value={asStr(draft.target_user)}
                  onChange={(v) => set('target_user', v)}
                  rows={1}
                />
                <ReviewRow
                  step="3/4"
                  label="The pain it solves"
                  hint="What they're struggling with today. Launch Kit searches for these exact words to find live buyers."
                  value={asStr(icp.pain)}
                  onChange={(v) => setIcp('pain', v)}
                />
                <ReviewListRow
                  step="4/4"
                  label="Why you're different"
                  hint="Only real, evidenced differences. These carry your pricing and your listing."
                  value={asList(draft.differentiators)}
                  onChange={(v) => set('differentiators', v)}
                />

                <Section
                  title="More detail"
                  summary="description, category, pricing, buyer, proof, tech, gaps, voice"
                  open={moreOpen}
                  onToggle={() => setMoreOpen(!moreOpen)}
                >
                  <ReviewRow
                    label="Description"
                    value={asStr(draft.description)}
                    onChange={(v) => set('description', v)}
                    rows={4}
                  />
                  <ReviewRow
                    label="Category"
                    value={asStr(draft.category)}
                    onChange={(v) => set('category', v)}
                    rows={1}
                  />
                  <ReviewRow
                    label="Pricing today"
                    value={asStr(draft.pricing_current)}
                    onChange={(v) => set('pricing_current', v)}
                    rows={1}
                  />
                  <ReviewRow
                    label="Who they are"
                    value={asStr(icp.who)}
                    onChange={(v) => setIcp('who', v)}
                  />
                  <ReviewRow
                    label="What makes them go looking"
                    value={asStr(icp.buying_trigger)}
                    onChange={(v) => setIcp('buying_trigger', v)}
                  />
                  <ReviewListRow
                    label="What they use instead today"
                    value={asList(icp.current_alternatives)}
                    onChange={(v) => setIcp('current_alternatives', v)}
                  />
                  <ReviewListRow
                    label="Proof points"
                    value={asList(draft.proof_points)}
                    onChange={(v) => set('proof_points', v)}
                  />
                  <ReviewListRow
                    label="Tech stack"
                    value={asList(draft.tech_stack)}
                    onChange={(v) => set('tech_stack', v)}
                  />
                  <ReviewListRow
                    label="What's missing from your site"
                    value={asList(draft.gaps)}
                    onChange={(v) => set('gaps', v)}
                  />
                  <div className="grid gap-1.5 border-t border-border py-3">
                    <Label>How you write</Label>
                    <p className="text-read leading-[1.625rem]">
                      {asList(voice.tone).join(' · ') || '-'}
                    </p>
                    {asStr(voice.sample_phrase) && (
                      <p className="text-read italic leading-[1.625rem] text-muted-foreground">
                        “{asStr(voice.sample_phrase)}”
                      </p>
                    )}
                  </div>
                </Section>

                <Section
                  title="Where this came from"
                  summary={`${pct}% confident · ${sources.length || 'no'} sources`}
                  open={evidenceOpen}
                  onToggle={() => setEvidenceOpen(!evidenceOpen)}
                >
                  <div className="grid gap-3">
                    <div className="flex items-center gap-3">
                      <div className="h-1 flex-1 bg-muted" aria-hidden>
                        <div className="h-full bg-chart-2" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="font-mono text-data tabular text-muted-foreground">
                        {pct}% confident
                      </span>
                    </div>
                    {asStr(confidence.notes) && (
                      <p className="text-body text-muted-foreground">{asStr(confidence.notes)}</p>
                    )}
                    <SourcesList sources={sources} />
                  </div>
                </Section>
              </div>
            )
          )}
        </div>
      </GateSlip>
    </div>
  );
}
