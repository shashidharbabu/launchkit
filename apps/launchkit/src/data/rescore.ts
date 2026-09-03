/**
 * Signal re-scoring — TS mirror of rr.rescore_signals: fetch each candidate
 * thread's REAL content, enforce HN replyability in code, then have the
 * lk_rescore pipe judge relevance AND write the final help-first reply.
 *
 * Fetches run in the browser; HN (Algolia), StackExchange, and GitHub APIs
 * are CORS-open. A fetch failure keeps the signal marked unverified — network
 * flakiness must not silently empty the queue (same rule as the Python).
 */
import { buildRescoreQuestion, buildRescoreSummary } from '../domain/questions';
import { hnLockCheck, HN_LOCK_REJECTION_WHY } from '../domain/gates';
import type { Dict, Profile, SignalData } from '../domain/types';
import { ask } from './runner';

async function fetchJson(url: string): Promise<Dict> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return (await res.json()) as Dict;
}

function stripTags(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** (text, createdEpoch|null) for a thread URL — mirrors rr._fetch_url_text. */
export async function fetchUrlText(url: string): Promise<[string, number | null]> {
  const hn = url.match(/news\.ycombinator\.com\/item\?id=(\d+)/);
  if (hn) {
    const item = await fetchJson(`https://hn.algolia.com/api/v1/items/${hn[1]}`);
    const parts = [String(item.title ?? ''), String(item.text ?? '')];
    for (const child of ((item.children as Dict[] | undefined) ?? []).slice(0, 10)) {
      parts.push(String(child.text ?? ''));
    }
    return [stripTags(parts.join(' ')).slice(0, 4000), (item.created_at_i as number) ?? null];
  }
  const so = url.match(/stackoverflow\.com\/(?:questions|q)\/(\d+)/);
  if (so) {
    const base = 'https://api.stackexchange.com/2.3';
    const q = await fetchJson(`${base}/questions/${so[1]}?site=stackoverflow&filter=withbody`);
    const items = (q.items as Dict[] | undefined) ?? [];
    const parts = items.length ? [String(items[0].title ?? ''), String(items[0].body ?? '')] : [];
    try {
      const a = await fetchJson(
        `${base}/questions/${so[1]}/answers?site=stackoverflow&filter=withbody&order=desc&sort=votes&pagesize=3`);
      for (const ans of ((a.items as Dict[] | undefined) ?? []).slice(0, 3)) {
        parts.push(String(ans.body ?? ''));
      }
    } catch { /* answers are a bonus; the question suffices */ }
    return [stripTags(parts.join(' ')).slice(0, 4000), null];
  }
  const gh = url.match(/github\.com\/([^/]+)\/([^/]+)\/(?:issues|discussions)\/(\d+)/);
  if (gh) {
    const issue = await fetchJson(`https://api.github.com/repos/${gh[1]}/${gh[2]}/issues/${gh[3]}`);
    return [stripTags(`${issue.title ?? ''} ${issue.body ?? ''}`).slice(0, 4000), null];
  }
  // generic pages: browsers enforce CORS, so most fail → caught by the caller
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return [stripTags(await res.text()).slice(0, 4000), null];
}

export async function rescoreSignals(
  profile: Profile,
  signals: SignalData[],
): Promise<[SignalData[], SignalData[]]> {
  const kept: SignalData[] = [];
  const rejected: SignalData[] = [];
  const summary = buildRescoreSummary(profile);

  for (const s of signals) {
    const url = String(s.url ?? '');
    let text: string;
    let created: number | null;
    try {
      [text, created] = await fetchUrlText(url);
    } catch (e) {
      s.rescore = { verdict: 'unverified', why: `fetch failed: ${String((e as Error)?.message ?? e)}` };
      kept.push(s);
      continue;
    }
    if (hnLockCheck(url, created, Date.now() / 1000)) {
      s.rescore = { verdict: 'rejected', why: HN_LOCK_REJECTION_WHY };
      rejected.push(s);
      continue;
    }
    try {
      const verdict = await ask('lk_rescore.pipe',
        buildRescoreQuestion(summary, String(s.platform ?? 'forum'), text));
      const relevant = Boolean(verdict.relevant);
      s.rescore = {
        verdict: relevant ? 'relevant' : 'rejected',
        confidence: verdict.confidence as number | undefined,
        why: verdict.why as string | undefined,
      };
      const reply = String(verdict.reply ?? '').trim();
      if (relevant && reply) s.drafted_reply = reply; // the finder drafted from a snippet; this read the thread
      (relevant ? kept : rejected).push(s);
    } catch (e) {
      s.rescore = { verdict: 'unverified', why: `judge failed: ${String((e as Error)?.message ?? e)}` };
      kept.push(s);
    }
  }
  kept.forEach((s, i) => { s.rank = i + 1; });
  return [kept, rejected];
}
