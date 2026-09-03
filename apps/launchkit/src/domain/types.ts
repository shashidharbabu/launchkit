/**
 * Shared types for the ported Launch Kit domain logic.
 *
 * These mirror the JSON shapes the deployed pipes emit (CONTRACT.md D1: "JSON
 * payload columns keep today's shapes — the pipeline output contracts do not
 * change in this migration"). They are deliberately PERMISSIVE: every shape
 * carries an unknown-index signature because pipe output is model-generated
 * and unknown extra keys must be tolerated, never dropped or rejected.
 */

/** Any JSON-shaped dict from a pipe. */
export interface Dict {
  [key: string]: unknown;
}

export interface Icp extends Dict {
  who?: string;
  pain?: string;
  current_alternatives?: unknown[];
  buying_trigger?: string;
}

export interface Voice extends Dict {
  tone?: unknown[];
  sample_phrase?: string;
}

/** App profile — output of lk_understand (Gate 1 payload). */
export interface Profile extends Dict {
  one_liner?: string;
  description?: string;
  category?: string;
  target_user?: string;
  icp?: Icp | unknown;
  differentiators?: unknown[];
  proof_points?: unknown[];
  tech_stack?: unknown[];
  pricing_current?: string;
  voice?: Voice | unknown;
  maturity?: Dict;
  gaps?: unknown[];
  confidence?: Dict;
  analysis_degraded?: boolean;
}

/** Output of lk_assets for one asset type (Gate 2 payload). */
export interface AssetData extends Dict {
  title?: unknown;
  post?: unknown;
  tagline?: unknown;
  body?: unknown;
  warnings?: unknown;
}

/** One ranked venue — element of lk_targets' targets[] (Gate 3 payload). */
export interface TargetData extends Dict {
  name?: unknown;
  kind?: unknown;
  url?: unknown;
  submission_url?: unknown;
  rules_summary?: unknown;
  audience_signal?: unknown;
  why_fit?: unknown;
  rank?: unknown;
  ref?: unknown;
  ref_url?: unknown;
}

export interface RescoreInfo extends Dict {
  verdict?: string;
  confidence?: unknown;
  why?: unknown;
}

/** One discussion thread — element of lk_signals' signals[]. */
export interface SignalData extends Dict {
  url?: unknown;
  platform?: unknown;
  title?: unknown;
  rank?: unknown;
  rescore?: RescoreInfo;
  drafted_reply?: string;
}

/** Verdict emitted by lk_rescore (the strict relevance judge). */
export interface RescoreVerdict extends Dict {
  relevant?: unknown;
  confidence?: unknown;
  why?: unknown;
  reply?: unknown;
}

/** Output of lk_brand task=dna. */
export interface BrandDna extends Dict {}

/** Row shape dropped signals take in gate_signals. */
export interface GateDropped {
  url: string;
  reason: string;
}
