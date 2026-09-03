/**
 * Launch plan assembly + attribution rollup, byte-faithful port of
 * _ref_code, _ref_url, get_plan's assembly, _plan_markdown, and
 * get_attribution's rollup join from launchkit/backend/app/main.py.
 *
 * The DB queries stay at the caller; these functions reproduce the exact
 * selection, ordering, formatting, and mutation semantics.
 */

import { pyGet, pyJsonDumps, pySlice, pyStr, pyTruthy } from "./py";
import type { AssetData, Dict, TargetData } from "./types";

export interface PlanProject {
  id: string;
  name: string;
  app_url: string;
  site_url: string;
}

/** One approved asset row (Gate 2), as stored: type + version + pipe payload. */
export interface ApprovedAssetRow {
  asset_type: string;
  version: number;
  data: AssetData;
}

/** One target row (Gate 3): rank + pipe payload (+ selection flag). */
export interface TargetRow {
  rank: number;
  data: TargetData;
  selected?: boolean;
}

export interface Plan {
  project: { id: string; name: string; app_url: string };
  sequencing: unknown[];
  targets: TargetData[];
  assets: Record<string, AssetData>;
  ready: boolean;
}

/**
 * main._ref_code: deterministic per-venue ref code: the attribution key.
 * `lk_<kind>_<slug>`; slug = re.sub(r"[^a-z0-9]+", "_", name.lower())
 * .strip("_")[:32]. Defaults ('venue' / 'x') apply only when the key is ABSENT
 *: a present-but-null name renders as 'none' (str(None).lower()), exactly as
 * in Python.
 */
export function refCode(targetData: TargetData): string {
  const name = pyStr(pyGet(targetData, "name", "venue"));
  const slug = pySlice(
    name.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, ""), 32);
  return `lk_${pyStr(pyGet(targetData, "kind", "x"))}_${slug}`;
}

/** main._ref_url — app_url or site_url, '?'/'&' chosen by existing query. */
export function refUrl(project: Pick<PlanProject, "app_url" | "site_url">, ref: string): string {
  const base = pyTruthy(project.app_url) ? project.app_url : project.site_url;
  const sep = base.includes("?") ? "&" : "?";
  return `${base}${sep}ref=${ref}`;
}

/**
 * main.get_plan assembly (fmt=json path).
 *
 * - approvedAssets: every asset row with status "approved" for the project.
 *   Ordered here exactly like the SQL (asset_type ASC, version DESC), then the
 *   FIRST row per type wins, newest approved version per type, with the
 *   assets dict keyed in asset_type order.
 * - selectedTargets: rows with selected=true; ordered by rank here.
 * - targetsMeta: latest commercial_results row of kind "targets_meta"
 *   (its parsed data), or null, sequencing_advice falls back to [].
 *
 * Mutates each selected target's data (adds ref / ref_url), as Python does.
 */
export function buildPlan(project: PlanProject, approvedAssets: ApprovedAssetRow[],
                          selectedTargets: TargetRow[], targetsMeta: Dict | null): Plan {
  const assetsSorted = [...approvedAssets].sort((a, b) =>
    a.asset_type < b.asset_type ? -1 : a.asset_type > b.asset_type ? 1 : b.version - a.version);
  const latest = new Map<string, ApprovedAssetRow>();
  for (const a of assetsSorted) {
    if (!latest.has(a.asset_type)) latest.set(a.asset_type, a); // dict.setdefault
  }

  const targetsSorted = [...selectedTargets].sort((a, b) => a.rank - b.rank);
  const seqRaw = targetsMeta ? pyGet(targetsMeta, "sequencing_advice", null) : [];
  const sequencing = pyTruthy(seqRaw) ? (seqRaw as unknown[]) : [];

  const targetDicts: TargetData[] = [];
  for (const t of targetsSorted) {
    const d = t.data;
    d["ref"] = refCode(d);
    d["ref_url"] = refUrl(project, pyStr(d["ref"]));
    targetDicts.push(d);
  }

  const assets: Record<string, AssetData> = {};
  for (const [k, a] of latest) assets[k] = a.data;

  return {
    project: { id: project.id, name: project.name, app_url: project.app_url },
    sequencing,
    targets: targetDicts,
    assets,
    ready: latest.size > 0 && targetDicts.length > 0,
  };
}

/** t.get(k) rendered the way an f-string renders it (missing/None → 'None'). */
function fmtGet(t: Dict, key: string): string {
  return pyStr(pyGet(t, key, null));
}

/**
 * main._plan_markdown: VERBATIM markdown export format. Non-string asset
 * values serialize via db.dumps = json.dumps(obj, ensure_ascii=False).
 */
export function planMarkdown(plan: Plan): string {
  const lines: string[] = [`# Launch Plan: ${pyStr(plan.project.name)}`, ""];
  if (pyTruthy(plan.sequencing)) {
    lines.push("## Sequence");
    plan.sequencing.forEach((s, idx) => lines.push(`${idx + 1}. ${pyStr(s)}`));
    lines.push("");
  }
  lines.push("## Targets");
  for (const t of plan.targets) {
    const sub = pyGet(t, "submission_url", null);
    const link = pyTruthy(sub) ? sub : pyGet(t, "url", null);
    lines.push(`- **${fmtGet(t, "name")}** (${fmtGet(t, "kind")}): ` +
               `${pyStr(link)}\n` +
               `  - why: ${fmtGet(t, "why_fit")}\n` +
               `  - rules: ${fmtGet(t, "rules_summary")}\n` +
               `  - link to use here (attribution): ${fmtGet(t, "ref_url")}`);
  }
  lines.push("");
  for (const [atype, a] of Object.entries(plan.assets)) {
    lines.push(`## Asset: ${atype}`);
    for (const [k, v] of Object.entries(a)) {
      if (k === "warnings") continue;
      lines.push(`**${k}:**\n\n${typeof v === "string" ? v : pyJsonDumps(v, { ensureAscii: false })}\n`);
    }
  }
  return lines.join("\n");
}

/** One GROUP BY row from the store's signup table: ref code → count. */
export interface SignupCount {
  ref: string | null;
  count: number;
}

export interface AttributionRow {
  target: unknown;
  kind: unknown;
  ref: string;
  signups: number;
}

/**
 * main.get_attribution rollup: join signup counts to the selected targets by
 * ref code. Falsy refs (null/"") roll up under "(direct)". Each matched ref is
 * POPPED from the counts, so leftovers (unknown refs, direct) trail as
 * target:null rows; by_target sorts by signups descending (stable).
 */
export function buildAttribution(projectId: string, selectedTargets: TargetRow[],
                                 signupCounts: SignupCount[]): {
  project_id: string;
  total: number;
  by_target: AttributionRow[];
} {
  const counts = new Map<string, number>();
  for (const row of signupCounts) {
    counts.set(pyTruthy(row.ref) ? String(row.ref) : "(direct)", row.count);
  }
  const out: AttributionRow[] = [];
  for (const t of [...selectedTargets].sort((a, b) => a.rank - b.rank)) {
    const d = t.data;
    const ref = refCode(d);
    const n = counts.has(ref) ? (counts.get(ref) as number) : 0; // counts.pop(ref, 0)
    counts.delete(ref);
    out.push({ target: pyGet(d, "name", null), kind: pyGet(d, "kind", null), ref, signups: n });
  }
  for (const [ref, n] of counts) {
    out.push({ target: null, kind: null, ref, signups: n });
  }
  return {
    project_id: projectId,
    total: out.reduce((acc, r) => acc + r.signups, 0),
    by_target: [...out].sort((a, b) => b.signups - a.signups),
  };
}
