/**
 * Reading a signal's thread from Exa's index instead of the page itself.
 *
 * The browser cannot fetch most thread pages (LinkedIn, Reddit, X, dev.to and
 * forums send no CORS headers) and Firecrawl refuses LinkedIn outright, so
 * those signals stayed "unverified" however real they were. The finder found
 * them through Exa, and Exa's search for a thread's own URL returns that
 * thread, with its text and publish date, as the top result.
 *
 * lk_thread_fetch.pipe hands back Exa's raw search JSON with no model in the
 * path. This accepts a result only when its URL is the thread's URL, so a
 * signal is verified from the source text or not at all: a near miss (a
 * different post, a profile page) never stands in for the thread.
 */
import type { Dict } from "./types";

export const THREAD_TEXT_CHARS = 4000;

/** Scheme, "www.", query, fragment and trailing slashes do not make two thread URLs different. */
export function normalizeThreadUrl(url: string): string {
  return String(url ?? "")
    .trim()
    .replace(/^https?:\/\//i, "")
    .replace(/^www\./i, "")
    .replace(/[?#].*$/, "")
    .replace(/\/+$/, "")
    .toLowerCase();
}

/**
 * [text, publishedEpochSeconds|null] for `url` from an Exa search body, or
 * null when no result is that exact thread or the match carries no text.
 */
export function threadFromExaSearch(body: unknown, url: string): [string, number | null] | null {
  if (!body || typeof body !== "object") return null;
  const results = (body as Dict).results;
  if (!Array.isArray(results)) return null;
  const want = normalizeThreadUrl(url);
  if (!want) return null;
  const hit = results.find((r) => r && typeof r === "object" && normalizeThreadUrl(String((r as Dict).url ?? "")) === want) as Dict | undefined;
  if (!hit) return null;
  const highlights = Array.isArray(hit.highlights) ? (hit.highlights as unknown[]).map(String) : [];
  const text = (highlights.length > 0 ? highlights.join(" ") : String(hit.text ?? ""))
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, THREAD_TEXT_CHARS);
  if (!text) return null;
  const ms = Date.parse(String(hit.publishedDate ?? ""));
  return [text, Number.isFinite(ms) ? Math.floor(ms / 1000) : null];
}

/**
 * Demand is live or it is not: a thread older than this is history, not a buyer to answer. On 09-29 the kept
 * signals for hoppscotch were from March and May and formbricks' was three months old.
 */
export const SIGNAL_MAX_AGE_DAYS = 90;

/** Why a thread is too old to count, or null when it is recent or undated. */
export function staleThreadWhy(createdEpoch: number | null, nowEpochSeconds: number,
                               maxDays = SIGNAL_MAX_AGE_DAYS): string | null {
  if (createdEpoch == null || !Number.isFinite(createdEpoch)) return null;
  const days = Math.floor((nowEpochSeconds - createdEpoch) / 86400);
  return days > maxDays ? `posted ${days} days ago, older than ${maxDays} days: not live demand` : null;
}

/**
 * A GitHub issue is evidence only when its repository is a real project. On 09-29 both of cal-com's
 * "verified" buyers were issues in a zero-star repository created minutes before them, and the relevance
 * judge passed them at 0.97 because their text was flawless.
 */
export const REPO_MIN_STARS = 20;
export const REPO_MIN_AGE_DAYS = 30;

export function untrustedRepoWhy(repo: { stargazers_count?: unknown; created_at?: unknown; archived?: unknown } | null,
                                 nowEpochSeconds: number): string | null {
  if (!repo) return null;
  // an archived repository is read-only: hack-judge kept a 2021 discussion in one archived in November 2025 (turn 3)
  if (repo.archived === true) return "the repository is archived: nobody can reply there";
  const stars = Number(repo.stargazers_count ?? NaN);
  const created = Date.parse(String(repo.created_at ?? ""));
  const ageDays = Number.isFinite(created) ? Math.floor((nowEpochSeconds - created / 1000) / 86400) : NaN;
  if (Number.isFinite(stars) && stars < REPO_MIN_STARS) return `the repository has ${stars} stars: too small to be evidence of demand`;
  if (Number.isFinite(ageDays) && ageDays < REPO_MIN_AGE_DAYS) return `the repository is ${ageDays} days old: too new to be evidence of demand`;
  return null;
}

/**
 * The finder's own `posted_when` ("2025-03-12", "March 12, 2025", "3 months ago", "unknown") as epoch
 * seconds, so a thread that cannot be read still gets the age check: excalidraw kept two unread threads over
 * a year old on 09-29 because only a read thread carried a date.
 */
export function postedWhenEpoch(text: unknown, nowEpochSeconds: number): number | null {
  const s = String(text ?? "").trim().toLowerCase();
  if (!s || s === "unknown") return null;
  const rel = s.match(/(\d+|a|an|one)\s+(hour|day|week|month|year)s?\s+ago/);
  if (rel) {
    const n = /^\d+$/.test(rel[1]) ? Number(rel[1]) : 1;
    const unit = { hour: 3600, day: 86400, week: 7 * 86400, month: 30 * 86400, year: 365 * 86400 }[rel[2] as "hour"];
    return Math.floor(nowEpochSeconds - n * unit);
  }
  if (/\b(?:today|yesterday|just now)\b/.test(s)) return Math.floor(nowEpochSeconds - 86400);
  const ms = Date.parse(s.replace(/(\d)(st|nd|rd|th)\b/g, "$1"));
  return Number.isFinite(ms) ? Math.floor(ms / 1000) : null;
}

/**
 * Why a thread that could not be read is still not worth keeping, or null when the failure says nothing about
 * the thread itself (the index call failed, the network dropped). On 09-29 hoppscotch kept four "unverified"
 * threads that the search index did not hold and whose pages were 404 or unreadable: three were dead links
 * and the fourth five months old. The finder searches that same index, so a thread it cannot find again by
 * its own URL was mangled or invented; a 404 or 410 is gone whatever the index says.
 */
export function unreadThreadWhy(failure: string): string | null {
  const msg = String(failure ?? "");
  const gone = msg.match(/page HTTP (404|410)\b/);
  if (gone) return `the thread page returns HTTP ${gone[1]}: it no longer exists`;
  if (/not in the search index/.test(msg) && /page (refused|HTTP \d{3})/.test(msg)) {
    return "the thread is not in the search index and its page cannot be read: it cannot be shown to exist";
  }
  return null;
}
