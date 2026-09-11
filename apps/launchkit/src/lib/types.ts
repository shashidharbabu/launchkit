export type ProjectRow = {
  id: string;
  name: string;
  repo_url: string;
  site_url: string;
  profile_status: string;
};

/** One row of the Assets stage: a site read, a brand kit, a reel script or a rendered reel. */
export type StudioRow = {
  id: string;
  kind: 'probe' | 'kit' | 'script' | 'reel' | string;
  version: number;
  status: string; // done | draft | edited | approved
  data: Record<string, unknown>;
  created_at?: string | null;
};

/** One tier of the pricing the builder chose to launch with (Commercial stage). */
export type SelectedPricingTier = {
  name: string;
  price_usd_month: number | null;
  included: boolean;
  who_its_for?: string;
  includes?: string[];
};

export type SelectedPricing = {
  model: string;
  /** The plan option chosen (its name in pricing.options); older rows carry none and mean the recommended plan. */
  option?: string;
  /** The billing model of that option: monthly subscription, annual subscription, one-time purchase, usage-based, free plus paid tiers. */
  billing?: string;
  tiers: SelectedPricingTier[];
  anchor_competitors: string[];
  chosen_at: string;
};

/** One tier of a plan option the pricing research proposes (Commercial stage). */
export type PricingOptionTier = {
  name: string;
  price_usd_month: number | null;
  who_its_for: string;
  includes: string[];
};

/** One of the three plan options drafted from the pricing research; the first restates the recommendation. */
export type PricingOption = {
  name: string;
  billing: string;
  positioning: string;
  tiers: PricingOptionTier[];
  market_rate_note: string;
  /** Monthly revenue in USD at 10, 50 and 200 paying customers. */
  revenue_at: Record<string, number>;
  when_to_pick: string;
};

/** A billing model the research weighed for this app. */
export type PricingModelConsidered = {
  model: string;
  fit: 'good' | 'possible' | 'poor' | string;
  why: string;
};

export type ProjectDetail = {
  id: string;
  name: string;
  repo_url: string;
  site_url: string;
  app_url?: string | null;
  /** Campaign angles chosen on the Brand stage; Social Launch writes from them. */
  selected_campaigns: string[];
  /** The pricing chosen on the Commercial stage; the plan carries it. */
  selected_pricing: SelectedPricing | null;
  profile: {
    id: string;
    version: number;
    status: string;
    data: Record<string, unknown>;
    created_at?: string | null;
  } | null;
  counts: { assets: number; targets: number; targets_selected: number; signals: number };
};

export type JobRow = {
  id: string;
  kind: string;
  status: string;
  error: string;
  elapsed_seconds: number;
  created_at?: string;
  project_id?: string;
  project_name?: string;
};

export type AssetRow = {
  id: string;
  asset_type: string;
  version: number;
  status: string;
  data: Record<string, unknown>;
};

export type TargetRow = {
  id: string;
  rank: number;
  selected: boolean;
  data: {
    name?: string;
    kind?: string;
    url?: string;
    submission_url?: string;
    why_fit?: string;
    rules_summary?: string;
    expected_impact?: string;
    effort?: string;
    audience_signal?: string;
  } & Record<string, unknown>;
};

export type SignalRescore = { verdict?: string; why?: string };

export type SignalRow = {
  id: string;
  rank: number;
  status: string; // new | replied | dismissed
  data: {
    platform?: string;
    url?: string;
    title_or_quote?: string;
    posted_when?: string;
    why_relevant?: string;
    intent_strength?: string;
    drafted_reply?: string;
    rescore?: SignalRescore;
  } & Record<string, unknown>;
};

export type PlanData = {
  ready: boolean;
  targets: { name: string; kind: string; ref: string; ref_url: string }[];
  /** The decisions the plan carries besides posts and venues. */
  angles?: Record<string, unknown>[];
  pricing?: SelectedPricing | null;
  listing?: Record<string, unknown> | null;
};

export type AttributionData = {
  total: number;
  by_target: { target: string | null; kind: string | null; ref: string; signups: number }[];
};
