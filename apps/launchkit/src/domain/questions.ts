/**
 * Pipe question-payload builders — byte-faithful port of the string
 * construction in launchkit/backend/app/rr.py (run_understand, run_commercial,
 * run_targets, run_brand, run_asset, build_signals_question, and the judge
 * prompt inside rescore_signals).
 *
 * These strings ARE the wire contract with the deployed pipes: a one-character
 * drift changes pipeline behavior. All embedded JSON goes through pyJsonDumps
 * (CPython json.dumps default separators + ensure_ascii). Do not "clean up"
 * spacing, dashes, or wording.
 */

import { pyJsonDumps, pyStr, pyTruthy } from "./py";
import type { BrandDna, Dict, Profile, TargetData } from "./types";

export { pyJsonDumps } from "./py";

function isDict(v: unknown): v is Dict {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/** rr.run_understand — repo_url may be empty: site-only analysis is supported. */
export function buildUnderstandQuestion(repoUrl: string, siteUrl: string, feedback = ""): string {
  const repoLine = repoUrl
    ? `Repository URL: ${repoUrl}`
    : "Repository URL: NONE SUPPLIED — analyse from the live site " +
      "alone and set analysis_degraded true.";
  let q = `Produce the app profile for this app.\n${repoLine}\nLive product URL: ${siteUrl}`;
  if (feedback) {
    q += "\nBUILDER_FEEDBACK (the app's builder reviewed a previous draft " +
         `and asks you to incorporate this): ${feedback}`;
  }
  return q;
}

/** rr.run_commercial — task: 'pricing' | 'listing'. */
export function buildCommercialQuestion(task: string, profile: Profile, currentListing = ""): string {
  const parts = [`TASK: ${task}`, `APP_PROFILE: ${pyJsonDumps(profile)}`];
  if (currentListing) {
    parts.push(`CURRENT_LISTING: ${currentListing}`);
  }
  return parts.join("\n");
}

/** rr.run_targets — curated venue pool rides along when non-empty. */
export function buildTargetsQuestion(profile: Profile, curatedVenues?: unknown[] | null): string {
  const parts = [`APP_PROFILE: ${pyJsonDumps(profile)}`];
  if (pyTruthy(curatedVenues)) {
    parts.push(`CURATED_VENUES: ${pyJsonDumps(curatedVenues)}`);
  }
  return parts.join("\n");
}

/** rr.run_brand — task: 'dna' (scrape SITE_URL) or 'campaigns' (DNA + profile). */
export function buildBrandQuestion(task: string, profile: Profile, siteUrl = "",
                                   dna?: BrandDna | null, feedback = ""): string {
  const parts = [`TASK: ${task}`, `APP_PROFILE: ${pyJsonDumps(profile)}`];
  if (siteUrl) {
    parts.push(`SITE_URL: ${siteUrl}`);
  }
  if (pyTruthy(dna)) {
    parts.push(`BRAND_DNA: ${pyJsonDumps(dna)}`);
  }
  if (feedback) {
    parts.push("BUILDER_FEEDBACK (the builder reviewed a previous draft " +
               `and asks for these changes): ${feedback}`);
  }
  return parts.join("\n");
}

/** rr.run_asset — section order (BRAND_DNA → TARGET → TONE → feedback) is contractual. */
export function buildAssetQuestion(assetType: string, profile: Profile,
                                   target?: TargetData | null, tone = "",
                                   feedback = "", brandDna?: BrandDna | null, rules = ""): string {
  const parts = [`ASSET_TYPE: ${assetType}`, `APP_PROFILE: ${pyJsonDumps(profile)}`];
  if (pyTruthy(brandDna)) {
    parts.push(`BRAND_DNA: ${pyJsonDumps(brandDna)}`);
  }
  if (pyTruthy(target)) {
    parts.push(`TARGET: ${pyJsonDumps(target)}`);
  }
  if (tone) {
    parts.push(`TONE: ${tone}`);
  }
  if (rules) {
    parts.push(rules);
  }
  if (feedback) {
    parts.push("BUILDER_FEEDBACK (the builder reviewed a previous draft " +
               `of this asset and asks for these changes): ${feedback}`);
  }
  return parts.join("\n");
}

/**
 * rr.SIGNAL_FALLBACK_COMMUNITIES — generic dev communities used when a project
 * has no ranked targets yet.
 */
export const SIGNAL_FALLBACK_COMMUNITIES = ["opensource", "SideProject", "selfhosted",
                                            "webdev", "devtools", "programming"];

/**
 * rr.build_signals_question — APP_PROFILE + ICP_PAIN (surfaced so the finder
 * mines problem phrasings from it) + COMMUNITIES (for site-scoped passes).
 */
export function buildSignalsQuestion(profile: Profile, communities?: unknown[] | null): string {
  const parts = [`APP_PROFILE: ${pyJsonDumps(profile)}`];
  const icp = profile["icp"];
  const pain = isDict(icp) ? (Object.prototype.hasOwnProperty.call(icp, "pain") ? icp["pain"] : null) : null;
  if (pyTruthy(pain)) {
    parts.push(`ICP_PAIN: ${pyStr(pain)}`);
  }
  parts.push(`COMMUNITIES: ${pyJsonDumps(pyTruthy(communities) ? communities : SIGNAL_FALLBACK_COMMUNITIES)}`);
  return parts.join("\n");
}

/** Keys rescore_signals projects out of the profile for the judge, in order. */
export const RESCORE_SUMMARY_KEYS = ["one_liner", "description", "icp",
                                     "differentiators", "proof_points", "voice"] as const;

/**
 * rr.rescore_signals summary construction: `{k: profile.get(k) for k in (...)
 * if k in profile}` — key ORDER is the tuple order, not the profile's, and
 * only present keys are included (a key present with null stays null).
 */
export function buildRescoreSummary(profile: Profile): Dict {
  const out: Dict = {};
  for (const k of RESCORE_SUMMARY_KEYS) {
    if (Object.prototype.hasOwnProperty.call(profile, k) && profile[k] !== undefined) {
      out[k] = profile[k];
    }
  }
  return out;
}

/**
 * The judge prompt inside rr.rescore_signals — VERBATIM, including the
 * help-first REPLY RULES and the RFC 8259 JSON output contract.
 *
 * `platform` mirrors `s.get('platform', 'forum')`: pass undefined when the
 * signal has no platform key (→ 'forum'); null renders as 'None' exactly as
 * Python's f-string would.
 */
export function buildRescoreQuestion(summary: Dict, platform: unknown, threadText: string): string {
  const plat = platform === undefined ? "forum" : pyStr(platform);
  return (
    "You are a strict relevance judge AND reply writer for launch outreach. " +
    "Below is an APP and the ACTUAL CONTENT of a discussion thread. First " +
    "decide if replying to this thread with this app is genuinely helpful " +
    "to the thread's author — i.e. they are asking for, or struggling " +
    "with, what this app does. Passing mentions of the topic do NOT count. " +
    "IF AND ONLY IF relevant, also write the reply the builder should " +
    "post. REPLY RULES: open by engaging the author's SPECIFIC situation — " +
    "reference a concrete detail from the thread (their tool, error, " +
    "constraint, or exact question); NEVER open with a canned phrase like " +
    "'I built a tool for exactly this'. Genuinely help FIRST in 2-4 " +
    "sentences — the reply must be worth upvoting even if they never " +
    "click. Then, only if the app truly fits, one plain-words sentence " +
    "disclosing you built it, mentioning it ONCE with {APP_URL}. Match " +
    `the norms of platform '${plat}' — Reddit and ` +
    "HN are hostile to marketing. Max 120 words. No emoji, no hype " +
    "words, no bullet lists. Reply with ONLY RFC 8259 JSON: " +
    "{\"relevant\": true|false, \"confidence\": number 0-1, " +
    "\"why\": string (one sentence), \"reply\": string (\"\" when not relevant)}\n\n" +
    `APP: ${pyJsonDumps(summary)}\n\nTHREAD CONTENT: ${threadText}`
  );
}
