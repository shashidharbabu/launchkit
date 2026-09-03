/**
 * Deterministic quality gates — byte-faithful port of gate_signals, gate_asset,
 * THREAD_PAT, ASSET_LIMITS and HN_LOCK_SECONDS from launchkit/backend/app/rr.py.
 *
 * Identical regexes, identical re-ranking (gate_signals mutates kept signals'
 * rank in place, 1-based), identical warning strings. Note the gate writes a
 * `warnings` array onto the asset data — that key name comes straight from
 * rr.py's gate_asset.
 */

import { pyGet, pyLen, pyList, pyStr, pyTruthy } from "./py";
import type { AssetData, GateDropped, SignalData } from "./types";

/** rr.THREAD_PAT — what counts as a real discussion thread. */
export const THREAD_PAT = new RegExp(
  "(reddit\\.com/r/.+/comments/|news\\.ycombinator\\.com/item|" +
  "github\\.com/.+/(discussions|issues)/|stackoverflow\\.com/questions/|" +
  "/t/|/thread|forum)");

/**
 * rr.gate_signals — keep only real discussion threads; drop the app's own
 * content. `ownUrls` is [repo_url, site_url, app_url] at the caller
 * (main.py's signals flow). Mutates kept signals: rank = 1-based position.
 *
 * Own-content matching: for the app's OWN hosts (its site/app domains) the
 * hostname is a drop-substring; for SHARED hosts (github.com, reddit.com, …)
 * only the app's own path on that host is (host/owner/name), because a shared
 * host is never "own" — the original rule dropped every github.com signal for
 * any GitHub-hosted app (F4). The last path segment of each own URL (e.g. the
 * repo name) remains a drop-substring, as before.
 */
const GENERIC_HOSTS = new Set([
  "github.com", "gitlab.com", "bitbucket.org", "codeberg.org", "huggingface.co",
  "npmjs.com", "pypi.org", "sourceforge.net", "reddit.com", "news.ycombinator.com",
  "x.com", "twitter.com", "producthunt.com", "medium.com", "dev.to", "youtube.com", "linkedin.com",
]);
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
    const stripped = su.replace(/\/+$/, "");
    const seg = stripped.slice(stripped.lastIndexOf("/") + 1);
    if (seg) {
      domains.push(seg);
    }
  }
  const kept: SignalData[] = [];
  const dropped: GateDropped[] = [];
  for (const s of signals) {
    const url = pyStr(pyGet(s, "url", ""));
    if (!url.startsWith("http")) {
      dropped.push({ url, reason: "not a url" });
    } else if (domains.some((d) => d !== "" && url.toLowerCase().includes(d.toLowerCase()))) {
      dropped.push({ url, reason: "app's own content" });
    } else if (!THREAD_PAT.test(url)) {
      dropped.push({ url, reason: "not a discussion thread" });
    } else {
      kept.push(s);
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
 * rr.gate_asset — attach code-checked warnings the model can't be trusted to
 * self-report. Mutates and returns `data` (data.warnings replaced by the
 * gated list). Length checks count CODE POINTS, matching Python len().
 */
export function gateAsset(assetType: string, data: AssetData): AssetData {
  const raw = pyGet(data, "warnings", null);
  const warnings: unknown[] = pyTruthy(raw) ? pyList(raw) : [];
  const limit = Object.prototype.hasOwnProperty.call(ASSET_LIMITS, assetType)
    ? ASSET_LIMITS[assetType]
    : undefined;
  if (limit) {
    const [field, maxLen] = limit;
    if (pyLen(pyStr(pyGet(data, field, ""))) > maxLen) {
      warnings.push(`${field} exceeds ${maxLen} chars — trim before publishing`);
    }
  }
  if (assetType === "show_hn" && !pyStr(pyGet(data, "title", "")).startsWith("Show HN:")) {
    warnings.push("title must start with 'Show HN:'");
  }
  if (assetType === "reddit_post" && pyStr(pyGet(data, "title", "")).startsWith("Show HN")) {
    warnings.push("title uses HN convention — rewrite for Reddit");
  }
  data["warnings"] = warnings;
  return data;
}

/** rr.HN_LOCK_SECONDS — HN threads become read-only ~2 weeks after posting. */
export const HN_LOCK_SECONDS = 14 * 86400;

/** Rejection text used by rescore_signals when the HN lock trips. */
export const HN_LOCK_REJECTION_WHY = "HN thread locked (older than 14 days) — cannot reply";

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
