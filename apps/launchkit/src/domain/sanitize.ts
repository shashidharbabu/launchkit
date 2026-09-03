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
