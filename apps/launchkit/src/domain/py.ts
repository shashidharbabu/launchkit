/**
 * Python-compatibility helpers for the byte-faithful domain port.
 *
 * Every function here exists to reproduce an exact CPython behavior that the
 * Launch Kit backend (launchkit/backend/app/rr.py + main.py) relied on:
 * json.dumps default formatting, str()/repr() coercions, truthiness, and
 * code-point (not UTF-16) string slicing/length.
 *
 * Known, unavoidable divergence (documented in the migration report): JSON
 * numbers lose Python's int/float distinction on JSON.parse, so a float that
 * happens to be integral (e.g. 3.0) re-serializes as "3" here but "3.0" in
 * Python. Pipe contracts emit no such values today.
 */

/** Python truthiness for JSON-shaped values. */
export function pyTruthy(v: unknown): boolean {
  if (v === null || v === undefined || v === false) return false;
  if (v === true) return true;
  if (typeof v === "number") return v !== 0; // NaN !== 0 → truthy, matching bool(float('nan'))
  if (typeof v === "string") return v.length > 0;
  if (Array.isArray(v)) return v.length > 0;
  if (typeof v === "object") return Object.keys(v).length > 0;
  return true;
}

/** dict.get(key, default): default only when the key is absent (undefined ≙ absent). */
export function pyGet(obj: Record<string, unknown>, key: string, def: unknown): unknown {
  if (Object.prototype.hasOwnProperty.call(obj, key) && obj[key] !== undefined) {
    return obj[key];
  }
  return def;
}

/** s[:n] — Python slices by code point, not UTF-16 unit. */
export function pySlice(s: string, n: number): string {
  return Array.from(s).slice(0, n).join("");
}

/** len(s) — code points, matching Python's len() on str. */
export function pyLen(s: string): number {
  return Array.from(s).length;
}

/**
 * str(x) for a float/int, matching CPython repr: exponent notation for
 * |x| >= 1e16 or 0 < |x| < 1e-4, exponent padded to two digits.
 */
export function pyNumStr(n: number): string {
  if (Number.isNaN(n)) return "nan";
  if (n === Infinity) return "inf";
  if (n === -Infinity) return "-inf";
  if (Object.is(n, -0)) return "-0.0";
  if (Number.isInteger(n) && Math.abs(n) < 1e16) return String(n);
  const a = Math.abs(n);
  if (a !== 0 && (a >= 1e16 || a < 1e-4)) {
    return n.toExponential().replace(/e([+-])(\d)$/, "e$10$2");
  }
  return String(n);
}

/** repr(s) for a string: single quotes preferred, Python escape rules. */
export function pyStrRepr(s: string): string {
  const quote = s.includes("'") && !s.includes('"') ? '"' : "'";
  let out = quote;
  for (const ch of s) {
    const code = ch.codePointAt(0) as number;
    if (ch === "\\") out += "\\\\";
    else if (ch === quote) out += "\\" + quote;
    else if (ch === "\n") out += "\\n";
    else if (ch === "\r") out += "\\r";
    else if (ch === "\t") out += "\\t";
    else if (code < 0x20 || code === 0x7f) out += "\\x" + code.toString(16).padStart(2, "0");
    else out += ch;
  }
  return out + quote;
}

/** repr(x) for JSON-shaped values (dicts render with single-quoted keys). */
export function pyRepr(v: unknown): string {
  if (v === null || v === undefined) return "None";
  if (typeof v === "boolean") return v ? "True" : "False";
  if (typeof v === "number") return pyNumStr(v);
  if (typeof v === "string") return pyStrRepr(v);
  if (Array.isArray(v)) return "[" + v.map(pyRepr).join(", ") + "]";
  const entries = Object.entries(v as Record<string, unknown>);
  return "{" + entries.map(([k, val]) => `${pyStrRepr(k)}: ${pyRepr(val)}`).join(", ") + "}";
}

/** str(x) for JSON-shaped values (None/True/False spellings, dict/list repr). */
export function pyStr(v: unknown): string {
  if (v === null || v === undefined) return "None";
  if (typeof v === "string") return v;
  if (typeof v === "boolean") return v ? "True" : "False";
  if (typeof v === "number") return pyNumStr(v);
  return pyRepr(v);
}

/** list(x) as used by gate_asset on the warnings value. */
export function pyList(v: unknown): unknown[] {
  if (Array.isArray(v)) return [...v];
  if (typeof v === "string") return Array.from(v);
  if (v !== null && typeof v === "object") return Object.keys(v);
  throw new TypeError(`'${typeof v}' object is not iterable`);
}

function jsonStringEscape(s: string, ensureAscii: boolean): string {
  let out = '"';
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    if (c === 0x22) out += '\\"';
    else if (c === 0x5c) out += "\\\\";
    else if (c === 0x08) out += "\\b";
    else if (c === 0x09) out += "\\t";
    else if (c === 0x0a) out += "\\n";
    else if (c === 0x0c) out += "\\f";
    else if (c === 0x0d) out += "\\r";
    else if (c < 0x20) out += "\\u" + c.toString(16).padStart(4, "0");
    else if (ensureAscii && c > 0x7e) out += "\\u" + c.toString(16).padStart(4, "0");
    else out += s[i];
  }
  return out + '"';
}

/**
 * json.dumps(value) with CPython's DEFAULT formatting; this is the wire
 * contract with the deployed pipes, so the differences from JSON.stringify
 * are load-bearing:
 *   - item separator ", " and key separator ": " (JSON.stringify uses none)
 *   - ensure_ascii=True by default: every non-ASCII char becomes \uXXXX
 *     (astral chars as surrogate pairs, exactly like CPython)
 *   - keys NOT sorted: insertion order preserved
 *   - NaN/Infinity/-Infinity emitted bare (allow_nan=True default)
 * db.dumps() in main.py is json.dumps(obj, ensure_ascii=False): pass
 * { ensureAscii: false } for that call site (plan markdown export).
 */
export function pyJsonDumps(value: unknown, opts?: { ensureAscii?: boolean }): string {
  const ensureAscii = opts?.ensureAscii ?? true;
  const dump = (v: unknown): string => {
    if (v === null) return "null";
    if (typeof v === "boolean") return v ? "true" : "false";
    if (typeof v === "number") {
      if (Number.isNaN(v)) return "NaN";
      if (v === Infinity) return "Infinity";
      if (v === -Infinity) return "-Infinity";
      return pyNumStr(v);
    }
    if (typeof v === "string") return jsonStringEscape(v, ensureAscii);
    if (Array.isArray(v)) return "[" + v.map(dump).join(", ") + "]";
    if (typeof v === "object") {
      const entries = Object.entries(v as Record<string, unknown>)
        .filter(([, val]) => val !== undefined); // undefined ≙ key absent in Python
      return "{" + entries.map(([k, val]) => `${jsonStringEscape(k, ensureAscii)}: ${dump(val)}`).join(", ") + "}";
    }
    throw new TypeError(`Object of type ${typeof v} is not JSON serializable`);
  };
  return dump(value);
}
