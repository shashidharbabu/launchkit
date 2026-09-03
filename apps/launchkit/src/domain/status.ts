/**
 * Gate rules, versioning, and carryover semantics from
 * launchkit/backend/app/main.py, as pure predicates and reducers.
 *
 * HTTP status codes noted in comments are what the FastAPI endpoints raise;
 * the ported UI/data layer maps these predicates to the same user-facing
 * behavior.
 */

import { gateAsset } from "./gates";
import { pyGet, pySlice, pyStr } from "./py";
import type { AssetData, Dict, SignalData, TargetData } from "./types";

// ---------------- stage kinds & Gate 1 ----------------

/** The kinds /run/{kind} accepts (main.run_stage); anything else is a 400. */
export const STAGE_KINDS = ["pricing", "listing", "targets", "signals",
                            "brand_dna", "brand_campaigns"] as const;
export type StageKind = (typeof STAGE_KINDS)[number];

export function isKnownStageKind(kind: string): kind is StageKind {
  return (STAGE_KINDS as readonly string[]).includes(kind);
}

/** 400 detail for an unknown /run/{kind}. */
export function unknownStageError(kind: string): string {
  return `unknown stage ${kind}`;
}

/** 409 detail when Gate 1 blocks a run (main._approved_profile). */
export const GATE1_ERROR = "Gate 1 not passed: no approved profile yet";

/**
 * Gate 1: which run kinds 409 without an approved profile. In main.py both
 * /run/asset and every /run/{kind} stage call _approved_profile; only
 * /run/understand does not.
 */
export function requiresApprovedProfile(kind: string): boolean {
  return kind === "asset" || isKnownStageKind(kind);
}

export interface ProfileRow {
  version: number;
  status: string;
}

/**
 * main._approved_profile selection: status == "approved", highest version
 * first. Null → Gate 1 not passed (409 GATE1_ERROR).
 */
export function latestApprovedProfile<T extends ProfileRow>(profiles: T[]): T | null {
  const approved = profiles.filter((p) => p.status === "approved")
    .sort((a, b) => b.version - a.version);
  return approved.length > 0 ? approved[0] : null;
}

export function gate1Passed(profiles: ProfileRow[]): boolean {
  return latestApprovedProfile(profiles) !== null;
}

// ---------------- brand campaigns prerequisite ----------------

/** 409 detail when brand_campaigns runs without extracted DNA. */
export const BRAND_CAMPAIGNS_PREREQ_ERROR =
  "extract Brand DNA first, campaigns are " +
  "generated from it";

/**
 * main.run_stage: brand_campaigns 409s when no brand_dna commercial result
 * exists (checked BEFORE creating a job row, so the failure never lands in
 * run history). Python `if not dna`, an empty dict also blocks.
 */
export function canRunBrandCampaigns(dna: Dict | null | undefined): boolean {
  return dna != null && Object.keys(dna).length > 0;
}

// ---------------- profile versioning (Gate 1 lifecycle) ----------------

/** Both understand's on_done and manual edit: version = 1 + existing count. */
export function nextProfileVersion(existingProfileCount: number): number {
  return 1 + existingProfileCount;
}

export const MANUAL_EDIT_JOB_ID = "manual-edit";

/**
 * main.edit_profile: an edit never mutates a profile row; it creates a NEW
 * draft version attributed to "manual-edit".
 */
export function newProfileRowOnEdit(existingProfileCount: number, data: Dict): {
  version: number;
  status: "draft";
  data: Dict;
  job_id: string;
} {
  return {
    version: nextProfileVersion(existingProfileCount),
    status: "draft",
    data,
    job_id: MANUAL_EDIT_JOB_ID,
  };
}

/** main._start_understand's on_done: new draft version from the pipe result. */
export function newProfileRowOnUnderstand(existingProfileCount: number, data: Dict,
                                          jobId: string): {
  version: number;
  status: "draft";
  data: Dict;
  job_id: string;
} {
  return {
    version: nextProfileVersion(existingProfileCount),
    status: "draft",
    data,
    job_id: jobId,
  };
}

/** 404 detail when there is no profile to approve. */
export const NO_PROFILE_TO_APPROVE_ERROR = "no profile to approve, run understand first";

/**
 * main.approve_profile approves the LATEST version regardless of its status
 * (draft or already-approved alike); null → 404 NO_PROFILE_TO_APPROVE_ERROR.
 */
export function profileToApprove<T extends ProfileRow>(profiles: T[]): T | null {
  const sorted = [...profiles].sort((a, b) => b.version - a.version);
  return sorted.length > 0 ? sorted[0] : null;
}

// ---------------- assets (Gate 2) ----------------

/** main.run_asset job kind string. */
export function assetJobKind(assetType: string): string {
  return `asset:${assetType}`;
}

/** main.run_asset's on_done: version = 1 + count of rows for (project, type). */
export function nextAssetVersion(existingCountForType: number): number {
  return 1 + existingCountForType;
}

/**
 * main.edit_asset: the edited payload is re-gated (rr.gate_asset) and the row
 * moves to status "edited". Approve (main.approve_asset) just sets "approved".
 */
export function applyAssetEdit(assetType: string, data: AssetData): {
  data: AssetData;
  status: "edited";
} {
  return { data: gateAsset(assetType, data), status: "edited" };
}

export const ASSET_STATUS_APPROVED = "approved";
export const ASSET_STATUS_EDITED = "edited";

// ---------------- signals ----------------

/** main.set_signal_status whitelist; anything else is a 400 "bad status". */
export const SIGNAL_STATUSES = ["new", "dismissed", "replied"] as const;
export type SignalStatus = (typeof SIGNAL_STATUSES)[number];
export const BAD_SIGNAL_STATUS_ERROR = "bad status";

export function isValidSignalStatus(status: string): status is SignalStatus {
  return (SIGNAL_STATUSES as readonly string[]).includes(status);
}

/**
 * main.run_stage signals branch: community-scoped recall, subreddit names
 * mined from this project's ranked targets (ordered by rank), deduped, max 5.
 * An empty result means the caller falls back to SIGNAL_FALLBACK_COMMUNITIES
 * (rr.run_signals receives null).
 */
export function subredditsFromTargets(targetDatasByRank: TargetData[]): string[] {
  const subs: string[] = [];
  for (const data of targetDatasByRank) {
    const m = /reddit\.com\/r\/([A-Za-z0-9_]+)/.exec(pyStr(pyGet(data, "url", "")));
    if (m && !subs.includes(m[1])) {
      subs.push(m[1]);
    }
    if (subs.length >= 5) {
      break;
    }
  }
  return subs;
}

/** Prior signal row shape for the carryover reducer. */
export interface PrevSignalRow {
  data: SignalData;
  status: string;
}

export interface NewSignalRow {
  rank: number;
  data: SignalData;
  status: string;
}

/**
 * main.run_stage signals on_done: a re-scan must not resurrect threads the
 * builder already replied to or dismissed, status carries across by URL
 * (ids regenerate every run). Only non-"new" statuses carry.
 */
export function carrySignalStatusByUrl(prevSignals: PrevSignalRow[],
                                       newSignals: SignalData[]): NewSignalRow[] {
  const prior = new Map<string, string>();
  for (const row of prevSignals) {
    const url = pyStr(pyGet(row.data, "url", ""));
    if (url && row.status !== "new") {
      prior.set(url, row.status);
    }
  }
  return newSignals.map((sig) => {
    const url = pyStr(pyGet(sig, "url", ""));
    return {
      rank: pyGet(sig, "rank", 0) as number,
      data: sig,
      status: prior.has(url) ? (prior.get(url) as string) : "new",
    };
  });
}

// ---------------- targets (Gate 3) ----------------

export interface PrevTargetRow {
  data: TargetData;
  selected: boolean;
}

export interface NewTargetRow {
  rank: number;
  data: TargetData;
  selected: boolean;
}

/** Venue learned from a discovered target (main.run_stage targets on_done). */
export interface NewVenueRow {
  name: string;
  kind: string;
  url: string;
  submission_url: string;
  rules_summary: string;
  audience_signal: string;
  source: "discovered";
}

/**
 * main.run_stage targets on_done. Gate 3 is an approval: re-running the stage
 * must not silently revoke it, the builder's picks carry across the rebuild
 * by URL (stable identity; ids and ranks both change between runs).
 * Discovered http URLs not already in the venue pool become new venues (with
 * the exact Python field defaults and code-point truncations); everything in
 * the result except "targets" becomes the targets_meta payload plus
 * venues_learned.
 */
export function applyTargetsRun(prevTargets: PrevTargetRow[], result: Dict,
                                knownVenueUrls: string[]): {
  targets: NewTargetRow[];
  newVenues: NewVenueRow[];
  meta: Dict;
} {
  const keptSelected = new Set<string>();
  for (const t of prevTargets) {
    if (t.selected) {
      keptSelected.add(pyStr(pyGet(t.data, "url", "")));
    }
  }
  keptSelected.delete(""); // kept_selected.discard("")

  const known = new Set(knownVenueUrls);
  const targets: NewTargetRow[] = [];
  const newVenues: NewVenueRow[] = [];
  let discovered = 0;
  const resultTargets = pyGet(result, "targets", []) as TargetData[];
  for (const t of resultTargets) {
    const url = pyStr(pyGet(t, "url", ""));
    targets.push({
      rank: pyGet(t, "rank", 0) as number,
      data: t,
      selected: keptSelected.has(url),
    });
    if (url.startsWith("http") && !known.has(url)) {
      newVenues.push({
        name: pySlice(pyStr(pyGet(t, "name", url)), 120),
        kind: pyStr(pyGet(t, "kind", "community")),
        url,
        submission_url: pyStr(pyGet(t, "submission_url", "")),
        rules_summary: pySlice(pyStr(pyGet(t, "rules_summary", "")), 500),
        audience_signal: pySlice(pyStr(pyGet(t, "audience_signal", "")), 200),
        source: "discovered",
      });
      known.add(url);
      discovered += 1;
    }
  }
  const meta: Dict = {};
  for (const [k, v] of Object.entries(result)) {
    if (k !== "targets") {
      meta[k] = v;
    }
  }
  meta["venues_learned"] = discovered;
  return { targets, newVenues, meta };
}
