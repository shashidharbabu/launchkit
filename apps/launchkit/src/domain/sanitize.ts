/**
 * No draft reaches the store with an em/en dash: replace them deterministically
 * and count the replacements so the UI can say so. Pure; covered by node tests.
 */
import { SLOP_SWAPS } from '../lib/slop-lexicon';

const EM = /\s*—\s*/g;           // em dash
const EN_RANGE = /([\w$%])–(\$?\w)/g; // an unspaced en dash inside a range ($8–$10, A–C, 2019–2024): a hyphen
const EN = /\s*–\s*/g;           // any other en dash

function cleanString(s: string): { s: string; n: number } {
  let n = 0;
  let out = s.replace(EN_RANGE, (_, a, b) => { n++; return `${a}-${b}`; });
  out = out.replace(EM, () => { n++; return ', '; }).replace(EN, () => { n++; return ', '; });
  out = out.replace(/\s+,/g, ',').replace(/,\s*,/g, ',').replace(/,\s*([.!?])/g, '$1');
  return { s: out, n };
}

// the launch verb the brand rulebook bans in every form (section 1.1); written split so a sweep of this file stays clean
const BANNED_VERB = new RegExp('\\b(s[h]ip|s[h]ips|s[h]ipped|s[h]ipping|s[h]ippable)\\b', 'gi');
const VERB_SWAP: Record<string, string> = { ship: 'release', ships: 'releases', shipped: 'released', shipping: 'releasing', shippable: 'releasable' };

/** The banned verb becomes the release verb, case preserved on the first letter; counted so the draft can say so. */
export function cleanVerbs(s: string): { s: string; n: number } {
  let n = 0;
  const out = s.replace(BANNED_VERB, (m) => {
    const swap = VERB_SWAP[m.toLowerCase()] ?? m;
    n++;
    return m[0] === m[0].toUpperCase() ? swap[0].toUpperCase() + swap.slice(1) : swap;
  });
  return { s: out, n };
}

// the slop lexicon, longest term first, each as its own word-bounded pattern
const SLOP_PATTERNS: ReadonlyArray<readonly [RegExp, string]> = SLOP_SWAPS.map(([term, swap]) =>
  [new RegExp(`\\b${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/ /g, '\\s+')}\\b`, 'gi'), swap] as const);

/** Each slop term becomes its plain replacement, case preserved on the first letter; counted for the card. */
export function cleanSlop(s: string): { s: string; n: number } {
  let n = 0;
  let out = s;
  for (const [pat, swap] of SLOP_PATTERNS) {
    out = out.replace(pat, (m) => {
      n++;
      return m[0] === m[0].toUpperCase() && m[0] !== m[0].toLowerCase() ? swap[0].toUpperCase() + swap.slice(1) : swap;
    });
  }
  return { s: out, n };
}

/**
 * Deterministic guarantee: no draft reaches the store with an em/en dash.
 * Walks every string in the result; counts replacements so the UI can say so.
 */
export function sanitizeDraft<T>(value: T): { data: T; changed: number } {
  let changed = 0;
  const walk = (v: unknown): unknown => {
    if (typeof v === 'string') { const r = cleanString(v); changed += r.n; return r.s; }
    if (Array.isArray(v)) return v.map(walk);
    if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v as Record<string, unknown>).map(([k, x]) => [k, walk(x)]));
    return v;
  };
  return { data: walk(value) as T, changed };
}

/**
 * Fields that hold somebody else's words: a venue's posting rules read off its
 * page, a competitor's pricing copy, a scraped testimonial, the raw research a
 * recommendation was built from. Replacing a dash inside one of these would
 * falsify a quote, so the walk below steps over them entirely.
 */
const QUOTED_FIELDS = new Set([
  'rules_summary', 'rules_source', 'research', 'competitors', 'sources', 'sources_read',
  'quote', 'quotes', 'evidence', 'copy', 'site_copy', 'observed', 'raw', 'title_or_quote',
  'warnings', 'blockers',
]);

/**
 * The same deterministic dash rule as sanitizeDraft, for copy Launch Kit wrote
 * itself: pricing plans, the store listing, brand DNA, campaign angles. Only
 * drafts were ever cleaned, so an em dash the model put in a plan name reached
 * the screen, and the store listing is the most public copy the app has.
 * Quoted and observed fields are left exactly as they were read.
 */
export function sanitizeAuthored<T>(value: T): { data: T; changed: number } {
  let changed = 0;
  const walk = (v: unknown): unknown => {
    if (typeof v === 'string') { const r = cleanString(v); changed += r.n; return r.s; }
    if (Array.isArray(v)) return v.map(walk);
    if (v && typeof v === 'object') {
      return Object.fromEntries(Object.entries(v as Record<string, unknown>).map(
        ([k, x]) => [k, QUOTED_FIELDS.has(k) ? x : walk(x)],
      ));
    }
    return v;
  };
  return { data: walk(value) as T, changed };
}

/**
 * The app profile is Launch Kit's own paraphrase of a product, and it feeds every
 * later draft, so it carries the two brand rules that never bend: no em dash and
 * never the banned launch verb. PostHog's profile arrived as "diagnoses issues and
 * ships fixes" on a cold run. Quoted fields (sources read, observed copy) are
 * stepped over; the slop lexicon is deliberately not applied, because a profile
 * is a record of facts and a swapped adjective can change one.
 */
export function sanitizeProfile<T>(value: T): { data: T; dashes: number; verbs: number } {
  let dashes = 0;
  let verbs = 0;
  const walk = (v: unknown): unknown => {
    if (typeof v === 'string') {
      const d = cleanString(v); dashes += d.n;
      const w = cleanVerbs(d.s); verbs += w.n;
      return w.s;
    }
    if (Array.isArray(v)) return v.map(walk);
    if (v && typeof v === 'object') {
      return Object.fromEntries(Object.entries(v as Record<string, unknown>).map(
        ([k, x]) => [k, QUOTED_FIELDS.has(k) ? x : walk(x)],
      ));
    }
    return v;
  };
  return { data: walk(value) as T, dashes, verbs };
}

/**
 * For launch drafts only (never for quoted third-party text such as signals,
 * or for an observed profile): the banned verb becomes the release verb in
 * every field except warnings, which quote the draft's faults as written.
 */
export function sanitizeVerbs<T>(value: T): { data: T; verbs: number; slop: number } {
  let verbs = 0;
  let slop = 0;
  const walk = (v: unknown, key = ''): unknown => {
    if (typeof v === 'string') {
      if (key === 'warnings') return v;
      const w = cleanVerbs(v);
      verbs += w.n;
      const p = cleanSlop(w.s);
      slop += p.n;
      return p.s;
    }
    if (Array.isArray(v)) return v.map((x) => walk(x, key));
    if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v as Record<string, unknown>).map(([k, x]) => [k, walk(x, k)]));
    return v;
  };
  return { data: walk(value) as T, verbs, slop };
}
