import * as React from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { toast } from 'sonner';
import { Check, ExternalLink, Globe } from 'lucide-react';
import { useProject } from '../project-provider';
import { Card, HonestEmpty, LockedGate, Orient } from '../stage-common';
import { Button } from '../../ui/button';
import { CopyButton } from '../../ui/copy-button';
import { StatusStamp } from '../../ui/status-stamp';
import { ProvenanceLine } from '../../ui/provenance-line';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from '../../ui/dialog';
import { api } from '../../../data/api';
import { actionError } from '../../../lib/errors';
import { age } from '../../../lib/format';
import { DUR, EASE_EXIT } from '../../../lib/motion';
import type { SignalRow } from '../../../lib/types';

function SignalCard({ signal }: { signal: SignalRow }) {
  const { refresh, setError } = useProject();
  const [confirmDismiss, setConfirmDismiss] = React.useState(false);
  const [marking, setMarking] = React.useState(false);
  const d = signal.data;
  const verdict = d.rescore?.verdict;
  const verified = verdict === 'relevant';

  const setStatus = async (status: string) => {
    setMarking(true);
    try {
      await api.setSignalStatus(signal.id, status);
      toast(status === 'replied' ? 'Marked replied' : 'Dismissed');
      await refresh();
    } catch (e) {
      setError(actionError(status === 'replied' ? 'mark this signal replied' : 'dismiss this signal', e));
    } finally {
      setMarking(false);
    }
  };

  return (
    <Card className="p-4">
      {/* 1 — source row */}
      <div className="flex flex-wrap items-center gap-2">
        <Globe size={14} strokeWidth={1.5} className="shrink-0 text-muted-foreground" aria-hidden />
        <span className="font-mono text-data text-muted-foreground">{String(d.platform ?? '—')}</span>
        <a
          href={String(d.url ?? '#')}
          target="_blank"
          rel="noreferrer"
          className="inline-flex min-w-0 items-center gap-1 text-body font-medium text-link hover:text-link-hover"
        >
          <span className="truncate">{String(d.title_or_quote ?? 'thread')}</span>
          <ExternalLink size={12} strokeWidth={1.5} className="shrink-0" />
        </a>
        <span className="ml-auto flex items-center gap-2">
          <span className="font-mono text-data tabular text-muted-foreground">{age(d.posted_when)}</span>
          <StatusStamp kind={verified ? 'go' : 'unverified'} />
        </span>
      </div>

      {/* 2 — the ask */}
      <blockquote className="mt-3 border-l-2 border-border pl-3 text-read leading-[1.625rem]">
        “{String(d.title_or_quote ?? '')}”
      </blockquote>
      {d.why_relevant != null && (
        <p className="mt-2 text-body text-muted-foreground">
          {String(d.why_relevant)}
          {d.intent_strength != null && ` · intent: ${String(d.intent_strength)}`}
        </p>
      )}

      {/* 3 — drafted reply */}
      <div className="mt-3 bg-muted p-3">
        <p className="whitespace-pre-wrap text-body">{String(d.drafted_reply ?? '')}</p>
      </div>
      <ProvenanceLine
        parts={[
          'drafted from approved profile',
          verified ? 'verified against thread' : 'could not verify',
        ]}
      />
      {!verified && (
        <p className="mt-2 text-body text-muted-foreground">
          Couldn&rsquo;t fetch this thread, so we can&rsquo;t verify it. It stays marked UNVERIFIED —
          judge it yourself before replying.
        </p>
      )}

      {/* 4 — actions */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <CopyButton text={String(d.drafted_reply ?? '')} label="Copy reply" toastMessage="Copied" />
        <Button variant="ghost" loading={marking} onClick={() => setStatus('replied')}>
          <Check size={14} strokeWidth={1.5} className="text-go" />
          Mark replied
        </Button>
        <Button variant="ghost" onClick={() => setConfirmDismiss(true)}>
          Dismiss
        </Button>
      </div>

      <Dialog open={confirmDismiss} onOpenChange={setConfirmDismiss}>
        <DialogContent showClose={false}>
          <DialogTitle>Dismiss this signal?</DialogTitle>
          <DialogDescription>It won&rsquo;t return in future searches.</DialogDescription>
          <div className="mt-4 flex justify-end gap-2">
            <DialogClose render={<Button variant="secondary">Keep it</Button>} />
            <Button
              variant="destructive"
              onClick={() => {
                setConfirmDismiss(false);
                setStatus('dismissed');
              }}
            >
              Dismiss signal
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

export function SignalsStage() {
  const { project, gate1, signals, running, runJob } = useProject();
  // the last scan's report (queries, coverage, drop reasons) — an empty result must be explainable
  const [meta, setMeta] = React.useState<Record<string, unknown> | null>(null);
  const projectId = project?.id;
  React.useEffect(() => {
    if (!projectId) return;
    let alive = true;
    api.commercial(projectId, 'signals_meta')
      .then((r) => { if (alive) setMeta((r.data ?? null) as Record<string, unknown> | null); })
      .catch(() => { if (alive) setMeta(null); });
    return () => { alive = false; };
  }, [projectId, signals.length, running?.kind]);
  const reduced = useReducedMotion();
  if (!project) return null;
  if (!gate1) return <LockedGate />;

  const queue = signals.filter((s) => s.status === 'new');
  const replied = signals.filter((s) => s.status === 'replied').length;
  const verified = queue.filter((s) => s.data.rescore?.verdict === 'relevant').length;
  const unverified = queue.length - verified;

  return (
    <div className="grid gap-4">
      {/* purpose before data — what happened, what to do */}
      {queue.length > 0 && (
        <Orient
          runKind="signals"
          lead={
            <>
              Real people, publicly asking for what you built — right now.{' '}
              <strong className="font-medium">Reply in your own words</strong>, mark replied, or
              dismiss.
            </>
          }
          detail="Launch Kit never fabricates demand — every signal was found live, so an empty queue honestly means nobody is asking yet."
        />
      )}

      {queue.length > 0 && (
        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="primary"
            disabled={Boolean(running)}
            loading={running?.kind === 'signals'}
            loadingLabel="Searching…"
            onClick={() => runJob('signals', () => api.runStage(project.id, 'signals'))}
          >
            Re-run signal search
          </Button>
          <span className="font-mono text-data text-muted-foreground">
            {verified} verified · {unverified} unverified
            {replied > 0 ? ` · ${replied} replied` : ''}
          </span>
        </div>
      )}

      {signals.length === 0 && (<>
        <HonestEmpty
          runKind="signals"
          fact="No signals yet."
          reason="Nobody is publicly asking for what your app does right now — that's common before launch. Re-run after your first posts, or widen the pain phrasing in your profile."
          action={
            <Button
              variant="secondary"
              disabled={Boolean(running)}
              loading={running?.kind === 'signals'}
              loadingLabel="Searching…"
              onClick={() => runJob('signals', () => api.runStage(project.id, 'signals'))}
            >
              Scan for live demand
            </Button>
          }
        />
        {meta && <ScanReport meta={meta} />}
      </>)}

      {signals.length > 0 && queue.length === 0 && (
        <HonestEmpty
          fact="Queue clear."
          reason={`Every signal is handled — ${replied} replied · ${
            signals.length - replied
          } dismissed. Re-run the search after your first posts to find new asks.`}
          action={
            <Button
              variant="secondary"
              disabled={Boolean(running)}
              loading={running?.kind === 'signals'}
              loadingLabel="Searching…"
              onClick={() => runJob('signals', () => api.runStage(project.id, 'signals'))}
            >
              Re-run signal search
            </Button>
          }
        />
      )}

      {/* the queue's only motion: exits on Mark replied / Dismiss */}
      <AnimatePresence initial={false}>
        {queue.map((s) => (
          <motion.div
            key={s.id}
            layout={!reduced}
            exit={
              reduced
                ? undefined
                : {
                    opacity: 0,
                    height: 0,
                    overflow: 'hidden',
                    transition: { duration: DUR.base, ease: EASE_EXIT },
                  }
            }
          >
            <SignalCard signal={s} />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}


/** What the last scan searched and why candidates were dropped — an empty result must be explainable. */
function ScanReport({ meta }: { meta: Record<string, unknown> }) {
  const queries = Array.isArray(meta.queries) ? (meta.queries as unknown[]).map(String) : [];
  const dropped = Array.isArray(meta.dropped_by_gate) ? (meta.dropped_by_gate as Array<Record<string, unknown>>) : [];
  const rejected = Array.isArray(meta.rejected_by_rescore) ? (meta.rejected_by_rescore as unknown[]).length : 0;
  const notes = typeof meta.coverage_notes === 'string' ? meta.coverage_notes : '';
  if (!queries.length && !dropped.length && !notes && !rejected) return null;
  return (
    <div className="mt-4 border border-border bg-background">
      <p className="border-b border-border px-3 py-2 font-mono text-meta uppercase tracking-[0.08em] text-muted-foreground">Scan report</p>
      {queries.length > 0 && (
        <p className="border-b border-border px-3 py-2 font-mono text-data text-muted-foreground"><span className="text-foreground">Searched</span> {queries.join(' · ')}</p>
      )}
      {notes && <p className="border-b border-border px-3 py-2 text-body text-muted-foreground">{notes}</p>}
      {dropped.length > 0 && (
        <div className="px-3 py-2 font-mono text-data text-muted-foreground">
          <span className="text-foreground">Dropped by gate</span> ({dropped.length})
          <ul className="mt-1 space-y-1">
            {dropped.slice(0, 8).map((d, i) => (
              <li key={i} className="truncate">{String(d.reason ?? '')} · {String(d.url ?? '')}</li>
            ))}
          </ul>
        </div>
      )}
      {rejected > 0 && (
        <p className="px-3 py-2 font-mono text-data text-muted-foreground"><span className="text-foreground">Rejected by relevance check</span> {rejected}</p>
      )}
    </div>
  );
}
