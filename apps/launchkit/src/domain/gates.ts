/**
 * Deterministic quality gates: byte-faithful port of gate_signals, gate_asset,
 * THREAD_PAT, ASSET_LIMITS and HN_LOCK_SECONDS from launchkit/backend/app/rr.py.
 *
 * Identical regexes, identical re-ranking (gate_signals mutates kept signals'
 * rank in place, 1-based), identical warning strings. Note the gate writes a
 * `warnings` array onto the asset data; that key name comes straight from
 * rr.py's gate_asset.
 */

import { pyGet, pyLen, pyList, pyStr, pyTruthy } from "./py";
import type { AssetData, GateDropped, SignalData } from "./types";
import { RULEBOOK_CHECKS, type RuleCheck } from "../lib/rulebook-checks";

/** rr.THREAD_PAT — what counts as a real discussion thread. */
export const THREAD_PAT = new RegExp(
  "(reddit\\.com/r/.+/comments/|news\\.ycombinator\\.com/item|" +
  "github\\.com/.+/(discussions|issues)/|stackoverflow\\.com/questions/|" +
  "(x|twitter)\\.com/[^/]+/status/|linkedin\\.com/posts/|dev\\.to/[^/]+/|" +
  "indiehackers\\.com/post/|quora\\.com/|" +
  "/t/|/thread|forum)");

/**
 * rr.gate_signals: keep only real discussion threads; drop the app's own
 * content. `ownUrls` is [repo_url, site_url, app_url] at the caller
 * (main.py's signals flow). Mutates kept signals: rank = 1-based position.
 *
 * Own-content matching: for the app's OWN hosts (its site/app domains) the
 * hostname is a drop-substring; for SHARED hosts (github.com, reddit.com, …)
 * only the app's own path on that host is (host/owner/name), because a shared
 * host is never "own", the original rule dropped every github.com signal for
 * any GitHub-hosted app (F4). The last path segment of each own URL (e.g. the
 * repo name) remains a drop-substring, as before.
 */
const GENERIC_HOSTS = new Set([
  "github.com", "gitlab.com", "bitbucket.org", "codeberg.org", "huggingface.co",
  "npmjs.com", "pypi.org", "sourceforge.net", "reddit.com", "news.ycombinator.com",
  "x.com", "twitter.com", "producthunt.com", "medium.com", "dev.to", "youtube.com", "linkedin.com",
]);
/**
 * Buyer or builder. A signal is a person who needs what the app does; the finder
 * kept returning people who had just built something like it, because the topic
 * matched. Deterministic and tested against real candidates, so a builder's
 * launch post or a vendor's trial pitch never reaches the store. Anything the
 * patterns cannot place is kept for the judge, never dropped on a guess.
 */
export type Intent = "buyer" | "builder" | "vendor" | "unclear";

// marketing: a trial, a pitch, a listicle, a savings hook
const VENDOR = [
  /\bfree (trial|for \d+ days)\b/i, /\bno credit card\b/i, /\bbook a demo\b/i, /\bsign up (now|today|free)\b/i,
  /\bsave \$?\d[\d,]*\+?\s*(per|a|\/)\s*(year|month|yr|mo)\b/i, /\balternatives? for 20\d\d\b/i, /\b(top|best) \d+ \b/i,
  /\bTry [A-Z]\w+\b/, /\b[A-Z]\w+ is a (powerful|simple|fast|free|modern|better|great|lightweight)\b/,
];
// an announcement, whoever wrote it: these never become a buyer whatever else the text says
const HARD_BUILDER = [
  /^\s*\[?(ann|announce|announcing|release|launch|introducing)\b/i, /\bshow hn\b/i, /\bintroducing\b/i,
  /\bv?\d+\.\d+(\.\d+)?([-.]?rc\.?\d*)?\b[^.!?]{0,40}\b(released?|is out|now available)\b/i, /\breleased:/i,
  // "Name: descriptor", the announce shape; the name must be capitalised, the descriptor may be either case
  /^[A-Z][\w.]+(?: [A-Z][\w.]+)?(?: v?\d+(\.\d+)+)?:\s+([Oo]pen[- ]source|[Aa] |[Aa]n |[Tt]he |[Ss]elf[- ]?host(ed|able)|[Ff]ree|[Ff]ast|[Oo]ffline|[Ff]reie)/,
  /\bjust (wrapped up|finished|shipped|launched|released|published)\b/i, /^\s*how i (built|made|turned|created)\b/i,
];
// the author states a need or is visibly living the problem
const BUYER = [
  /\b(i|we) (need|want|am looking|are looking|'m looking|'re looking)\b/i, /\bi'?m looking for\b/i, /\blooking for (a|an|some|something)\b/i,
  /\bis there (a|an|any)\b/i, /\bany recommend/i, /\brecommendations?\?/i, /\bdoes anyone\b/i, /\banyone (know|found|use|using|tried|recommend)\b/i,
  /\bwhat (do you|does everyone) (use|recommend)\b/i, /\bwhat is your (way|approach)\b/i, /\bhow are you (doing|handling)\b/i,
  /\bhow (do|to) (i|you|people|we)?\b[^.!?]{0,80}\b(my|our|i|we)\b/i, /\btired of\b/i, /\bfrustrated\b/i, /\bsick of\b/i,
  /\bthere has to be a better\b/i, /\bhas to be a better way\b/i, /\bevaluating\b/i, /\bcomparing\b/i, /\bswitch(ing)? from\b/i,
  /\bcharges? (you|us|me) per\b/i, /\bwhich (one|tool|service) (should|do|would)\b/i,
  // the pain that precedes a switch: a cancelled subscription, a price rise
  /\b(cancell?ed|cancel(l)?ing|dropped|ditched) (my|our) \w+ (subscription|plan|account)\b/i,
  /\braised (their|its|the) prices?\b/i, /\bprice (hike|increase)\b/i, /\bprices? (went|going) up\b/i,
  // asking how others cope is a need even with no first person after it: "how do people handle this properly?"
  /\bhow do (people|others|you|you all|you guys|teams) (handle|deal with|solve|manage|approach|do)\b/i,
  // living the problem, stated as what happened to them: "our conversions dropped", "our audit flagged"
  /\b(our|my) [\w ]{0,30}\b(dropped|broke|stopped working|failed|flagged|got flagged|keeps? failing)\b/i,
  /\bshould (we|i) (actually |really |even )?\w+\b[^.!?]{0,40}\?/i,
];
// first person past tense on a build: a builder unless a question follows
const SOFT_BUILDER = [/\b(i|we) (built|made|created|launched|released|open[- ]sourced|wrote|developed)\b/i];

export function classifyIntent(text: string): Intent {
  const t = String(text ?? "").trim();
  if (!t) return "unclear";
  if (VENDOR.some((p) => p.test(t))) return "vendor";
  if (HARD_BUILDER.some((p) => p.test(t))) return "builder";
  if (BUYER.some((p) => p.test(t))) return "buyer";
  if (SOFT_BUILDER.some((p) => p.test(t))) return "builder";
  return "unclear";
}

export function gateSignals(signals: SignalData[], ownUrls: unknown[]): { kept: SignalData[]; dropped: GateDropped[] } {
  const domains: string[] = [];
  for (const u of ownUrls) {
    const su = pyStr(u);
    const m = /https?:\/\/(?:www\.)?([^/?#]+)(\/[^?#]*)?/.exec(su);
    if (m) {
      const host = m[1].toLowerCase();
      if (GENERIC_HOSTS.has(host)) {
        const segs = (m[2] ?? "").split("/").filter(Boolean).slice(0, 2);
        if (segs.length) domains.push(`${host}/${segs.join("/")}`.toLowerCase());
      } else {
        domains.push(host);
      }
    }
    // The last path segment used to be banned as a substring of any url. For
    // plausible, whose repo is github.com/plausible/analytics, that banned the
    // word "analytics" everywhere and dropped nine real signals in one run as
    // "the app's own content", including
    // indiehackers.com/post/why-i-stopped-using-google-analytics. It was also
    // redundant: a shared host is already pinned to host/owner/repo above, and a
    // site url already contributes its host. On a docs url it would have banned
    // a word like "guide". Removed rather than narrowed.
  }
  const kept: SignalData[] = [];
  const dropped: GateDropped[] = [];
  for (const s of signals) {
    const url = pyStr(pyGet(s, "url", ""));
    if (!url.startsWith("http")) {
      dropped.push({ url, reason: "not a url" });
    } else if (/\.\.\.|\u2026/.test(url)) {
      // the model shortened the address to stay compact: nobody can open it, so it is not a signal
      dropped.push({ url, reason: "truncated url" });
    } else if (domains.some((d) => d !== "" && url.toLowerCase().includes(d.toLowerCase()))) {
      dropped.push({ url, reason: "app's own content" });
    } else if (!THREAD_PAT.test(url)) {
      dropped.push({ url, reason: "not a discussion thread" });
    } else {
      // a builder's launch post or a vendor's pitch is on topic and useless: a reply naming the app there is an ad
      const intent = classifyIntent(pyStr(pyGet(s, "title_or_quote", "")));
      if (intent === "builder") dropped.push({ url, reason: "a builder announcing their own tool, not a person who needs one" });
      else if (intent === "vendor") dropped.push({ url, reason: "vendor marketing, not a person" });
      else kept.push(s);
    }
  }
  kept.forEach((s, i) => {
    s["rank"] = i + 1;
  });
  return { kept, dropped };
}

/** rr.ASSET_LIMITS — asset_type → [field, max chars]. */
export const ASSET_LIMITS: Record<string, [string, number]> = {
  x_post: ["post", 280],
  producthunt: ["tagline", 60],
};

/**
 * rr.gate_asset: attach code-checked warnings the model can't be trusted to
 * self-report. Mutates and returns `data` (data.warnings replaced by the
 * gated list). Length checks count CODE POINTS, matching Python len().
 */
export function gateAsset(assetType: string, data: AssetData, ctx: GateContext = {}): AssetData {
  const raw = pyGet(data, "warnings", null);
  const warnings: unknown[] = pyTruthy(raw) ? pyList(raw) : [];
  // the subset a founder cannot post over; the UI shows them apart and the repair ask names them
  const blockers: string[] = [];
  const limit = Object.prototype.hasOwnProperty.call(ASSET_LIMITS, assetType)
    ? ASSET_LIMITS[assetType]
    : undefined;
  if (limit) {
    const [field, maxLen] = limit;
    if (pyLen(pyStr(pyGet(data, field, ""))) > maxLen) {
      warnings.push(`${field} exceeds ${maxLen} chars: trim before publishing`);
      blockers.push(`${field} exceeds ${maxLen} chars`);
    }
  }
  for (const [k, v] of Object.entries(data as Record<string, unknown>)) {
    if (typeof v === "string" && /[—–]/.test(v)) {
      warnings.push(`${k} contains an em/en dash, forbidden on every platform`);
    }
  }
  if (assetType === "show_hn" && !pyStr(pyGet(data, "title", "")).startsWith("Show HN:")) {
    warnings.push("title must start with 'Show HN:'");
  }
  if (assetType === "reddit_post" && pyStr(pyGet(data, "title", "")).startsWith("Show HN")) {
    warnings.push("title uses HN convention, rewrite for Reddit");
  }
  for (const h of runRulebookCheckHits(assetType, data, ctx)) {
    const w = hitLine(h);
    if (!warnings.includes(w)) warnings.push(w);
    if (h.hard && !blockers.includes(w)) blockers.push(w);
  }
  data["warnings"] = warnings;
  data["blockers"] = blockers;
  return data;
}

const wordCount = (s: string): number => s.split(/\s+/).filter(Boolean).length;

// what the runner and the gate stamp onto a draft: never the draft's own words, so an "all" check skips them
const META_FIELDS = new Set(["warnings", "blockers", "repaired", "venue", "app_name", "rulebook_version", "rulebook_source", "punctuation_fixed", "wording_fixed", "slop_fixed"]);

/** The fields a check reads: a named field, or every string field (and every string in an array) for "all" or "*". */
function fieldsOf(data: AssetData, field: string): Array<[string, string]> {
  const out: Array<[string, string]> = [];
  const take = (k: string, v: unknown) => {
    if (typeof v === "string") out.push([k, v]);
    else if (Array.isArray(v)) v.forEach((x, i) => { if (typeof x === "string") out.push([`${k}[${i + 1}]`, x]); });
  };
  if (field === "all" || field === "*") for (const [k, v] of Object.entries(data as Record<string, unknown>)) { if (!META_FIELDS.has(k)) take(k, v); }
  else take(field, (data as Record<string, unknown>)[field]);
  return out;
}

/** One failed check: the field, the rule, the evidence, and whether it blocks approval. */
export type CheckHit = { id: string; field: string; description: string; detail: string; hard: boolean };

/**
 * What the gate knows about the app besides the draft. Several adopted rules depend on the profile
 * rather than on the words in front of them: a thin profile may not carry a mechanism, a limitation
 * must be the placeholder when the profile records no gap, and RocketRide's own brand rules bind only
 * when the app being launched is RocketRide's. A check reaches these through a `when` pseudo-field.
 */
export type GateContext = {
  /** the understand pass could not evidence the profile: analysis_degraded, or confidence under 0.5 */
  thin?: boolean;
  /** the profile records no gap, so an honest limitation cannot be written from it */
  noGaps?: boolean;
  /** the app being launched is RocketRide's own, so the RocketRide brand rules bind the draft itself */
  ownApp?: boolean;
};

/** The pseudo-fields a `when` guard may read: "true" or "" so the guard stays a plain regex test. */
function contextValue(field: string, ctx: GateContext): string {
  const on = field === "$thin" ? ctx.thin : field === "$noGaps" ? ctx.noGaps : field === "$ownApp" ? ctx.ownApp : false;
  return on ? "true" : "";
}

/** The profile facts the gate needs, read once per draft. */
export function gateContext(profile: unknown, siteUrl = "", repoUrl = ""): GateContext {
  const p = (profile ?? {}) as Record<string, unknown>;
  const conf = Number((p.confidence as Record<string, unknown> | undefined)?.overall ?? NaN);
  const gaps = Array.isArray(p.gaps) ? (p.gaps as unknown[]) : [];
  return {
    thin: Boolean(pyTruthy(p.analysis_degraded)) || (Number.isFinite(conf) && conf < 0.5),
    noGaps: gaps.filter((g) => pyStr(g).trim()).length === 0,
    ownApp: /(^|\/\/|\.)rocketride\.(ai|org)(\/|$)/i.test(`${siteUrl} ${repoUrl}`),
  };
}

// a founder cannot post over these: platform caps, required shapes, the banned verb, a link where none is allowed
const HARD_KINDS = new Set(["max_chars", "max_words", "required_prefix", "required_regex", "max_count"]);
const HARD_IDS = /banned_verb|brand_banned|s_word|raw_links|raw_urls|url_in_body|link_present|link_once|url_at_most_once|url_max_once|vote_ask|vote_or_reciprocity|no_dash|no_dashes/;

/** What a max_count check counts in a string field: placeholders, raw links, paragraph breaks, the product's name, else hashtags. */
function countIn(id: string, text: string, data: AssetData): number {
  if (/url/.test(id)) return (text.match(/\{APP_URL\}/g) ?? []).length;
  if (/raw_links/.test(id)) return (text.match(/https?:\/\//g) ?? []).length;
  // a line that is only the link (the Show HN shape puts {APP_URL} on its own line) is not a paragraph
  if (/paragraph/.test(id)) return (text.replace(/\n[ \t]*(\{APP_URL\}|https?:\/\/\S+)[ \t]*(?=\n)/g, "").match(/\n[ \t]*\n/g) ?? []).length;
  if (/product_name/.test(id)) {
    // the mention ladder counts how often the product is named; with no name stamped the check cannot fire
    const name = pyStr(pyGet(data, "app_name", "")).trim();
    if (!name) return 0;
    const pat = new RegExp(`\\b${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "gi");
    return (text.match(pat) ?? []).length;
  }
  return (text.match(/#\w+/g) ?? []).length;
}

/**
 * The rulebook's machine checks (lib/rulebook-checks.ts): lengths, counts,
 * forbidden patterns and required prefixes, each with its evidence (the count
 * or the matched words) so the builder can act on it. A pattern JavaScript
 * cannot compile is skipped, never fatal.
 */
export function runRulebookCheckHits(assetType: string, data: AssetData, ctx: GateContext = {}): CheckHit[] {
  const checks: RuleCheck[] = RULEBOOK_CHECKS[assetType] ?? [];
  const out: CheckHit[] = [];
  const push = (c: RuleCheck, field: string, detail: string) =>
    out.push({ id: c.id, field, description: c.description, detail, hard: c.hard ?? (HARD_KINDS.has(c.kind) || HARD_IDS.test(c.id)) });
  for (const c of checks) {
    const n = Number(c.value);
    // a check scoped to one venue (an r/SideProject title shape, an r/MachineLearning prefix) runs only
    // there; a check scoped to a pseudo-field runs only in that situation (a thin profile, a profile with
    // no recorded gap, a RocketRide-owned app), which is how a rule that depends on the profile is enforced
    if (c.when) {
      const gv = c.when.field.startsWith("$") ? contextValue(c.when.field, ctx) : pyStr(pyGet(data, c.when.field, ""));
      let applies = false;
      try { applies = new RegExp(c.when.regex, "i").test(gv); } catch { applies = false; }
      if (!applies) continue;
    }
    if (c.kind === "required_regex") {
      // the first entry of the field must match: warnings[1] is the model's first line, a string field is itself
      const [first] = fieldsOf(data, c.field);
      let ok = false;
      if (first) {
        try { ok = new RegExp(c.value, c.flags ?? "").test(first[1]); } catch { ok = true; }
      }
      if (!ok) push(c, first ? first[0] : c.field, first ? `starts "${first[1].slice(0, 40)}"` : "empty");
      continue;
    }
    if (c.kind === "max_count") {
      const v = (data as Record<string, unknown>)[c.field];
      const count = Array.isArray(v) ? v.length : typeof v === "string" ? countIn(c.id, v, data) : 0;
      if (Number.isFinite(n) && count > n) push(c, c.field, `${count}, cap ${n}`);
      continue;
    }
    for (const [name, text] of fieldsOf(data, c.field)) {
      let hit = false;
      let detail = "";
      if (c.kind === "max_chars") { const len = pyLen(text); hit = Number.isFinite(n) && len > n; detail = `${len} characters, cap ${n}`; }
      else if (c.kind === "min_words") { const w = wordCount(text); hit = Number.isFinite(n) && w < n; detail = `${w} words, floor ${n}`; }
      else if (c.kind === "max_words") { const w = wordCount(text); hit = Number.isFinite(n) && w > n; detail = `${w} words, cap ${n}`; }
      else if (c.kind === "required_prefix") { hit = !text.startsWith(c.value); detail = `starts "${text.slice(0, 24)}"`; }
      else if (c.kind === "forbidden_regex") {
        try {
          const flags = c.flags ?? (/\\u\{/.test(c.value) ? "iu" : "i");
          const m = new RegExp(c.value, flags).exec(text);
          hit = m !== null;
          if (m && m[0].trim()) detail = `"${m[0].trim().slice(0, 60)}"`;
        } catch { hit = false; }
      }
      if (hit) { push(c, name, detail); break; }
    }
  }
  return out;
}

/** The hits as the one-line warnings the draft shows: field, rule, evidence. */
export function runRulebookChecks(assetType: string, data: AssetData, ctx: GateContext = {}): string[] {
  return runRulebookCheckHits(assetType, data, ctx).map(hitLine);
}

function hitLine(h: CheckHit): string {
  return `${h.field}: ${h.description}${h.detail ? ` (${h.detail})` : ""}`;
}

/** rr.HN_LOCK_SECONDS — HN threads become read-only ~2 weeks after posting. */
export const HN_LOCK_SECONDS = 14 * 86400;

/** Rejection text used by rescore_signals when the HN lock trips. */
export const HN_LOCK_REJECTION_WHY = "HN thread locked (older than 14 days), cannot reply";

/**
 * The HN-lock check from rr.rescore_signals as a pure predicate:
 * `created and "news.ycombinator.com" in url and now - created > HN_LOCK_SECONDS`.
 * Returns the rescore rejection object when locked, null otherwise.
 * All times are epoch seconds.
 */
export function hnLockCheck(url: string, createdEpoch: number | null | undefined,
                            nowEpochSeconds: number): { verdict: "rejected"; why: string } | null {
  if (pyTruthy(createdEpoch) && url.includes("news.ycombinator.com") &&
      nowEpochSeconds - (createdEpoch as number) > HN_LOCK_SECONDS) {
    return { verdict: "rejected", why: HN_LOCK_REJECTION_WHY };
  }
  return null;
}


/** Venue kinds that are a launch (someone reads the post) vs a listing (passive discovery). */
const PRIMARY_KINDS = new Set(["launch_platform", "subreddit", "community", "newsletter", "forum"]);
const REPO_FILE = /github\.com\/[^/]+\/[^/]+\/(blob|tree|raw)\//i;

export type TargetGateResult = { kept: Record<string, unknown>[]; dropped: { target: Record<string, unknown>; why: string }[] };

/**
 * gateTargets: deterministic guardrails on the model's venue ranking.
 *  - a file inside a repository (README, Resources.md) is not a venue: dropped;
 *  - awesome-lists and other GitHub listings rank after every real launch
 *    venue and carry impact "low"; directories rank after primary venues with
 *    impact capped at "medium";
 *  - relative order within each band is the model's; ranks are renumbered 1..N.
 */
export function gateTargets(targets: unknown[]): TargetGateResult {
  const dropped: TargetGateResult["dropped"] = [];
  const bands: Record<number, Record<string, unknown>[]> = { 0: [], 1: [], 2: [] };
  for (const raw of targets) {
    if (!raw || typeof raw !== "object") continue;
    const t = { ...(raw as Record<string, unknown>) };
    const url = pyStr(pyGet(t, "url", ""));
    const name = pyStr(pyGet(t, "name", "")).trim();
    const kind = pyStr(pyGet(t, "kind", "")).toLowerCase();
    if (!name || !url) { dropped.push({ target: t, why: "missing name or url" }); continue; }
    if (REPO_FILE.test(url) || /\.md(\?|#|$)/i.test(url)) { dropped.push({ target: t, why: "a file inside a repository is not a venue" }); continue; }
    const isGithub = /(^|\/\/)([a-z0-9-]+\.)?github\.com\//i.test(url);
    if (kind === "awesome_list" || (isGithub && !PRIMARY_KINDS.has(kind))) {
      t.kind = kind || "awesome_list";
      t.expected_impact = "low";
      bands[2].push(t);
    } else if (kind === "directory") {
      if (pyStr(pyGet(t, "expected_impact", "")).toLowerCase() === "high") t.expected_impact = "medium";
      bands[1].push(t);
    } else {
      bands[0].push(t);
    }
  }
  const kept = [...bands[0], ...bands[1], ...bands[2]].map((t, i) => ({ ...t, rank: i + 1 }));
  return { kept, dropped };
}
