export type ProjectRow = {
  id: string;
  name: string;
  repo_url: string;
  site_url: string;
  profile_status: string;
};

export type ProjectDetail = {
  id: string;
  name: string;
  repo_url: string;
  site_url: string;
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
};

export type AttributionData = {
  total: number;
  by_target: { target: string | null; kind: string | null; ref: string; signups: number }[];
};
