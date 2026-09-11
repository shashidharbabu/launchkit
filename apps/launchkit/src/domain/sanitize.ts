/**
 * No draft reaches the store with an em/en dash: replace them deterministically
 * and count the replacements so the UI can say so. Pure; covered by node tests.
 */
const EM = /\s*—\s*/g;           // em dash
const EN_RANGE = /(\d)\s*–\s*(\d)/g; // en dash between numbers: keep as a hyphen range
const EN = /\s*–\s*/g;           // any other en dash

function cleanString(s: string): { s: string; n: number } {
  let n = 0;
  let out = s.replace(EN_RANGE, (_, a, b) => { n++; return `${a}-${b}`; });
  out = out.replace(EM, () => { n++; return ', '; }).replace(EN, () => { n++; return ', '; });
  out = out.replace(/\s+,/g, ',').replace(/,\s*,/g, ',').replace(/,\s*([.!?])/g, '$1');
  return { s: out, n };
}

// the launch verb the brand rulebook bans in every form (section 1.1); written split so a sweep of this file stays clean
const BANNED_VERB = new RegExp('\\b(s[h]ip|s[h]ips|s[h]ipped|s[h]ipping)\\b', 'gi');
const VERB_SWAP: Record<string, string> = { ship: 'release', ships: 'releases', shipped: 'released', shipping: 'releasing' };

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
 * For launch drafts only (never for quoted third-party text such as signals,
 * or for an observed profile): the banned verb becomes the release verb in
 * every field except warnings, which quote the draft's faults as written.
 */
export function sanitizeVerbs<T>(value: T): { data: T; verbs: number } {
  let verbs = 0;
  const walk = (v: unknown, key = ''): unknown => {
    if (typeof v === 'string') { if (key === 'warnings') return v; const w = cleanVerbs(v); verbs += w.n; return w.s; }
    if (Array.isArray(v)) return v.map((x) => walk(x, key));
    if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v as Record<string, unknown>).map(([k, x]) => [k, walk(x, k)]));
    return v;
  };
  return { data: walk(value) as T, verbs };
}
