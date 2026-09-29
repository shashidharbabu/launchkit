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
