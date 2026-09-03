"use strict";
/**
 * Gate rules, versioning, and carryover semantics from
 * launchkit/backend/app/main.py, as pure predicates and reducers.
 *
 * HTTP status codes noted in comments are what the FastAPI endpoints raise;
 * the ported UI/data layer maps these predicates to the same user-facing
 * behavior.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.BAD_SIGNAL_STATUS_ERROR = exports.SIGNAL_STATUSES = exports.ASSET_STATUS_EDITED = exports.ASSET_STATUS_APPROVED = exports.NO_PROFILE_TO_APPROVE_ERROR = exports.MANUAL_EDIT_JOB_ID = exports.BRAND_CAMPAIGNS_PREREQ_ERROR = exports.GATE1_ERROR = exports.STAGE_KINDS = void 0;
exports.isKnownStageKind = isKnownStageKind;
exports.unknownStageError = unknownStageError;
exports.requiresApprovedProfile = requiresApprovedProfile;
exports.latestApprovedProfile = latestApprovedProfile;
exports.gate1Passed = gate1Passed;
exports.canRunBrandCampaigns = canRunBrandCampaigns;
exports.nextProfileVersion = nextProfileVersion;
exports.newProfileRowOnEdit = newProfileRowOnEdit;
exports.newProfileRowOnUnderstand = newProfileRowOnUnderstand;
exports.profileToApprove = profileToApprove;
exports.assetJobKind = assetJobKind;
exports.nextAssetVersion = nextAssetVersion;
exports.applyAssetEdit = applyAssetEdit;
exports.isValidSignalStatus = isValidSignalStatus;
exports.subredditsFromTargets = subredditsFromTargets;
exports.carrySignalStatusByUrl = carrySignalStatusByUrl;
exports.applyTargetsRun = applyTargetsRun;
const gates_1 = require("./gates");
const py_1 = require("./py");
// ---------------- stage kinds & Gate 1 ----------------
/** The kinds /run/{kind} accepts (main.run_stage); anything else is a 400. */
exports.STAGE_KINDS = ["pricing", "listing", "targets", "signals",
    "brand_dna", "brand_campaigns"];
function isKnownStageKind(kind) {
    return exports.STAGE_KINDS.includes(kind);
}
/** 400 detail for an unknown /run/{kind}. */
function unknownStageError(kind) {
    return `unknown stage ${kind}`;
}
/** 409 detail when Gate 1 blocks a run (main._approved_profile). */
exports.GATE1_ERROR = "Gate 1 not passed: no approved profile yet";
/**
 * Gate 1: which run kinds 409 without an approved profile. In main.py both
 * /run/asset and every /run/{kind} stage call _approved_profile; only
 * /run/understand does not.
 */
function requiresApprovedProfile(kind) {
    return kind === "asset" || isKnownStageKind(kind);
}
/**
 * main._approved_profile selection: status == "approved", highest version
 * first. Null → Gate 1 not passed (409 GATE1_ERROR).
 */
function latestApprovedProfile(profiles) {
    const approved = profiles.filter((p) => p.status === "approved")
        .sort((a, b) => b.version - a.version);
    return approved.length > 0 ? approved[0] : null;
}
function gate1Passed(profiles) {
    return latestApprovedProfile(profiles) !== null;
}
// ---------------- brand campaigns prerequisite ----------------
/** 409 detail when brand_campaigns runs without extracted DNA. */
exports.BRAND_CAMPAIGNS_PREREQ_ERROR = "extract Brand DNA first — campaigns are " +
    "generated from it";
/**
 * main.run_stage: brand_campaigns 409s when no brand_dna commercial result
 * exists (checked BEFORE creating a job row, so the failure never lands in
 * run history). Python `if not dna` — an empty dict also blocks.
 */
function canRunBrandCampaigns(dna) {
    return dna != null && Object.keys(dna).length > 0;
}
// ---------------- profile versioning (Gate 1 lifecycle) ----------------
/** Both understand's on_done and manual edit: version = 1 + existing count. */
function nextProfileVersion(existingProfileCount) {
    return 1 + existingProfileCount;
}
exports.MANUAL_EDIT_JOB_ID = "manual-edit";
/**
 * main.edit_profile: an edit never mutates a profile row — it creates a NEW
 * draft version attributed to "manual-edit".
 */
function newProfileRowOnEdit(existingProfileCount, data) {
    return {
        version: nextProfileVersion(existingProfileCount),
        status: "draft",
        data,
        job_id: exports.MANUAL_EDIT_JOB_ID,
    };
}
/** main._start_understand's on_done: new draft version from the pipe result. */
function newProfileRowOnUnderstand(existingProfileCount, data, jobId) {
    return {
        version: nextProfileVersion(existingProfileCount),
        status: "draft",
        data,
        job_id: jobId,
    };
}
/** 404 detail when there is no profile to approve. */
exports.NO_PROFILE_TO_APPROVE_ERROR = "no profile to approve — run understand first";
/**
 * main.approve_profile approves the LATEST version regardless of its status
 * (draft or already-approved alike); null → 404 NO_PROFILE_TO_APPROVE_ERROR.
 */
function profileToApprove(profiles) {
    const sorted = [...profiles].sort((a, b) => b.version - a.version);
    return sorted.length > 0 ? sorted[0] : null;
}
// ---------------- assets (Gate 2) ----------------
/** main.run_asset job kind string. */
function assetJobKind(assetType) {
    return `asset:${assetType}`;
}
/** main.run_asset's on_done: version = 1 + count of rows for (project, type). */
function nextAssetVersion(existingCountForType) {
    return 1 + existingCountForType;
}
/**
 * main.edit_asset: the edited payload is re-gated (rr.gate_asset) and the row
 * moves to status "edited". Approve (main.approve_asset) just sets "approved".
 */
function applyAssetEdit(assetType, data) {
    return { data: (0, gates_1.gateAsset)(assetType, data), status: "edited" };
}
exports.ASSET_STATUS_APPROVED = "approved";
exports.ASSET_STATUS_EDITED = "edited";
// ---------------- signals ----------------
/** main.set_signal_status whitelist; anything else is a 400 "bad status". */
exports.SIGNAL_STATUSES = ["new", "dismissed", "replied"];
exports.BAD_SIGNAL_STATUS_ERROR = "bad status";
function isValidSignalStatus(status) {
    return exports.SIGNAL_STATUSES.includes(status);
}
/**
 * main.run_stage signals branch: community-scoped recall — subreddit names
 * mined from this project's ranked targets (ordered by rank), deduped, max 5.
 * An empty result means the caller falls back to SIGNAL_FALLBACK_COMMUNITIES
 * (rr.run_signals receives null).
 */
function subredditsFromTargets(targetDatasByRank) {
    const subs = [];
    for (const data of targetDatasByRank) {
        const m = /reddit\.com\/r\/([A-Za-z0-9_]+)/.exec((0, py_1.pyStr)((0, py_1.pyGet)(data, "url", "")));
        if (m && !subs.includes(m[1])) {
            subs.push(m[1]);
        }
        if (subs.length >= 5) {
            break;
        }
    }
    return subs;
}
/**
 * main.run_stage signals on_done: a re-scan must not resurrect threads the
 * builder already replied to or dismissed — status carries across by URL
 * (ids regenerate every run). Only non-"new" statuses carry.
 */
function carrySignalStatusByUrl(prevSignals, newSignals) {
    const prior = new Map();
    for (const row of prevSignals) {
        const url = (0, py_1.pyStr)((0, py_1.pyGet)(row.data, "url", ""));
        if (url && row.status !== "new") {
            prior.set(url, row.status);
        }
    }
    return newSignals.map((sig) => {
        const url = (0, py_1.pyStr)((0, py_1.pyGet)(sig, "url", ""));
        return {
            rank: (0, py_1.pyGet)(sig, "rank", 0),
            data: sig,
            status: prior.has(url) ? prior.get(url) : "new",
        };
    });
}
/**
 * main.run_stage targets on_done. Gate 3 is an approval: re-running the stage
 * must not silently revoke it — the builder's picks carry across the rebuild
 * by URL (stable identity; ids and ranks both change between runs).
 * Discovered http URLs not already in the venue pool become new venues (with
 * the exact Python field defaults and code-point truncations); everything in
 * the result except "targets" becomes the targets_meta payload plus
 * venues_learned.
 */
function applyTargetsRun(prevTargets, result, knownVenueUrls) {
    const keptSelected = new Set();
    for (const t of prevTargets) {
        if (t.selected) {
            keptSelected.add((0, py_1.pyStr)((0, py_1.pyGet)(t.data, "url", "")));
        }
    }
    keptSelected.delete(""); // kept_selected.discard("")
    const known = new Set(knownVenueUrls);
    const targets = [];
    const newVenues = [];
    let discovered = 0;
    const resultTargets = (0, py_1.pyGet)(result, "targets", []);
    for (const t of resultTargets) {
        const url = (0, py_1.pyStr)((0, py_1.pyGet)(t, "url", ""));
        targets.push({
            rank: (0, py_1.pyGet)(t, "rank", 0),
            data: t,
            selected: keptSelected.has(url),
        });
        if (url.startsWith("http") && !known.has(url)) {
            newVenues.push({
                name: (0, py_1.pySlice)((0, py_1.pyStr)((0, py_1.pyGet)(t, "name", url)), 120),
                kind: (0, py_1.pyStr)((0, py_1.pyGet)(t, "kind", "community")),
                url,
                submission_url: (0, py_1.pyStr)((0, py_1.pyGet)(t, "submission_url", "")),
                rules_summary: (0, py_1.pySlice)((0, py_1.pyStr)((0, py_1.pyGet)(t, "rules_summary", "")), 500),
                audience_signal: (0, py_1.pySlice)((0, py_1.pyStr)((0, py_1.pyGet)(t, "audience_signal", "")), 200),
                source: "discovered",
            });
            known.add(url);
            discovered += 1;
        }
    }
    const meta = {};
    for (const [k, v] of Object.entries(result)) {
        if (k !== "targets") {
            meta[k] = v;
        }
    }
    meta["venues_learned"] = discovered;
    return { targets, newVenues, meta };
}
