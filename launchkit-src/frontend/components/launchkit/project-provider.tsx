'use client';

import * as React from 'react';
import { api, pollJob } from '@/lib/api';
import type {
  ProjectDetail,
  AssetRow,
  SignalRow,
  TargetRow,
  PlanData,
  AttributionData,
} from '@/lib/types';
import type { StageSlug } from '@/lib/stages';
import { jobLabel } from '@/lib/jobs';

export type StageDot = 'go' | 'hold' | 'nogo' | 'none';

type Running = { kind: string; since: number } | null;

type Ctx = {
  project: ProjectDetail | null;
  assets: AssetRow[];
  signals: SignalRow[];
  targets: TargetRow[];
  plan: PlanData | null;
  attribution: AttributionData | null;
  pricing: Record<string, unknown> | null;
  listing: Record<string, unknown> | null;
  brandDna: Record<string, unknown> | null;
  brandCampaigns: Record<string, unknown> | null;
  loaded: boolean;
  error: string;
  setError: (e: string) => void;
  gate1: boolean;
  running: Running;
  /** The last failed job kind, so the error banner can offer Retry. */
  failed: string | null;
  retryFailed: () => void;
  stageDots: Record<StageSlug, StageDot>;
  refresh: () => Promise<void>;
  runJob: (kind: string, start: () => Promise<{ job_id: string }>) => Promise<void>;
};

const ProjectContext = React.createContext<Ctx | null>(null);

export function useProject() {
  const ctx = React.useContext(ProjectContext);
  if (!ctx) throw new Error('useProject must be used within ProjectProvider');
  return ctx;
}

/** Like useProject, but returns null outside a workspace (app-level pages). */
export function useProjectMaybe() {
  return React.useContext(ProjectContext);
}

/** Voice.md error style: what happened, then the fix — no apology. */
export function pipelineError(kind: string, detail: string): string {
  const label = jobLabel(kind);
  if (/fetch|network|ECONNREFUSED|reach/i.test(detail)) {
    return `Couldn't reach the pipeline while running ${label}. It restarts automatically — retry in about a minute.`;
  }
  return `${label} failed: ${detail}`;
}

export function ProjectProvider({ id, children }: { id: string; children: React.ReactNode }) {
  const [project, setProject] = React.useState<ProjectDetail | null>(null);
  const [assets, setAssets] = React.useState<AssetRow[]>([]);
  const [signals, setSignals] = React.useState<SignalRow[]>([]);
  const [targets, setTargets] = React.useState<TargetRow[]>([]);
  const [plan, setPlan] = React.useState<PlanData | null>(null);
  const [attribution, setAttribution] = React.useState<AttributionData | null>(null);
  const [pricing, setPricing] = React.useState<Record<string, unknown> | null>(null);
  const [listing, setListing] = React.useState<Record<string, unknown> | null>(null);
  const [brandDna, setBrandDna] = React.useState<Record<string, unknown> | null>(null);
  const [brandCampaigns, setBrandCampaigns] = React.useState<Record<string, unknown> | null>(null);
  const [loaded, setLoaded] = React.useState(false);
  const [error, setError] = React.useState('');
  const [running, setRunning] = React.useState<Running>(null);
  const [failed, setFailed] = React.useState<string | null>(null);

  const refresh = React.useCallback(async () => {
    try {
      const p = (await api.getProject(id)) as ProjectDetail;
      setProject(p);
      setError('');
      const [a, s, t, pl, at, pr, li, bd, bc] = await Promise.all([
        api.assets(id).catch(() => []),
        api.signals(id).catch(() => []),
        api.targets(id).catch(() => []),
        api.plan(id).catch(() => null),
        api.attribution(id).catch(() => null),
        api.commercial(id, 'pricing').then((r) => r.data).catch(() => null),
        api.commercial(id, 'listing').then((r) => r.data).catch(() => null),
        api.commercial(id, 'brand_dna').then((r) => r.data).catch(() => null),
        api.commercial(id, 'brand_campaigns').then((r) => r.data).catch(() => null),
      ]);
      setAssets(a);
      setSignals(s);
      setTargets(t);
      setPlan(pl);
      setAttribution(at);
      setPricing(pr);
      setListing(li);
      setBrandDna(bd);
      setBrandCampaigns(bc);
    } catch (e) {
      setError(
        /fetch/i.test(String(e))
          ? 'Couldn’t reach the backend. Start it, then retry — the workspace reconnects on its own.'
          : String(e instanceof Error ? e.message : e),
      );
    } finally {
      setLoaded(true);
    }
  }, [id]);

  React.useEffect(() => {
    refresh();
  }, [refresh]);

  // A run started elsewhere — autorun on create, or before a reload — must
  // still show progress here, or the workspace looks idle mid-analysis.
  React.useEffect(() => {
    let cancelled = false;
    api
      .jobs(id)
      .then(async (rows: { id: string; kind: string; status: string; elapsed_seconds: number }[]) => {
        const live = rows.find((j) => j.status === 'running' || j.status === 'queued');
        if (!live || cancelled) return;
        setRunning({ kind: live.kind, since: Date.now() - (live.elapsed_seconds ?? 0) * 1000 });
        const j = await pollJob(live.id);
        if (cancelled) return;
        if (j.status === 'error') {
          setError(pipelineError(live.kind, (j as { error?: string }).error ?? ''));
          setFailed(live.kind);
        }
        setRunning(null);
        refresh();
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [id, refresh]);

  const runJob = React.useCallback(
    async (kind: string, start: () => Promise<{ job_id: string }>) => {
      setRunning({ kind, since: Date.now() });
      setError('');
      setFailed(null);
      try {
        const { job_id } = await start();
        const j = await pollJob(job_id);
        if (j.status === 'error') {
          setError(pipelineError(kind, (j as { error?: string }).error ?? ''));
          setFailed(kind);
        }
      } catch (e) {
        setError(pipelineError(kind, String(e instanceof Error ? e.message : e)));
        setFailed(kind);
      } finally {
        setRunning(null);
        refresh();
      }
    },
    [refresh],
  );

  const retryFailed = React.useCallback(() => {
    if (!failed) return;
    const kind = failed;
    const start = () => {
      if (kind === 'understand') return api.runUnderstand(id);
      if (kind.startsWith('asset:')) return api.runAsset(id, kind.slice('asset:'.length));
      return api.runStage(id, kind);
    };
    runJob(kind, start);
  }, [failed, id, runJob]);

  const gate1 = project?.profile?.status === 'approved';

  const stageDots = React.useMemo<Record<StageSlug, StageDot>>(() => {
    const profile: StageDot = gate1 ? 'go' : project?.profile ? 'hold' : 'none';
    const brand: StageDot = brandDna && brandCampaigns ? 'go' : brandDna ? 'hold' : 'none';
    const commercial: StageDot = pricing || listing ? 'hold' : 'none';
    const assetsDot: StageDot =
      assets.length === 0 ? 'none' : assets.every((a) => a.status === 'approved') ? 'go' : 'hold';
    const targetsDot: StageDot =
      targets.filter((t) => t.selected).length > 0 ? 'go' : targets.length > 0 ? 'hold' : 'none';
    const queue = signals.filter((s) => s.status === 'new');
    const signalsDot: StageDot =
      signals.length === 0 ? 'none' : queue.length > 0 ? 'hold' : 'go';
    const planDot: StageDot = plan?.ready ? 'go' : 'none';
    return {
      profile,
      brand,
      commercial,
      assets: assetsDot,
      targets: targetsDot,
      signals: signalsDot,
      plan: planDot,
    };
  }, [gate1, project, pricing, listing, brandDna, brandCampaigns, assets, targets, signals, plan]);

  return (
    <ProjectContext.Provider
      value={{
        project,
        assets,
        signals,
        targets,
        plan,
        attribution,
        pricing,
        listing,
        brandDna,
        brandCampaigns,
        loaded,
        error,
        setError,
        gate1: Boolean(gate1),
        running,
        failed,
        retryFailed,
        stageDots,
        refresh,
        runJob,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
}
