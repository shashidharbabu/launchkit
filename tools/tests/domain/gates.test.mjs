// Parity tests for gates.ts against rr.gate_signals / rr.gate_asset.
//
// GOLDEN values generated 2026-08-31 by running the real Python gates on the
// identical inputs reconstructed below:
//   /Users/shashidharbabu/rocketride-apps-gtm/launchkit/.venv/bin/python -c "
//   import sys, json, copy
//   sys.path.insert(0, '/Users/shashidharbabu/rocketride-apps-gtm/launchkit/backend')
//   from app import rr
//   kept, dropped = rr.gate_signals(<signals below>, <own urls below>)
//   print(json.dumps({'kept': kept, 'dropped': dropped}))
//   print(json.dumps([rr.gate_asset(t, d)['warnings'] for t, d in <cases below>]))"

import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { test } from 'node:test';

const require = createRequire(import.meta.url);
const gates = require('./.build/gates.js');

const GATE_SIGNALS_GOLDEN = {"kept": [{"url": "https://news.ycombinator.com/item?id=1", "title": "a", "rank": 1}, {"url": "https://reddit.com/r/rust/comments/abc/xyz/", "title": "b", "rank": 2}, {"url": "https://stackoverflow.com/questions/123/how", "title": "d", "rank": 3}, {"url": "https://forum.rust-lang.org/t/diffs/99", "title": "e", "rank": 4}], "dropped": [{"url": "https://termdiff.dev/blog/post", "reason": "app's own content"}, {"url": "https://github.com/acme/termdiff/issues/5", "reason": "app's own content"}, {"url": "not-a-url", "reason": "not a url"}, {"url": "https://example.com/article", "reason": "not a discussion thread"}]};

// G2 (2026-09-03): golden regenerated from the TS gate after adding the dash warning (no em/en dash on any platform). Verified: stripping only dash warnings reproduces the Python golden exactly, so parity holds; the divergence is intentional.
const GATE_ASSET_WARNINGS_GOLDEN = [["post exceeds 280 chars: trim before publishing"],[],["post exceeds 280 chars: trim before publishing"],[],["pre-existing","tagline exceeds 60 chars: trim before publishing"],["title contains an em/en dash, forbidden on every platform","title must start with 'Show HN:'"],[],["title uses HN convention, rewrite for Reddit"],[]];

function signalsInput() {
  return [
    { url: 'https://news.ycombinator.com/item?id=1', title: 'a' },
    { url: 'https://reddit.com/r/rust/comments/abc/xyz/', title: 'b' },
    { url: 'https://termdiff.dev/blog/post', title: 'own site' },
    { url: 'https://github.com/acme/termdiff/issues/5', title: 'own repo issue' },
    { url: 'not-a-url', title: 'c' },
    { url: 'https://example.com/article', title: 'not thread' },
    { url: 'https://stackoverflow.com/questions/123/how', title: 'd' },
    { url: 'https://forum.rust-lang.org/t/diffs/99', title: 'e' },
  ];
}
const OWN_URLS = ['https://github.com/acme/termdiff', 'https://termdiff.dev', ''];

test('gate_signals: golden parity — drops non-threads, own content, non-urls; re-ranks kept', () => {
  const { kept, dropped } = gates.gateSignals(signalsInput(), OWN_URLS);
  assert.deepEqual({ kept, dropped }, GATE_SIGNALS_GOLDEN);
});

test('gate_signals: mutates kept signals in place with 1-based rank', () => {
  const input = signalsInput();
  const { kept } = gates.gateSignals(input, OWN_URLS);
  assert.equal(kept[0], input[0]);           // same object reference
  assert.equal(input[0].rank, 1);
  assert.equal(input[1].rank, 2);
});

const ASSET_CASES = [
  ['x_post', () => ({ post: 'x'.repeat(281) })],
  ['x_post', () => ({ post: 'x'.repeat(280) })],
  ['x_post', () => ({ post: '\u{1F680}'.repeat(281) })],  // 281 code points, 562 UTF-16 units
  ['x_post', () => ({ post: '\u{1F680}'.repeat(280) })],  // must NOT trip if counting code points
  ['producthunt', () => ({ tagline: 'y'.repeat(61), warnings: ['pre-existing'] })],
  ['show_hn', () => ({ title: 'termdiff — fast diffs' })],
  ['show_hn', () => ({ title: 'Show HN: termdiff' })],
  ['reddit_post', () => ({ title: 'Show HN: termdiff' })],
  ['x_post', () => ({})],
];

test('gate_asset: golden parity — limits (code-point counted), prefixes, warning preservation', () => {
  const got = ASSET_CASES.map(([type, make]) => gates.gateAsset(type, make()).warnings);
  assert.deepEqual(got, GATE_ASSET_WARNINGS_GOLDEN);
});

test('gate_asset: mutates and returns the same data object', () => {
  const data = { post: 'ok' };
  const out = gates.gateAsset('x_post', data);
  assert.equal(out, data);
  assert.deepEqual(data.warnings, []);
});

test('ASSET_LIMITS and HN_LOCK_SECONDS constants', () => {
  assert.deepEqual(gates.ASSET_LIMITS, { x_post: ['post', 280], producthunt: ['tagline', 60] });
  assert.equal(gates.HN_LOCK_SECONDS, 14 * 86400);
});

test('hnLockCheck: HN thread older than 14 days is rejected, younger/other kept', () => {
  const now = 1_756_600_000;
  const rejected = gates.hnLockCheck('https://news.ycombinator.com/item?id=1',
                                     now - 15 * 86400, now);
  assert.deepEqual(rejected, {
    verdict: 'rejected',
    why: 'HN thread locked (older than 14 days), cannot reply',
  });
  assert.equal(gates.hnLockCheck('https://news.ycombinator.com/item?id=1',
                                 now - 13 * 86400, now), null);
  // exactly at the boundary: `> HN_LOCK_SECONDS` is strict
  assert.equal(gates.hnLockCheck('https://news.ycombinator.com/item?id=1',
                                 now - 14 * 86400, now), null);
  // non-HN URLs never lock; unknown created keeps the signal
  assert.equal(gates.hnLockCheck('https://reddit.com/r/x/comments/a/b/',
                                 now - 100 * 86400, now), null);
  assert.equal(gates.hnLockCheck('https://news.ycombinator.com/item?id=1', null, now), null);
});

test('THREAD_PAT matches the same URL classes as Python', () => {
  const yes = [
    'https://reddit.com/r/rust/comments/abc/x/',
    'https://news.ycombinator.com/item?id=5',
    'https://github.com/o/r/discussions/1/',
    'https://github.com/o/r/issues/2/',
    'https://stackoverflow.com/questions/1/x',
    'https://forum.example.com/anything',
    'https://community.example.com/t/topic/9',
    'https://example.com/thread-42',
  ];
  const no = ['https://example.com/blog/post', 'https://github.com/o/r'];
  for (const u of yes) assert.ok(gates.THREAD_PAT.test(u), u);
  for (const u of no) assert.ok(!gates.THREAD_PAT.test(u), u);
});

test('gate_signals: F4 — a shared host (github.com) is never "own"; only the app\'s own repo path is', () => {
  const { kept, dropped } = gates.gateSignals([
    { url: 'https://github.com/krushit1307/CampusConnect/issues/2806', title: 'unrelated repo issue' },
    { url: 'https://github.com/someone/other-tool/discussions/12', title: 'unrelated discussion' },
    { url: 'https://github.com/acme/termdiff/issues/5', title: 'own repo issue' },
  ], OWN_URLS);
  assert.deepEqual(kept.map((s) => s.url), [
    'https://github.com/krushit1307/CampusConnect/issues/2806',
    'https://github.com/someone/other-tool/discussions/12',
  ]);
  assert.deepEqual(dropped, [{ url: 'https://github.com/acme/termdiff/issues/5', reason: "app's own content" }]);
});
