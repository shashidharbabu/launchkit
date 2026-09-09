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
import type { ConceptSpec } from "./studio";

export { pyJsonDumps } from "./py";

/**
 * The Assets stage's reel script (lk_studio.pipe, a toolless LLM pipe): the
 * whole prompt travels in the question. The slot contract comes from the
 * studio forge's concept spec so the prompt, the editor and the renderer
 * agree on ids and limits. New in the short-video branch, not a rr.py port.
 */
export function buildStudioQuestion(spec: ConceptSpec, profile: Profile, appName: string,
                                    siteUrl: string, dna?: BrandDna | null, campaign = ""): string {
  const host = siteUrl.replace(/^https?:\/\//i, "").replace(/\/.*$/, "").replace(/^www\./, "").toUpperCase();
  const beats = spec.beats.map((b) => `- ${b.t} s: ${b.what} Slots: ${b.slots.join(", ")}`).join("\n");
  const slots = spec.slots.map((s) =>
    `- ${s.id} (max ${s.max} chars${s.optional ? ", optional" : ""}): ${s.hint ?? ""}` +
    (s.example ? ` Example: "${s.example}"` : "")).join("\n");
  const parts = [
    "You write the on-screen copy for a 24 second vertical launch reel: kinetic typography, no voice-over, " +
    "a few words per beat. The film is fixed; you fill its text slots and nothing else.",
    "RULES: 1) Every slot value is at most its max characters, count them, shorter is better; text renders in " +
    "capitals. 2) Never invent a number, a user count, a benchmark or a claim: a number may appear only if it " +
    "is in APP_PROFILE or BRAND_DNA (use ONE or a plain word otherwise). 3) Write in the brand's voice: if " +
    "BRAND_DNA is present follow its tone_words, vocabulary and dos_and_donts and reuse its key messages; " +
    "otherwise plain and concrete. 4) Use the app name exactly as APP_NAME. 5) t1 is \"URL: \" plus " +
    "SITE_HOST; lock_line2 is SITE_HOST; lock_line1 is the tagline in the brand's own words. 6) No hype " +
    "words (game-changer, revolutionary, seamless, unleash, elevate, next-gen, cutting-edge, supercharge), " +
    "no rhetorical questions, no em dashes, no emoji. 7) Punctuate as the hints say: labels end with a " +
    "colon, statements end with a period. 8) If CAMPAIGN_ANGLE is present, the hook (s1_line) and the " +
    "payoff (s12_l1, s12_l2) carry that angle.",
    `THE FILM (beats in order):\n${beats}`,
    `SLOTS:\n${slots}`,
    `APP_NAME: ${appName}`,
    `SITE_HOST: ${host}`,
    `APP_PROFILE: ${pyJsonDumps(profile)}`,
  ];
  if (pyTruthy(dna)) {
    parts.push(`BRAND_DNA: ${pyJsonDumps(dna)}`);
  }
  if (campaign) {
    parts.push(`CAMPAIGN_ANGLE: ${campaign}`);
  }
  parts.push("OUTPUT: ONLY one RFC 8259 JSON object, no fences, no commentary: {\"slots\": {<every slot id " +
             "listed above>: string}, \"tagline\": string (at most 60 characters, sentence case, the brand's own " +
             "tagline when BRAND_DNA has one, otherwise one in its voice; used on the launch cards), " +
             "\"one_liner\": string (at most 120 characters, sentence case, what the app does and for whom, as " +
             "the brand would say it, never hedged with words like appears or likely), \"claims_used\": " +
             "[string] (each on-screen fact and where in APP_PROFILE or BRAND_DNA it comes from), \"notes\": " +
             "string (one sentence on the angle you took)}");
  return parts.join("\n\n");
}

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
                                   feedback = "", brandDna?: BrandDna | null, rules = "",
                                   extras?: { commercial?: string; campaign?: string; previousDraft?: string }): string {
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
  if (extras?.campaign) {
    parts.push(`CAMPAIGN_ANGLE (the builder chose this angle in the Brand stage; the post carries it): ${extras.campaign}`);
  }
  if (extras?.commercial) {
    parts.push(`COMMERCIAL (approved pricing and listing copy; reuse the tagline and tier names, never invent prices): ${extras.commercial}`);
  }
  if (extras?.previousDraft) {
    parts.push(`PREVIOUS_DRAFT (the last version of this same post; the builder's feedback below refers to it. Keep what worked, change what they ask): ${extras.previousDraft}`);
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
  const hints: string[] = [];
  for (const k of ["one_liner", "description", "use_cases", "differentiators", "category", "target_user"]) {
    const v = profile[k];
    if (pyTruthy(v)) hints.push(`${k}: ${typeof v === "string" ? v : pyJsonDumps(v)}`);
  }
  if (hints.length > 0) {
    parts.push(`PAIN_HINTS (derive the ICP's own words for the problem from these; search the problem, not the product name):\n${hints.join("\n")}`);
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
