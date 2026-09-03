/**
 * parse_json_loose: byte-faithful port from launchkit/backend/app/rr.py.
 *
 * Mirrors each fallback step in order:
 *   1. dict/list input passes through untouched
 *   2. str() + strip(), then find("{") / rfind("}"): anything outside the
 *      outermost braces (code fences, prose, junk) is discarded
 *   3. strict JSON parse of the blob
 *   4. on JSON failure, ast.literal_eval-equivalent Python-literal parse
 *      (single quotes, True/False/None, tuples, escapes, adjacent string
 *      concatenation): models sometimes emit Python-dict style
 *
 * Documented divergences (both practically unreachable for pipe output, which
 * is contractually RFC 8259): Python's json.loads accepts bare NaN/Infinity
 * where JSON.parse does not (such input falls through to the literal parser
 * and fails, as ast.literal_eval also would on bare Infinity); a Python set
 * literal parses to an array here where ast.literal_eval returns a set.
 */

import { pyRepr, pySlice, pyStr } from "./py";

/** ast.literal_eval equivalent for the literal subset models actually emit. */
export function pyLiteralEval(src: string): unknown {
  let i = 0;

  const err = (msg: string): never => {
    throw new SyntaxError(`${msg} at position ${i} in Python literal`);
  };

  const ws = (): void => {
    while (i < src.length && " \t\n\r\f\v".includes(src[i])) i++;
  };

  const escapeSeq = (): string => {
    i++; // consume backslash
    if (i >= src.length) return err("bad escape");
    const c = src[i];
    i++;
    switch (c) {
      case "\n": return "";            // line continuation
      case "\\": return "\\";
      case "'": return "'";
      case '"': return '"';
      case "a": return "\x07";
      case "b": return "\b";
      case "f": return "\f";
      case "n": return "\n";
      case "r": return "\r";
      case "t": return "\t";
      case "v": return "\v";
      case "x": {
        const m = /^[0-9a-fA-F]{2}/.exec(src.slice(i));
        if (!m) return err("bad \\x escape");
        i += 2;
        return String.fromCharCode(parseInt(m[0], 16));
      }
      case "u": {
        const m = /^[0-9a-fA-F]{4}/.exec(src.slice(i));
        if (!m) return err("bad \\u escape");
        i += 4;
        return String.fromCharCode(parseInt(m[0], 16));
      }
      case "U": {
        const m = /^[0-9a-fA-F]{8}/.exec(src.slice(i));
        if (!m) return err("bad \\U escape");
        i += 8;
        return String.fromCodePoint(parseInt(m[0], 16));
      }
      default:
        if (c >= "0" && c <= "7") {
          let oct = c;
          while (oct.length < 3 && i < src.length && src[i] >= "0" && src[i] <= "7") {
            oct += src[i];
            i++;
          }
          return String.fromCharCode(parseInt(oct, 8));
        }
        return "\\" + c; // Python keeps unknown escapes literally
    }
  };

  const oneString = (): string => {
    const q = src[i];
    let triple = false;
    if (src.startsWith(q + q + q, i)) {
      triple = true;
      i += 3;
    } else {
      i += 1;
    }
    let out = "";
    while (i < src.length) {
      const c = src[i];
      if (c === "\\") {
        out += escapeSeq();
        continue;
      }
      if (c === q && (!triple || src.startsWith(q + q + q, i))) {
        i += triple ? 3 : 1;
        return out;
      }
      if (c === "\n" && !triple) return err("EOL inside string literal");
      out += c;
      i++;
    }
    return err("unterminated string literal");
  };

  const strLit = (): string => {
    let out = oneString();
    // implicit adjacent-literal concatenation: 'a' 'b' → 'ab'
    for (;;) {
      const save = i;
      ws();
      if (i < src.length && (src[i] === "'" || src[i] === '"')) {
        out += oneString();
      } else {
        i = save;
        return out;
      }
    }
  };

  const num = (): number => {
    let sign = 1;
    let j = i;
    if (src[j] === "+" || src[j] === "-") {
      if (src[j] === "-") sign = -1;
      j++;
    }
    const rest = src.slice(j);
    let m: RegExpExecArray | null;
    let v: number;
    if ((m = /^0[xX][0-9a-fA-F](?:_?[0-9a-fA-F])*/.exec(rest))) {
      v = parseInt(m[0].slice(2).replace(/_/g, ""), 16);
    } else if ((m = /^0[oO][0-7](?:_?[0-7])*/.exec(rest))) {
      v = parseInt(m[0].slice(2).replace(/_/g, ""), 8);
    } else if ((m = /^0[bB][01](?:_?[01])*/.exec(rest))) {
      v = parseInt(m[0].slice(2).replace(/_/g, ""), 2);
    } else if ((m = /^(?:\d(?:_?\d)*(?:\.(?:\d(?:_?\d)*)?)?|\.\d(?:_?\d)*)(?:[eE][+-]?\d(?:_?\d)*)?/.exec(rest))) {
      v = Number(m[0].replace(/_/g, ""));
    } else {
      return err("invalid number");
    }
    i = j + m[0].length;
    return sign * v;
  };

  const seq = (close: string): { items: unknown[]; sawComma: boolean } => {
    i++; // consume opener
    const items: unknown[] = [];
    let sawComma = false;
    ws();
    if (src[i] === close) {
      i++;
      return { items, sawComma };
    }
    for (;;) {
      items.push(value());
      ws();
      if (src[i] === ",") {
        sawComma = true;
        i++;
        ws();
        if (src[i] === close) {
          i++;
          return { items, sawComma };
        }
        continue;
      }
      if (src[i] === close) {
        i++;
        return { items, sawComma };
      }
      return err(`expected ',' or '${close}'`);
    }
  };

  const dictKey = (k: unknown): string => (typeof k === "string" ? k : pyStr(k));

  const dictOrSet = (): unknown => {
    i++; // consume '{'
    ws();
    if (src[i] === "}") {
      i++;
      return {};
    }
    const first = value();
    ws();
    if (src[i] === ":") {
      i++;
      const obj: Record<string, unknown> = {};
      obj[dictKey(first)] = value();
      for (;;) {
        ws();
        if (src[i] === ",") {
          i++;
          ws();
          if (src[i] === "}") {
            i++;
            return obj;
          }
          const k = value();
          ws();
          if (src[i] !== ":") return err("expected ':'");
          i++;
          obj[dictKey(k)] = value();
          continue;
        }
        if (src[i] === "}") {
          i++;
          return obj;
        }
        return err("expected ',' or '}'");
      }
    }
    // set literal: ast.literal_eval returns a set; closest JSON mirror: array
    const items: unknown[] = [first];
    for (;;) {
      ws();
      if (src[i] === ",") {
        i++;
        ws();
        if (src[i] === "}") {
          i++;
          return items;
        }
        items.push(value());
        continue;
      }
      if (src[i] === "}") {
        i++;
        return items;
      }
      return err("expected ',' or '}'");
    }
  };

  const value = (): unknown => {
    ws();
    if (i >= src.length) return err("unexpected end of input");
    const c = src[i];
    if (c === "{") return dictOrSet();
    if (c === "[") return seq("]").items;
    if (c === "(") {
      const { items, sawComma } = seq(")");
      // (x) is a parenthesized value, not a 1-tuple
      return items.length === 1 && !sawComma ? items[0] : items;
    }
    if (c === "'" || c === '"') return strLit();
    if (c === "+" || c === "-" || c === "." || (c >= "0" && c <= "9")) return num();
    if (src.startsWith("True", i)) { i += 4; return true; }
    if (src.startsWith("False", i)) { i += 5; return false; }
    if (src.startsWith("None", i)) { i += 4; return null; }
    return err(`unexpected character ${JSON.stringify(c)}`);
  };

  const v = value();
  ws();
  if (i !== src.length) err("trailing characters");
  return v;
}

/** rr.parse_json_loose. */
export function parseJsonLoose(raw: unknown): unknown {
  if (raw !== null && typeof raw === "object") {
    return raw; // isinstance(raw, (dict, list))
  }
  const text = pyStr(raw).trim();
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1) {
    throw new Error(`no JSON object in answer: ${pyRepr(pySlice(text, 300))}`);
  }
  const blob = text.slice(start, end + 1);
  try {
    return JSON.parse(blob);
  } catch {
    return pyLiteralEval(blob);
  }
}
