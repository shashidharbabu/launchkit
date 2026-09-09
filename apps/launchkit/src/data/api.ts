/**
 * The api facade: the EXACT surface of frontend/lib/api.ts, backed by the
 * in-memory document store + pipeline runner instead of the FastAPI backend.
 * The provider and every stage component consume this unchanged; each method
 * mirrors its main.py handler one-to-one (same shapes, same gate errors,
 * same versioning and carryover semantics).
 */
import {
  buildAssetQuestion, buildBrandQuestion, buildCommercialQuestion,
  buildSignalsQuestion, buildTargetsQuestion, buildUnderstandQuestion,
} from '../domain/questions';
import { gateAsset, gateSignals, gateTargets } from '../domain/gates';
import { buildAttribution, buildPlan, planMarkdown } from '../domain/plan';
import {
  BRAND_CAMPAIGNS_PREREQ_ERROR, GATE1_ERROR, NO_PROFILE_TO_APPROVE_ERROR,
  applyAssetEdit, applyTargetsRun, assetJobKind, canRunBrandCampaigns,
  carrySignalStatusByUrl, isKnownStageKind, isValidSignalStatus,
  newProfileRowOnEdit, newProfileRowOnUnderstand, profileToApprove,
  subredditsFromTargets, unknownStageError, BAD_SIGNAL_STATUS_ERROR,
} from '../domain/status';
import type { Dict, Profile, SignalData, TargetData } from '../domain/types';
import { ask, askSignals } from './runner';
import { rescoreSignals } from './rescore';
import { forgeConcept, forgeRun } from './studio';
import { buildStudioQuestion, buildStudioRepairQuestion } from '../domain/questions';
import {
  NEEDS_PROBE_ERROR, NEEDS_SCRIPT_ERROR, isStudioStep, kitCopy, normalizeSlots, studioJobKind,
  type ConceptSpec,
} from '../domain/studio';
import {
  byNewest, byNumber, count, currentActor, flush, insert, remove,
  select, selectOne, uid, update, type Row,
} from './blobstore';
import { getCurrentRun, setCurrentRun } from './trace';
import { rulesBlock } from './rules';
import { punctuationFixed } from './runner';
import { activeWorkspaceId } from './workspace-state';

// ---------------------------------------------------------------- url normalization (main._norm_url)

export function normUrl(raw: string, kind: 'site' | 'repo' | 'app', required: boolean): string {
  let url = String(raw ?? '').trim().replace(/^<|>$/g, '').replace(/\/+$/, '');
  if (!url) {
    if (required) throw new Error(`${kind} URL is required`);
    return '';
  }
  if (!/^https?:\/\//i.test(url)) url = 'https://' + url;
  const m = url.match(/^https?:\/\/([^/\s]+)/i);
  if (!m || !m[1].includes('.') || url.includes(' ')) {
    throw new Error(`${kind} URL doesn't look like a URL: ${JSON.stringify(raw)}`);
  }
  if (kind === 'repo' && !/^https:\/\/(www\.)?github\.com\/[^/]+\/[^/]+/i.test(url)) {
    throw new Error('repo URL must be a public GitHub repo '
      + '(https://github.com/owner/name), or leave it blank for site-only analysis');
  }
  return url;
}

// newest-first by numeric version (mirrors SQL `ORDER BY version DESC`).
function byVersionDesc(rows: Row[]): Row[] {
  return [...rows].sort((a, b) => Number(b.version ?? 0) - Number(a.version ?? 0));
}

// ---------------------------------------------------------------- job registry (in-memory + runs history)

type JobRow = {
  id: string; project_id: string; kind: string;
  status: 'queued' | 'running' | 'done' | 'error';
  error: string | null; elapsed_seconds: number; created_at: string;
};
const jobs = new Map<string, JobRow>();

async function runJob(
  projectId: string, kind: string,
  work: () => Promise<Dict>, onDone: (result: Dict) => Promise<void>,
): Promise<string> {
  const id = uid();
  const job: JobRow = {
    id, project_id: projectId, kind, status: 'queued',
    error: null, elapsed_seconds: 0, created_at: new Date().toISOString(),
  };
  jobs.set(id, job);
  insert('runs', { id, project_id: projectId, kind, status: 'queued', started_by: currentActor() });
  void (async () => {
    job.status = 'running';
    update('runs', { id }, { status: 'running' });
    const t0 = Date.now();
    const prevRun = getCurrentRun();
    setCurrentRun(id);
    try {
      const result = await work();
      job.elapsed_seconds = Math.round((Date.now() - t0) / 1000);
      await onDone(result);
      job.status = 'done';
    } catch (e) {
      job.status = 'error';
      job.error = String((e as Error)?.message ?? e).slice(0, 2000);
    } finally {
      setCurrentRun(prevRun);
      job.elapsed_seconds = Math.round((Date.now() - t0) / 1000);
      update('runs', { id }, {
        status: job.status, error: job.error,
        elapsed_seconds: job.elapsed_seconds, finished_at: new Date().toISOString(),
      });
      // a run's on-done writes must be visible the moment the poll flips done
      flush();
    }
  })();
  return id;
}

// ---------------------------------------------------------------- row helpers (main.py query mirrors)

async function projectRow(id: string): Promise<Dict> {
  const p = selectOne('projects', { id });
  if (!p) throw new Error('project not found');
  return p as Dict;
}

async function latestProfile(projectId: string): Promise<Dict | null> {
  const latest = byVersionDesc(select('profiles', { project_id: projectId }))[0];
  return (latest as Dict) ?? null;
}

async function approvedProfile(projectId: string): Promise<Profile> {
  const latest = byVersionDesc(select('profiles', { project_id: projectId, status: 'approved' }))[0];
  if (!latest) throw new Error(GATE1_ERROR);
  return latest.data as Profile;
}

async function profileCount(projectId: string): Promise<number> {
  return count('profiles', { project_id: projectId });
}

async function latestCommercial(projectId: string, kind: string): Promise<Dict | null> {
  const latest = byNewest(select('commercial_results', { project_id: projectId, kind }))[0];
  return latest ? (latest.data as Dict) : null;
}

async function saveCommercial(projectId: string, kind: string, data: Dict, jobId: string): Promise<void> {
  insert('commercial_results', { id: uid(), project_id: projectId, kind, data, job_id: jobId });
}

// ---------------------------------------------------------------- understand (main._start_understand)

async function startUnderstand(p: Dict, feedback = ''): Promise<string> {
  const pid = String(p.id);
  return runJob(pid, 'understand',
    () => ask('lk_understand.pipe',
      buildUnderstandQuestion(String(p.repo_url ?? ''), String(p.site_url ?? ''), feedback)),
    async (result) => {
      const row = newProfileRowOnUnderstand(await profileCount(pid), result, 'pipeline');
      insert('profiles', {
        id: uid(), project_id: pid, version: row.version,
        data: row.data, status: row.status, job_id: row.job_id,
      });
    });
}

// ---------------------------------------------------------------- the facade

export const api = {
  listProjects: async () => {
    const rows = byNewest(select('projects'));
    return rows.map((r) => {
      const latest = byVersionDesc(select('profiles', { project_id: r.id }))[0];
      return {
        id: r.id, name: r.name, repo_url: r.repo_url, site_url: r.site_url,
        profile_status: (latest?.status as string | undefined) ?? 'none',
      };
    });
  },

  createProject: async (body: { name: string; site_url: string; repo_url?: string; app_url?: string; autorun?: boolean }) => {
    const site = normUrl(body.site_url, 'site', true);
    const repo = normUrl(body.repo_url ?? '', 'repo', false);
    const appUrl = normUrl(body.app_url ?? '', 'app', false);
    const name = String(body.name ?? '').trim();
    if (!name) throw new Error('app name is required');
    const dup = byNewest(select('projects', { site_url: site }))[0] ?? null;
    const id = uid();
    insert('projects', {
      id, name, repo_url: repo, site_url: site, app_url: appUrl, created_by: currentActor(),
      workspace_id: activeWorkspaceId(),
    });
    const p = { id, name, repo_url: repo, site_url: site };
    const jobId = (body.autorun ?? true) ? await startUnderstand(p) : null;
    flush();
    return {
      id, name, job_id: jobId,
      duplicate_of: dup ? { id: String(dup.id), name: String(dup.name) } : null,
    };
  },

  getProject: async (id: string) => {
    const p = await projectRow(id);
    const prof = await latestProfile(id);
    const counts: Dict = {
      assets: count('assets', { project_id: id }),
      targets: count('targets', { project_id: id }),
      targets_selected: count('targets', { project_id: id, selected: true }),
      signals: count('signals', { project_id: id }),
    };
    return {
      id: p.id, name: p.name, repo_url: p.repo_url, site_url: p.site_url, app_url: p.app_url,
      profile: prof ? {
        id: prof.id, version: prof.version, status: prof.status,
        data: prof.data as Dict, created_at: prof.created_at ?? null,
      } : null,
      counts,
    };
  },

  runUnderstand: async (id: string, feedback = '') => {
    const p = await projectRow(id);
    return { job_id: await startUnderstand(p, feedback) };
  },

  runStage: async (id: string, kind: string) => {
    if (!isKnownStageKind(kind)) throw new Error(unknownStageError(kind));
    const p = await projectRow(id);
    const profile = await approvedProfile(id); // Gate 1 enforced
    let dna: Dict | null = null;
    if (kind === 'brand_campaigns') {
      dna = await latestCommercial(id, 'brand_dna');
      if (!canRunBrandCampaigns(dna)) throw new Error(BRAND_CAMPAIGNS_PREREQ_ERROR);
    }

    if (kind === 'pricing' || kind === 'listing') {
      const jobId = await runJob(id, kind,
        () => ask('lk_commercial.pipe', buildCommercialQuestion(kind, profile, '')),
        async (result) => saveCommercial(id, kind, result, jobId));
      return { job_id: jobId };
    }
    if (kind === 'brand_dna') {
      const jobId = await runJob(id, kind,
        () => ask('lk_brand.pipe', buildBrandQuestion('dna', profile, String(p.site_url ?? ''), null, '')),
        async (result) => saveCommercial(id, 'brand_dna', result, jobId));
      return { job_id: jobId };
    }
    if (kind === 'brand_campaigns') {
      const jobId = await runJob(id, kind,
        () => ask('lk_brand.pipe', buildBrandQuestion('campaigns', profile, '', dna, '')),
        async (result) => saveCommercial(id, 'brand_campaigns', result, jobId));
      return { job_id: jobId };
    }
    if (kind === 'targets') {
      const curated = select('venues', { enabled: true }).slice(0, 80).map((v) => ({
        name: v.name, kind: v.kind, url: v.url,
        submission_url: v.submission_url, tags: v.tags ?? null,
      }));
      const jobId = await runJob(id, kind,
        () => ask('lk_targets.pipe', buildTargetsQuestion(profile, curated)),
        async (result) => {
          // deterministic guardrails first: repo files out, listings below launch venues
          const gatedTargets = gateTargets(Array.isArray((result as Dict).targets) ? ((result as Dict).targets as unknown[]) : []);
          saveCommercial(id, 'targets_meta', {
            kept: gatedTargets.kept.length,
            dropped: gatedTargets.dropped.map((d) => ({ name: d.target.name, url: d.target.url, why: d.why })),
            coverage_notes: (result as Dict).coverage_notes ?? null,
          }, jobId);
          const gatedResult = { ...(result as Dict), targets: gatedTargets.kept };
          const prevSel = select('targets', { project_id: id, selected: true });
          const venueRows = select('venues');
          const applied = applyTargetsRun(
            prevSel.map((r) => ({ data: r.data as TargetData, selected: true })),
            gatedResult,
            venueRows.map((v) => String(v.url)),
          );
          remove('targets', { project_id: id });
          for (const t of applied.targets) {
            insert('targets', {
              id: uid(), project_id: id, rank: t.rank, data: t.data,
              selected: t.selected, job_id: jobId,
            });
          }
          for (const v of applied.newVenues) {
            // ON CONFLICT (url) DO NOTHING: only insert an unseen url
            if (!selectOne('venues', { url: v.url })) {
              insert('venues', {
                id: uid(), name: v.name, kind: v.kind, url: v.url,
                submission_url: v.submission_url, rules_summary: v.rules_summary,
                audience_signal: v.audience_signal, source: 'discovered', enabled: true,
              });
            }
          }
          await saveCommercial(id, 'targets_meta', applied.meta, jobId);
        });
      return { job_id: jobId };
    }
    // signals: finder, deterministic gate, then re-score pass (main.py signals_flow)
    const targetRows = byNumber(select('targets', { project_id: id }), 'rank');
    const subs = subredditsFromTargets(targetRows.map((r) => r.data as TargetData));
    const jobId = await runJob(id, 'signals',
      async () => {
        const result = await askSignals(buildSignalsQuestion(profile, subs.length ? subs : null));
        const own = [p.repo_url, p.site_url, p.app_url];
        const { kept: gated, dropped } = gateSignals(
          (result.signals as SignalData[] | undefined) ?? [], own);
        const [kept, rejectedList] = await rescoreSignals(profile, gated);
        return {
          signals: kept,
          meta: {
            dropped_by_gate: dropped,
            rejected_by_rescore: rejectedList.map((r) => ({
              url: r.url, why: (r.rescore as Dict | undefined)?.why,
            })),
            coverage_notes: result.coverage_notes,
            queries: result.search_queries_used,
          },
        };
      },
      async (result) => {
        const prev = select('signals', { project_id: id });
        const carried = carrySignalStatusByUrl(
          prev.map((r) => ({ data: r.data as SignalData, status: String(r.status) })),
          (result.signals as SignalData[]) ?? []);
        remove('signals', { project_id: id });
        for (const s of carried) {
          insert('signals', {
            id: uid(), project_id: id, rank: s.rank, data: s.data,
            status: s.status, job_id: jobId,
          });
        }
        await saveCommercial(id, 'signals_meta', result.meta as Dict, jobId);
      });
    return { job_id: jobId };
  },

  runAsset: async (id: string, asset_type: string, target_id?: string, feedback = '') => {
    const profile = await approvedProfile(id); // Gate 1 enforced
    let target: TargetData | null = null;
    if (target_id) {
      const row = selectOne('targets', { id: target_id });
      if (row) target = row.data as TargetData;
    }
    const brandDna = await latestCommercial(id, 'brand_dna');
    // context the draft is written against: approved commercial copy, the chosen angle, the last version
    const compact = (v: unknown, n: number) => { const s = JSON.stringify(v ?? null); return s.length > n ? s.slice(0, n) + '…' : s; };
    const pricing = await latestCommercial(id, 'pricing');
    const listing = await latestCommercial(id, 'listing');
    const commercialCtx = pricing || listing ? compact({ pricing, listing }, 3500) : '';
    const projRow = selectOne('projects', { id });
    const angles = Array.isArray(projRow?.selected_campaigns) ? (projRow.selected_campaigns as unknown[]).map(String) : [];
    let campaignCtx = '';
    if (angles.length > 0) {
      const camps = await latestCommercial(id, 'brand_campaigns');
      const list = Array.isArray((camps as Dict | null)?.campaigns) ? ((camps as Dict).campaigns as Dict[]) : [];
      const chosen = list.filter((c) => angles.includes(String(c.name))).map((c) => ({ name: c.name, big_idea: c.big_idea, hook: c.hook, objective: c.objective }));
      campaignCtx = chosen.length > 0 ? compact(chosen, 2500) : angles.join('; ');
    }
    const prev = byNewest(select('assets', { project_id: id, asset_type }), 'version')[0];
    const previousDraft = prev ? compact(prev.data, 3000) : '';
    const jobId = await runJob(id, assetJobKind(asset_type),
      () => ask('lk_assets.pipe',
        buildAssetQuestion(asset_type, profile, target, '', feedback, brandDna, rulesBlock(asset_type),
          { commercial: commercialCtx, campaign: campaignCtx, previousDraft })),
      async (result) => {
        const changed = punctuationFixed(result);
        const gated = gateAsset(asset_type, result) as Record<string, unknown>;
        if (changed) gated.punctuation_fixed = changed;
        const n = count('assets', { project_id: id, asset_type });
        insert('assets', {
          id: uid(), project_id: id, asset_type, version: n + 1,
          data: gated, status: 'draft', job_id: jobId,
        });
      });
    return { job_id: jobId };
  },

  // ---------------------------------------------------------------- Assets stage (studio)

  studio: async (id: string) => {
    const rows = byNewest(select('studio', { project_id: id }));
    return rows.map((r) => ({
      id: r.id, kind: r.kind, version: r.version, status: r.status,
      data: r.data as Dict, created_at: (r.created_at as string | undefined) ?? null,
    }));
  },

  /**
   * One step of the Assets stage: probe (read the site on the studio forge),
   * kit (render the cards), script (write the reel copy through lk_studio.pipe),
   * reel (render it). Every step is a run; the forge steps need the local
   * service, the script step needs the pipeline.
   */
  runStudio: async (id: string, step: string, opts: { scriptId?: string; concept?: string } = {}) => {
    if (!isStudioStep(step)) throw new Error(unknownStageError(step));
    const p = await projectRow(id);
    const profile = await approvedProfile(id); // Gate 1 enforced
    const latestOf = (kind: string) => byNewest(select('studio', { project_id: id, kind }))[0] ?? null;
    const save = (kind: string, data: Dict, jobId: string, status = 'done') => {
      const n = count('studio', { project_id: id, kind });
      insert('studio', { id: uid(), project_id: id, kind, version: n + 1, status, data, job_id: jobId });
    };

    if (step === 'probe') {
      const jobId = await runJob(id, studioJobKind('probe'),
        () => forgeRun('probe', { project_id: id, site_url: String(p.site_url ?? '') }),
        async (result) => save('probe', result, jobId));
      return { job_id: jobId };
    }

    const probe = latestOf('probe');
    const dna = await latestCommercial(id, 'brand_dna');

    if (step === 'kit') {
      if (!probe) throw new Error(NEEDS_PROBE_ERROR);
      const pd = probe.data as Dict;
      const listing = await latestCommercial(id, 'listing');
      const script = latestOf('script');
      const copy = kitCopy(profile, dna, listing, script ? (script.data as Dict) : null);
      const jobId = await runJob(id, studioJobKind('kit'),
        () => forgeRun('kit', {
          project_id: id, site_url: String(p.site_url ?? ''), name: String(p.name ?? ''), ...copy,
          palette: pd.palette, logos: pd.logos, fonts: pd.fonts,
        }),
        async (result) => save('kit', result, jobId));
      return { job_id: jobId };
    }

    if (step === 'script') {
      const concept = opts.concept ?? 'verdict';
      const siteCopy = probe ? String(((probe.data as Dict).copy as Dict | undefined)?.text ?? '') : '';
      // the chosen campaign angle, the same way Social Launch reads it
      const angles = Array.isArray(p.selected_campaigns) ? (p.selected_campaigns as unknown[]).map(String) : [];
      let campaignCtx = '';
      if (angles.length > 0) {
        const camps = await latestCommercial(id, 'brand_campaigns');
        const list = Array.isArray((camps as Dict | null)?.campaigns) ? ((camps as Dict).campaigns as Dict[]) : [];
        const chosen = list.filter((c) => angles.includes(String(c.name)))
          .map((c) => ({ name: c.name, big_idea: c.big_idea, hook: c.hook, objective: c.objective }));
        campaignCtx = chosen.length > 0 ? JSON.stringify(chosen).slice(0, 2500) : angles.join('; ');
      }
      const jobId = await runJob(id, studioJobKind('script'),
        async () => {
          const spec = await forgeConcept(concept);
          const result = await ask('lk_studio.pipe',
            buildStudioQuestion(spec, profile, String(p.name ?? ''), String(p.site_url ?? ''), dna, campaignCtx, siteCopy));
          const raw: Dict = result.slots && typeof result.slots === 'object' ? { ...(result.slots as Dict) } : {};
          let norm = normalizeSlots(spec, raw);
          const repaired: string[] = [];
          if (norm.clamped.length > 0) {
            // a second small ask rewrites only the over-limit slots, so the film never shows a cut fragment
            const offenders = norm.clamped.map((sid) => ({ id: sid, value: String(raw[sid] ?? '') }));
            try {
              const fix = await ask('lk_studio.pipe', buildStudioRepairQuestion(spec, offenders, String(p.name ?? '')));
              const fixed: Dict = fix.slots && typeof fix.slots === 'object' ? (fix.slots as Dict) : {};
              for (const o of offenders) {
                const s = spec.slots.find((x) => x.id === o.id);
                const v = typeof fixed[o.id] === 'string' ? (fixed[o.id] as string).trim() : '';
                if (s && v && v.length <= s.max) { raw[o.id] = v; repaired.push(o.id); }
              }
              if (repaired.length > 0) norm = normalizeSlots(spec, raw);
            } catch { /* keep the mechanical clamp */ }
          }
          return {
            concept, ...norm, repaired,
            tagline: typeof result.tagline === 'string' ? result.tagline.trim().slice(0, 80) : '',
            one_liner: typeof result.one_liner === 'string' ? result.one_liner.trim().slice(0, 160) : '',
            claims_used: Array.isArray(result.claims_used) ? result.claims_used : [],
            notes: typeof result.notes === 'string' ? result.notes : '',
            spec: {
              title: spec.title, tagline: spec.tagline, duration: spec.duration, beats: spec.beats,
              slots: spec.slots.map((s) => ({ id: s.id, max: s.max, hint: s.hint, example: s.example, optional: s.optional, default: s.default })),
            },
          };
        },
        async (result) => save('script', result, jobId, 'draft'));
      return { job_id: jobId };
    }

    // reel
    if (!probe) throw new Error(NEEDS_PROBE_ERROR);
    const script = opts.scriptId ? selectOne('studio', { id: opts.scriptId }) : latestOf('script');
    if (!script) throw new Error(NEEDS_SCRIPT_ERROR);
    const sd = script.data as Dict;
    const pd = probe.data as Dict;
    const logo = (Array.isArray(pd.logos) ? (pd.logos as Dict[]) : []).find((l) => l.picked) ?? null;
    const jobId = await runJob(id, studioJobKind('reel'),
      () => forgeRun('reel', {
        project_id: id, concept: sd.concept ?? 'verdict', slots: sd.slots, palette: pd.palette, logo,
        screenshot_path: pd.screenshot_path ?? null,
      }),
      async (result) => save('reel', { ...result, script_id: script.id, script_version: script.version }, jobId, 'draft'));
    return { job_id: jobId };
  },

  /** Edit a script's slots; the same clamp the renderer applies, so the editor tells the truth. */
  editStudioScript: async (rowId: string, slots: Record<string, string>) => {
    const row = selectOne('studio', { id: rowId });
    if (!row || row.kind !== 'script') throw new Error('script not found');
    const data = row.data as Dict;
    const spec = { ...(data.spec as Dict), concept: data.concept } as unknown as ConceptSpec;
    const norm = normalizeSlots(spec, slots);
    update('studio', { id: rowId }, {
      data: { ...data, slots: norm.slots, clamped: norm.clamped, edited: true },
      status: 'edited', status_by: currentActor(),
    });
    flush();
    return { id: rowId, status: 'edited', clamped: norm.clamped };
  },

  approveStudio: async (rowId: string) => {
    const affected = update('studio', { id: rowId }, { status: 'approved', status_by: currentActor() });
    if (!affected) throw new Error('reel not found');
    flush();
    return { id: rowId, status: 'approved' };
  },

  job: async (jobId: string) => {
    const j = jobs.get(jobId);
    if (j) return { ...j };
    const row = selectOne('runs', { id: jobId });
    if (!row) throw new Error('job not found');
    return row;
  },

  jobs: async (id: string) => {
    const rows = byNewest(select('runs', { project_id: id })).slice(0, 30).map((r) => ({
      id: r.id, kind: r.kind, status: r.status, error: r.error, elapsed_seconds: r.elapsed_seconds,
    }));
    // live in-memory state wins over persisted rows (poll loop reads these)
    return rows.map((r) => {
      const live = jobs.get(String(r.id));
      return live ? { id: live.id, kind: live.kind, status: live.status, error: live.error, elapsed_seconds: live.elapsed_seconds } : r;
    });
  },

  allJobs: async (limit = 100) => {
    // inner-join semantics: runs without a surviving project drop out
    const joined = byNewest(select('runs')).flatMap((r) => {
      const proj = selectOne('projects', { id: r.project_id });
      return proj ? [{ ...r, project_name: proj.name }] : [];
    });
    return joined.slice(0, Math.min(limit, 200));
  },

  editProfile: async (id: string, data: unknown) => {
    await projectRow(id);
    const row = newProfileRowOnEdit(await profileCount(id), data as Dict);
    const pid = uid();
    insert('profiles', {
      id: pid, project_id: id, version: row.version,
      data: row.data, status: row.status, job_id: row.job_id,
    });
    flush();
    return { id: pid, version: row.version, status: row.status };
  },

  approveProfile: async (id: string) => {
    const prof = profileToApprove(select('profiles', { project_id: id }).map((r) => ({
      id: String(r.id), version: Number(r.version), status: String(r.status),
    })));
    if (!prof) throw new Error(NO_PROFILE_TO_APPROVE_ERROR);
    update('profiles', { id: prof.id }, {
      status: 'approved', approved_by: currentActor(), approved_at: new Date().toISOString(),
    });
    flush();
    return { id: prof.id, version: prof.version, status: 'approved' };
  },

  commercial: async (id: string, kind: string) => {
    const data = await latestCommercial(id, kind);
    if (!data) throw new Error(`no ${kind} result yet`);
    return { id, kind, data };
  },

  assets: async (id: string) => {
    const rows = byNewest(select('assets', { project_id: id }));
    return rows.map((r) => ({
      id: r.id, asset_type: r.asset_type, version: r.version, status: r.status,
      data: r.data as Dict,
    }));
  },

  editAsset: async (assetId: string, data: unknown) => {
    const row = selectOne('assets', { id: assetId });
    if (!row) throw new Error('asset not found');
    const edit = applyAssetEdit(String(row.asset_type), data as Dict);
    update('assets', { id: assetId }, {
      data: edit.data, status: edit.status, status_by: currentActor(),
    });
    flush();
    return { id: assetId, status: edit.status };
  },

  approveAsset: async (assetId: string) => {
    const affected = update('assets', { id: assetId }, { status: 'approved', status_by: currentActor() });
    if (!affected) throw new Error('asset not found');
    flush();
    return { id: assetId, status: 'approved' };
  },

  targets: async (id: string) => {
    const rows = byNumber(select('targets', { project_id: id }), 'rank');
    return rows.map((r) => ({
      id: r.id, rank: r.rank, selected: r.selected, data: r.data as Dict,
    }));
  },

  /** Choose a campaign angle from the Brand stage; Social Launch writes from it. */
  selectCampaign: async (projectId: string, name: string, selected: boolean) => {
    const row = selectOne('projects', { id: projectId });
    if (!row) throw new Error('launch not found');
    const cur = Array.isArray(row.selected_campaigns) ? (row.selected_campaigns as unknown[]).map(String) : [];
    const next = selected ? Array.from(new Set([...cur, name])) : cur.filter((n) => n !== name);
    update('projects', { id: projectId }, { selected_campaigns: next });
    flush();
    return { selected_campaigns: next };
  },

  selectTarget: async (targetId: string, selected: boolean) => {
    const affected = update('targets', { id: targetId }, { selected, selected_by: currentActor() });
    if (!affected) throw new Error('target not found');
    flush();
    return { id: targetId, selected };
  },

  signals: async (id: string) => {
    const rows = byNumber(select('signals', { project_id: id }), 'rank');
    return rows.map((r) => ({
      id: r.id, rank: r.rank, status: r.status, data: r.data as Dict,
    }));
  },

  setSignalStatus: async (signalId: string, status: string) => {
    if (!isValidSignalStatus(status)) throw new Error(BAD_SIGNAL_STATUS_ERROR);
    const affected = update('signals', { id: signalId }, { status, status_by: currentActor() });
    if (!affected) throw new Error('signal not found');
    flush();
    return { id: signalId, status };
  },

  plan: async (id: string, fmt: 'json' | 'markdown' = 'json') => {
    const p = await projectRow(id);
    const assetRows = select('assets', { project_id: id, status: 'approved' });
    const targetRows = byNumber(select('targets', { project_id: id, selected: true }), 'rank');
    const meta = await latestCommercial(id, 'targets_meta');
    const plan = buildPlan(
      { id: String(p.id), name: String(p.name), app_url: (p.app_url as string) ?? null, site_url: String(p.site_url) },
      assetRows.map((r) => ({ asset_type: String(r.asset_type), version: Number(r.version), data: r.data as Dict })),
      targetRows.map((r) => ({ rank: Number(r.rank), data: r.data as TargetData })),
      meta,
    );
    if (fmt === 'markdown') return { markdown: planMarkdown(plan) };
    return plan;
  },

  attribution: async (id: string) => {
    await projectRow(id);
    const byRef = new Map<string | null, number>();
    for (const s of select('signups', { app_id: id })) {
      const ref = (s.ref as string | null | undefined) ?? null;
      byRef.set(ref, (byRef.get(ref) ?? 0) + 1);
    }
    const counts = [...byRef.entries()].map(([ref, n]) => ({ ref, count: n }));
    const targetRows = byNumber(select('targets', { project_id: id, selected: true }), 'rank');
    return buildAttribution(id,
      targetRows.map((r) => ({ rank: Number(r.rank), data: r.data as TargetData })),
      counts);
  },

  simulateSignup: async (appId: string, ref: string) => {
    insert('signups', { id: uid(), app_id: appId, ref, event: 'signup' });
    flush();
    return { ok: true };
  },
};

export async function pollJob(jobId: string, onTick?: (j: { status: string }) => void) {
  for (;;) {
    const j = (await api.job(jobId)) as JobRow;
    onTick?.(j);
    if (j.status === 'done' || j.status === 'error') return j;
    await new Promise((r) => setTimeout(r, 2500));
  }
}
