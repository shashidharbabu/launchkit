// Parity tests for parse.ts against rr.parse_json_loose.
//
// GOLDEN values generated 2026-08-31 by running the real Python parser on the
// identical inputs below:
//   /Users/shashidharbabu/rocketride-apps-gtm/launchkit/.venv/bin/python -c "
//   import sys, json
//   sys.path.insert(0, '/Users/shashidharbabu/rocketride-apps-gtm/launchkit/backend')
//   from app import rr
//   print(json.dumps([rr.parse_json_loose(c) for c in <cases below>]))"

import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { test } from 'node:test';

const require = createRequire(import.meta.url);
const { parseJsonLoose, pyLiteralEval } = require('./.build/parse.js');

const CASES = [
  '```json\n{"a": 1}\n```',
  "{'a': \"it's\", 'b': True, 'c': None, 'd': 1.5, 'e': [1, 2], 'f': {'g': 'h'}}",
  'junk before {"x": [1, 2.5, null, true]} junk after',
  "Sure! Here is the JSON:\n```\n{'answer': 'use \\'termdiff\\'', 'score': 0.9}\n```\nHope that helps.",
];

const PARSE_GOLDEN = [{"a": 1}, {"a": "it's", "b": true, "c": null, "d": 1.5, "e": [1, 2], "f": {"g": "h"}}, {"x": [1, 2.5, null, true]}, {"answer": "use 'termdiff'", "score": 0.9}];

test('parse_json_loose: fenced JSON, python-dict quotes, junk-wrapped, escaped quotes', () => {
  assert.deepEqual(CASES.map(parseJsonLoose), PARSE_GOLDEN);
});

test('parse_json_loose: dict/list input passes through untouched (same reference)', () => {
  const d = { a: 1 };
  const l = [1, 2];
  assert.equal(parseJsonLoose(d), d);
  assert.equal(parseJsonLoose(l), l);
});

test('parse_json_loose: no braces raises with the Python error text prefix', () => {
  assert.throws(() => parseJsonLoose('LLM error: something died'),
                /no JSON object in answer: 'LLM error: something died'/);
  assert.throws(() => parseJsonLoose(''), /no JSON object in answer/);
});

test('parse_json_loose: brace-wrapped garbage fails both JSON and literal parse', () => {
  // Python: json.loads fails -> ast.literal_eval raises; overall an exception
  assert.throws(() => parseJsonLoose('{this is not anything} trailing }'));
});

test('pyLiteralEval: tuples, nested containers, unicode escapes, adjacent concat', () => {
  assert.deepEqual(pyLiteralEval("{'t': (1, 2), 'u': '\\u00e9\\n', 's': 'a' 'b', 'n': -3}"),
                   { t: [1, 2], u: 'é\n', s: 'ab', n: -3 });
});
